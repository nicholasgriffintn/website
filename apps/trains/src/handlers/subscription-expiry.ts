import { GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { ddb } from "../lib/aws.js";
import {
  defaultNotificationsListener,
  defaultNotificationsListenerId,
} from "../lib/default-listener.js";
import { requiredEnv } from "../lib/env.js";
import { counterKey, expiresSk, listenerSk, nowEpochSeconds, userPk } from "../lib/keys.js";
import { sendNotification } from "../lib/notification-delivery.js";
import { trainNotification } from "../lib/notifications.js";
import { invokeReconciler } from "../lib/reconcile.js";
import type { ListenerItem, SubscriptionItem } from "../lib/types.js";

const tableName = requiredEnv("TABLE_NAME");

async function listenerFor(item: SubscriptionItem): Promise<ListenerItem | undefined> {
  if (item.listenerId === defaultNotificationsListenerId) {
    return defaultNotificationsListener(item.userId);
  }

  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: userPk(item.userId), sk: listenerSk(item.listenerId) },
    }),
  );
  return result.Item as ListenerItem | undefined;
}

async function expireSubscription(item: SubscriptionItem, nowIso: string): Promise<boolean> {
  if (!item.active) {
    return false;
  }

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: tableName,
              Key: { pk: item.pk, sk: item.sk },
              ConditionExpression: "active = :true",
              UpdateExpression:
                "SET active = :false, #status = :status, updatedAt = :now REMOVE gsi1pk, gsi1sk, gsi2pk, gsi2sk",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":true": true,
                ":status": "EXPIRED",
                ":now": nowIso,
              },
            },
          },
          {
            Update: {
              TableName: tableName,
              Key: counterKey,
              UpdateExpression: "SET updatedAt = :now ADD activeCount :minusOne",
              ExpressionAttributeValues: { ":now": nowIso, ":minusOne": -1 },
            },
          },
        ],
      }),
    );

    const listener = await listenerFor(item);

    if (listener) {
      await sendNotification(
        listener,
        trainNotification("train.listening.stopped", { ...item, active: false, status: "EXPIRED" }),
      );
    }

    return true;
  } catch (error) {
    console.warn("Failed to expire subscription, probably already updated elsewhere", {
      subscriptionId: item.subscriptionId,
      error,
    });
    return false;
  }
}

export async function handler(): Promise<{ expired: number }> {
  const now = nowEpochSeconds();
  const nowIso = new Date().toISOString();
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk AND gsi2sk <= :sk",
      ExpressionAttributeValues: {
        ":pk": "EXPIRES",
        ":sk": expiresSk(now, "zzzz"),
      },
      Limit: 100,
    }),
  );

  let expired = 0;
  for (const item of (result.Items ?? []) as SubscriptionItem[]) {
    if (await expireSubscription(item, nowIso)) {
      expired += 1;
    }
  }

  if (expired > 0) {
    await invokeReconciler();
  }

  return { expired };
}
