import { DocumentPreview } from "@/components/DocumentPreview";
import {
  drawHopeMessage,
  hopeMessageContent,
  loadPdfLibs,
  measureHopeMessage,
} from "@/lib/pdf";
import type { HopeMessage } from "@/lib/types";
import { HopeMode } from "@/lib/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Cover for the accepted visual treatment of the daily Biblical-hope block.
 *
 * The accepted change renders the promise as a devotional card — a soft
 * background with a colored border and a green left rail, the promise in italic
 * type one point larger than the footer, the citation in bold amber, and a
 * faded decorative opening quote — in the on-screen preview and in the A4 and
 * 80 mm PDFs, without ever overflowing the page or reserving space when there
 * is no promise.
 *
 * jsdom does not apply the stylesheet, so the on-screen assertions pin the
 * class contract the CSS in `index.css` targets (`.doc-hope`, `.doc-hope-text`,
 * `.doc-hope-citation`, and the `::before` quote). The PDF assertions exercise
 * the real jsPDF geometry helpers, which is where overflow and overlap are
 * actually decided.
 *
 * The backend is mocked nowhere here: the promise is passed in as a prop, and
 * the PDF helpers are pure geometry over a real jsPDF document.
 */

function hopeMessage(overrides: Partial<HopeMessage> = {}): HopeMessage {
  return {
    enabled: true,
    mode: HopeMode.auto,
    text: "El Señor es mi pastor; nada me faltará.",
    citation: "Salmos 23:1",
    referenceDate: "26/09/2026",
    ...overrides,
  };
}

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof DocumentPreview>> = {},
) {
  return render(
    <DocumentPreview
      title="Cotización"
      number="COT-0001"
      companyName="Taller Central"
      meta={[{ label: "Cliente", value: "Ada Lovelace" }]}
      lines={[
        {
          description: "Cambio de aceite",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ]}
      totals={[{ label: "Total", value: "$ 450", emphasis: true }]}
      footer="Gracias por su preferencia"
      format="a4"
      ocid="doc.preview"
      {...overrides}
    />,
  );
}

describe("daily hope block — on-screen card (cover)", () => {
  it("renders the promise inside the styled card, separated from the footer", () => {
    renderPreview({
      hopeMessage: { text: "El Señor es mi pastor.", citation: "Salmos 23:1" },
    });

    const card = screen.getByTestId("doc.preview.hope_message");
    // The card carries the class the stylesheet paints: soft surface, colored
    // border and the decorative opening quote via `::before`.
    expect(card).toHaveClass("doc-hope");
    expect(card).toHaveAttribute("aria-label", "Mensaje de esperanza");

    // The promise and the citation are distinct elements with their own
    // classes, so the promise can be italic/larger and the citation bold/amber.
    const promise = screen.getByText("El Señor es mi pastor.");
    expect(promise).toHaveClass("doc-hope-text");
    const citation = screen.getByText("Salmos 23:1");
    expect(citation).toHaveClass("doc-hope-citation");

    // The card is a sibling after the footer note, not nested inside it.
    const footer = screen.getByText("Gracias por su preferencia");
    expect(footer).not.toContainElement(card);
    expect(
      footer.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the styled card in the 80 mm format too", () => {
    renderPreview({
      format: "receipt80",
      hopeMessage: { text: "El Señor es mi pastor.", citation: "Salmos 23:1" },
    });

    const card = screen.getByTestId("doc.preview.hope_message");
    expect(card).toHaveClass("doc-hope");
    expect(screen.getByText("El Señor es mi pastor.")).toHaveClass(
      "doc-hope-text",
    );
    expect(screen.getByText("Salmos 23:1")).toHaveClass("doc-hope-citation");
  });

  it("renders no card and no placeholder when there is no promise", () => {
    renderPreview({ hopeMessage: null });

    expect(
      screen.queryByTestId("doc.preview.hope_message"),
    ).not.toBeInTheDocument();
    // The document body and footer still render; nothing reserves the space.
    expect(screen.getByText("Taller Central")).toBeInTheDocument();
    expect(screen.getByText("Gracias por su preferencia")).toBeInTheDocument();
  });

  it("omits the citation line when the promise has no citation", () => {
    renderPreview({ hopeMessage: { text: "Solo la promesa.", citation: "" } });

    expect(screen.getByText("Solo la promesa.")).toHaveClass("doc-hope-text");
    expect(screen.queryByText("Salmos 23:1")).not.toBeInTheDocument();
  });
});

describe("daily hope block — printable content gate (cover)", () => {
  it("returns the promise when the message is enabled with text", () => {
    expect(hopeMessageContent(hopeMessage())).toEqual({
      text: "El Señor es mi pastor; nada me faltará.",
      citation: "Salmos 23:1",
    });
  });

  it("returns null when the message is disabled", () => {
    expect(hopeMessageContent(hopeMessage({ enabled: false }))).toBeNull();
  });

  it("returns null when the text is empty or only whitespace", () => {
    expect(hopeMessageContent(hopeMessage({ text: "" }))).toBeNull();
    expect(hopeMessageContent(hopeMessage({ text: "   " }))).toBeNull();
  });

  it("returns null when there is no message at all", () => {
    expect(hopeMessageContent(null)).toBeNull();
    expect(hopeMessageContent(undefined)).toBeNull();
  });
});

describe("daily hope block — PDF geometry (cover)", () => {
  const A4 = { x: 14, right: 196, narrow: false };
  const TIRILLA = { x: 3, right: 77, narrow: true };

  it("reserves no space and draws nothing when there is no promise", async () => {
    const { jsPDF } = await loadPdfLibs();
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    expect(measureHopeMessage(doc, null, A4)).toBe(0);
    // Drawing a null promise leaves the cursor exactly where it was.
    expect(drawHopeMessage(doc, null, { ...A4, y: 100 })).toBe(100);
  });

  it("measures a positive card height and keeps the A4 card inside the page", async () => {
    const { jsPDF } = await loadPdfLibs();
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const hope = hopeMessageContent(hopeMessage());
    expect(hope).not.toBeNull();

    const height = measureHopeMessage(doc, hope, A4);
    expect(height).toBeGreaterThan(0);

    // The card is drawn above the footer and its bottom stays inside the page.
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottom = drawHopeMessage(doc, hope, { ...A4, y: 260 });
    expect(bottom).toBeCloseTo(260 + height, 5);
    expect(bottom).toBeLessThanOrEqual(pageHeight);
  });

  it("fits the 80 mm card within the roll width without horizontal overflow", async () => {
    const { jsPDF } = await loadPdfLibs();
    const doc = new jsPDF({ unit: "mm", format: [80, 297] });
    const hope = hopeMessageContent(hopeMessage());
    expect(hope).not.toBeNull();

    // The card spans exactly the content area, which is inside the 80 mm roll.
    const pageWidth = doc.internal.pageSize.getWidth();
    expect(TIRILLA.x).toBeGreaterThanOrEqual(0);
    expect(TIRILLA.right).toBeLessThanOrEqual(pageWidth);

    const height = measureHopeMessage(doc, hope, TIRILLA);
    expect(height).toBeGreaterThan(0);
    const bottom = drawHopeMessage(doc, hope, { ...TIRILLA, y: 250 });
    expect(bottom).toBeCloseTo(250 + height, 5);
    expect(bottom).toBeLessThanOrEqual(doc.internal.pageSize.getHeight());
  });

  it("grows the card with a longer promise instead of clipping it", async () => {
    const { jsPDF } = await loadPdfLibs();
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const short = hopeMessageContent(hopeMessage({ text: "Corto." }));
    const long = hopeMessageContent(
      hopeMessage({
        text: "El Señor es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.",
      }),
    );
    expect(short).not.toBeNull();
    expect(long).not.toBeNull();

    expect(measureHopeMessage(doc, long, A4)).toBeGreaterThan(
      measureHopeMessage(doc, short, A4),
    );
  });
});
