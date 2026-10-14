import { downloadWarrantyPdf } from "@/lib/pdf";
import type { WarrantyDocumentData } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: in the generated warranty PDF the identity
 * block starts at the cursor the company header left behind, and the clauses
 * and the IMPORTANTE notice follow below the identity — so the header never
 * overlaps the customer/moto/fecha/técnico rows and the body never overlaps the
 * identity, in A4 and in the 80 mm tirilla.
 *
 * The regression this pins is `drawWarrantyIdentity` starting at Y=0 (the top
 * of the page) instead of at the caller's cursor, which drew the identity rows
 * over the company header, and `downloadWarrantyPdf` not passing the header
 * cursor, which let the clauses and the notice stack on top of the identity.
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
  /** Number of wrapped lines jsPDF was asked to draw. */
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

function warrantyData(
  overrides: Partial<WarrantyDocumentData> = {},
): WarrantyDocumentData {
  return {
    orderNumber: "OT-000123",
    customerName: "Ada Lovelace",
    customerDocument: "1020304050",
    motorcycleBrand: "Yamaha",
    motorcycleModel: "FZ 2.0",
    motorcycleYear: 2022n,
    motorcyclePlate: "ABC12D",
    serviceDate: 1_700_000_000_000_000_000n,
    technicianCode: "TEC-01",
    technicianName: "Marco Pérez",
    ...overrides,
  };
}

/**
 * A company whose razón social, contact line and fiscal block are long enough
 * to wrap in the narrow 80 mm roll, so the header cursor is well below the top
 * of the page and the identity must start below it.
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

describe("warranty PDF block separation (cover)", () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    downloadFileMock.mockResolvedValue(undefined);
    textCalls.length = 0;
  });

  afterEach(() => {
    textCalls.length = 0;
    vi.restoreAllMocks();
  });

  it("starts the A4 identity below the company header, not at the top", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "a4");

    const headerName = textCall("HR SOLUCIONES INTEGRALES");
    const orderLine = textCall("Orden de servicio OT-000123");
    const customer = textCall("Ada Lovelace");
    const document = textCall("1020304050");
    const motorcycle = textCall("Yamaha FZ 2.0");
    const technician = textCall("TEC-01 · Marco Pérez");

    expect(headerName).toBeDefined();
    expect(orderLine).toBeDefined();
    expect(customer).toBeDefined();
    expect(document).toBeDefined();
    expect(motorcycle).toBeDefined();
    expect(technician).toBeDefined();
    if (
      !headerName ||
      !orderLine ||
      !customer ||
      !document ||
      !motorcycle ||
      !technician
    ) {
      return;
    }

    // The identity rows start below the header name and below the order line,
    // never at the top of the page (Y=0) where the header is drawn.
    expect(customer.y).toBeGreaterThan(headerName.y);
    expect(customer.y).toBeGreaterThan(orderLine.y);
    expect(customer.y).toBeGreaterThan(0);

    // Each identity row is drawn strictly below the previous one.
    expect(document.y).toBeGreaterThan(customer.y);
    expect(motorcycle.y).toBeGreaterThan(document.y);
    expect(technician.y).toBeGreaterThan(motorcycle.y);
  });

  it("starts the 80 mm identity below the company header, not at the top", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "receipt80");

    const headerName = textCall("HR SOLUCIONES INTEGRALES");
    const orderLine = textCall("Orden de servicio OT-000123");
    const customer = textCall("Ada Lovelace");
    const technician = textCall("TEC-01 · Marco Pérez");

    expect(headerName).toBeDefined();
    expect(orderLine).toBeDefined();
    expect(customer).toBeDefined();
    expect(technician).toBeDefined();
    if (!headerName || !orderLine || !customer || !technician) return;

    // The wrapped header pushes the cursor down; the identity must begin below
    // it, not at Y=0 over the header.
    expect(customer.y).toBeGreaterThan(headerName.y);
    expect(customer.y).toBeGreaterThan(orderLine.y);
    expect(customer.y).toBeGreaterThan(0);
    expect(technician.y).toBeGreaterThan(customer.y);
  });

  it("draws the clauses and the IMPORTANTE notice below the identity in A4", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "a4");

    const technician = textCall("TEC-01 · Marco Pérez");
    const firstClause = textCall("1. ALCANCE DE LA GARANTÍA");
    const lastClause = textCall("8. ACEPTACIÓN");
    const important = textCall("IMPORTANTE");

    expect(technician).toBeDefined();
    expect(firstClause).toBeDefined();
    expect(lastClause).toBeDefined();
    expect(important).toBeDefined();
    if (!technician || !firstClause || !lastClause || !important) return;

    // The body starts below the last identity row and the notice below the
    // last clause, so neither overlaps the identity.
    expect(firstClause.y).toBeGreaterThan(technician.y);
    expect(lastClause.y).toBeGreaterThan(firstClause.y);
    expect(important.y).toBeGreaterThan(lastClause.y);
  });

  it("draws the clauses and the IMPORTANTE notice below the identity in 80 mm", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "receipt80");

    const technician = textCall("TEC-01 · Marco Pérez");
    const firstClause = textCall("1. ALCANCE DE LA GARANTÍA");
    const lastClause = textCall("8. ACEPTACIÓN");
    const important = textCall("IMPORTANTE");

    expect(technician).toBeDefined();
    expect(firstClause).toBeDefined();
    expect(lastClause).toBeDefined();
    expect(important).toBeDefined();
    if (!technician || !firstClause || !lastClause || !important) return;

    expect(firstClause.y).toBeGreaterThan(technician.y);
    expect(lastClause.y).toBeGreaterThan(firstClause.y);
    expect(important.y).toBeGreaterThan(lastClause.y);
  });

  it("keeps the saved terms block below the identity in both formats", async () => {
    const savedTerms =
      "1. GARANTÍA A MEDIDA\nTexto configurado por el administrador.";

    await downloadWarrantyPdf(
      warrantyData(),
      LONG_COMPANY,
      "a4",
      null,
      savedTerms,
    );

    const technician = textCall("TEC-01 · Marco Pérez");
    const terms = textCall("Texto configurado por el administrador.");
    expect(technician).toBeDefined();
    expect(terms).toBeDefined();
    if (!technician || !terms) return;
    expect(terms.y).toBeGreaterThan(technician.y);

    textCalls.length = 0;
    await downloadWarrantyPdf(
      warrantyData(),
      LONG_COMPANY,
      "receipt80",
      null,
      savedTerms,
    );

    const narrowTechnician = textCall("TEC-01 · Marco Pérez");
    const narrowTerms = textCall("Texto configurado por el administrador.");
    expect(narrowTechnician).toBeDefined();
    expect(narrowTerms).toBeDefined();
    if (!narrowTechnician || !narrowTerms) return;
    expect(narrowTerms.y).toBeGreaterThan(narrowTechnician.y);
  });
});
