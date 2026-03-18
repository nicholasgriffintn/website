import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
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

    const webBuildDir = path.join(__dirname, "../../web/build");

    // ---------- S3 bucket (static assets) ----------
    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: `${prefix}-assets`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProduction,
    });

    // ---------- Server Lambda ----------
    const serverFunction = new lambda.Function(this, "ServerFunction", {
      functionName: `${prefix}-server`,
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(path.join(webBuildDir, "server")),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: "production",
      },
    });

    const serverFunctionUrl = serverFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
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
      },
      additionalBehaviors: {
        "assets/*": {
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

    // ---------- Route53 alias records ----------
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
      sources: [s3deploy.Source.asset(path.join(webBuildDir, "client"))],
      destinationBucket: assetsBucket,
      distribution,
      distributionPaths: ["/assets/*", "/favicon.ico", "/icons/*", "/images/*"],
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
