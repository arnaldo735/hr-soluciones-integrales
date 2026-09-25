import type { ServiceCategoryUsage } from "@/lib/types";
import { ServiceCategoriesPage } from "@/pages/ServiceCategoriesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listCategoriesMock = vi.fn();
const createCategoryMock = vi.fn();
const updateCategoryMock = vi.fn();
const deleteCategoryMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listServiceCategories: listCategoriesMock,
      createServiceCategory: createCategoryMock,
      updateServiceCategory: updateCategoryMock,
      deleteServiceCategory: deleteCategoryMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function usage(
  overrides: Partial<ServiceCategoryUsage> = {},
): ServiceCategoryUsage {
  return {
    category: {
      id: 1n,
      name: "Mantenimiento",
      description: "Preventivo y correctivo",
      createdAt: 1_700_000_000_000_000_000n,
    },
    serviceCount: 3n,
    activeServiceCount: 2n,
    ...overrides,
  };
}

describe("ServiceCategoriesPage", () => {
  beforeEach(() => {
    listCategoriesMock.mockReset();
    createCategoryMock.mockReset();
    updateCategoryMock.mockReset();
    deleteCategoryMock.mockReset();
    listCategoriesMock.mockResolvedValue([]);
  });

  it("lists categories with their service usage counts", async () => {
    listCategoriesMock.mockResolvedValue([usage()]);
    renderWithProviders(<ServiceCategoriesPage />);

    expect(await screen.findByText("Mantenimiento")).toBeInTheDocument();
    expect(screen.getByText("Preventivo y correctivo")).toBeInTheDocument();
    expect(screen.getByText("3 servicios")).toBeInTheDocument();
    expect(screen.getByText("2 activos")).toBeInTheDocument();
  });

  it("creates a category from the embedded form", async () => {
    createCategoryMock.mockResolvedValue(usage().category);
    renderWithProviders(<ServiceCategoriesPage />);
    await screen.findByTestId("service_categories.empty_state");

    await userEvent.type(
      screen.getByTestId("service_categories.name_input"),
      "Frenos",
    );
    await userEvent.type(
      screen.getByTestId("service_categories.description_input"),
      "Sistema de frenado",
    );
    await userEvent.click(
      screen.getByTestId("service_categories.submit_button"),
    );

    await waitFor(() => expect(createCategoryMock).toHaveBeenCalledTimes(1));
    expect(createCategoryMock.mock.calls[0][0]).toEqual({
      name: "Frenos",
      description: "Sistema de frenado",
    });
  });

  it("edits a category with its current values", async () => {
    listCategoriesMock.mockResolvedValue([usage()]);
    updateCategoryMock.mockResolvedValue(usage().category);
    renderWithProviders(<ServiceCategoriesPage />);
    await screen.findByText("Mantenimiento");

    await userEvent.click(
      screen.getByTestId("service_categories.edit_button.1"),
    );
    expect(screen.getByTestId("service_categories.name_input")).toHaveValue(
      "Mantenimiento",
    );

    await userEvent.clear(screen.getByTestId("service_categories.name_input"));
    await userEvent.type(
      screen.getByTestId("service_categories.name_input"),
      "Mantenimiento general",
    );
    await userEvent.click(
      screen.getByTestId("service_categories.submit_button"),
    );

    await waitFor(() => expect(updateCategoryMock).toHaveBeenCalledTimes(1));
    expect(updateCategoryMock.mock.calls[0][0]).toBe(1n);
    expect(updateCategoryMock.mock.calls[0][1]).toMatchObject({
      name: "Mantenimiento general",
    });
  });

  it("deletes a category only after confirming", async () => {
    listCategoriesMock.mockResolvedValue([
      usage({ activeServiceCount: 0n, serviceCount: 0n }),
    ]);
    deleteCategoryMock.mockResolvedValue(true);
    renderWithProviders(<ServiceCategoriesPage />);
    await screen.findByText("Mantenimiento");

    await userEvent.click(
      screen.getByTestId("service_categories.delete_button.1"),
    );
    expect(deleteCategoryMock).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByTestId("service_categories.delete_confirm_button"),
    );
    await waitFor(() => expect(deleteCategoryMock).toHaveBeenCalledWith(1n));
  });

  it("blocks deleting a category that has active services", async () => {
    listCategoriesMock.mockResolvedValue([usage()]);
    renderWithProviders(<ServiceCategoriesPage />);
    await screen.findByText("Mantenimiento");

    // The delete control is disabled while active services reference it.
    expect(
      screen.getByTestId("service_categories.delete_button.1"),
    ).toBeDisabled();
    expect(deleteCategoryMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend refusal when a category is still in use", async () => {
    listCategoriesMock.mockResolvedValue([
      usage({ activeServiceCount: 0n, serviceCount: 1n }),
    ]);
    deleteCategoryMock.mockRejectedValue(
      new Error("inUse: 1 (2 servicios activos)"),
    );
    renderWithProviders(<ServiceCategoriesPage />);
    await screen.findByText("Mantenimiento");

    await userEvent.click(
      screen.getByTestId("service_categories.delete_button.1"),
    );
    await userEvent.click(
      screen.getByTestId("service_categories.delete_confirm_button"),
    );

    expect(
      await screen.findByTestId("service_categories.delete_error"),
    ).toHaveTextContent("No se puede eliminar: 2 servicios activos");
  });

  it("renders an empty state when no categories exist", async () => {
    listCategoriesMock.mockResolvedValue([]);
    renderWithProviders(<ServiceCategoriesPage />);

    expect(
      await screen.findByTestId("service_categories.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay categorías")).toBeInTheDocument();
  });
});
