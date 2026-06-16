import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { join } from "node:path";

const appRoot = process.cwd();

export class TrainKafkaCaptureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const appName = this.node.tryGetContext("appName") ?? "train-kafka-capture";
    const kafkaBootstrapServer = this.node.tryGetContext("kafkaBootstrapServer");
    const kafkaTopic = this.node.tryGetContext("kafkaTopic");
    const kafkaConsumerGroupId =
      this.node.tryGetContext("kafkaConsumerGroupId") ?? `${appName}-${this.account}`;
    const notificationsWebhookUrl = this.node.tryGetContext("notificationsWebhookUrl");
    const notificationsWebhookTokenSecretName =
      this.node.tryGetContext("notificationsWebhookTokenSecretName") ??
      `${appName}/notifications-webhook-token`;

    if (!kafkaBootstrapServer || !kafkaTopic || !notificationsWebhookUrl) {
      throw new Error(
        "Missing required CDK context: kafkaBootstrapServer, kafkaTopic, notificationsWebhookUrl",
      );
    }

    const table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const rawBucket = new s3.Bucket(this, "RawBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [{ id: "raw-retention", expiration: Duration.days(30) }],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const adminSiteBucket = new s3.Bucket(this, "AdminSiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const adminSiteDistribution = new cloudfront.Distribution(this, "AdminSiteDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(adminSiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
      ],
    });
    const adminSiteUrl =
      this.node.tryGetContext("adminSiteUrl") ??
      `https://${adminSiteDistribution.distributionDomainName}`;
    const adminSiteOrigin = new URL(adminSiteUrl).origin;

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: { minLength: 12 },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient("WebClient", {
      authFlows: { userPassword: true, userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [adminSiteUrl],
        logoutUrls: [adminSiteUrl],
      },
    });

    const accountPart = cdk.Token.isUnresolved(this.account) ? "account" : this.account;
    const regionPart = cdk.Token.isUnresolved(this.region) ? "region" : this.region;
    const safePrefix = `${appName}-${accountPart}-${regionPart}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 63);
    const userPoolDomain = userPool.addDomain("HostedDomain", {
      cognitoDomain: { domainPrefix: safePrefix },
    });

    const commonEnv = {
      TABLE_NAME: table.tableName,
      RAW_BUCKET_NAME: rawBucket.bucketName,
      APP_NAME: appName,
    };

    const notificationsWebhookTokenSecret = new secretsmanager.Secret(
      this,
      "NotificationsWebhookTokenSecret",
      {
        secretName: notificationsWebhookTokenSecretName,
        description: "Bearer token used by train capture Lambdas to call the notifications Worker",
        generateSecretString: {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: "token",
          excludePunctuation: true,
        },
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );
    const notificationsWebhookToken = `{{resolve:secretsmanager:${notificationsWebhookTokenSecretName}:SecretString:token}}`;

    const notificationEnv = {
      NOTIFICATIONS_WEBHOOK_URL: notificationsWebhookUrl,
      NOTIFICATIONS_WEBHOOK_TOKEN: notificationsWebhookToken,
    };
    const reconcilerFunctionName = `${appName}-subscription-reconciler`;
    const reconcilerFunctionArn = this.formatArn({
      service: "lambda",
      resource: "function",
      resourceName: reconcilerFunctionName,
      arnFormat: cdk.ArnFormat.COLON_RESOURCE_NAME,
    });
    const processorFunctionName = `${appName}-subscription-processor`;
    const processorFunctionArn = this.formatArn({
      service: "lambda",
      resource: "function",
      resourceName: processorFunctionName,
      arnFormat: cdk.ArnFormat.COLON_RESOURCE_NAME,
    });

    const apiFn = new lambdaNode.NodejsFunction(this, "ApiFunction", {
      entry: join(appRoot, "src/handlers/api.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: { ...commonEnv, ...notificationEnv },
      bundling: { format: lambdaNode.OutputFormat.CJS, target: "node24", sourceMap: true },
    });

    const kafkaConsumerFn = new lambdaNode.NodejsFunction(this, "KafkaConsumerFunction", {
      entry: join(appRoot, "src/handlers/kafka-capture.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        ...commonEnv,
        KAFKA_TOPIC: kafkaTopic,
        PROCESSOR_FUNCTION_NAME: processorFunctionName,
      },
      bundling: { format: lambdaNode.OutputFormat.CJS, target: "node24", sourceMap: true },
    });

    const processorFn = new lambdaNode.NodejsFunction(this, "SubscriptionProcessorFunction", {
      entry: join(appRoot, "src/handlers/subscription-processing.ts"),
      handler: "handler",
      functionName: processorFunctionName,
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        ...commonEnv,
        ...notificationEnv,
        RECONCILER_FUNCTION_NAME: reconcilerFunctionName,
      },
      bundling: { format: lambdaNode.OutputFormat.CJS, target: "node24", sourceMap: true },
    });

    const reconcilerFn = new lambdaNode.NodejsFunction(this, "SubscriptionReconcilerFunction", {
      entry: join(appRoot, "src/handlers/subscription-reconciliation.ts"),
      handler: "handler",
      functionName: reconcilerFunctionName,
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: Duration.seconds(15),
      memorySize: 128,
      environment: commonEnv,
      bundling: { format: lambdaNode.OutputFormat.CJS, target: "node24", sourceMap: true },
    });

    const expirySweeperFn = new lambdaNode.NodejsFunction(this, "ExpirySweeperFunction", {
      entry: join(appRoot, "src/handlers/subscription-expiry.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: { ...commonEnv, ...notificationEnv },
      bundling: { format: lambdaNode.OutputFormat.CJS, target: "node24", sourceMap: true },
    });

    apiFn.node.addDependency(notificationsWebhookTokenSecret);
    processorFn.node.addDependency(notificationsWebhookTokenSecret);
    expirySweeperFn.node.addDependency(notificationsWebhookTokenSecret);

    table.grantReadWriteData(apiFn);
    table.grantReadWriteData(processorFn);
    table.grantReadWriteData(reconcilerFn);
    table.grantReadWriteData(expirySweeperFn);
    rawBucket.grantPut(kafkaConsumerFn);
    rawBucket.grantRead(processorFn);

    const kafkaCredentialsSecret = new secretsmanager.Secret(this, "KafkaBasicAuthSecret", {
      secretName: `${appName}/kafka/basic-auth`,
      description: "Kafka BASIC_AUTH credentials for the train capture Lambda event source mapping",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "pending-deploy" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    kafkaCredentialsSecret.grantRead(kafkaConsumerFn);

    const sourceAccessConfigurations: lambda.CfnEventSourceMapping.SourceAccessConfigurationProperty[] =
      [{ type: "BASIC_AUTH", uri: kafkaCredentialsSecret.secretArn }];

    const kafkaMapping = new lambda.CfnEventSourceMapping(this, "DarwinKafkaEventSourceMapping", {
      functionName: kafkaConsumerFn.functionName,
      topics: [kafkaTopic],
      startingPosition: "LATEST",
      batchSize: 100,
      maximumBatchingWindowInSeconds: 5,
      enabled: false,
      selfManagedEventSource: {
        endpoints: {
          kafkaBootstrapServers: [kafkaBootstrapServer],
        },
      },
      sourceAccessConfigurations,
      selfManagedKafkaEventSourceConfig: {
        consumerGroupId: kafkaConsumerGroupId,
      },
    });

    reconcilerFn.addEnvironment("EVENT_SOURCE_MAPPING_UUID", kafkaMapping.ref);
    apiFn.addEnvironment("RECONCILER_FUNCTION_NAME", reconcilerFunctionName);
    expirySweeperFn.addEnvironment("RECONCILER_FUNCTION_NAME", reconcilerFunctionName);

    reconcilerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:GetEventSourceMapping", "lambda:UpdateEventSourceMapping"],
        resources: ["*"],
      }),
    );
    reconcilerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
      }),
    );

    const invokeReconcilerPolicy = new iam.PolicyStatement({
      actions: ["lambda:InvokeFunction"],
      resources: [reconcilerFunctionArn, `${reconcilerFunctionArn}:*`],
    });
    apiFn.addToRolePolicy(invokeReconcilerPolicy);
    processorFn.addToRolePolicy(invokeReconcilerPolicy);
    expirySweeperFn.addToRolePolicy(invokeReconcilerPolicy);
    kafkaConsumerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [processorFunctionArn, `${processorFunctionArn}:*`],
      }),
    );

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      corsPreflight: {
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: [adminSiteOrigin],
      },
    });

    const authorizer = new apigwv2Authorizers.HttpJwtAuthorizer(
      "CognitoJwtAuthorizer",
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      },
    );

    const apiIntegration = new apigwv2Integrations.HttpLambdaIntegration("ApiIntegration", apiFn);

    api.addRoutes({
      path: "/listeners",
      methods: [apigwv2.HttpMethod.POST],
      integration: apiIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/listeners",
      methods: [apigwv2.HttpMethod.GET],
      integration: apiIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/subscriptions",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.GET],
      integration: apiIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/subscriptions/{subscriptionId}",
      methods: [apigwv2.HttpMethod.DELETE],
      integration: apiIntegration,
      authorizer,
    });

    new s3deploy.BucketDeployment(this, "AdminSiteDeployment", {
      destinationBucket: adminSiteBucket,
      distribution: adminSiteDistribution,
      distributionPaths: ["/*"],
      sources: [
        s3deploy.Source.asset(join(appRoot, "client")),
        s3deploy.Source.data(
          "config.js",
          [
            "window.TRAINS_ADMIN_CONFIG = ",
            JSON.stringify(
              {
                apiUrl: api.apiEndpoint,
                cognitoDomain: userPoolDomain.baseUrl(),
                clientId: userPoolClient.userPoolClientId,
                redirectUri: adminSiteUrl,
              },
              null,
              2,
            ),
            ";\n",
          ].join(""),
        ),
      ],
    });

    new events.Rule(this, "ExpiryEveryMinute", {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [new targets.LambdaFunction(expirySweeperFn)],
    });

    new events.Rule(this, "ReconcileEveryFiveMinutes", {
      schedule: events.Schedule.rate(Duration.minutes(5)),
      targets: [new targets.LambdaFunction(reconcilerFn)],
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new cdk.CfnOutput(this, "AdminSiteUrl", { value: adminSiteUrl });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "CognitoHostedDomain", { value: userPoolDomain.baseUrl() });
    new cdk.CfnOutput(this, "RawBucketName", { value: rawBucket.bucketName });
    new cdk.CfnOutput(this, "KafkaCredentialsSecretArn", {
      value: kafkaCredentialsSecret.secretArn,
    });
    new cdk.CfnOutput(this, "KafkaCredentialsSecretName", {
      value: kafkaCredentialsSecret.secretName,
    });
    new cdk.CfnOutput(this, "NotificationsWebhookTokenSecretName", {
      value: notificationsWebhookTokenSecretName,
    });
    new cdk.CfnOutput(this, "KafkaMappingUuid", { value: kafkaMapping.ref });
  }
}
