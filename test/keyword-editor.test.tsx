// The keyword editor over a real zustand catalogue store: chips for the active
// photo's keywords (or the keywords every selected photo shares), adding from
// the field or a suggestion, removing from a chip or with Backspace, keyboard
// navigation through the suggestions, and the Library's K shortcut.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHIP_CLASS,
  KeywordEditor,
  MULTI_LABEL_CLASS,
  SUGGESTION_ACTIVE_CLASS,
  SUGGESTION_CLASS,
} from "../src/KeywordEditor";
import { React, initRuntime } from "../src/rt";
import type { CatalogPhoto } from "../src/safelight";
import { fakeApi, photo, type Rig } from "./support/fake-api";

afterEach(cleanup);

function mount(options: { photos: CatalogPhoto[]; activePhotoId?: string | null; selectedIds?: string[] }): Rig {
  const rig = fakeApi(options);
  initRuntime(rig.api);
  render(<KeywordEditor />);
  return rig;
}

const field = () => screen.getByLabelText<HTMLInputElement>("Add keyword");
const chips = () => [...document.querySelectorAll(`.${CHIP_CLASS}`)].map((c) => c.firstChild?.textContent);
const suggestions = () => [...document.querySelectorAll<HTMLButtonElement>(`.${SUGGESTION_CLASS}`)];
const keywordsOf = (rig: Rig, id: string) => rig.catalog.getState().photos.find((p) => p.id === id)?.keywords;

function type(text: string) {
  fireEvent.focus(field());
  fireEvent.change(field(), { target: { value: text } });
}

const catalog = [
  photo("a", { keywords: ["dawn", "coast"] }),
  photo("b", { keywords: ["dawn", "forest"] }),
  photo("c", { keywords: ["dawn", "coast", "fog"] }),
];

describe("KeywordEditor", () => {
  it("renders nothing with no photo selected", () => {
    mount({ photos: catalog });
    expect(document.body.textContent).toBe("");
    expect(screen.queryByLabelText("Add keyword")).toBeNull();
  });

  it("shows the active photo's keywords as chips", () => {
    mount({ photos: catalog, activePhotoId: "a" });
    expect(chips()).toEqual(["dawn", "coast"]);
    expect(document.querySelector(`.${MULTI_LABEL_CLASS}`)).toBeNull();
    expect(field().placeholder).toBe("Add keyword…");
  });

  it("adds the typed keyword on Enter and on a comma, trimmed, and clears the field", () => {
    const rig = mount({ photos: catalog, activePhotoId: "a" });
    type("  sunrise ");
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(rig.calls).toEqual([["addKeyword", "a", "sunrise"]]);
    expect(field().value).toBe("");
    type("tide");
    fireEvent.keyDown(field(), { key: "," });
    expect(keywordsOf(rig, "a")).toEqual(["dawn", "coast", "sunrise", "tide"]);
  });

  it("adds nothing for a blank field", () => {
    const rig = mount({ photos: catalog, activePhotoId: "a" });
    type("   ");
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(rig.calls).toEqual([]);
  });

  it("removes a keyword from its chip", () => {
    const rig = mount({ photos: catalog, activePhotoId: "a" });
    fireEvent.click(screen.getByLabelText("Remove keyword dawn"));
    expect(rig.calls).toEqual([["removeKeyword", "a", "dawn"]]);
    expect(chips()).toEqual(["coast"]);
  });

  it("removes the last keyword on Backspace in an empty field only", () => {
    const rig = mount({ photos: catalog, activePhotoId: "a" });
    type("x");
    fireEvent.keyDown(field(), { key: "Backspace" });
    expect(rig.calls).toEqual([]);
    type("");
    fireEvent.keyDown(field(), { key: "Backspace" });
    expect(rig.calls).toEqual([["removeKeyword", "a", "coast"]]);
  });

  it("edits the keywords every selected photo shares, with a label saying so", () => {
    const rig = mount({ photos: catalog, activePhotoId: "a", selectedIds: ["a", "c"] });
    expect(chips()).toEqual(["dawn", "coast"]);
    expect(document.querySelector(`.${MULTI_LABEL_CLASS}`)?.textContent).toBe(
      "Editing 2 photos (shared keywords)",
    );
    type("pier");
    fireEvent.keyDown(field(), { key: "Enter" });
    fireEvent.click(screen.getByLabelText("Remove keyword coast"));
    expect(rig.calls).toEqual([
      ["addKeywords", ["a", "c"], ["pier"]],
      ["removeKeywords", ["a", "c"], ["coast"]],
    ]);
    expect(keywordsOf(rig, "c")).toEqual(["dawn", "fog", "pier"]);
    expect(keywordsOf(rig, "b")).toEqual(["dawn", "forest"]);
  });

  it("suggests catalogue keywords containing the text, most used first, leaving out ones the photo has", () => {
    mount({ photos: catalog, activePhotoId: "b" });
    type("o");
    expect(suggestions().map((s) => s.textContent)).toEqual(["coast2", "fog1"]);
    expect(suggestions().map((s) => s.className)).toEqual([
      `${SUGGESTION_CLASS} ${SUGGESTION_ACTIVE_CLASS}`,
      SUGGESTION_CLASS,
    ]);
  });

  it("suggests at most eight keywords", () => {
    const many = Array.from({ length: 10 }, (_, i) => `tag${i}`);
    mount({ photos: [photo("a"), photo("b", { keywords: many })], activePhotoId: "a" });
    type("tag");
    expect(suggestions()).toHaveLength(8);
  });

  it("moves through the suggestions with the arrow keys and adds the highlighted one on Enter", () => {
    const rig = mount({ photos: catalog, activePhotoId: "b" });
    type("o");
    fireEvent.keyDown(field(), { key: "ArrowDown" });
    fireEvent.keyDown(field(), { key: "ArrowDown" });
    expect(suggestions()[1].className).toContain(SUGGESTION_ACTIVE_CLASS);
    fireEvent.keyDown(field(), { key: "ArrowUp" });
    fireEvent.keyDown(field(), { key: "ArrowUp" });
    expect(suggestions()[0].className).toContain(SUGGESTION_ACTIVE_CLASS);
    fireEvent.keyDown(field(), { key: "ArrowDown" });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(rig.calls).toEqual([["addKeyword", "b", "fog"]]);
    expect(suggestions()).toHaveLength(0);
  });

  it("highlights a suggestion under the pointer and adds it on press", () => {
    const rig = mount({ photos: catalog, activePhotoId: "b" });
    type("o");
    fireEvent.mouseEnter(suggestions()[1]);
    expect(suggestions()[1].className).toContain(SUGGESTION_ACTIVE_CLASS);
    fireEvent.mouseDown(suggestions()[1]);
    expect(rig.calls).toEqual([["addKeyword", "b", "fog"]]);
  });

  it("hides the suggestions on Escape and on a press outside the editor", () => {
    mount({ photos: catalog, activePhotoId: "b" });
    type("o");
    fireEvent.keyDown(field(), { key: "Escape" });
    expect(suggestions()).toHaveLength(0);
    type("oa");
    expect(suggestions()).toHaveLength(1);
    fireEvent.mouseDown(document.body);
    expect(suggestions()).toHaveLength(0);
  });

  it("focuses the field when the Library's K shortcut asks for it", () => {
    const rig = mount({ photos: catalog, activePhotoId: "a" });
    act(() => void window.dispatchEvent(new CustomEvent(rig.api.events.FOCUS_KEYWORD_INPUT)));
    expect(document.activeElement).toBe(field());
  });
});
