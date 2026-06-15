# Train Kafka Capture CDK

AWS serverless setup for consuming Darwin Push Port Kafka updates from National Rail Enquires only while active user subscriptions exist.

- Cognito User Pool, app client, hosted auth domain
- HTTP API protected by Cognito JWT authorizer
- S3-backed static admin site for managing train subscriptions
- DynamoDB single table for listeners, subscriptions, counters
- S3 bucket for raw captured Kafka batches
- Lambda Kafka consumer with self-managed Kafka event source mapping, initially disabled
- Lambda subscription processor that reads captured S3 batches and sends webhook updates
- Lambda reconciler that enables/disables Kafka polling from active subscription count
- Lambda expiry sweeper that expires old subscriptions and disables polling when count reaches zero
- EventBridge schedule for expiry/reconcile backstop

## API

All API calls require Cognito JWT auth.

### Create listener

```http
POST /listeners
Authorization: Bearer <id-token-or-access-token>
Content-Type: application/json

{
  "name": "Local webhook",
  "webhookUrl": "https://example.com/train-webhook",
  "webhookToken": "secret-token-sent-as-bearer"
}
```

### List listeners

```http
GET /listeners
Authorization: Bearer <token>
```

### Create subscription

```http
POST /subscriptions
Authorization: Bearer <id-token-or-access-token>
Content-Type: application/json

{
  "listenerId": "lst_...",
  "originTpl": "FALCNWD",
  "destinationTpl": "DARTFDJ",
  "serviceDate": "2026-06-15",
  "plannedDepartureTime": "19:26",
  "expiresAtEpochSeconds": 1781548740
}
```

Default expiry is planned departure + 6 hours if not supplied. The subscription processor also expires the subscription when the destination has an actual or estimated arrival in a matching Darwin update.

### List subscriptions

```http
GET /subscriptions
Authorization: Bearer <token>
```

### Cancel subscription

```http
DELETE /subscriptions/{subscriptionId}
Authorization: Bearer <token>
```

## Deploy

```bash
pnpm run deploy
```

The deploy outputs `AdminSiteUrl`. Open that URL to sign in with Cognito and manage listeners/subscriptions.

`adminSiteUrl` in `cdk.json` sets the public admin URL used for Cognito callback/logout URLs and generated client config. The API CORS origin is derived from that URL without the trailing slash.

`notificationsWebhookUrl` points at the notifications Worker. The stack creates the AWS Secrets Manager JSON secret named by `notificationsWebhookTokenSecretName`. The `postdeploy` script writes the real token from `.env`, matching the Kafka credential sync flow.

## Admin site

The admin UI is deployed from `client/` to S3 and served through CloudFront for HTTPS. It uses the generated `config.js` deployed by CDK, Cognito Hosted UI with PKCE, and the protected HTTP API.

The UI supports:

- create webhook listeners
- list existing listeners
- create train subscriptions
- list subscription status
- cancel active subscriptions

## Secrets

Put Kafka credentials in `apps/trains/.env`:

```dotenv
RDM_KAFKA_BOOTSTRAP_SERVERS=...
RDM_REALTIME_KAFKA_TOPIC=...
RDM_KAFKA_USER_GROUP=...
RDM_KAFKA_USERNAME=...
RDM_KAFKA_PASSWORD=...
NOTIFICATIONS_WEBHOOK_TOKEN=...
```

The CDK stack creates the Secrets Manager secret for Lambda self-managed Kafka `BASIC_AUTH`. The `postdeploy` script reads `RDM_KAFKA_USERNAME` and `RDM_KAFKA_PASSWORD` from `.env` and writes them into that secret as JSON with `username` and `password`.

The CDK stack also creates `NotificationsWebhookTokenSecretName`. The same `postdeploy` script reads `NOTIFICATIONS_WEBHOOK_TOKEN` from `.env` and writes it into that secret as JSON with `token`.

Run `pnpm secrets:sync` to push updated Kafka credentials and the notifications webhook token from `.env` without redeploying the stack. Set the Cloudflare `NOTIFICATIONS_TOKEN` secret for `apps/notifications` to the same `NOTIFICATIONS_WEBHOOK_TOKEN` value.
