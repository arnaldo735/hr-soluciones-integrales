import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change that keeps the heavy PDF, Excel and charting
 * libraries out of the app's startup bundle.
 *
 * The observable contract is that importing the module that *uses* a heavy
 * library does not load it: the library is pulled in only when the user
 * actually generates a document, reads/writes a spreadsheet or renders a chart.
 *
 * Each heavy module is replaced with a factory that records whether it was
 * evaluated. A factory that has not run proves the module was never imported,
 * which is exactly the property the accepted change adds. The factories return
 * minimal stand-ins so the real call paths can still run once invoked.
 */

const jspdfFactory = vi.fn();
const autoTableFactory = vi.fn();
const exceljsFactory = vi.fn();
const rechartsFactory = vi.fn();

// Each factory records that it ran and then returns the real module, so the
// call paths still execute against the genuine library while the factory's
// invocation is the observable proof that the module was loaded.
vi.mock("jspdf", async (importOriginal) => {
  jspdfFactory();
  return await importOriginal<typeof import("jspdf")>();
});

vi.mock("jspdf-autotable", async (importOriginal) => {
  autoTableFactory();
  return await importOriginal<typeof import("jspdf-autotable")>();
});

vi.mock("exceljs", async (importOriginal) => {
  exceljsFactory();
  return await importOriginal<typeof import("exceljs")>();
});

vi.mock("recharts", async (importOriginal) => {
  rechartsFactory();
  return await importOriginal<typeof import("recharts")>();
});

// The download seam is stubbed so the real generation paths can run in jsdom
// without touching the file system.
vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return { ...actual, downloadFile: vi.fn().mockResolvedValue(undefined) };
});

describe("heavy libraries load on use, not at startup", () => {
  afterEach(() => {
    jspdfFactory.mockClear();
    autoTableFactory.mockClear();
    exceljsFactory.mockClear();
    rechartsFactory.mockClear();
  });

  it("does not load the PDF libraries when the pdf module is imported", async () => {
    // Importing the module that generates PDFs must not pull jsPDF in.
    await import("@/lib/pdf");

    expect(jspdfFactory).not.toHaveBeenCalled();
    expect(autoTableFactory).not.toHaveBeenCalled();
  });

  it("loads the PDF libraries only when a document is generated", async () => {
    const { downloadContactDocumentPdf } = await import("@/lib/pdf");
    expect(jspdfFactory).not.toHaveBeenCalled();

    await downloadContactDocumentPdf(
      {
        kind: "customer",
        title: "Ficha de cliente",
        number: "CLI-1",
        name: "Ada Lovelace",
        meta: [],
        sections: [],
      },
      { name: "Taller HR Motos" },
      "a4",
    );

    // The generation path is what pulls the heavy libraries in.
    expect(jspdfFactory).toHaveBeenCalledTimes(1);
    expect(autoTableFactory).toHaveBeenCalledTimes(1);
  });

  it("does not load ExcelJS when the xlsx module is imported", async () => {
    await import("@/lib/xlsx");

    expect(exceljsFactory).not.toHaveBeenCalled();
  });

  it("loads ExcelJS only when a spreadsheet is written", async () => {
    const { downloadXlsx } = await import("@/lib/xlsx");
    expect(exceljsFactory).not.toHaveBeenCalled();

    await downloadXlsx("datos", "Datos", ["sku"], [{ sku: "REP-0001" }]);

    expect(exceljsFactory).toHaveBeenCalledTimes(1);
  });

  it("does not load recharts when the chart module is imported", async () => {
    await import("@/components/ui/chart");

    expect(rechartsFactory).not.toHaveBeenCalled();
  });
});
