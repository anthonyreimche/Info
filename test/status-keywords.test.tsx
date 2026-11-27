// The Keywords button Info adds to Develop's status bar (Safelight 3.2.8's
// develop-photo-metadata slot, discussion #294): it opens the keyword editor
// above the bar for the open photo, and closes on Escape or a click elsewhere.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { activate } from "../src/index";
import { KEYWORDS_SLOT_ID, StatusKeywords } from "../src/StatusKeywords";
import { React, initRuntime } from "../src/rt";
import { fakeApi, photo, type Rig } from "./support/fake-api";

afterEach(cleanup);

function mount(): Rig {
  const rig = fakeApi({ photos: [photo("a", { keywords: ["beach"] })], activePhotoId: "a" });
  initRuntime(rig.api);
  render(<StatusKeywords />);
  return rig;
}

const trigger = () => screen.getByRole("button", { name: "Keywords" });

describe("StatusKeywords", () => {
  it("is registered in the develop-photo-metadata slot", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.slots).toEqual([
      { id: KEYWORDS_SLOT_ID, slot: "develop-photo-metadata", component: StatusKeywords },
    ]);
  });

  it("opens the keyword editor for the open photo, with its field focused", () => {
    mount();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const editor = screen.getByRole("dialog", { name: "Keywords" });
    expect(editor.textContent).toContain("beach");
    expect(document.activeElement).toBe(screen.getByLabelText("Add keyword"));
  });

  it("adds a keyword to the open photo", () => {
    const rig = mount();
    fireEvent.click(trigger());
    const field = screen.getByLabelText<HTMLInputElement>("Add keyword");
    fireEvent.change(field, { target: { value: "sunset" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(rig.catalog.getState().photos[0].keywords).toEqual(["beach", "sunset"]);
  });

  it("closes on Escape and gives the key back", () => {
    const rig = mount();
    fireEvent.click(trigger());
    expect(rig.escapeTakers()).toBe(1);
    act(() => rig.pressEscape());
    expect(screen.queryByRole("dialog", { name: "Keywords" })).toBeNull();
    expect(rig.escapeTakers()).toBe(0);
  });

  it("closes on a click outside it, and stays open for a click inside", () => {
    mount();
    fireEvent.click(trigger());
    fireEvent.pointerDown(screen.getByLabelText("Add keyword"));
    expect(screen.getByRole("dialog", { name: "Keywords" })).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog", { name: "Keywords" })).toBeNull();
  });

  it("shows nothing with no photo open", () => {
    const rig = fakeApi({ photos: [photo("a")], activePhotoId: null });
    initRuntime(rig.api);
    const { container } = render(<StatusKeywords />);
    expect(container.textContent).toBe("");
  });
});

void React;
