import type { LaborItem } from "@/lib/types";
import {
  isWarrantyService,
  normalizeServiceName,
  warrantyAppliesToOrder,
} from "@/lib/warranty";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the warranty activation logic, ahead of making
 * the warranty document text admin-editable.
 *
 * The accepted change only makes the document's copy editable; the rule that
 * decides WHEN the document applies must keep working: a labor line linked to
 * the catalog services "Reparación de motor" or "Reparación de cabeza de
 * fuerza" activates it, matching case, accents and repeated spaces. These tests
 * protect that rule and the name normalization it depends on.
 */

function laborLine(overrides: Partial<LaborItem> = {}): LaborItem {
  return {
    id: 1n,
    description: "Reparación de motor",
    price: 250000n,
    ...overrides,
  };
}

describe("normalizeServiceName (characterization)", () => {
  it("lowercases, strips accents and collapses whitespace", () => {
    expect(normalizeServiceName("  Reparación   de MOTOR  ")).toBe(
      "reparacion de motor",
    );
    expect(normalizeServiceName("CABEZA DE FUERZA")).toBe("cabeza de fuerza");
  });
});

describe("isWarrantyService (characterization)", () => {
  it("accepts the two warranty services regardless of case and accents", () => {
    expect(isWarrantyService("Reparación de motor")).toBe(true);
    expect(isWarrantyService("reparacion de motor")).toBe(true);
    expect(isWarrantyService("REPARACIÓN DE MOTOR")).toBe(true);
    expect(isWarrantyService("Reparación de cabeza de fuerza")).toBe(true);
    expect(isWarrantyService("reparacion  de  cabeza  de  fuerza")).toBe(true);
  });

  it("rejects any other catalog service", () => {
    expect(isWarrantyService("Cambio de aceite")).toBe(false);
    expect(isWarrantyService("Reparación de frenos")).toBe(false);
    expect(isWarrantyService("")).toBe(false);
  });
});

describe("warrantyAppliesToOrder (characterization)", () => {
  it("is true when a linked labor line names a warranty service", () => {
    const serviceNameFor = vi.fn((id: bigint) =>
      id === 9n ? "Reparación de motor" : null,
    );

    expect(
      warrantyAppliesToOrder([laborLine({ serviceId: 9n })], serviceNameFor),
    ).toBe(true);
    expect(serviceNameFor).toHaveBeenCalledWith(9n);
  });

  it("is false when no labor line is linked to a catalog service", () => {
    const serviceNameFor = vi.fn(() => "Reparación de motor");

    expect(warrantyAppliesToOrder([laborLine()], serviceNameFor)).toBe(false);
    expect(serviceNameFor).not.toHaveBeenCalled();
  });

  it("is false when the linked service is not a warranty service", () => {
    const serviceNameFor = vi.fn(() => "Cambio de aceite");

    expect(
      warrantyAppliesToOrder([laborLine({ serviceId: 5n })], serviceNameFor),
    ).toBe(false);
  });

  it("is false when the service id cannot be resolved", () => {
    const serviceNameFor = vi.fn(() => null);

    expect(
      warrantyAppliesToOrder([laborLine({ serviceId: 9n })], serviceNameFor),
    ).toBe(false);
  });

  it("is true when any one of several labor lines matches", () => {
    const serviceNameFor = vi.fn((id: bigint) =>
      id === 11n ? "Reparación de cabeza de fuerza" : "Cambio de aceite",
    );

    expect(
      warrantyAppliesToOrder(
        [
          laborLine({ id: 1n, serviceId: 5n }),
          laborLine({ id: 2n, serviceId: 11n }),
        ],
        serviceNameFor,
      ),
    ).toBe(true);
  });
});
