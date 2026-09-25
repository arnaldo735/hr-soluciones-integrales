import { CancelOrderDialog } from "@/components/order/CancelOrderDialog";
import { DeleteOrderDialog } from "@/components/order/DeleteOrderDialog";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the two order-lifecycle dialogs, which are
 * adjacent to the accepted change that lets an order be cancelled with a reason
 * and deleted permanently after an explicit confirmation.
 *
 * These tests protect the surrounding working behavior: the cancel reason is
 * mandatory and reaches the backend trimmed, a failed cancel surfaces an error
 * without closing, the delete confirmation calls the backend and then notifies
 * the caller, and a failed delete keeps the dialog open with its error. They
 * never assert the exact copy of the confirmation, which the accepted change
 * may reword.
 */

const cancelMutateMock = vi.fn();
const deleteMutateMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useCancelOrder: () => ({
      mutate: cancelMutateMock,
      isPending: false,
    }),
    useDeleteOrder: () => ({
      mutate: deleteMutateMock,
      isPending: false,
    }),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("CancelOrderDialog", () => {
  beforeEach(() => {
    cancelMutateMock.mockReset();
  });

  it("keeps the confirm action disabled until a reason is typed", async () => {
    renderWithProviders(
      <CancelOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={vi.fn()}
      />,
    );

    const confirm = screen.getByTestId(
      "order_detail.cancel_order.confirm_button",
    );
    expect(confirm).toBeDisabled();

    await userEvent.type(
      screen.getByTestId("order_detail.cancel_order.reason_textarea"),
      "El cliente desistió",
    );
    expect(confirm).toBeEnabled();
  });

  it("does not submit a whitespace-only reason", async () => {
    renderWithProviders(
      <CancelOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={vi.fn()}
      />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.cancel_order.reason_textarea"),
      "   ",
    );
    expect(
      screen.getByTestId("order_detail.cancel_order.confirm_button"),
    ).toBeDisabled();
    expect(cancelMutateMock).not.toHaveBeenCalled();
  });

  it("cancels the order with the trimmed reason and closes on success", async () => {
    const onOpenChange = vi.fn();
    cancelMutateMock.mockImplementation(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    renderWithProviders(
      <CancelOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={onOpenChange}
      />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.cancel_order.reason_textarea"),
      "  El cliente desistió  ",
    );
    await userEvent.click(
      screen.getByTestId("order_detail.cancel_order.confirm_button"),
    );

    await waitFor(() => expect(cancelMutateMock).toHaveBeenCalledTimes(1));
    expect(cancelMutateMock.mock.calls[0][0]).toEqual({
      id: 42n,
      reason: "El cliente desistió",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("surfaces a backend rejection without closing the dialog", async () => {
    const onOpenChange = vi.fn();
    cancelMutateMock.mockImplementation(
      (_input: unknown, options?: { onError?: (error: unknown) => void }) => {
        options?.onError?.(new Error("La orden ya fue facturada"));
      },
    );

    renderWithProviders(
      <CancelOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={onOpenChange}
      />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.cancel_order.reason_textarea"),
      "Motivo",
    );
    await userEvent.click(
      screen.getByTestId("order_detail.cancel_order.confirm_button"),
    );

    expect(
      await screen.findByTestId("order_detail.cancel_order.error_state"),
    ).toHaveTextContent("La orden ya fue facturada");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("DeleteOrderDialog", () => {
  beforeEach(() => {
    deleteMutateMock.mockReset();
  });

  it("deletes the order after confirmation and notifies the caller", async () => {
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();
    deleteMutateMock.mockImplementation(
      (_id: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    renderWithProviders(
      <DeleteOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />,
    );

    await userEvent.click(
      screen.getByTestId("order_detail.delete_order.confirm_button"),
    );

    await waitFor(() => expect(deleteMutateMock).toHaveBeenCalledTimes(1));
    expect(deleteMutateMock.mock.calls[0][0]).toBe(42n);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("does not delete when the user keeps the order", async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(
      <DeleteOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={onOpenChange}
      />,
    );

    await userEvent.click(
      screen.getByTestId("order_detail.delete_order.dismiss_button"),
    );

    expect(deleteMutateMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("surfaces a backend rejection without notifying a deletion", async () => {
    const onDeleted = vi.fn();
    deleteMutateMock.mockImplementation(
      (_id: unknown, options?: { onError?: (error: unknown) => void }) => {
        options?.onError?.(
          new Error("No se puede eliminar una orden facturada"),
        );
      },
    );

    renderWithProviders(
      <DeleteOrderDialog
        orderId={42n}
        orderNumber="OT-0001"
        open
        onOpenChange={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    await userEvent.click(
      screen.getByTestId("order_detail.delete_order.confirm_button"),
    );

    expect(
      await screen.findByTestId("order_detail.delete_order.error_state"),
    ).toHaveTextContent("No se puede eliminar una orden facturada");
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
