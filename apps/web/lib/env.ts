export function getEnvValue(name: string) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  return process.env[name];
}
