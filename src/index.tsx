// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Registers the Library "Info" panel (histogram, keywords, metadata). It was
// core's built-in `core.info` until Safelight 3.2.0 and keeps that panel id, so
// saved layouts keep it where it was.

import { InfoPanel, infoCss } from "./InfoPanel";
import { initRuntime } from "./rt";
import type { SafelightAPI } from "./safelight";

export const PANEL_ID = "core.info";
export const STYLESHEET_ID = "safelight.info.styles";

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  host.registerStylesheet({ id: STYLESHEET_ID, css: infoCss(host.ui.tokens) });
  host.registerPanel({
    id: PANEL_ID,
    title: "Info",
    component: InfoPanel,
    defaultDock: { module: "library", direction: "right", order: 0, width: 280 },
  });
}
