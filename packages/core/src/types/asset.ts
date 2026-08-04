export type AssetType = "image" | "font" | "icon" | "video" | "audio" | "json" | "css" | "script";

export interface NexusAsset {
  id: string;
  name: string;
  type: AssetType;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  externalUrl?: string;
  alt?: string;
  fontWeight?: string;
  fontStyle?: string;
  checksum: string;
  createdAt: string;
  updatedAt: string;
}

export interface NexusAssetRegistry {
  version: string;
  assets: NexusAsset[];
}