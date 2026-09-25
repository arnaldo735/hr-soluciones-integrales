import { OrderPhotosSection } from "@/components/order/OrderPhotosSection";
import { ORDER_PHOTO_LIMIT, type OrderPhoto } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the order's process-evidence gallery, which is
 * adjacent to the accepted change that caps an order at six photos taken with
 * the camera or picked from a file.
 *
 * These tests protect the surrounding working behavior: the counter and the
 * per-photo captions, the camera and file inputs, the removal action, and the
 * hard limit that hides the add tile and disables both inputs once six photos
 * are attached. They never assert the exact upload transport, which is the
 * seam the accepted change may touch.
 */

const uploadMock = vi.fn();
const addPhotoMutateMock = vi.fn();
const removePhotoMutateMock = vi.fn();

vi.mock("@/hooks/use-order-photos", () => ({
  useOrderPhotoUpload: () => ({
    upload: uploadMock,
    isUploading: false,
    progress: 0,
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useAddOrderPhoto: () => ({
      mutateAsync: addPhotoMutateMock,
      isPending: false,
    }),
    useRemoveOrderPhoto: () => ({
      mutate: removePhotoMutateMock,
      isPending: false,
    }),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

/** A photo whose blob exposes the direct URL the gallery renders. */
function photo(overrides: Partial<OrderPhoto> = {}): OrderPhoto {
  return {
    id: 1n,
    filename: "ingreso.jpg",
    mimeType: "image/jpeg",
    uploadedAt: TS,
    uploadedBy: undefined as never,
    blob: {
      getDirectURL: () => "blob:photo-1",
    } as unknown as OrderPhoto["blob"],
    ...overrides,
  };
}

function photos(count: number): OrderPhoto[] {
  return Array.from({ length: count }, (_, index) =>
    photo({
      id: BigInt(index + 1),
      filename: `evidencia-${index + 1}.jpg`,
      blob: {
        getDirectURL: () => `blob:photo-${index + 1}`,
      } as unknown as OrderPhoto["blob"],
    }),
  );
}

describe("OrderPhotosSection", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    addPhotoMutateMock.mockReset();
    removePhotoMutateMock.mockReset();
  });

  it("shows the counter and one tile per attached photo", async () => {
    renderWithProviders(
      <OrderPhotosSection orderId={42n} photos={photos(2)} />,
    );

    expect(screen.getByTestId("order_detail.photos.counter")).toHaveTextContent(
      `2 de ${ORDER_PHOTO_LIMIT} fotos`,
    );
    expect(
      screen.getByTestId("order_detail.photos.item.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("order_detail.photos.item.2"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("order_detail.photos.item.3"),
    ).not.toBeInTheDocument();
  });

  it("renders the camera and file inputs with the expected capture hints", () => {
    renderWithProviders(<OrderPhotosSection orderId={42n} photos={[]} />);

    const camera = screen.getByTestId("order_detail.photos.camera_button");
    const file = screen.getByTestId("order_detail.photos.file_button");
    expect(camera).toBeEnabled();
    expect(file).toBeEnabled();

    // The camera input requests the rear camera; the file input accepts
    // multiple images. Both are hidden behind their buttons.
    const inputs =
      document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(inputs).toHaveLength(2);
    const cameraInput = Array.from(inputs).find(
      (input) => input.getAttribute("capture") === "environment",
    );
    const fileInput = Array.from(inputs).find(
      (input) => input.getAttribute("capture") === null,
    );
    expect(cameraInput).toBeDefined();
    expect(cameraInput?.accept).toBe("image/*");
    expect(fileInput).toBeDefined();
    expect(fileInput?.multiple).toBe(true);
  });

  it("uploads a selected file and attaches it to the order", async () => {
    const uploaded = {
      blob: { getDirectURL: () => "blob:new" },
      filename: "nueva.jpg",
      mimeType: "image/jpeg",
    };
    uploadMock.mockResolvedValue(uploaded);
    addPhotoMutateMock.mockResolvedValue({});

    renderWithProviders(<OrderPhotosSection orderId={42n} photos={[]} />);

    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]:not([capture])',
    );
    expect(fileInput).not.toBeNull();
    const file = new File(["bytes"], "nueva.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput as HTMLInputElement, file);

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    expect(uploadMock.mock.calls[0][0]).toBe(file);
    await waitFor(() =>
      expect(addPhotoMutateMock).toHaveBeenCalledWith({
        id: 42n,
        photo: uploaded,
      }),
    );
  });

  it("removes a photo through the backend", async () => {
    renderWithProviders(
      <OrderPhotosSection orderId={42n} photos={photos(1)} />,
    );

    await userEvent.click(
      screen.getByTestId("order_detail.photos.remove_button.1"),
    );

    await waitFor(() => expect(removePhotoMutateMock).toHaveBeenCalledTimes(1));
    expect(removePhotoMutateMock.mock.calls[0][0]).toEqual({
      id: 42n,
      photoId: 1n,
    });
  });

  it("blocks a seventh photo once the limit is reached", () => {
    renderWithProviders(
      <OrderPhotosSection orderId={42n} photos={photos(ORDER_PHOTO_LIMIT)} />,
    );

    // The counter reports the cap and the add tile is gone.
    expect(screen.getByTestId("order_detail.photos.counter")).toHaveTextContent(
      `${ORDER_PHOTO_LIMIT} de ${ORDER_PHOTO_LIMIT} fotos`,
    );
    expect(
      screen.queryByTestId("order_detail.photos.upload_button"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("order_detail.photos.limit_state"),
    ).toBeInTheDocument();

    // Both entry points are disabled, so no seventh file can be selected.
    expect(
      screen.getByTestId("order_detail.photos.camera_button"),
    ).toBeDisabled();
    expect(
      screen.getByTestId("order_detail.photos.file_button"),
    ).toBeDisabled();
  });

  it("keeps the add tile and both inputs available below the limit", () => {
    renderWithProviders(
      <OrderPhotosSection
        orderId={42n}
        photos={photos(ORDER_PHOTO_LIMIT - 1)}
      />,
    );

    expect(
      screen.getByTestId("order_detail.photos.upload_button"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("order_detail.photos.limit_state"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("order_detail.photos.camera_button"),
    ).toBeEnabled();
    expect(screen.getByTestId("order_detail.photos.file_button")).toBeEnabled();
  });

  it("shows the upload error state when a file is rejected", async () => {
    uploadMock.mockRejectedValue(
      new Error("La foto supera el límite de 10 MB."),
    );

    renderWithProviders(<OrderPhotosSection orderId={42n} photos={[]} />);

    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]:not([capture])',
    );
    const file = new File(["bytes"], "grande.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput as HTMLInputElement, file);

    const error = await screen.findByTestId("order_detail.photos.error_state");
    expect(error).toHaveTextContent("La foto supera el límite de 10 MB.");
    expect(addPhotoMutateMock).not.toHaveBeenCalled();
  });

  it("labels each tile with its upload timestamp", () => {
    renderWithProviders(
      <OrderPhotosSection orderId={42n} photos={photos(1)} />,
    );

    const tile = screen.getByTestId("order_detail.photos.item.1");
    // The caption is the formatted upload date, not the filename.
    expect(within(tile).getByText(/2023|2024/)).toBeInTheDocument();
  });
});
