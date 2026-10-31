// What activate() registers: the Info panel under core's old panel id, title
// and dock spot (so saved layouts keep it), and the stylesheet that gives it
// core's look.

import { describe, expect, it } from "vitest";
import { INFO_CLASS, InfoPanel } from "../src/InfoPanel";
import { CHIP_CLASS, INPUT_CLASS, REMOVE_CLASS, SUGGESTION_CLASS } from "../src/KeywordEditor";
import { ROW_CLASS, VALUE_CLASS } from "../src/MetadataPanel";
import { PANEL_ID, STYLESHEET_ID, activate } from "../src/index";
import { fakeApi } from "./support/fake-api";

describe("activate", () => {
  it("registers exactly the Info panel, as core's core.info did", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.panels).toHaveLength(1);
    expect(rig.panels[0]).toEqual({
      id: "core.info",
      title: "Info",
      component: InfoPanel,
      defaultDock: { module: "library", direction: "right", order: 0, width: 280 },
    });
    expect(PANEL_ID).toBe("core.info");
  });

  it("registers one stylesheet for the panel's classes, coloured from the theme tokens", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
    const css = rig.stylesheets[0].css;
    expect(css).toContain(`:where(.${INFO_CLASS}) { display: flex; flex-direction: column; }`);
    expect(css).toContain(`:where(.${CHIP_CLASS}) {`);
    expect(css).toContain("background-color: var(--color-surface-3)");
    expect(css).toContain(`:where(.${INPUT_CLASS}:focus) { box-shadow: 0 0 0 1px var(--color-accent); }`);
    expect(css).toContain(`:where(.${INPUT_CLASS})::placeholder { color: var(--color-text-muted); }`);
    expect(css).toContain("color-mix(in oklab, var(--color-accent) 20%, transparent)");
    expect(css).toContain(`@media (hover: hover) { :where(.${REMOVE_CLASS}:hover) { color: var(--color-text-primary); } }`);
    expect(css).toContain(`:where(.${VALUE_CLASS}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`);
  });

  it("repeats core's Larger text sizes for the 10 and 11 px text", () => {
    const rig = fakeApi();
    activate(rig.api);
    const css = rig.stylesheets[0].css;
    expect(css).toContain(`html.sl-larger-text .${CHIP_CLASS} { font-size: 12px !important; }`);
    expect(css).toMatch(new RegExp(`html\\.sl-larger-text \\.${ROW_CLASS} \\{ font-size: 13px !important; line-height: 1\\.45 !important; \\}`));
    expect(css).toMatch(new RegExp(`html\\.sl-larger-text \\.${SUGGESTION_CLASS} \\{ font-size: 13px !important; line-height: 1\\.45 !important; \\}`));
  });

  it("keeps every rule but Larger text at zero specificity, below any stylesheet that restyles controls", () => {
    const rig = fakeApi();
    activate(rig.api);
    const rules = rig.stylesheets[0].css.split("\n").filter((line) => line.includes("safelight-"));
    const plain = rules.filter((line) => !line.includes(":where(") && !line.startsWith("html.sl-larger-text"));
    expect(plain).toEqual([]);
  });
});
