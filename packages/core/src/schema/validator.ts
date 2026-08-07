import { z } from "zod";
import { ALL_NODE_TYPES } from "../constants/node-types.js";

export const SpacingValueSchema = z.union([
  z.string(),
  z.object({
    top: z.string(),
    right: z.string(),
    bottom: z.string(),
    left: z.string(),
  }),
]);

export const NexusTransformSchema = z.object({
  x: z.string().default("0"),
  y: z.string().default("0"),
  width: z.string().default("auto"),
  height: z.string().default("auto"),
  rotation: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  zIndex: z.number().optional(),
});

export const NexusAnchorSchema = z.object({
  x: z.number().min(0).max(1).default(0),
  y: z.number().min(0).max(1).default(0),
});

export const NexusStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundSize: z.string().optional(),
  backgroundRepeat: z.string().optional(),
  backgroundPosition: z.string().optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  lineHeight: z.union([z.string(), z.number()]).optional(),
  letterSpacing: z.string().optional(),
  textTransform: z
    .enum(["none", "uppercase", "lowercase", "capitalize"])
    .optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  textDecoration: z.string().optional(),
  borderRadius: z.string().optional(),
  borderWidth: z.string().optional(),
  borderColor: z.string().optional(),
  borderStyle: z
    .enum([
      "none",
      "solid",
      "dashed",
      "dotted",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset",
    ])
    .optional(),
  opacity: z.number().min(0).max(1).optional(),
  display: z
    .enum(["block", "inline", "flex", "grid", "none", "inline-block"])
    .optional(),
  flexDirection: z
    .enum(["row", "column", "row-reverse", "column-reverse"])
    .optional(),
  justifyContent: z
    .enum([
      "flex-start",
      "center",
      "flex-end",
      "space-between",
      "space-around",
      "space-evenly",
    ])
    .optional(),
  alignItems: z
    .enum(["flex-start", "center", "flex-end", "stretch", "baseline"])
    .optional(),
  gap: z.string().optional(),
  gridTemplateColumns: z.string().optional(),
  gridTemplateRows: z.string().optional(),
  overflow: z
    .enum(["visible", "hidden", "scroll", "auto", "clip"])
    .optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  boxShadow: z.string().optional(),
  cursor: z
    .enum([
      "default",
      "pointer",
      "text",
      "grab",
      "not-allowed",
      "move",
      "crosshair",
      "zoom-in",
      "zoom-out",
    ])
    .optional(),
  pointerEvents: z.enum(["auto", "none"]).optional(),
  border: z.string().optional(),
  transition: z.string().optional(),
  transform: z.string().optional(),
  padding: SpacingValueSchema.optional(),
  margin: SpacingValueSchema.optional(),
  maxWidth: z.string().optional(),
  minWidth: z.string().optional(),
  maxHeight: z.string().optional(),
  minHeight: z.string().optional(),
  aspectRatio: z.string().optional(),
  objectFit: z
    .enum(["contain", "cover", "fill", "none", "scale-down"])
    .optional(),
});

export const NexusResponsiveStylesSchema = z.object({
  sm: NexusStyleSchema.partial().optional(),
  md: NexusStyleSchema.partial().optional(),
  lg: NexusStyleSchema.partial().optional(),
  xl: NexusStyleSchema.partial().optional(),
  "2xl": NexusStyleSchema.partial().optional(),
});

export const NexusAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum([
    "image",
    "font",
    "icon",
    "video",
    "audio",
    "json",
    "css",
    "script",
  ]),
  mimeType: z.string(),
  extension: z.string(),
  size: z.number().int().nonnegative(),
  path: z.string(),
  externalUrl: z.string().url().optional(),
  alt: z.string().optional(),
  fontWeight: z.string().optional(),
  fontStyle: z.string().optional(),
  checksum: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const NexusAssetRegistrySchema = z.object({
  version: z.string(),
  assets: z.array(NexusAssetSchema),
});

export const SignalPortSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "event",
    "boolean",
    "string",
    "number",
    "object",
    "array",
    "any",
  ]),
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
  required: z.boolean().optional(),
});

export const NexusSignalLinkSchema = z.object({
  id: z.string().uuid(),
  source: z.string().uuid(),
  sourceOutput: z.string().min(1),
  target: z.string().uuid(),
  targetInput: z.string().min(1),
  type: z.enum([
    "event",
    "boolean",
    "string",
    "number",
    "object",
    "array",
    "any",
  ]),
});

export const NodeMetaSchema = z.object({
  collapsed: z.boolean().optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  comment: z.string().optional(),
  colorTag: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const NodeTypeDataSchema = z
  .object({
    content: z.string().optional(),
    richText: z.boolean().optional(),
    assetRef: z.string().uuid().optional(),
    alt: z.string().optional(),
    objectFit: z.enum(["contain", "cover", "fill", "none"]).optional(),
    loop: z.boolean().optional(),
    autoplay: z.boolean().optional(),
    muted: z.boolean().optional(),
    href: z.string().optional(),
    openInNewTab: z.boolean().optional(),
    text: z.string().optional(),
    variant: z.enum(["primary", "secondary", "ghost", "danger"]).optional(),
    submit: z.boolean().optional(),
    inputType: z
      .enum([
        "text",
        "email",
        "password",
        "number",
        "tel",
        "url",
        "search",
        "date",
      ])
      .optional(),
    name: z.string().optional(),
    value: z.string().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    componentRef: z.string().uuid().optional(),
    props: z.record(z.unknown()).optional(),
    tableName: z.string().optional(),
    route: z.string().optional(),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
    cronExpression: z.string().optional(),
    interval: z.number().optional(),
    repeat: z.boolean().optional(),
    initialValue: z.number().optional(),
    condition: z.string().optional(),
    variableName: z.string().optional(),
    variableDefault: z.unknown().optional(),
  })
  .passthrough();

export const NexusNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(ALL_NODE_TYPES),
  name: z.string().min(1),
  parentId: z.string().uuid().nullable(),
  childrenIds: z.array(z.string().uuid()),
  transform: NexusTransformSchema,
  anchor: NexusAnchorSchema.optional(),
  style: NexusStyleSchema,
  responsive: NexusResponsiveStylesSchema.optional(),
  inputs: z.array(SignalPortSchema),
  outputs: z.array(SignalPortSchema),
  data: NodeTypeDataSchema,
  meta: NodeMetaSchema,
  tag: z.string().optional(),
  ariaRole: z.string().optional(),
  ariaLabel: z.string().optional(),
});

export const SceneMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  language: z.string().optional(),
  favicon: z.string().uuid().optional(),
  themeColor: z.string().optional(),
  viewport: z.string().optional(),
  customHead: z.string().optional(),
});

export const NexusSceneSchema = z.object({
  version: z.string(),
  id: z.string().uuid(),
  name: z.string().min(1),
  isComponent: z.boolean().default(false),
  meta: SceneMetaSchema,
  nodes: z.record(z.string().uuid(), NexusNodeSchema),
  rootId: z.string().uuid(),
  signals: z.array(NexusSignalLinkSchema),
  assets: NexusAssetRegistrySchema,
  globalStyle: z
    .object({
      css: z.string().optional(),
      tokens: z.record(z.string()).optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ComponentExportSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "string",
    "number",
    "boolean",
    "color",
    "asset",
    "node",
    "enum",
  ]),
  defaultValue: z.unknown().optional(),
  options: z.array(z.string()).optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  category: z.string().optional(),
});

export const NexusComponentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().uuid().optional(),
  exports: z.array(ComponentExportSchema),
  inputs: z.array(SignalPortSchema),
  outputs: z.array(SignalPortSchema),
  scene: NexusSceneSchema,
  version: z.string(),
});

export const ComponentLibrarySchema = z.object({
  version: z.string(),
  components: z.array(NexusComponentSchema),
});

export const ProjectFileSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string().uuid(),
    kind: z.literal("folder"),
    name: z.string().min(1),
    parentId: z.string().uuid().nullable(),
    children: z.array(z.string().uuid()),
  }),
  z.object({
    id: z.string().uuid(),
    kind: z.literal("scene"),
    name: z.string().min(1),
    parentId: z.string().uuid().nullable(),
    children: z.array(z.string().uuid()),
    scene: NexusSceneSchema,
  }),
  z.object({
    id: z.string().uuid(),
    kind: z.literal("component"),
    name: z.string().min(1),
    parentId: z.string().uuid().nullable(),
    children: z.array(z.string().uuid()),
    component: NexusComponentSchema,
  }),
]);

export const ProjectManifestMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  version: z.string().optional(),
});

export const NexusProjectManifestSchema = z.object({
  formatVersion: z.string(),
  version: z.string(),
  id: z.string().uuid(),
  name: z.string().min(1),
  meta: ProjectManifestMetaSchema,
  rootFileId: z.string().uuid(),
  rootId: z.string().uuid(),
  files: z.record(z.string().uuid(), ProjectFileSchema),
  assets: NexusAssetRegistrySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ValidatedNexusScene = z.infer<typeof NexusSceneSchema>;
export type ValidatedNexusNode = z.infer<typeof NexusNodeSchema>;
export type ValidatedNexusComponent = z.infer<typeof NexusComponentSchema>;
export type ValidatedNexusProjectManifest = z.infer<
  typeof NexusProjectManifestSchema
>;
