import { downloadContactDocumentPdf } from "@/lib/pdf";
import type { ContactDocument } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted header alignment of the generated contact-document
 * PDFs.
 *
 * The accepted change centers the logo and the company text horizontally on the
 * 80 mm tirilla, while the A4 sheet keeps its current two-column header (logo
 * to the left of the identity block, title/number right-aligned). This file
 * exercises the real `drawContactHeader` path through
 * `downloadContactDocumentPdf`, so the assertions read the actual coordinates
 * the document was drawn with rather than a mock's opinion.
 *
 * jsPDF is the real library here — only the download seam is stubbed, because
 * jsdom cannot save a file. The logo is made embeddable by stubbing `Image` and
 * the canvas `toDataURL`, which is the only way jsPDF can embed a remote logo
 * synchronously; the drawing coordinates are then recorded by wrapping the
 * `text` and `addImage` methods on each jsPDF instance the builder creates.
 */

const downloadFileMock = vi.fn();

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

/** One recorded jsPDF drawing call, with its arguments. */
interface DrawCall {
  method: string;
  args: unknown[];
}

const drawCalls: DrawCall[] = [];

vi.mock("jspdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jspdf")>();
  const Real = actual.jsPDF;
  class RecordingJsPDF extends Real {
    constructor(...args: ConstructorParameters<typeof Real>) {
      super(...args);
      const self = this as unknown as Record<string, unknown>;
      for (const method of ["text", "addImage"]) {
        const original = self[method];
        if (typeof original !== "function") continue;
        self[method] = (...callArgs: unknown[]) => {
          drawCalls.push({ method, args: callArgs });
          return (original as (...a: unknown[]) => unknown).apply(
            self,
            callArgs,
          );
        };
      }
    }
  }
  return { ...actual, jsPDF: RecordingJsPDF };
});

const LOGO_URL = "https://gateway.example.com/logo-hash.png";

/**
 * A 1×1 transparent PNG data URL. jsPDF reads the format from the data URL
 * header, so this is enough for `getImageProperties` to report PNG and for
 * `addImage` to record the placement.
 */
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * jsdom never loads images, so `loadLogoDataUrl` would resolve to `null` and no
 * logo would be drawn. This stub makes the image "load" and the canvas
 * "encode" it, which is exactly the contract the real browser provides.
 */
function stubImageLoading(): void {
  class StubImage {
    crossOrigin = "";
    naturalWidth = 1;
    naturalHeight = 1;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", StubImage as unknown as typeof Image);

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === "2d") {
        return { drawImage: () => {} } as unknown as CanvasRenderingContext2D;
      }
      return originalGetContext.call(this, contextId as "2d");
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    PNG_DATA_URL,
  );
}

function contactDocument(
  overrides: Partial<ContactDocument> = {},
): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-1",
    name: "Ada Lovelace",
    meta: [{ label: "Teléfono", value: "+57 300 111 2222" }],
    sections: [],
    footer: "Ficha de cliente generada para Ada Lovelace.",
    ...overrides,
  };
}

/** The first recorded `text` call whose string contains `needle`. */
function textCall(needle: string): DrawCall | undefined {
  return drawCalls.find((call) => {
    if (call.method !== "text") return false;
    const value = call.args[0];
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    return text.includes(needle);
  });
}

/** The first recorded `addImage` call, with its placement. */
function imageCall():
  | { x: number; y: number; w: number; h: number }
  | undefined {
  const call = drawCalls.find((entry) => entry.method === "addImage");
  if (!call) return undefined;
  const [, , x, y, w, h] = call.args as [
    string,
    string,
    number,
    number,
    number,
    number,
  ];
  return { x, y, w, h };
}

describe("contact document PDF header alignment (cover)", () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    downloadFileMock.mockResolvedValue(undefined);
    drawCalls.length = 0;
    stubImageLoading();
  });

  afterEach(() => {
    drawCalls.length = 0;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("centers the logo and the company text on the 80 mm roll", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos", logoUrl: LOGO_URL },
      "receipt80",
    );

    // 80mm roll: 3mm margins → usable width 3..77, center 40.
    const center = 40;

    const logo = imageCall();
    expect(logo).toBeDefined();
    if (!logo) return;
    // The logo box is centered: its midpoint sits on the roll center.
    expect(logo.x + logo.w / 2).toBeCloseTo(center, 5);

    const name = textCall("Taller HR Motos");
    expect(name).toBeDefined();
    if (!name) return;
    // The company name is drawn at the center with centered alignment.
    // jsPDF signature: text(text, x, y, options).
    expect(name.args[1]).toBeCloseTo(center, 5);
    expect(name.args[3]).toMatchObject({ align: "center" });

    const title = textCall("FICHA DE CLIENTE");
    expect(title).toBeDefined();
    if (!title) return;
    expect(title.args[1]).toBeCloseTo(center, 5);
    expect(title.args[3]).toMatchObject({ align: "center" });
  });

  it("keeps the A4 header with the logo left and the title right", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos", logoUrl: LOGO_URL },
      "a4",
    );

    // A4: 14mm left margin, 196mm right edge.
    const logo = imageCall();
    expect(logo).toBeDefined();
    if (!logo) return;
    // The logo is anchored at the left margin, not centered.
    expect(logo.x).toBeCloseTo(14, 5);

    const name = textCall("Taller HR Motos");
    expect(name).toBeDefined();
    if (!name) return;
    // The company name starts to the right of the logo, left-aligned.
    expect(name.args[1] as number).toBeGreaterThanOrEqual(14);
    expect(name.args[3]).not.toMatchObject({ align: "center" });

    const title = textCall("FICHA DE CLIENTE");
    expect(title).toBeDefined();
    if (!title) return;
    // The title is right-aligned on the right edge.
    expect(title.args[1]).toBeCloseTo(196, 5);
    expect(title.args[3]).toMatchObject({ align: "right" });
  });
});
