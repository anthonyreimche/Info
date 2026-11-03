// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

import { React, api } from "./rt";
import type { UiTokens } from "./safelight";

export const EMPTY_CLASS = "safelight-info-empty";
export const RATING_ROW_CLASS = "safelight-info-rating";
export const LIST_CLASS = "safelight-info-fields";
export const ROW_CLASS = "safelight-info-field";
export const LABEL_CLASS = "safelight-info-label";
export const VALUE_CLASS = "safelight-info-value";

export function metadataCss(t: UiTokens): string {
  return `
:where(.${EMPTY_CLASS}) { font-size: 11px; color: ${t.textMuted}; }
:where(.${RATING_ROW_CLASS}) { margin-bottom: 0.375rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 11px; }
:where(.${LIST_CLASS} > :not(:last-child)) { margin-block-end: 0.125rem; }
:where(.${ROW_CLASS}) { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 11px; }
:where(.${LABEL_CLASS}) { flex-shrink: 0; color: ${t.textMuted}; }
:where(.${VALUE_CLASS}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; color: ${t.textSecondary}; }
html.sl-larger-text .${EMPTY_CLASS}, html.sl-larger-text .${RATING_ROW_CLASS}, html.sl-larger-text .${ROW_CLASS} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(1)} MB`;
  if (bytes >= 1 << 10) return `${Math.round(bytes / (1 << 10))} KB`;
  return `${bytes} B`;
}

function formatDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}` : s;
}

function formatFocal(e: { focalLength?: number; focalLength35mm?: number }): string | undefined {
  if (!e.focalLength) return undefined;
  if (e.focalLength35mm && e.focalLength35mm !== e.focalLength)
    return `${e.focalLength} mm (${e.focalLength35mm} mm eq.)`;
  return `${e.focalLength} mm`;
}

function formatExposureComp(v: number | undefined): string | undefined {
  if (v === undefined || v === 0) return undefined;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v} EV`;
}

function formatCameraMatch(e: { baselineExposure?: number | null; baselineShadows?: number | null }): string | undefined {
  const exposure = formatExposureComp(e.baselineExposure ?? undefined);
  return exposure && e.baselineShadows ? `${exposure}, Shadows +${e.baselineShadows}` : exposure;
}

function formatCoord(lat: number | undefined, lon: number | undefined): string | undefined {
  if (lat === undefined || lon === undefined) return undefined;
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

function formatAltitude(v: number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return `${v} m`;
}

function formatDistance(v: number | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v >= 1) return `${v} m`;
  return `${Math.round(v * 100)} cm`;
}

function formatLens(e: {
  lens?: string;
  lensMake?: string;
}): string | undefined {
  if (!e.lens) return undefined;
  if (e.lensMake && !e.lens.startsWith(e.lensMake)) return `${e.lensMake} ${e.lens}`;
  return e.lens;
}

export function MetadataPanel() {
  const { Panel, Rating } = api.components;
  const useCatalogStore = api.stores.useCatalogStore;
  const photo = useCatalogStore((s) =>
    s.photos.find((p) => p.id === s.activePhotoId),
  );
  const setRating = useCatalogStore((s) => s.setRating);
  // A RAW imported from its camera preview has the preview's size until its
  // metadata is read from the whole file: read it now for the photo shown.
  const pendingId = photo?.metadataPending ? photo.id : null;
  React.useEffect(() => {
    void api.catalog.settleSelectedPhoto(pendingId);
  }, [pendingId]);
  if (!photo) {
    return (
      <Panel title="Metadata">
        <p className={EMPTY_CLASS}>Select a photo</p>
      </Panel>
    );
  }

  const e = photo.exif;
  const camera = [e.cameraMake, e.cameraModel].filter(Boolean).join(" ");
  const hasGps = e.gpsLatitude !== undefined && e.gpsLongitude !== undefined;

  const rows: [string, string | undefined][] = [
    ["Filename", photo.filename],
    ["Artist", e.artist],
    ["Copyright", e.copyright],
    ["Description", e.imageDescription],
    ["Camera", camera || undefined],
    ["Body S/N", e.bodySerial],
    ["Software", e.software],
    ["Lens", formatLens(e)],
    ["Lens S/N", e.lensSerial],
    ["Focal length", formatFocal(e)],
    ["Max aperture", e.maxAperture ? `f/${e.maxAperture}` : undefined],
    ["Aperture", e.aperture ? `f/${e.aperture}` : undefined],
    ["Shutter", e.shutterSpeed],
    ["ISO", e.iso ? `${e.iso}` : undefined],
    ["Program", e.exposureProgram],
    ["Exp. mode", e.exposureMode],
    ["Exp. comp.", formatExposureComp(e.exposureCompensation)],
    ["Raw exp. bias", formatExposureComp(e.rawExposureBias)],
    ["Camera match", formatCameraMatch(e)],
    ["Metering", e.meteringMode],
    ["White balance", e.whiteBalance],
    ["Flash", e.flash],
    ["Focus dist.", formatDistance(e.subjectDistance)],
    ["Scene", e.sceneCaptureType],
    ["Colour space", e.colorSpace],
    ["Date", formatDate(e.dateTimeOriginal)],
    ["Location", formatCoord(e.gpsLatitude, e.gpsLongitude)],
    ["Altitude", hasGps ? formatAltitude(e.gpsAltitude) : undefined],
    [
      "Dimensions",
      photo.width && photo.height
        ? `${photo.width} × ${photo.height}`
        : undefined,
    ],
    ["Size", formatSize(photo.fileSize)],
    ["Type", photo.mimeType || undefined],
  ];
  const visible = rows.filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <Panel title="Metadata">
      <div className={RATING_ROW_CLASS}>
        <span className={LABEL_CLASS}>Rating</span>
        <Rating
          value={photo.rating}
          onChange={(r) => setRating(photo.id, r)}
          size="md"
        />
      </div>
      <dl className={LIST_CLASS}>
        {visible.map(([k, v]) => (
          <div key={k} className={ROW_CLASS}>
            <dt className={LABEL_CLASS}>{k}</dt>
            <dd className={VALUE_CLASS} title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
