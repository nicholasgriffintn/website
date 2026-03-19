import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

export interface CoUkRedirectStackProps extends cdk.StackProps {
  coUkCert: acm.ICertificate;
}

export class CoUkRedirectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CoUkRedirectStackProps) {
    super(scope, id, props);

    const redirectFn = new lambda.Function(this, "RedirectFn", {
      functionName: "nickgriffin-couk-to-dev-redirect",
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const path = event.rawPath || '/';
  const qs = event.rawQueryString ? '?' + event.rawQueryString : '';
  return {
    statusCode: 301,
    headers: { location: 'https://nicholasgriffin.dev' + path + qs },
    body: '',
  };
};
      `),
    });

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      defaultIntegration: new integrations.HttpLambdaIntegration("RedirectIntegration", redirectFn),
    });

    const domainName = new apigwv2.DomainName(this, "DomainName", {
      domainName: "nicholasgriffin.co.uk",
      certificate: props.coUkCert,
    });

    new apigwv2.ApiMapping(this, "ApiMapping", {
      api: httpApi,
      domainName,
    });

    const wwwDomainName = new apigwv2.DomainName(this, "WwwDomainName", {
      domainName: "www.nicholasgriffin.co.uk",
      certificate: props.coUkCert,
    });

    new apigwv2.ApiMapping(this, "WwwApiMapping", {
      api: httpApi,
      domainName: wwwDomainName,
    });

    const coUkZone = route53.HostedZone.fromHostedZoneAttributes(this, "CoUkZone", {
      hostedZoneId: "Z10048483MV9GSRT6BH0U",
      zoneName: "nicholasgriffin.co.uk",
    });

    const apexTarget = route53.RecordTarget.fromAlias(
      new targets.ApiGatewayv2DomainProperties(
        domainName.regionalDomainName,
        domainName.regionalHostedZoneId,
      ),
    );

    const wwwTarget = route53.RecordTarget.fromAlias(
      new targets.ApiGatewayv2DomainProperties(
        wwwDomainName.regionalDomainName,
        wwwDomainName.regionalHostedZoneId,
      ),
    );

    new route53.ARecord(this, "ApexARecord", {
      zone: coUkZone,
      target: apexTarget,
    });
    new route53.AaaaRecord(this, "ApexAaaaRecord", {
      zone: coUkZone,
      target: apexTarget,
    });
    new route53.ARecord(this, "WwwARecord", {
      zone: coUkZone,
      recordName: "www",
      target: wwwTarget,
    });
    new route53.AaaaRecord(this, "WwwAaaaRecord", {
      zone: coUkZone,
      recordName: "www",
      target: wwwTarget,
    });
  }
}
