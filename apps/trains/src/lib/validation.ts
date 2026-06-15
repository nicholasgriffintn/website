export function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

export function requireTplCode(value: unknown, name: string): string {
  const tpl = requireString(value, name).toUpperCase();
  if (!/^[A-Z0-9]{3,16}$/.test(tpl)) {
    throw new Error(`${name} must be a CRS/TIPLOC-like code`);
  }

  return tpl;
}

export function assertHttpsUrl(value: string, name: string): void {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error(`${name} must be HTTPS`);
  }
}

export function assertServiceDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("serviceDate must be YYYY-MM-DD");
  }
}

export function assertClockTime(value: string, name: string): void {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw new Error(`${name} must be HH:mm or HH:mm:ss`);
  }
}
