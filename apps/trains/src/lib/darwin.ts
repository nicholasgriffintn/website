export type DarwinLocation = {
  tpl: string;
  wta?: string;
  wtd?: string;
  wtp?: string;
  pta?: string;
  ptd?: string;
  arr?: { at?: string; et?: string; src?: string; atClass?: string };
  dep?: { at?: string; et?: string; src?: string; atClass?: string };
  pass?: { at?: string; et?: string; src?: string; atClass?: string };
  plat?: unknown;
  length?: string;
};

export type DarwinUpdate = {
  ts: string;
  version?: string;
  uR?: {
    updateOrigin?: string;
    TS?: {
      rid: string;
      uid?: string;
      ssd: string;
      Location?: DarwinLocation[];
    };
  };
};

export type KafkaEnvelope = {
  messageID?: string;
  bytes?: string;
  properties?: {
    PushPortSequence?: { string?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type ParsedKafkaMessage = {
  envelope: KafkaEnvelope;
  update?: DarwinUpdate;
  messageId: string;
  sequence?: string;
};

export function parseKafkaValue(rawValue: string): ParsedKafkaMessage {
  const envelope = JSON.parse(rawValue) as KafkaEnvelope;

  return parseKafkaEnvelope(envelope);
}

export function parseKafkaEnvelope(envelope: KafkaEnvelope): ParsedKafkaMessage {
  const update = envelope.bytes ? (JSON.parse(envelope.bytes) as DarwinUpdate) : undefined;
  const messageId = envelope.messageID ?? crypto.randomUUID();
  const sequence = envelope.properties?.PushPortSequence?.string;

  return { envelope, update, messageId, sequence };
}

export function locations(update: DarwinUpdate): DarwinLocation[] {
  return update.uR?.TS?.Location ?? [];
}

export function rid(update: DarwinUpdate): string | undefined {
  return update.uR?.TS?.rid;
}

export function uid(update: DarwinUpdate): string | undefined {
  return update.uR?.TS?.uid;
}

export function serviceDate(update: DarwinUpdate): string | undefined {
  return update.uR?.TS?.ssd;
}

export function plannedDepartureAt(location: DarwinLocation): string | undefined {
  return location.ptd ?? location.wtd ?? location.pta ?? location.wta ?? location.wtp;
}

export function actualArrivalAt(location: DarwinLocation): string | undefined {
  return location.arr?.at ?? location.pass?.at;
}

export function estimatedArrivalAt(location: DarwinLocation): string | undefined {
  return location.arr?.et ?? location.pass?.et;
}

export function uniqueTpls(update: DarwinUpdate): string[] {
  return [
    ...new Set(
      locations(update)
        .map((loc) => loc.tpl?.toUpperCase())
        .filter(Boolean),
    ),
  ];
}

function parseMinutes(hhmmss: string): number | undefined {
  const [hh, mm] = hhmmss.split(":").map((part) => Number(part));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return undefined;
  }

  return hh * 60 + mm;
}

export function isSameTimeWindow(
  actual: string | undefined,
  wanted: string,
  windowMinutes: number,
): boolean {
  if (!actual) {
    return false;
  }

  const a = parseMinutes(actual);
  const w = parseMinutes(wanted);
  if (a === undefined || w === undefined) {
    return false;
  }

  return Math.abs(a - w) <= windowMinutes;
}
