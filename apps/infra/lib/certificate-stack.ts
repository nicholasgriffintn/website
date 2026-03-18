import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class CertificateStack extends cdk.Stack {
  // public readonly devCert: acm.ICertificate;
  public readonly coUkCert: acm.ICertificate;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const devZone = route53.HostedZone.fromHostedZoneAttributes(this, "DevZone", {
      hostedZoneId: "Z10253952JE8NDHIG9NCH",
      zoneName: "nicholasgriffin.dev",
    });

    /* this.devCert = new acm.Certificate(this, "DevCert", {
      domainName: "nicholasgriffin.dev",
      subjectAlternativeNames: ["www.nicholasgriffin.dev"],
      validation: acm.CertificateValidation.fromDns(devZone),
    }); */

    const coUkZone = route53.HostedZone.fromHostedZoneAttributes(this, "CoUkZone", {
      hostedZoneId: "Z10048483MV9GSRT6BH0U",
      zoneName: "nicholasgriffin.co.uk",
    });

    this.coUkCert = new acm.Certificate(this, "CoUkCert", {
      domainName: "nicholasgriffin.co.uk",
      subjectAlternativeNames: ["www.nicholasgriffin.co.uk"],
      validation: acm.CertificateValidation.fromDns(coUkZone),
    });
  }
}
