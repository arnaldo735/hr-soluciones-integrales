import {
  downloadCommissionPaymentPdf,
  downloadContactDocumentPdf,
} from "@/lib/pdf";
import type { CommissionPayment, ContactDocument } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: every company datum in the generated PDF
 * header occupies its own space and never overlaps the next one, in A4 and in
 * the 80 mm tirilla.
 *
 * The accepted change advances the header cursor by the *real* height of each
 * block (lineHeight × number of wrapped lines) instead of a fixed per-line
 * increment. The regression this pins is a long razón social, contact line or
 * fiscal block that wraps to two or more lines and is then overlapped by the
 * block drawn below it.
 *
 * jsPDF is the real library here — only the download seam is stubbed, because
 * jsdom cannot save a file. The drawing coordinates are recorded by wrapping
 * the `text` method on each jsPDF instance the builder creates, so the
 * assertions read the actual Y positions the document was drawn with.
 */

const downloadFileMock = vi.fn();

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

/** One recorded jsPDF `text` call, with its arguments. */
interface TextCall {
  /** The drawn string, with wrapped arrays joined by a space. */
  text: string;
  /** The X coordinate the text was drawn at. */
  x: number;
  /** The Y coordinate the text was drawn at. */
  y: number;
  /**
   * Number of wrapped lines jsPDF was asked to draw. A single string is one
   * line; an array is the result of `splitTextToSize`, so its length is the
   * real number of lines the block occupies.
   */
  lineCount: number;
}

const textCalls: TextCall[] = [];

vi.mock("jspdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jspdf")>();
  const Real = actual.jsPDF;
  class RecordingJsPDF extends Real {
    constructor(...args: ConstructorParameters<typeof Real>) {
      super(...args);
      const self = this as unknown as Record<string, unknown>;
      const original = self.text;
      if (typeof original !== "function") return;
      self.text = (...callArgs: unknown[]) => {
        const value = callArgs[0];
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        textCalls.push({
          text,
          x: Number(callArgs[1]),
          y: Number(callArgs[2]),
          lineCount: Array.isArray(value) ? value.length : 1,
        });
        return (original as (...a: unknown[]) => unknown).apply(self, callArgs);
      };
    }
  }
  return { ...actual, jsPDF: RecordingJsPDF };
});

/** The first recorded `text` call whose string contains `needle`. */
function textCall(needle: string): TextCall | undefined {
  return textCalls.find((call) => call.text.includes(needle));
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

/**
 * A company whose razón social, contact line and fiscal block are all long
 * enough to wrap to several lines in the narrow 80 mm roll, which is exactly
 * the case the fixed-increment layout used to overlap.
 */
const LONG_COMPANY = {
  name: "HR SOLUCIONES INTEGRALES S.A.S. TALLER DE MOTOCICLETAS Y REPUESTOS",
  taxId: "NIT 900.123.456-8",
  address: "Calle 45 #12-30, Barrio La Soledad, Local 204",
  city: "Bogotá D.C., Cundinamarca, Colombia",
  phone: "+57 300 000 0000",
  email: "contacto@hrsolucionesintegrales.com",
  website: "https://hrsolucionesintegrales.com",
  fiscalRegime: "Responsable de IVA",
  taxResponsibility: "Gran contribuyente",
};

describe("contact document PDF header no-overlap (cover)", () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    downloadFileMock.mockResolvedValue(undefined);
    textCalls.length = 0;
  });

  afterEach(() => {
    textCalls.length = 0;
    vi.restoreAllMocks();
  });

  it("stacks the wrapped 80 mm header blocks without overlapping", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      LONG_COMPANY,
      "receipt80",
    );

    const name = textCall("HR SOLUCIONES INTEGRALES");
    const contact = textCall("NIT 900.123.456-8");
    const fiscal = textCall("Responsable de IVA");
    const title = textCall("FICHA DE CLIENTE");

    expect(name).toBeDefined();
    expect(contact).toBeDefined();
    expect(fiscal).toBeDefined();
    expect(title).toBeDefined();
    if (!name || !contact || !fiscal || !title) return;

    // The long razón social and contact line really do wrap on the roll, so
    // this is the multi-line case the fixed-increment layout used to overlap.
    expect(name.lineCount).toBeGreaterThan(1);
    expect(contact.lineCount).toBeGreaterThan(1);

    // Each block is drawn strictly below the previous one: the razón social,
    // then the contact line, then the fiscal block, then the title.
    expect(contact.y).toBeGreaterThan(name.y);
    expect(fiscal.y).toBeGreaterThan(contact.y);
    expect(title.y).toBeGreaterThan(fiscal.y);

    // The next block starts at or below the bottom of the wrapped block above
    // it (lineHeight × wrapped lines), so no line of a wrapped block is
    // overlapped. The 80 mm layout uses 4.2mm for the name and 3mm for meta.
    expect(contact.y - name.y).toBeGreaterThanOrEqual(name.lineCount * 4.2);
    expect(fiscal.y - contact.y).toBeGreaterThanOrEqual(contact.lineCount * 3);
    expect(title.y - fiscal.y).toBeGreaterThanOrEqual(fiscal.lineCount * 3);
  });

  it("stacks the wrapped A4 header blocks without overlapping", async () => {
    await downloadContactDocumentPdf(contactDocument(), LONG_COMPANY, "a4");

    const name = textCall("HR SOLUCIONES INTEGRALES");
    const contact = textCall("NIT 900.123.456-8");
    const fiscal = textCall("Responsable de IVA");

    expect(name).toBeDefined();
    expect(contact).toBeDefined();
    expect(fiscal).toBeDefined();
    if (!name || !contact || !fiscal) return;

    // The razón social wraps in the A4 identity column too.
    expect(name.lineCount).toBeGreaterThan(1);

    // A4 keeps its left-aligned identity column, but the wrapped razón social
    // must still push the contact and fiscal blocks below it. The A4 layout
    // uses a 4mm meta line height; the epsilon absorbs float rounding when a
    // block ends exactly at the next block's baseline.
    const EPSILON = 0.01;
    expect(contact.y).toBeGreaterThan(name.y);
    expect(fiscal.y).toBeGreaterThan(contact.y);
    expect(contact.y - name.y).toBeGreaterThanOrEqual(
      name.lineCount * 4 - EPSILON,
    );
    expect(fiscal.y - contact.y).toBeGreaterThanOrEqual(
      contact.lineCount * 4 - EPSILON,
    );
  });

  it("includes the company website in the 80 mm PDF header", async () => {
    await downloadContactDocumentPdf(
      contactDocument(),
      LONG_COMPANY,
      "receipt80",
    );

    // The website is part of the contact line, so it must be drawn in the
    // header rather than silently dropped.
    expect(textCall("https://hrsolucionesintegrales.com")).toBeDefined();
  });

  it("includes the company website in the A4 PDF header", async () => {
    await downloadContactDocumentPdf(contactDocument(), LONG_COMPANY, "a4");

    expect(textCall("https://hrsolucionesintegrales.com")).toBeDefined();
  });

  it("includes the company website in the commission receipt header", async () => {
    // The commission receipt uses the shared `drawHeader`, a different code
    // path from the contact-document header, so the website must reach it too.
    const payment: CommissionPayment = {
      id: 1n,
      technicianId: 1n,
      technicianCode: "TEC-01",
      technicianName: "Marco Pérez",
      period: {
        from: 1_700_000_000_000_000_000n,
        to: 1_700_000_000_000_000_000n,
      },
      netPaid: 100_000n,
      loansDeducted: 0n,
      lines: [],
      loans: [],
      lineCount: 0n,
      baseAmount: 100_000n,
      commissionAmount: 100_000n,
      paidAt: 1_700_000_000_000_000_000n,
      paidBy: {
        toText: () => "aaaaa-aa",
      } as unknown as CommissionPayment["paidBy"],
    };

    await downloadCommissionPaymentPdf(payment, LONG_COMPANY);

    expect(textCall("https://hrsolucionesintegrales.com")).toBeDefined();
  });
});
