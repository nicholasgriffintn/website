import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { GetCommand, PutCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { ddb } from "./aws.js";
import { parseJsonBody, userIdFrom } from "./api-request.js";
import {
  defaultNotificationsListener,
  defaultNotificationsListenerId,
} from "./default-listener.js";
import { requiredEnv } from "./env.js";
import { json, notFound, empty, badRequest, type ApiResponse } from "./http.js";
import {
  activeDestinationPk,
  activeSubscriptionSk,
  counterKey,
  expiresSk,
  listenerSk,
  nowEpochSeconds,
  subscriptionSk,
  userPk,
} from "./keys.js";
import { publicListener } from "./listeners.js";
import { sendNotification } from "./notification-delivery.js";
import { trainNotification } from "./notifications.js";
import { invokeReconciler } from "./reconcile.js";
import { publicSubscription } from "./subscriptions.js";
import type { ListenerItem, SubscriptionItem } from "./types.js";
import {
  assertClockTime,
  assertHttpsUrl,
  assertServiceDate,
  requireString,
  requireTplCode,
} from "./validation.js";

const tableName = requiredEnv("TABLE_NAME");

async function listenerFor(userId: string, listenerId: string): Promise<ListenerItem | undefined> {
  if (listenerId === defaultNotificationsListenerId) {
    return defaultNotificationsListener(userId);
  }

  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: userPk(userId), sk: listenerSk(listenerId) },
    }),
  );

  return result.Item as ListenerItem | undefined;
}

export async function createListener(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<ApiResponse> {
  const userId = userIdFrom(event);
  const body = parseJsonBody<Record<string, unknown>>(event);
  const name = requireString(body.name, "name");
  const webhookUrl = requireString(body.webhookUrl, "webhookUrl");
  const webhookToken = requireString(body.webhookToken, "webhookToken");
  assertHttpsUrl(webhookUrl, "webhookUrl");

  const now = new Date().toISOString();
  const listenerId = `lst_${crypto.randomUUID()}`;
  const item: ListenerItem = {
    pk: userPk(userId),
    sk: listenerSk(listenerId),
    entityType: "LISTENER",
    userId,
    listenerId,
    name,
    webhookUrl,
    webhookToken,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
    }),
  );

  return json(201, { listenerId, name, webhookUrl });
}

export async function listListeners(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<ApiResponse> {
  const userId = userIdFrom(event);
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: { ":pk": userPk(userId), ":sk": "LISTENER#" },
      ScanIndexForward: false,
      Limit: 100,
    }),
  );

  return json(200, {
    listeners: [
      publicListener(defaultNotificationsListener(userId)),
      ...((result.Items as ListenerItem[]) ?? []).map(publicListener),
    ],
  });
}

export async function createSubscription(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<ApiResponse> {
  const userId = userIdFrom(event);
  const body = parseJsonBody<Record<string, unknown>>(event);

  const listenerId = requireString(body.listenerId, "listenerId");
  const originTpl = requireTplCode(body.originTpl, "originTpl");
  const destinationTpl = requireTplCode(body.destinationTpl, "destinationTpl");
  const serviceDate = requireString(body.serviceDate, "serviceDate");
  const plannedDepartureTime = requireString(body.plannedDepartureTime, "plannedDepartureTime");
  const timeWindowMinutes = Number(body.timeWindowMinutes ?? 5);

  assertServiceDate(serviceDate);
  assertClockTime(plannedDepartureTime, "plannedDepartureTime");
  if (!Number.isFinite(timeWindowMinutes) || timeWindowMinutes < 0 || timeWindowMinutes > 60) {
    throw new Error("timeWindowMinutes must be 0-60");
  }
  if (originTpl === destinationTpl) {
    throw new Error("originTpl and destinationTpl must differ");
  }

  const listener = await listenerFor(userId, listenerId);
  if (!listener) {
    return notFound("Listener not found");
  }

  const now = new Date().toISOString();
  const nowEpoch = nowEpochSeconds();
  const expiresAtEpochSeconds = Number(body.expiresAtEpochSeconds ?? nowEpoch + 6 * 60 * 60);
  if (!Number.isFinite(expiresAtEpochSeconds) || expiresAtEpochSeconds <= nowEpoch) {
    throw new Error("expiresAtEpochSeconds must be in the future");
  }

  const subscriptionId = `sub_${crypto.randomUUID()}`;
  const item: SubscriptionItem = {
    pk: userPk(userId),
    sk: subscriptionSk(subscriptionId),
    entityType: "SUBSCRIPTION",
    userId,
    subscriptionId,
    listenerId,
    originTpl,
    destinationTpl,
    serviceDate,
    plannedDepartureTime,
    timeWindowMinutes,
    active: true,
    status: "ACTIVE",
    expiresAtEpochSeconds,
    gsi1pk: activeDestinationPk(serviceDate, destinationTpl),
    gsi1sk: activeSubscriptionSk(originTpl, plannedDepartureTime, subscriptionId),
    gsi2pk: "EXPIRES",
    gsi2sk: expiresSk(expiresAtEpochSeconds, subscriptionId),
    ttl: expiresAtEpochSeconds + 7 * 24 * 60 * 60,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableName,
            Item: item,
            ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
          },
        },
        {
          Update: {
            TableName: tableName,
            Key: counterKey,
            UpdateExpression: "SET updatedAt = :now ADD activeCount :one",
            ExpressionAttributeValues: { ":now": now, ":one": 1 },
          },
        },
      ],
    }),
  );

  await invokeReconciler();
  await sendNotification(listener, trainNotification("train.listening.started", item));
  return json(201, publicSubscription(item));
}

export async function listSubscriptions(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<ApiResponse> {
  const userId = userIdFrom(event);
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: { ":pk": userPk(userId), ":sk": "SUB#" },
      ScanIndexForward: false,
      Limit: 100,
    }),
  );

  return json(200, {
    subscriptions: ((result.Items as SubscriptionItem[]) ?? []).map(publicSubscription),
  });
}

export async function cancelSubscription(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<ApiResponse> {
  const userId = userIdFrom(event);
  const subscriptionId = event.pathParameters?.subscriptionId;
  if (!subscriptionId) {
    return badRequest("subscriptionId is required");
  }

  const key = { pk: userPk(userId), sk: subscriptionSk(subscriptionId) };
  const current = await ddb.send(new GetCommand({ TableName: tableName, Key: key }));
  const item = current.Item as SubscriptionItem | undefined;
  if (!item) {
    return empty(204);
  }
  if (!item.active) {
    return empty(204);
  }

  const now = new Date().toISOString();
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: tableName,
            Key: key,
            ConditionExpression: "active = :true AND userId = :userId",
            UpdateExpression:
              "SET active = :false, #status = :status, updatedAt = :now REMOVE gsi1pk, gsi1sk, gsi2pk, gsi2sk",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":true": true,
              ":status": "CANCELLED",
              ":now": now,
              ":userId": userId,
            },
          },
        },
        {
          Update: {
            TableName: tableName,
            Key: counterKey,
            UpdateExpression: "SET updatedAt = :now ADD activeCount :minusOne",
            ExpressionAttributeValues: { ":now": now, ":minusOne": -1 },
          },
        },
      ],
    }),
  );

  await invokeReconciler();
  const listener = await listenerFor(userId, item.listenerId);
  if (listener) {
    await sendNotification(
      listener,
      trainNotification("train.listening.stopped", { ...item, active: false, status: "CANCELLED" }),
    );
  }

  return empty(204);
}
