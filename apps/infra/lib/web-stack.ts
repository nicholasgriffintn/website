import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as cr from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import * as path from "path";

export interface WebStackProps extends cdk.StackProps {
  environment: "production" | "preview";
  certificate?: acm.ICertificate;
}

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const { environment, certificate } = props;
    const prefix = `nickgriffin-web-${environment}`;
    const isProduction = environment === "production";

    const openNextDir = path.join(__dirname, "../../web/.open-next");

    // ---------- S3 bucket (static assets + ISR cache) ----------
    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: `${prefix}-assets`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProduction,
    });

    // ---------- DynamoDB table for ISR tag cache ----------
    const tagCacheTable = new dynamodb.Table(this, "TagCacheTable", {
      tableName: `${prefix}-tag-cache`,
      partitionKey: { name: "tag", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "path", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });
    tagCacheTable.addGlobalSecondaryIndex({
      indexName: "revalidate",
      partitionKey: { name: "path", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "revalidatedAt", type: dynamodb.AttributeType.NUMBER },
    });

    // ---------- SQS FIFO queue for ISR revalidation ----------
    const revalidationQueue = new sqs.Queue(this, "RevalidationQueue", {
      queueName: `${prefix}-revalidation.fifo`,
      fifo: true,
      receiveMessageWaitTime: cdk.Duration.seconds(20),
    });

    // ---------- Server Lambda (SSR) ----------
    const serverFunction = new lambda.Function(this, "ServerFunction", {
      functionName: `${prefix}-server`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(openNextDir, "server-functions/default")),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        CACHE_BUCKET_NAME: assetsBucket.bucketName,
        CACHE_BUCKET_KEY_PREFIX: "_cache",
        CACHE_BUCKET_REGION: this.region,
        REVALIDATION_QUEUE_URL: revalidationQueue.queueUrl,
        REVALIDATION_QUEUE_REGION: this.region,
        CACHE_DYNAMO_TABLE: tagCacheTable.tableName,
      },
    });

    assetsBucket.grantReadWrite(serverFunction);
    revalidationQueue.grantSendMessages(serverFunction);
    tagCacheTable.grantReadWriteData(serverFunction);

    const serverFunctionUrl = serverFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // ---------- Image optimisation Lambda ----------
    const imageOptFunction = new lambda.Function(this, "ImageOptFunction", {
      functionName: `${prefix}-image-opt`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(openNextDir, "image-optimization-function")),
      memorySize: 1536,
      timeout: cdk.Duration.seconds(25),
      environment: {
        BUCKET_NAME: assetsBucket.bucketName,
        BUCKET_KEY_PREFIX: "_assets",
      },
    });

    assetsBucket.grantRead(imageOptFunction);

    const imageOptFunctionUrl = imageOptFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // ---------- Revalidation Lambda (ISR) ----------
    const revalidationFunction = new lambda.Function(this, "RevalidationFunction", {
      functionName: `${prefix}-revalidation`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(openNextDir, "revalidation-function")),
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
    });

    revalidationFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(revalidationQueue, {
        batchSize: 5,
      }),
    );

    // ---------- DynamoDB init Lambda (runs once on deploy) ----------
    const dynamodbInitFunction = new lambda.Function(this, "DynamodbInitFunction", {
      functionName: `${prefix}-dynamodb-init`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(openNextDir, "dynamodb-provider")),
      memorySize: 128,
      timeout: cdk.Duration.seconds(120),
      environment: {
        CACHE_DYNAMO_TABLE: tagCacheTable.tableName,
      },
    });

    tagCacheTable.grantReadWriteData(dynamodbInitFunction);

    new cr.AwsCustomResource(this, "DynamodbInit", {
      onCreate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: dynamodbInitFunction.functionName,
          InvocationType: "Event",
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
      onUpdate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: dynamodbInitFunction.functionName,
          InvocationType: "Event",
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          resources: [dynamodbInitFunction.functionArn],
        }),
      ]),
    });

    // ---------- CloudFront function to forward host header ----------
    const hostForwardFn = new cloudfront.Function(this, "HostForwardFn", {
      functionName: `${prefix}-host-forward`,
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  request.headers["x-forwarded-host"] = { value: request.headers["host"].value };
  return request;
}
      `),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    // ---------- CloudFront OAC for S3 ----------
    const oac = new cloudfront.S3OriginAccessControl(this, "OAC", {
      description: `OAC for ${prefix}`,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(assetsBucket, {
      originAccessControl: oac,
    });

    // ---------- CloudFront distribution ----------
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: prefix,
      ...(isProduction && certificate
        ? {
            domainNames: ["nicholasgriffin.dev", "www.nicholasgriffin.dev"],
            certificate,
          }
        : {}),
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(serverFunctionUrl),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        functionAssociations: [
          {
            function: hostForwardFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "_next/image*": {
          origin: new origins.FunctionUrlOrigin(imageOptFunctionUrl),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "_next/*": {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        "favicon.ico": {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        "icons/*": {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        "images/*": {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // ---------- Route53 alias records (production only) ----------
    if (isProduction) {
      const devZone = route53.HostedZone.fromHostedZoneAttributes(this, "DevZone", {
        hostedZoneId: "Z10253952JE8NDHIG9NCH",
        zoneName: "nicholasgriffin.dev",
      });

      const cfTarget = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));

      new route53.ARecord(this, "ApexARecord", {
        zone: devZone,
        target: cfTarget,
      });
      new route53.AaaaRecord(this, "ApexAaaaRecord", {
        zone: devZone,
        target: cfTarget,
      });
      new route53.ARecord(this, "WwwARecord", {
        zone: devZone,
        recordName: "www",
        target: cfTarget,
      });
      new route53.AaaaRecord(this, "WwwAaaaRecord", {
        zone: devZone,
        recordName: "www",
        target: cfTarget,
      });
    }

    // ---------- Deploy static assets to S3 ----------
    new s3deploy.BucketDeployment(this, "AssetsDeployment", {
      sources: [s3deploy.Source.asset(path.join(openNextDir, "assets"))],
      destinationBucket: assetsBucket,
      destinationKeyPrefix: "_assets",
      distribution,
      distributionPaths: ["/_next/*"],
    });

    // ---------- Outputs ----------
    new cdk.CfnOutput(this, "DistributionUrl", {
      value: isProduction
        ? "https://nicholasgriffin.dev"
        : `https://${distribution.distributionDomainName}`,
      exportName: `${prefix}-url`,
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      exportName: `${prefix}-distribution-id`,
    });
  }
}
