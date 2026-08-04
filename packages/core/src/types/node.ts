import type { NodeType } from "../constants/node-types.js";
import type {
  NexusTransform,
  NexusStyle,
  NexusResponsiveStyles,
  NexusAnchor,
} from "./style.js";
import type { SignalPort } from "./signal.js";

export interface NodeMeta {
  collapsed?: boolean;
  locked?: boolean;
  hidden?: boolean;
  comment?: string;
  colorTag?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NodeTypeData {
  content?: string;
  richText?: boolean;
  assetRef?: string;
  alt?: string;
  objectFit?: "contain" | "cover" | "fill" | "none";
  loop?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  href?: string;
  openInNewTab?: boolean;
  text?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  submit?: boolean;
  inputType?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date";
  name?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  componentRef?: string;
  props?: Record<string, unknown>;
  tableName?: string;
  route?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  cronExpression?: string;
  interval?: number;
  repeat?: boolean;
  initialValue?: number;
  condition?: string;
  variableName?: string;
  variableDefault?: unknown;
  behavior?: Record<string, unknown>;
}

export interface NexusNode {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  childrenIds: string[];
  transform: NexusTransform;
  anchor?: NexusAnchor;
  style: NexusStyle;
  responsive?: NexusResponsiveStyles;
  behavior?: Record<string, unknown>;
  inputs: SignalPort[];
  outputs: SignalPort[];
  data: NodeTypeData;
  meta: NodeMeta;
  tag?: string;
  ariaRole?: string;
  ariaLabel?: string;
}
