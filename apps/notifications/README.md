# Nicholas Griffin - Notifications Worker

Routes known notification messages to configured destination services.

## Local development

From the repo root:

```bash
pnpm install
cd apps/notifications
```

Create `apps/notifications/.dev.vars`:

```dotenv
NOTIFICATIONS_TOKEN=replace-with-notifications-token
EMAIL_SERVICE_TOKEN=replace-with-email-service-token
```
