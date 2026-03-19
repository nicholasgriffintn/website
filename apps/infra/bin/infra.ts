#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as path from "node:path";
import { WebStack } from "../lib/web-stack";
import { CertificateStack } from "../lib/certificate-stack";
import { CoUkRedirectStack } from "../lib/redirect-stack";

import { loadEnvFile } from "../utils/env";

loadEnvFile(path.resolve(process.cwd(), "../web/.env"));

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? "eu-west-1";

const certStack = new CertificateStack(app, "CertStack", {
  env: { account, region: "us-east-1" },
  crossRegionReferences: true,
});

const redirectStack = new CoUkRedirectStack(app, "CoUkRedirectStack", {
  env: { account, region: "us-east-1" },
  crossRegionReferences: true,
  coUkCert: certStack.coUkCert,
});
redirectStack.addDependency(certStack);

const productionStack = new WebStack(app, "WebStack-Production", {
  environment: "production",
  env: { account, region },
  crossRegionReferences: true,
});
productionStack.addDependency(certStack);

new WebStack(app, "WebStack-Preview", {
  environment: "preview",
  env: { account, region },
  certificate: certStack.devCert,
});
