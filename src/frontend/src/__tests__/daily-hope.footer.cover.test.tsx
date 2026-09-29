import { downloadContactDocumentPdf } from "@/lib/pdf";
import type { ContactDocument } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted placement of the daily Biblical-hope card in the real
 * generated PDFs.
 *
 * The accepted change requires the card to sit above the footer note without
 * overlapping it and without running past the page margin, in both the A4 sheet
 * and the 80 mm tirilla. The existing block cover exercises the pure geometry
 * helpers (`measureHopeMessage` / `drawHopeMessage`) in isolation; this file
 * exercises the composed footer path (`drawContactFooter`) that actually
 * decides where the card and the footer land.
 *
 * jsPDF is the real library here — only the download seam is stubbed, because
 * jsdom cannot save a file. The geometry is observed by wrapping the drawing
 * methods on each jsPDF instance the document builder creates, so the
 * assertions read the real coordinates the document was drawn with rather than
 * a mock's opinion.
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
      for (const method of ["text", "roundedRect", "line"]) {
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

/** The y coordinate of the first `text` call whose string contains `needle`. */
function textY(needle: string): number | undefined {
  for (const call of drawCalls) {
    if (call.method !== "text") continue;
    const value = call.args[0];
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    if (text.includes(needle)) {
      return call.args[2] as number;
    }
  }
  return undefined;
}

/** The roundedRect call that draws the hope card (the only one in these docs). */
function hopeRect():
  | { x: number; y: number; w: number; h: number }
  | undefined {
  const call = drawCalls.find((entry) => entry.method === "roundedRect");
  if (!call) return undefined;
  const [x, y, w, h] = call.args as [number, number, number, number];
  return { x, y, w, h };
}

describe("daily hope — real PDF footer placement (cover)", () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    downloadFileMock.mockResolvedValue(undefined);
    drawCalls.length = 0;
  });

  afterEach(() => {
    drawCalls.length = 0;
  });

  it("places the A4 card above the footer note without overlap and inside the page", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos" },
      "a4",
      {
        text: "El Señor es mi pastor; nada me faltará.",
        citation: "Salmos 23:1",
      },
    );

    const rect = hopeRect();
    expect(rect).toBeDefined();
    if (!rect) return;

    // The card is drawn inside the A4 content area (14mm margins, 210mm wide).
    expect(rect.x).toBeGreaterThanOrEqual(14);
    expect(rect.x + rect.w).toBeLessThanOrEqual(196);

    // The footer note is drawn below the card, so the two never overlap.
    const footerY = textY("Ficha de cliente generada");
    expect(footerY).toBeDefined();
    if (footerY === undefined) return;
    expect(rect.y + rect.h).toBeLessThanOrEqual(footerY);

    // The whole card stays inside the 297mm page.
    expect(rect.y + rect.h).toBeLessThanOrEqual(297);
  });

  it("fits the 80 mm card within the roll width and above the footer", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos" },
      "receipt80",
      {
        text: "El Señor es mi pastor; nada me faltará.",
        citation: "Salmos 23:1",
      },
    );

    const rect = hopeRect();
    expect(rect).toBeDefined();
    if (!rect) return;

    // The 80mm roll is 80mm wide with 3mm margins: the card must not overflow.
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.w).toBeLessThanOrEqual(80);

    const footerY = textY("Ficha de cliente generada");
    expect(footerY).toBeDefined();
    if (footerY === undefined) return;
    expect(rect.y + rect.h).toBeLessThanOrEqual(footerY);
  });

  it("draws no card at all when there is no promise", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos" },
      "a4",
      null,
    );

    // No roundedRect means no card and no reserved space; the footer still draws.
    expect(hopeRect()).toBeUndefined();
    expect(textY("Ficha de cliente generada")).toBeDefined();
  });
});
