// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Library "Info" panel: histogram of the active photo (rendered through the
// develop pipeline with its saved edits) plus the keywords and the metadata
// readout. Docked right of the grid by default.

import { KeywordEditor, keywordEditorCss } from "./KeywordEditor";
import { MetadataPanel, metadataCss } from "./MetadataPanel";
import { React, api } from "./rt";
import type { HistogramData, UiTokens } from "./safelight";

export const INFO_CLASS = "safelight-info";

/** The look core gave this panel with Tailwind utilities, as plain CSS (the
 *  app's Tailwind build never scans an extension). `:where()` drops the rules
 *  to zero specificity, so any stylesheet that restyles `button` or `input`
 *  (Custom Input Styling, a user's own CSS) wins over them as it wins over
 *  core's layered utilities. The `html.sl-larger-text` rules repeat core's
 *  Accessibility ▸ Larger text rules for 10 and 11 px text. */
export function infoCss(t: UiTokens): string {
  return `
:where(.${INFO_CLASS}) { display: flex; flex-direction: column; }
${keywordEditorCss(t).trim()}
${metadataCss(t).trim()}
`;
}

export function InfoPanel() {
  const { Panel } = api.components;
  return (
    <div className={INFO_CLASS}>
      <LibraryHistogram />
      <Panel title="Keywords">
        <KeywordEditor />
      </Panel>
      <MetadataPanel />
    </div>
  );
}

// Histogram of the active photo with its saved edits, so it matches Develop
// rather than the raw, unedited thumbnail.
function LibraryHistogram() {
  const { Histogram } = api.components;
  const useCatalogStore = api.stores.useCatalogStore;
  // Depend only on the fields the render actually consumes — the pixel source
  // (thumbnail blob, keyed by its object URL; the fallback decode's rotation),
  // as-shot WB, and file-access nonce — so metadata mutations that replace the
  // photo object (rating, flag, colour label, keywords) don't retrigger a full
  // develop-pipeline render. The live object is read inside the effect.
  const photoId = useCatalogStore((s) => s.activePhotoId);
  const thumbnailUrl = useCatalogStore(
    (s) => s.photos.find((p) => p.id === s.activePhotoId)?.thumbnailUrl,
  );
  const rotation = useCatalogStore(
    (s) => s.photos.find((p) => p.id === s.activePhotoId)?.rotation,
  );
  const colorTemperature = useCatalogStore(
    (s) => s.photos.find((p) => p.id === s.activePhotoId)?.exif.colorTemperature,
  );
  const fileAccessNonce = useCatalogStore((s) => s.fileAccessNonce);
  const [data, setData] = React.useState<HistogramData | null>(null);
  // Bumped when this photo's saved edits change (live from Develop, including a
  // detached window) so the histogram re-renders.
  const [editNonce, setEditNonce] = React.useState(0);

  React.useEffect(() => {
    if (!photoId) return;
    return api.events.onBroadcast((msg) => {
      if (msg.type === "edit-update" && msg.payload.photoId === photoId) {
        setEditNonce((n) => n + 1);
      }
    });
  }, [photoId]);

  React.useEffect(() => {
    let cancelled = false;
    if (!photoId) {
      setData(null);
      return;
    }
    (async () => {
      const photo = useCatalogStore
        .getState()
        .photos.find((p) => p.id === photoId);
      if (!photo) {
        setData(null);
        return;
      }
      const hist = await api.catalog.renderHistogram(photo);
      if (!cancelled) setData(hist);
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId, thumbnailUrl, rotation, colorTemperature, fileAccessNonce, editNonce]);

  return <Histogram data={data} />;
}
