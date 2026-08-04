export interface NexusTransform {
  x: string;
  y: string;
  width: string;
  height: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  zIndex?: number;
}

export interface NexusAnchor {
  x: number;
  y: number;
}

export type SpacingValue =
  | string
  | { top: string; right: string; bottom: string; left: string };

export interface NexusStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  backgroundPosition?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?:
    | "none"
    | "solid"
    | "dashed"
    | "dotted"
    | "double"
    | "groove"
    | "ridge"
    | "inset"
    | "outset";
  opacity?: number;
  display?: "block" | "inline" | "flex" | "grid" | "none" | "inline-block";
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  overflow?: "visible" | "hidden" | "scroll" | "auto" | "clip";
  width?: string;
  height?: string;
  boxShadow?: string;
  cursor?:
    | "default"
    | "pointer"
    | "text"
    | "grab"
    | "not-allowed"
    | "move"
    | "crosshair"
    | "zoom-in"
    | "zoom-out";
  pointerEvents?: "auto" | "none";
  border?: string;
  transition?: string;
  transform?: string;
  padding?: SpacingValue;
  margin?: SpacingValue;
  maxWidth?: string;
  minWidth?: string;
  maxHeight?: string;
  minHeight?: string;
  aspectRatio?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export interface NexusResponsiveStyles {
  sm?: Partial<NexusStyle>;
  md?: Partial<NexusStyle>;
  lg?: Partial<NexusStyle>;
  xl?: Partial<NexusStyle>;
  "2xl"?: Partial<NexusStyle>;
}
