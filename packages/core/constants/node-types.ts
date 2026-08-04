export const VISUAL_NODE_TYPES = [
  "page",
  "container",
  "text",
  "image",
  "link",
  "button",
  "input",
  "textarea",
  "select",
  "video",
  "canvas",
  "svg",
  "component",
] as const;

export const LAYOUT_NODE_TYPES = ["flex", "grid", "stack", "scroll"] as const;

export const LOGIC_NODE_TYPES = [
  "timer",
  "counter",
  "condition",
  "variable",
  "router",
  "http_request",
  "form_validator",
] as const;

export const BACKEND_NODE_TYPES = [
  "api_endpoint",
  "database_table",
  "database_query",
  "auth_provider",
  "storage_bucket",
  "websocket_room",
  "cron_job",
  "email_sender",
] as const;

export const ALL_NODE_TYPES = [
  ...VISUAL_NODE_TYPES,
  ...LAYOUT_NODE_TYPES,
  ...LOGIC_NODE_TYPES,
  ...BACKEND_NODE_TYPES,
] as const;

export type NodeType = (typeof ALL_NODE_TYPES)[number];
export type VisualNodeType = (typeof VISUAL_NODE_TYPES)[number];
export type LogicNodeType = (typeof LOGIC_NODE_TYPES)[number];
export type BackendNodeType = (typeof BACKEND_NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  page: "Page",
  container: "Container",
  text: "Text",
  image: "Image",
  link: "Link",
  button: "Button",
  input: "Input",
  textarea: "Text Area",
  select: "Select",
  video: "Video",
  canvas: "Canvas",
  svg: "SVG",
  component: "Component",
  flex: "Flex Layout",
  grid: "Grid Layout",
  stack: "Stack",
  scroll: "Scroll View",
  timer: "Timer",
  counter: "Counter",
  condition: "Condition",
  variable: "Variable",
  router: "Router",
  http_request: "HTTP Request",
  form_validator: "Form Validator",
  api_endpoint: "API Endpoint",
  database_table: "Database Table",
  database_query: "Database Query",
  auth_provider: "Auth Provider",
  storage_bucket: "Storage Bucket",
  websocket_room: "WebSocket Room",
  cron_job: "Cron Job",
  email_sender: "Email Sender",
};

export const NODE_TYPE_DEFAULT_TAG: Record<VisualNodeType, string> = {
  page: "html",
  container: "div",
  text: "span",
  image: "img",
  link: "a",
  button: "button",
  input: "input",
  textarea: "textarea",
  select: "select",
  video: "video",
  canvas: "canvas",
  svg: "svg",
  component: "div",
};
