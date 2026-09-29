import { downloadWarrantyPdf } from "@/lib/pdf";
import type { WarrantyDocumentData } from "@/lib/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: the generated warranty PDF header carries the
 * complete company identity and lays each datum out in its own space, in A4 and
 * in the 80 mm tirilla.
 *
 * `downloadWarrantyPdf` draws its header through the shared `drawContactHeader`
 * with the format's layout, so the accepted header rework has to hold on this
 * call site too. This file exercises the real builder path and records the
 * actual drawing coordinates, so a wrong layout passed for the warranty (or a
 * dropped website) fails here rather than in front of a user.
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
 * A company whose razón social, contact line and fiscal block are all long
 * enough to wrap to several lines in the narrow 80 mm roll, which is exactly
 * the case a fixed-increment layout used to overlap.
 */
const LONG_COMPANY = {
  name: "HR SOLUCIONES INTEGRALES S.A.S. TALLER DE MOTOCICLETAS Y REPUESTOS",
  logoUrl: LOGO_URL,
  taxId: "NIT 900.123.456-8",
  address: "Calle 45 #12-30, Barrio La Soledad, Local 204",
  city: "Bogotá D.C., Cundinamarca, Colombia",
  phone: "+57 300 000 0000",
  email: "contacto@hrsolucionesintegrales.com",
  website: "https://hrsolucionesintegrales.com",
  fiscalRegime: "Responsable de IVA",
  taxResponsibility: "Gran contribuyente",
};

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

describe("warranty PDF header (cover)", () => {
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

  it("draws the complete company identity in the A4 header", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "a4");

    // Logo, razón social, NIT, dirección/ciudad/teléfono/correo/sitio web and
    // the fiscal block all reach the header.
    expect(imageCall()).toBeDefined();
    expect(textCall("HR SOLUCIONES INTEGRALES")).toBeDefined();
    expect(textCall("NIT 900.123.456-8")).toBeDefined();
    expect(textCall("Calle 45 #12-30")).toBeDefined();
    expect(textCall("Bogotá D.C.")).toBeDefined();
    expect(textCall("+57 300 000 0000")).toBeDefined();
    expect(textCall("contacto@hrsolucionesintegrales.com")).toBeDefined();
    expect(textCall("https://hrsolucionesintegrales.com")).toBeDefined();
    expect(textCall("Responsable de IVA")).toBeDefined();
    expect(textCall("Gran contribuyente")).toBeDefined();
  });

  it("centers the logo and the company text on the 80 mm roll", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "receipt80");

    // 80mm roll: 3mm margins → usable width 3..77, center 40.
    const center = 40;

    const logo = imageCall();
    expect(logo).toBeDefined();
    if (!logo) return;
    // The logo box is centered: its midpoint sits on the roll center.
    expect(logo.x + logo.w / 2).toBeCloseTo(center, 5);

    const name = textCall("HR SOLUCIONES INTEGRALES");
    expect(name).toBeDefined();
    if (!name) return;
    // The company name is drawn at the center with centered alignment.
    // jsPDF signature: text(text, x, y, options).
    expect(name.args[1]).toBeCloseTo(center, 5);
    expect(name.args[3]).toMatchObject({ align: "center" });
  });

  it("stacks the wrapped 80 mm header blocks without overlapping", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "receipt80");

    const name = textCall("HR SOLUCIONES INTEGRALES");
    const contact = textCall("NIT 900.123.456-8");
    const fiscal = textCall("Responsable de IVA");
    const title = textCall("TÉRMINOS Y CONDICIONES DE GARANTÍA");

    expect(name).toBeDefined();
    expect(contact).toBeDefined();
    expect(fiscal).toBeDefined();
    expect(title).toBeDefined();
    if (!name || !contact || !fiscal || !title) return;

    // The long razón social and contact line really do wrap on the roll, so
    // this is the multi-line case a fixed-increment layout used to overlap.
    const nameLines = Array.isArray(name.args[0]) ? name.args[0].length : 1;
    const contactLines = Array.isArray(contact.args[0])
      ? contact.args[0].length
      : 1;
    expect(nameLines).toBeGreaterThan(1);
    expect(contactLines).toBeGreaterThan(1);

    const nameY = Number(name.args[2]);
    const contactY = Number(contact.args[2]);
    const fiscalY = Number(fiscal.args[2]);
    const titleY = Number(title.args[2]);

    // Each block is drawn strictly below the previous one: razón social, then
    // contact line, then fiscal block, then title.
    expect(contactY).toBeGreaterThan(nameY);
    expect(fiscalY).toBeGreaterThan(contactY);
    expect(titleY).toBeGreaterThan(fiscalY);

    // The next block starts at or below the bottom of the wrapped block above
    // it (lineHeight × wrapped lines), so no line is overlapped. The 80 mm
    // layout uses 4.2mm for the name and 3mm for meta.
    expect(contactY - nameY).toBeGreaterThanOrEqual(nameLines * 4.2);
    expect(fiscalY - contactY).toBeGreaterThanOrEqual(contactLines * 3);
  });

  it("keeps the A4 header with the logo left and the title right", async () => {
    await downloadWarrantyPdf(warrantyData(), LONG_COMPANY, "a4");

    // A4: 14mm left margin, 196mm right edge.
    const logo = imageCall();
    expect(logo).toBeDefined();
    if (!logo) return;
    // The logo is anchored at the left margin, not centered.
    expect(logo.x).toBeCloseTo(14, 5);

    const name = textCall("HR SOLUCIONES INTEGRALES");
    expect(name).toBeDefined();
    if (!name) return;
    // The company name starts to the right of the logo, left-aligned.
    expect(name.args[1] as number).toBeGreaterThanOrEqual(14);
    expect(name.args[3]).not.toMatchObject({ align: "center" });

    const title = textCall("TÉRMINOS Y CONDICIONES DE GARANTÍA");
    expect(title).toBeDefined();
    if (!title) return;
    // The title is right-aligned on the right edge.
    expect(title.args[1]).toBeCloseTo(196, 5);
    expect(title.args[3]).toMatchObject({ align: "right" });
  });
});
