// The Metadata section over a fake API. A RAW imported from its camera preview
// shows the preview's size until its metadata is read from the whole file; the
// panel asks the host for that read for the photo it shows, rather than leave
// it to the background pass. The rest: the rows core shows, formatted as core
// formats them, and the rating control.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_CLASS, LABEL_CLASS, MetadataPanel, VALUE_CLASS } from "../src/MetadataPanel";
import { React, initRuntime } from "../src/rt";
import type { CatalogPhoto } from "../src/safelight";
import { fakeApi, photo, type Rig } from "./support/fake-api";

afterEach(cleanup);

function mount(p: CatalogPhoto | null): Rig {
  const rig = fakeApi(p ? { photos: [p], activePhotoId: p.id } : {});
  initRuntime(rig.api);
  render(<MetadataPanel />);
  return rig;
}

/** The value row `label` shows, or null when the row is hidden. */
function value(label: string): string | null {
  const dt = [...document.querySelectorAll("dt")].find((d) => d.textContent === label);
  return dt?.nextElementSibling?.textContent ?? null;
}

describe("the Metadata panel", () => {
  it("has the metadata read for a selected photo whose import left it pending", async () => {
    const rig = mount(photo("a", { metadataPending: true, width: 1620, height: 1080 }));
    await waitFor(() => expect(rig.settled).toEqual(["a"]));
  });

  it("asks for no read for a selected photo whose metadata is known", async () => {
    const rig = mount(photo("a"));
    await waitFor(() => expect(rig.settled).toEqual([null]));
  });

  it("asks again once the photo's metadata has settled, which stops the read", async () => {
    const rig = mount(photo("a", { metadataPending: true }));
    await waitFor(() => expect(rig.settled).toEqual(["a"]));
    rig.catalog.setState((s) => ({ photos: s.photos.map((p) => ({ ...p, metadataPending: undefined })) }));
    await waitFor(() => expect(rig.settled).toEqual(["a", null]));
  });

  it("shows the camera match a RAW has learned", () => {
    mount(photo("a", { exif: { baselineExposure: 1.53 } }));
    expect(screen.getByText("Camera match")).toBeTruthy();
    expect(screen.getByText("+1.53 EV")).toBeTruthy();
  });

  it("shows the shadows lift beside it when the match has one", () => {
    mount(photo("a", { exif: { baselineExposure: 1.12, baselineShadows: 55 } }));
    expect(screen.getByText("+1.12 EV, Shadows +55")).toBeTruthy();
  });

  it("shows no camera match for a photo without one", () => {
    mount(photo("a", { exif: { baselineExposure: null } }));
    expect(screen.queryByText("Camera match")).toBeNull();
  });

  it("asks for a photo when none is selected", () => {
    mount(null);
    expect(screen.getByText("Select a photo").className).toBe(EMPTY_CLASS);
    expect(screen.getByRole("heading").textContent).toBe("Metadata");
  });

  it("formats the EXIF rows as core does and hides the empty ones", () => {
    mount(
      photo("a", {
        filename: "DSC_0001.NEF",
        mimeType: "image/x-nikon-nef",
        fileSize: 3 * (1 << 20) + (1 << 19),
        exif: {
          cameraMake: "NIKON",
          cameraModel: "Z 8",
          lens: "NIKKOR Z 24-70mm f/2.8 S",
          lensMake: "Nikon",
          focalLength: 35,
          focalLength35mm: 52,
          aperture: 2.8,
          shutterSpeed: "1/250",
          iso: 400,
          exposureCompensation: -0.7,
          subjectDistance: 0.45,
          dateTimeOriginal: "2026:05:01 18:42:07",
          gpsLatitude: 49.2827,
          gpsLongitude: -123.1207,
          gpsAltitude: 70,
        },
      }),
    );
    expect(value("Filename")).toBe("DSC_0001.NEF");
    expect(value("Camera")).toBe("NIKON Z 8");
    expect(value("Lens")).toBe("Nikon NIKKOR Z 24-70mm f/2.8 S");
    expect(value("Focal length")).toBe("35 mm (52 mm eq.)");
    expect(value("Aperture")).toBe("f/2.8");
    expect(value("Shutter")).toBe("1/250");
    expect(value("ISO")).toBe("400");
    expect(value("Exp. comp.")).toBe("-0.7 EV");
    expect(value("Focus dist.")).toBe("45 cm");
    expect(value("Date")).toBe("2026-05-01 18:42");
    expect(value("Location")).toBe("49.2827° N, 123.1207° W");
    expect(value("Altitude")).toBe("70 m");
    expect(value("Dimensions")).toBe("6000 × 4000");
    expect(value("Size")).toBe("3.5 MB");
    expect(value("Type")).toBe("image/x-nikon-nef");
    expect(value("Artist")).toBeNull();
    expect(value("Max aperture")).toBeNull();
    expect(value("Raw exp. bias")).toBeNull();
  });

  it("shows no altitude without a position, and sizes under a megabyte in KB or B", () => {
    mount(photo("a", { fileSize: 2048, exif: { gpsAltitude: 70 } }));
    expect(value("Altitude")).toBeNull();
    expect(value("Size")).toBe("2 KB");
    cleanup();
    mount(photo("b", { fileSize: 512 }));
    expect(value("Size")).toBe("512 B");
  });

  it("gives each value its full text as a tooltip, for a truncated one", () => {
    mount(photo("a", { exif: { imageDescription: "A very long description of the scene" } }));
    const dt = [...document.querySelectorAll("dt")].find((d) => d.textContent === "Description");
    expect(dt?.className).toBe(LABEL_CLASS);
    const dd = dt?.nextElementSibling;
    expect(dd?.className).toBe(VALUE_CLASS);
    expect(dd?.getAttribute("title")).toBe("A very long description of the scene");
  });

  it("rates the photo from the Rating row, and clears it on the same star", () => {
    const rig = mount(photo("a", { rating: 2 }));
    fireEvent.click(screen.getByLabelText("4 stars"));
    expect(rig.calls).toEqual([["setRating", "a", 4]]);
    expect(screen.getByRole("group").getAttribute("aria-label")).toBe("Rating: 4 of 5 stars");
    fireEvent.click(screen.getByLabelText("4 stars"));
    expect(rig.catalog.getState().photos[0].rating).toBe(0);
  });
});
