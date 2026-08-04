export type SignalDataType = "event" | "boolean" | "string" | "number" | "object" | "array" | "any";

export interface SignalPort {
  id: string;
  label: string;
  type: SignalDataType;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
}

export interface NexusSignalLink {
  id: string;
  source: string;
  sourceOutput: string;
  target: string;
  targetInput: string;
  type: SignalDataType;
}

export interface SignalPayload<T = unknown> {
  linkId: string;
  from: string;
  fromPort: string;
  value: T;
  timestamp: number;
}

export type SignalHandler<T = unknown> = (payload: SignalPayload<T>) => void;