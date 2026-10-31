// A stand-in Safelight API over real React and zustand. The catalog store edits
// ratings and keywords the way core's does (an added keyword a photo already
// has is skipped), and records every action called. Panel, Rating and
// Histogram are small stand-ins with core's labels; the host's catalog and
// broadcast calls are recorded, and `broadcast` delivers a message to every
// listener as core's same-window fan-out does.

import * as React from "react";
import { create } from "zustand";
import type {
  BroadcastMessage,
  CatalogPhoto,
  CatalogStoreState,
  HistogramData,
  HistogramProps,
  PanelContribution,
  PanelProps,
  RatingProps,
  SafelightAPI,
  StoreApi,
  StylesheetContribution,
  UiTokens,
} from "../../src/safelight";

export const TOKENS: UiTokens = {
  surface1: "var(--color-surface-1)",
  surface2: "var(--color-surface-2)",
  surface3: "var(--color-surface-3)",
  border: "var(--color-border)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
  accent: "var(--color-accent)",
};

export type CatalogCall =
  | ["setRating", string, number]
  | ["addKeyword", string, string]
  | ["removeKeyword", string, string]
  | ["addKeywords", string[], string[]]
  | ["removeKeywords", string[], string[]];

export interface Rig {
  api: SafelightAPI;
  catalog: StoreApi<CatalogStoreState>;
  /** Every catalog store action called, in order. */
  calls: CatalogCall[];
  /** Every id passed to `catalog.settleSelectedPhoto`, in order. */
  settled: (string | null)[];
  /** Every photo passed to `catalog.renderHistogram`, in order. */
  rendered: CatalogPhoto[];
  /** The `data` of each Histogram render, in order. */
  histograms: (HistogramData | null)[];
  panels: PanelContribution[];
  stylesheets: StylesheetContribution[];
  broadcast(message: BroadcastMessage): void;
  /** How many onBroadcast listeners are subscribed now. */
  listenerCount(): number;
}

/** A photo with `id`, a JPEG of 6000 × 4000 and no EXIF, unless `extra` says
 *  otherwise. */
export function photo(id: string, extra: Partial<CatalogPhoto> = {}): CatalogPhoto {
  return {
    id,
    filename: `${id}.jpg`,
    thumbnailUrl: `blob:${id}`,
    width: 6000,
    height: 4000,
    fileSize: 5 * (1 << 20),
    mimeType: "image/jpeg",
    rating: 0,
    rotation: 0,
    keywords: [],
    exif: {},
    ...extra,
  };
}

/** A histogram whose luma names the photo it was rendered for. */
export function histogramOf(p: CatalogPhoto): HistogramData {
  const bins = new Uint32Array([p.id.length]);
  return { r: bins, g: bins, b: bins, luma: bins };
}

function Panel({ title, children }: PanelProps) {
  return React.createElement(
    "section",
    { "aria-label": title },
    React.createElement("h3", null, title),
    children,
  );
}

function Rating({ value, onChange }: RatingProps) {
  return React.createElement(
    "div",
    { role: "group", "aria-label": `Rating: ${value} of 5 stars` },
    [1, 2, 3, 4, 5].map((star) =>
      React.createElement(
        "button",
        {
          key: star,
          "aria-label": `${star} star${star === 1 ? "" : "s"}`,
          onClick: () => onChange?.(value === star ? 0 : star),
        },
        star <= value ? "★" : "☆",
      ),
    ),
  );
}

export function fakeApi({
  photos = [],
  activePhotoId = null,
  selectedIds = activePhotoId ? [activePhotoId] : [],
  histogram = async (p: CatalogPhoto) => histogramOf(p),
}: {
  photos?: CatalogPhoto[];
  activePhotoId?: string | null;
  selectedIds?: string[];
  histogram?: (p: CatalogPhoto) => Promise<HistogramData | null>;
} = {}): Rig {
  const calls: CatalogCall[] = [];
  const settled: (string | null)[] = [];
  const rendered: CatalogPhoto[] = [];
  const histograms: (HistogramData | null)[] = [];
  const panels: PanelContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];
  const listeners = new Set<(message: BroadcastMessage) => void>();

  const catalog: StoreApi<CatalogStoreState> = create<CatalogStoreState>()((set) => {
    const commit = (ids: string[], edit: (p: CatalogPhoto) => CatalogPhoto) => {
      const hit = new Set(ids);
      set((s) => ({ photos: s.photos.map((p) => (hit.has(p.id) ? edit(p) : p)) }));
      return Promise.resolve();
    };
    return {
      photos,
      selectedIds: new Set(selectedIds),
      activePhotoId,
      fileAccessNonce: 0,
      setRating: (id, rating) => {
        calls.push(["setRating", id, rating]);
        return commit([id], (p) => ({ ...p, rating }));
      },
      addKeyword: (id, keyword) => {
        calls.push(["addKeyword", id, keyword]);
        return commit([id], (p) => ({
          ...p,
          keywords: p.keywords.includes(keyword) ? p.keywords : [...p.keywords, keyword],
        }));
      },
      removeKeyword: (id, keyword) => {
        calls.push(["removeKeyword", id, keyword]);
        return commit([id], (p) => ({ ...p, keywords: p.keywords.filter((k) => k !== keyword) }));
      },
      addKeywords: (ids, keywords) => {
        calls.push(["addKeywords", ids, keywords]);
        return commit(ids, (p) => {
          const toAdd = keywords.filter((k) => !p.keywords.includes(k));
          return toAdd.length > 0 ? { ...p, keywords: [...p.keywords, ...toAdd] } : p;
        });
      },
      removeKeywords: (ids, keywords) => {
        calls.push(["removeKeywords", ids, keywords]);
        const remove = new Set(keywords);
        return commit(ids, (p) => ({ ...p, keywords: p.keywords.filter((k) => !remove.has(k)) }));
      },
    };
  });

  function Histogram({ data }: HistogramProps) {
    histograms.push(data);
    return React.createElement("canvas", { "aria-label": "Histogram" });
  }

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.info",
    react: React,
    registerPanel: (c) => void panels.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    ui: { tokens: TOKENS },
    components: { Panel, Histogram, Rating },
    stores: { useCatalogStore: catalog },
    catalog: {
      settleSelectedPhoto: async (id) => void settled.push(id),
      renderHistogram: (p) => {
        rendered.push(p);
        return histogram(p);
      },
    },
    events: {
      onBroadcast: (handler) => {
        listeners.add(handler);
        return () => void listeners.delete(handler);
      },
      FOCUS_KEYWORD_INPUT: "sl-focus-keyword-input",
    },
  };

  return {
    api,
    catalog,
    calls,
    settled,
    rendered,
    histograms,
    panels,
    stylesheets,
    broadcast: (message) => {
      for (const l of [...listeners]) l(message);
    },
    listenerCount: () => listeners.size,
  };
}
