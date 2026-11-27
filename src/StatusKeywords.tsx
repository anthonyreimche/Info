// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// A Keywords button in Develop's status bar, after core's flag, stars, label and
// keyword count (the develop-photo-metadata slot, Safelight 3.2.8). It opens the
// Info panel's keyword editor above the bar, so keywords can be added and taken
// off without leaving Develop. Escape or a click elsewhere closes it.

import { React, api } from "./rt";
import type { UiTokens } from "./safelight";
import { INPUT_CLASS, KeywordEditor } from "./KeywordEditor";

export const KEYWORDS_SLOT_ID = "safelight.info.status-keywords";

export const STATUS_KEYWORDS_CLASS = "safelight-info-status-keywords";
export const STATUS_TRIGGER_CLASS = "safelight-info-status-keywords-trigger";
export const STATUS_OPEN_CLASS = "safelight-info-status-keywords-open";
export const STATUS_POPOVER_CLASS = "safelight-info-status-keywords-popover";

// The trigger copies core's status-bar text buttons: 10 px muted words with a
// padded hit box whose negative margins keep the bar's spacing.
export function statusKeywordsCss(t: UiTokens): string {
  return `
:where(.${STATUS_KEYWORDS_CLASS}) { position: relative; display: flex; align-items: center; }
:where(.${STATUS_TRIGGER_CLASS}) { margin: -0.375rem -0.25rem; border-radius: 0.25rem; padding: 0.375rem 0.25rem; font-size: 10px; line-height: 1; color: ${t.textMuted}; }
@media (hover: hover) { :where(.${STATUS_TRIGGER_CLASS}:hover) { color: ${t.textPrimary}; } }
:where(.${STATUS_OPEN_CLASS}) { color: ${t.textPrimary}; }
:where(.${STATUS_POPOVER_CLASS}) { position: absolute; bottom: 100%; left: 0; z-index: 50; margin-bottom: 0.375rem; width: 240px; border-radius: 0.375rem; border: 1px solid ${t.border}; background-color: ${t.surface2}; padding: 0.5rem; box-shadow: 0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a; }
html.sl-larger-text .${STATUS_TRIGGER_CLASS} { font-size: 12px !important; }
`;
}

export function StatusKeywords() {
  const hasPhoto = api.stores.useCatalogStore((s) => s.activePhotoId !== null);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLInputElement>(`.${INPUT_CLASS}`)?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    const giveBack = api.ui.onEscape?.(() => {
      setOpen(false);
      triggerRef.current?.focus();
    });
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      giveBack?.();
    };
  }, [open]);

  if (!hasPhoto) return null;

  return (
    <div ref={rootRef} className={STATUS_KEYWORDS_CLASS}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        title="Add or remove this photo's keywords"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={open ? `${STATUS_TRIGGER_CLASS} ${STATUS_OPEN_CLASS}` : STATUS_TRIGGER_CLASS}
      >
        Keywords
      </button>
      {open && (
        <div role="dialog" aria-label="Keywords" className={STATUS_POPOVER_CLASS}>
          <KeywordEditor />
        </div>
      )}
    </div>
  );
}
