import { ServicePicker } from "@/components/order/ServicePicker";
import type { Service } from "@/lib/types";
import { ServiceSort } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted search-only behavior of the shared service picker.
 *
 * The accepted change makes the service selector show nothing until the user
 * types a term: it no longer lists the whole active catalog by default. This
 * picker is the shared seam used by the workshop-order labor dialog (OT) and
 * the quote line editor (cotizaciones), so a regression here would silently
 * list every service again in both flows. The real `useServices` hook runs
 * against a typed actor mock, so these tests fail if the picker queries the
 * catalog before a term is typed or drops the active-only filter.
 */

const listServicesMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { listServices: listServicesMock },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return {
    ...actual,
    useAuth: () => ({ token: "session-token" }),
  };
});

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 3n,
    code: "SRV-0003",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function servicePage(items: Service[]) {
  return { items, total: BigInt(items.length), offset: 0n, limit: 1000n };
}

describe("ServicePicker search-only behavior (cover)", () => {
  beforeEach(() => {
    listServicesMock.mockReset();
    listServicesMock.mockResolvedValue(servicePage([service()]));
  });

  it("shows the write-a-term prompt and does not query the catalog before typing", async () => {
    renderWithProviders(
      <ServicePicker
        value={null}
        onChange={vi.fn()}
        id="service-picker"
        ocid="order_detail.add_labor.service"
      />,
    );

    expect(
      screen.getByTestId("order_detail.add_labor.service.prompt_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("order_detail.add_labor.service.list"),
    ).not.toBeInTheDocument();
    // The catalog is only searched on demand, so nothing is fetched yet.
    expect(listServicesMock).not.toHaveBeenCalled();
  });

  it("queries the active catalog with the typed term and lists the matches", async () => {
    listServicesMock.mockResolvedValue(
      servicePage([
        service({ id: 3n, code: "SRV-0003", name: "Cambio de aceite" }),
        service({ id: 4n, code: "SRV-0004", name: "Cambio de aceite premium" }),
      ]),
    );
    renderWithProviders(
      <ServicePicker
        value={null}
        onChange={vi.fn()}
        id="service-picker"
        ocid="order_detail.add_labor.service"
      />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.service.search_input"),
      "aceite",
    );

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenLastCalledWith(
        "session-token",
        expect.objectContaining({ search: "aceite", activeOnly: true }),
        ServiceSort.name,
        0n,
        1000n,
      ),
    );

    const list = within(
      await screen.findByTestId("order_detail.add_labor.service.list"),
    );
    expect(list.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(list.getByText("Cambio de aceite premium")).toBeInTheDocument();
  });

  it("shows the no-matches message when the term matches no service", async () => {
    listServicesMock.mockResolvedValue(servicePage([]));
    renderWithProviders(
      <ServicePicker
        value={null}
        onChange={vi.fn()}
        id="service-picker"
        ocid="order_detail.add_labor.service"
      />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.service.search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("order_detail.add_labor.service.empty_state"),
    ).toHaveTextContent("Sin servicios activos que coincidan con “zzz”.");
  });

  it("reports the chosen service through onChange", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ServicePicker
        value={null}
        onChange={onChange}
        id="service-picker"
        ocid="order_detail.add_labor.service"
      />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.service.search_input"),
      "aceite",
    );
    await userEvent.click(
      await screen.findByTestId("order_detail.add_labor.service.item.1"),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3n, code: "SRV-0003" }),
    );
  });
});
