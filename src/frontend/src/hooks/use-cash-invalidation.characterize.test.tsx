import { invalidateCashData } from "@/hooks/use-cash";
import { createTestQueryClient } from "@/test/helpers";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the `invalidateCashData` helper contract that
 * the accepted "OT sale's saldo a cobrar is recorded in Caja y Bancos" change
 * reuses.
 *
 * The accepted change makes `createInvoiceFromOrder` write a Caja/Bancos income
 * movement and makes the frontend refresh the Caja y Bancos view after
 * generating the invoice. That refresh goes through `invalidateCashData`, the
 * same helper the existing POS sale, receivable payment, invoice collection and
 * installment flows already call. These tests deliberately do NOT assert that
 * `InvoicesPage` calls the helper — that is exactly the behavior the change
 * adds. They protect the helper's own contract so a third caller cannot weaken
 * it:
 *
 *   - it invalidates the whole `["cash"]` family, which is what refreshes the
 *     open shifts (`["cash","open-shifts"]`), the movement history
 *     (`["cash","movements",…]`) and the daily report (`["cash","daily-report",…]`);
 *   - it invalidates the accounting surfaces that derive from the same ledger
 *     (`accounting-summary`, `accounting-report`, `ledger-entries`);
 *   - it stays scoped: it does not invalidate unrelated families such as
 *     `["invoices"]` or `["orders"]`.
 *
 * The backend actor is not involved: this is a pure query-cache contract.
 */

describe("invalidateCashData contract (characterization)", () => {
  it("invalidates the whole cash family and the accounting surfaces", () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    invalidateCashData(queryClient);

    const keys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(["cash"]);
    expect(keys).toContainEqual(["accounting-summary"]);
    expect(keys).toContainEqual(["accounting-report"]);
    expect(keys).toContainEqual(["ledger-entries"]);
  });

  it("refreshes the open-shifts and movements queries through the cash family", async () => {
    const queryClient = createTestQueryClient();
    // Seed the exact keys the Caja y Bancos page reads, then prove the helper's
    // `["cash"]` prefix invalidation reaches them.
    queryClient.setQueryData(["cash", "open-shifts"], []);
    queryClient.setQueryData(["cash", "movements", "all", "all"], {
      items: [],
    });
    queryClient.setQueryData(["cash", "daily-report", "7"], null);

    invalidateCashData(queryClient);

    expect(
      queryClient.getQueryState(["cash", "open-shifts"])?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(["cash", "movements", "all", "all"])
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(["cash", "daily-report", "7"])?.isInvalidated,
    ).toBe(true);
  });

  it("stays scoped and does not invalidate unrelated query families", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["invoices", "list"], { items: [] });
    queryClient.setQueryData(["orders", "invoiceable"], []);

    invalidateCashData(queryClient);

    expect(queryClient.getQueryState(["invoices", "list"])?.isInvalidated).toBe(
      false,
    );
    expect(
      queryClient.getQueryState(["orders", "invoiceable"])?.isInvalidated,
    ).toBe(false);
  });
});
