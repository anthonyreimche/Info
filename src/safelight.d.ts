// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/extensions/ui-kit.tsx,
// src/state/catalog-store.ts, src/state/broadcast.ts, src/catalog/types.ts and
// src/rendering/histogram.ts. Extensions are standalone bundles, so the host's
// source is not on the type path; React types come from @types/react (dev only).

import type { ComponentType, ReactNode } from "react";

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

/** The EXIF fields the Info panel shows or renders with. */
export interface ExifData {
  cameraMake?: string;
  cameraModel?: string;
  bodySerial?: string;
  lens?: string;
  lensMake?: string;
  lensSerial?: string;
  focalLength?: number;
  focalLength35mm?: number;
  aperture?: number;
  maxAperture?: number;
  shutterSpeed?: string;
  iso?: number;
  exposureCompensation?: number;
  exposureProgram?: string;
  exposureMode?: string;
  meteringMode?: string;
  whiteBalance?: string;
  flash?: string;
  /** Metres. */
  subjectDistance?: number;
  sceneCaptureType?: string;
  colorSpace?: string;
  artist?: string;
  copyright?: string;
  software?: string;
  imageDescription?: string;
  dateTimeOriginal?: string;
  /** As-shot white balance in Kelvin. */
  colorTemperature?: number;
  /** EV the sensor sat below the tagged ISO (Fujifilm DR modes). */
  rawExposureBias?: number;
  /** EV the camera baseline adds to a RAW to reach its camera's brightness;
   *  null when the camera's embedded preview gave no usable match. */
  baselineExposure?: number | null;
  /** The Shadows (0 to 100) the camera baseline adds with it. */
  baselineShadows?: number | null;
  /** Decimal degrees, positive north. */
  gpsLatitude?: number;
  /** Decimal degrees, positive east. */
  gpsLongitude?: number;
  /** Metres above sea level. */
  gpsAltitude?: number;
}

/** A catalog photo, with the fields this extension reads. */
export interface CatalogPhoto {
  id: string;
  filename: string;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  rating: number;
  /** Baked-in display rotation, degrees clockwise. */
  rotation: number;
  keywords: string[];
  exif: ExifData;
  /** Set on a RAW imported from its camera preview alone, until its metadata
   *  is read from the whole file; until then width/height are the preview's. */
  metadataPending?: true;
}

export interface CatalogStoreState {
  photos: CatalogPhoto[];
  selectedIds: Set<string>;
  activePhotoId: string | null;
  /** Bumped after file access is granted again, to reload bitmaps. */
  fileAccessNonce: number;
  setRating(id: string, rating: number): Promise<void>;
  addKeyword(id: string, keyword: string): Promise<void>;
  removeKeyword(id: string, keyword: string): Promise<void>;
  addKeywords(ids: string[], keywords: string[]): Promise<void>;
  removeKeywords(ids: string[], keywords: string[]): Promise<void>;
}

export interface ExtendedHistogramData {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  luma: Uint32Array;
  rangeMin: number;
  rangeMax: number;
  clipLow: number;
  clipHigh: number;
}

export interface HistogramData {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  luma: Uint32Array;
  extended?: ExtendedHistogramData;
}

/** A photo's edit changed, in this window or another. */
export interface EditUpdateMessage {
  type: "edit-update";
  payload: { photoId: string | null };
}

/** The app's other cross-window messages, whose payloads this extension never
 *  reads. */
export interface OtherBroadcastMessage {
  type:
    | "selection-change"
    | "catalog-change"
    | "detach"
    | "attach"
    | "navigate"
    | "catalog-records"
    | "catalog-hello";
  payload: unknown;
}

export type BroadcastMessage = EditUpdateMessage | OtherBroadcastMessage;

export interface PanelProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
}

export interface HistogramProps {
  data: HistogramData | null;
}

export interface PanelDockDefault {
  module: "library" | "develop";
  direction: "left" | "right" | "bottom";
  order?: number;
  width?: number;
  height?: number;
}

export interface PanelContribution {
  /** Globally unique, e.g. "core.histogram" or "my-ext.fancy-curves". */
  id: string;
  title: string;
  component: ComponentType;
  defaultDock?: PanelDockDefault;
}

/** A stylesheet applied to every app window after the core styles. Extension
 *  rules are unlayered, so they win over Tailwind utility classes at equal or
 *  lower specificity; disabling the extension removes the sheet. */
export interface StylesheetContribution {
  id: string;
  css: string;
}

/** The theme's CSS variables as `var(--color-…)` strings. */
export interface UiTokens {
  readonly surface1: string;
  readonly surface2: string;
  readonly surface3: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly accent: string;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  registerPanel(c: PanelContribution): void;
  registerStylesheet(c: StylesheetContribution): void;
  ui: { tokens: UiTokens };
  components: {
    /** A titled, collapsible section; inside a dock panel of the same title it
     *  drops its header. */
    Panel: ComponentType<PanelProps>;
    Histogram: ComponentType<HistogramProps>;
    Rating: ComponentType<RatingProps>;
  };
  stores: {
    useCatalogStore: StoreApi<CatalogStoreState>;
  };
  catalog: {
    /** Read the full metadata of a photo whose import left it pending; null
     *  stops. Only the last photo asked for is read. */
    settleSelectedPhoto(id: string | null): Promise<void>;
    /** The histogram of a photo's saved edit, rendered from its thumbnail. Null
     *  without WebGL or when the photo can't be read. */
    renderHistogram(photo: CatalogPhoto): Promise<HistogramData | null>;
  };
  events: {
    /** Messages from this window and the app's others. Returns an unsubscribe. */
    onBroadcast(handler: (message: BroadcastMessage) => void): () => void;
    /** The window event the Focus keyword input shortcut (K by default)
     *  dispatches in Library. */
    FOCUS_KEYWORD_INPUT: "sl-focus-keyword-input";
  };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
