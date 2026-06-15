import {
  GetEventSourceMappingCommand,
  UpdateEventSourceMappingCommand,
} from "@aws-sdk/client-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { ddb, lambda } from "../lib/aws.js";
import { requiredEnv } from "../lib/env.js";
import { counterKey } from "../lib/keys.js";
import type { ActiveCounterItem } from "../lib/types.js";

const tableName = requiredEnv("TABLE_NAME");
const eventSourceMappingUuid = requiredEnv("EVENT_SOURCE_MAPPING_UUID");

export async function handler(): Promise<{
  activeCount: number;
  shouldEnable: boolean;
  state: string;
}> {
  const result = await ddb.send(new GetCommand({ TableName: tableName, Key: counterKey }));
  const counter = result.Item as ActiveCounterItem | undefined;
  const activeCount = Math.max(0, Number(counter?.activeCount ?? 0));
  const shouldEnable = activeCount > 0;

  const mapping = await lambda.send(
    new GetEventSourceMappingCommand({ UUID: eventSourceMappingUuid }),
  );
  const state = mapping.State ?? "Unknown";
  const isEnabledOrEnabling = state === "Enabled" || state === "Enabling";
  const isDisabledOrDisabling = state === "Disabled" || state === "Disabling";

  if (shouldEnable && !isEnabledOrEnabling) {
    await lambda.send(
      new UpdateEventSourceMappingCommand({ UUID: eventSourceMappingUuid, Enabled: true }),
    );
    console.log({ action: "enabled-kafka-mapping", activeCount, previousState: state });
  } else if (!shouldEnable && !isDisabledOrDisabling) {
    await lambda.send(
      new UpdateEventSourceMappingCommand({ UUID: eventSourceMappingUuid, Enabled: false }),
    );
    console.log({ action: "disabled-kafka-mapping", activeCount, previousState: state });
  } else {
    console.log({ action: "no-op", activeCount, state });
  }

  return { activeCount, shouldEnable, state };
}
