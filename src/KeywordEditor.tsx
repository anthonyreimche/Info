// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

import type { KeyboardEvent } from "react";
import { React, api } from "./rt";
import type { UiTokens } from "./safelight";

export const EDITOR_CLASS = "safelight-keywords";
export const MULTI_LABEL_CLASS = "safelight-keywords-multi";
export const CHIPS_CLASS = "safelight-keywords-chips";
export const CHIP_CLASS = "safelight-keyword";
export const REMOVE_CLASS = "safelight-keyword-remove";
export const FIELD_CLASS = "safelight-keywords-field";
export const INPUT_CLASS = "safelight-keywords-input";
export const SUGGESTIONS_CLASS = "safelight-keywords-suggestions";
export const SUGGESTION_CLASS = "safelight-keywords-suggestion";
export const SUGGESTION_ACTIVE_CLASS = "safelight-keywords-suggestion-active";
export const COUNT_CLASS = "safelight-keywords-count";

export function keywordEditorCss(t: UiTokens): string {
  return `
:where(.${EDITOR_CLASS} > :not(:last-child)) { margin-block-end: 0.25rem; }
:where(.${MULTI_LABEL_CLASS}) { margin-bottom: 0.25rem; font-size: 10px; color: ${t.textMuted}; }
:where(.${CHIPS_CLASS}) { display: flex; flex-wrap: wrap; gap: 0.25rem; }
:where(.${CHIP_CLASS}) { display: inline-flex; align-items: center; gap: 0.125rem; border-radius: 0.25rem; background-color: ${t.surface3}; padding: 0.125rem 0.375rem; font-size: 10px; color: ${t.textSecondary}; }
:where(.${REMOVE_CLASS}) { margin-left: 0.125rem; color: ${t.textMuted}; }
@media (hover: hover) { :where(.${REMOVE_CLASS}:hover) { color: ${t.textPrimary}; } }
:where(.${FIELD_CLASS}) { position: relative; }
:where(.${INPUT_CLASS}) { width: 100%; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.25rem 0.5rem; font-size: 11px; color: ${t.textPrimary}; outline-style: none; }
:where(.${INPUT_CLASS})::placeholder { color: ${t.textMuted}; }
:where(.${INPUT_CLASS}:focus) { box-shadow: 0 0 0 1px ${t.accent}; }
:where(.${SUGGESTIONS_CLASS}) { position: absolute; left: 0; right: 0; top: 100%; z-index: 50; margin-top: 0.125rem; border-radius: 0.25rem; border: 1px solid ${t.border}; background-color: ${t.surface1}; padding: 0.125rem 0; box-shadow: 0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a; }
:where(.${SUGGESTION_CLASS}) { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 0.25rem 0.5rem; font-size: 11px; color: ${t.textSecondary}; }
@media (hover: hover) { :where(.${SUGGESTION_CLASS}:not(.${SUGGESTION_ACTIVE_CLASS}):hover) { background-color: ${t.surface2}; } }
:where(.${SUGGESTION_ACTIVE_CLASS}) { background-color: color-mix(in oklab, ${t.accent} 20%, transparent); color: ${t.textPrimary}; }
:where(.${COUNT_CLASS}) { color: ${t.textMuted}; }
html.sl-larger-text .${MULTI_LABEL_CLASS}, html.sl-larger-text .${CHIP_CLASS} { font-size: 12px !important; }
html.sl-larger-text .${INPUT_CLASS}, html.sl-larger-text .${SUGGESTION_CLASS} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}

export function KeywordEditor() {
  const useCatalogStore = api.stores.useCatalogStore;
  const photos = useCatalogStore((s) => s.photos);
  const selectedIds = useCatalogStore((s) => s.selectedIds);
  const activePhotoId = useCatalogStore((s) => s.activePhotoId);
  const addKeyword = useCatalogStore((s) => s.addKeyword);
  const removeKeyword = useCatalogStore((s) => s.removeKeyword);
  const addKeywords = useCatalogStore((s) => s.addKeywords);
  const removeKeywords = useCatalogStore((s) => s.removeKeywords);

  const [input, setInput] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const targetIds = React.useMemo(() => {
    if (selectedIds.size > 1) return [...selectedIds];
    if (activePhotoId) return [activePhotoId];
    return [];
  }, [selectedIds, activePhotoId]);

  const targetPhotos = React.useMemo(
    () => {
      const idSet = new Set(targetIds);
      return photos.filter((p) => idSet.has(p.id));
    },
    [photos, targetIds],
  );

  // Keywords shared by ALL target photos (intersection for multi-select display).
  const sharedKeywords = React.useMemo(() => {
    if (targetPhotos.length === 0) return [];
    if (targetPhotos.length === 1) return targetPhotos[0].keywords;
    const first = new Set(targetPhotos[0].keywords);
    for (let i = 1; i < targetPhotos.length; i++) {
      const kws = new Set(targetPhotos[i].keywords);
      for (const k of first) if (!kws.has(k)) first.delete(k);
    }
    return [...first];
  }, [targetPhotos]);

  // All unique keywords across the entire catalogue, with counts.
  const allKeywords = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of photos) {
      for (const k of p.keywords) {
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    return counts;
  }, [photos]);

  const suggestions = React.useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    const existing = new Set(sharedKeywords.map((k) => k.toLowerCase()));
    return [...allKeywords.entries()]
      .filter(([k]) => k.toLowerCase().includes(q) && !existing.has(k.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [input, allKeywords, sharedKeywords]);

  React.useEffect(() => {
    setSelectedSuggestion(0);
  }, [suggestions.length]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // The Library's K shortcut asks for the keyword field.
  React.useEffect(() => {
    const event = api.events.FOCUS_KEYWORD_INPUT;
    const handler = () => inputRef.current?.focus();
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, []);

  if (targetIds.length === 0) return null;

  const commitKeyword = (raw: string) => {
    const keyword = raw.trim();
    if (!keyword) return;
    if (targetIds.length > 1) {
      void addKeywords(targetIds, [keyword]);
    } else {
      void addKeyword(targetIds[0], keyword);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const handleRemove = (keyword: string) => {
    if (targetIds.length > 1) {
      void removeKeywords(targetIds, [keyword]);
    } else {
      void removeKeyword(targetIds[0], keyword);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        commitKeyword(suggestions[selectedSuggestion][0]);
      } else {
        commitKeyword(input);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion((i) => Math.max(i - 1, 0));
    } else if (e.key === "Backspace" && input === "" && sharedKeywords.length > 0) {
      handleRemove(sharedKeywords[sharedKeywords.length - 1]);
    }
  };

  const multiLabel =
    targetIds.length > 1 ? (
      <span className={MULTI_LABEL_CLASS}>
        Editing {targetIds.length} photos (shared keywords)
      </span>
    ) : null;

  return (
    <div ref={containerRef} className={EDITOR_CLASS}>
      {multiLabel}
      <div className={CHIPS_CLASS}>
        {sharedKeywords.map((k) => (
          <span key={k} className={CHIP_CLASS}>
            {k}
            <button
              onClick={() => handleRemove(k)}
              className={REMOVE_CLASS}
              aria-label={`Remove keyword ${k}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        ))}
      </div>
      <div className={FIELD_CLASS}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add keyword…"
          aria-label="Add keyword"
          className={INPUT_CLASS}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className={SUGGESTIONS_CLASS}>
            {suggestions.map(([keyword, count], i) => (
              <button
                key={keyword}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitKeyword(keyword);
                }}
                onMouseEnter={() => setSelectedSuggestion(i)}
                className={
                  i === selectedSuggestion
                    ? `${SUGGESTION_CLASS} ${SUGGESTION_ACTIVE_CLASS}`
                    : SUGGESTION_CLASS
                }
              >
                <span>{keyword}</span>
                <span className={COUNT_CLASS}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
