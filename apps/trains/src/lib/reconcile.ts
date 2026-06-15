import { InvokeCommand } from "@aws-sdk/client-lambda";
import { lambda } from "./aws.js";

export async function invokeReconciler(): Promise<void> {
  const functionName = process.env.RECONCILER_FUNCTION_NAME;
  if (!functionName) {
    return;
  }

  await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "Event",
      Payload: Buffer.from(JSON.stringify({ source: "app" })),
    }),
  );
}
