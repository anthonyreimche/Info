// The whole Info panel over a fake API: histogram, Keywords and Metadata in
// core's order, and the histogram of the active photo's saved edit, rendered
// again when the pixels, white balance, file access or saved edit change, but
// not when only the photo's metadata does.

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { INFO_CLASS, InfoPanel } from "../src/InfoPanel";
import { React, initRuntime } from "../src/rt";
import type { CatalogPhoto, HistogramData } from "../src/safelight";
import { fakeApi, histogramOf, photo, type Rig } from "./support/fake-api";

afterEach(cleanup);

function mount(options: Parameters<typeof fakeApi>[0] = {}): Rig {
  const rig = fakeApi(options);
  initRuntime(rig.api);
  render(<InfoPanel />);
  return rig;
}

const editPhoto = (rig: Rig, id: string, edit: Partial<CatalogPhoto>) =>
  act(() =>
    rig.catalog.setState((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, ...edit } : p)) })),
  );

/** Let pending renders settle, so a re-render that shouldn't happen would have. */
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe("InfoPanel", () => {
  it("stacks the histogram, Keywords and Metadata in one column", () => {
    mount({ photos: [photo("a")], activePhotoId: "a" });
    const root = document.querySelector(`.${INFO_CLASS}`);
    expect(root?.firstElementChild?.getAttribute("aria-label")).toBe("Histogram");
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual(["Keywords", "Metadata"]);
  });

  it("shows the histogram of the active photo's saved edit", async () => {
    const a = photo("a");
    const rig = mount({ photos: [a], activePhotoId: "a" });
    await waitFor(() => expect(rig.histograms.at(-1)).toEqual(histogramOf(a)));
    expect(rig.rendered.map((p) => p.id)).toEqual(["a"]);
  });

  it("shows an empty histogram with no photo selected, and asks for no render", async () => {
    const rig = mount({ photos: [photo("a")] });
    await settle();
    expect(rig.rendered).toEqual([]);
    expect(rig.histograms.every((h) => h === null)).toBe(true);
  });

  it("follows the selection, and clears when it is gone", async () => {
    const rig = mount({ photos: [photo("a"), photo("bb")], activePhotoId: "a" });
    await waitFor(() => expect(rig.rendered).toHaveLength(1));
    act(() => rig.catalog.setState({ activePhotoId: "bb" }));
    await waitFor(() => expect(rig.histograms.at(-1)?.luma[0]).toBe(2));
    act(() => rig.catalog.setState({ activePhotoId: null }));
    await waitFor(() => expect(rig.histograms.at(-1)).toBeNull());
  });

  it("renders again for a new thumbnail, rotation, white balance or file access", async () => {
    const rig = mount({ photos: [photo("a")], activePhotoId: "a" });
    await waitFor(() => expect(rig.rendered).toHaveLength(1));
    editPhoto(rig, "a", { thumbnailUrl: "blob:a2" });
    await waitFor(() => expect(rig.rendered).toHaveLength(2));
    editPhoto(rig, "a", { rotation: 90 });
    await waitFor(() => expect(rig.rendered).toHaveLength(3));
    editPhoto(rig, "a", { exif: { colorTemperature: 5200 } });
    await waitFor(() => expect(rig.rendered).toHaveLength(4));
    act(() => rig.catalog.setState((s) => ({ fileAccessNonce: s.fileAccessNonce + 1 })));
    await waitFor(() => expect(rig.rendered).toHaveLength(5));
    expect(rig.rendered.at(-1)?.rotation).toBe(90);
  });

  it("renders nothing again when only the rating or keywords change", async () => {
    const rig = mount({ photos: [photo("a")], activePhotoId: "a" });
    await waitFor(() => expect(rig.rendered).toHaveLength(1));
    editPhoto(rig, "a", { rating: 3, keywords: ["dawn"] });
    await settle();
    expect(rig.rendered).toHaveLength(1);
  });

  it("renders again when this photo's edit changes in any window, and only this photo's", async () => {
    const rig = mount({ photos: [photo("a")], activePhotoId: "a" });
    await waitFor(() => expect(rig.rendered).toHaveLength(1));
    act(() => rig.broadcast({ type: "edit-update", payload: { photoId: "b" } }));
    act(() => rig.broadcast({ type: "catalog-change", payload: { action: "update", origin: "w" } }));
    await settle();
    expect(rig.rendered).toHaveLength(1);
    act(() => rig.broadcast({ type: "edit-update", payload: { photoId: "a" } }));
    await waitFor(() => expect(rig.rendered).toHaveLength(2));
  });

  it("listens for edits only while a photo is selected, and stops on unmount", async () => {
    const rig = mount({ photos: [photo("a")] });
    expect(rig.listenerCount()).toBe(0);
    act(() => rig.catalog.setState({ activePhotoId: "a" }));
    expect(rig.listenerCount()).toBe(1);
    cleanup();
    expect(rig.listenerCount()).toBe(0);
  });

  it("drops a render that finishes after the selection moved on", async () => {
    const pending = new Map<string, (h: HistogramData) => void>();
    const rig = mount({
      photos: [photo("a"), photo("bb")],
      activePhotoId: "a",
      histogram: (p) => new Promise((resolve) => pending.set(p.id, resolve)),
    });
    await waitFor(() => expect(pending.has("a")).toBe(true));
    act(() => rig.catalog.setState({ activePhotoId: "bb" }));
    await waitFor(() => expect(pending.has("bb")).toBe(true));
    const bb = photo("bb");
    await act(async () => pending.get("bb")?.(histogramOf(bb)));
    await act(async () => pending.get("a")?.(histogramOf(photo("a"))));
    expect(rig.histograms.at(-1)).toEqual(histogramOf(bb));
  });
});
