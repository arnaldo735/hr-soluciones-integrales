import { Layout } from "@/components/Layout";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { useBackend } from "@/hooks/use-backend";
import { useCompleteDriveAuthorization } from "@/hooks/use-backup";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { ComponentType } from "react";
import { Suspense, lazy, useEffect, useRef, useState } from "react";

const rootRoute = createRootRoute({ component: Layout });

/** Lightweight placeholder shown while a route's screen chunk loads. */
function PageFallback() {
  return (
    <div
      data-ocid="route.loading_state"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <Loader2
        className="size-6 animate-spin text-primary"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Wraps a lazily imported page in a Suspense boundary so each screen is
 * fetched only when its route is visited, never at app startup.
 */
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);
  return function LazyPage() {
    return (
      <Suspense fallback={<PageFallback />}>
        <Component />
      </Suspense>
    );
  };
}

/** Wraps a page component in the administrator route guard. */
function adminOnly(Component: ComponentType) {
  return function AdminGuardedRoute() {
    return (
      <RequireAdmin>
        <Component />
      </RequireAdmin>
    );
  };
}

// --- Screens (loaded on visit, not at startup) ---------------------------

const DashboardPage = lazyPage(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const OrdersPage = lazyPage(() =>
  import("@/pages/OrdersPage").then((m) => ({ default: m.OrdersPage })),
);
const NewOrderPage = lazyPage(() =>
  import("@/pages/NewOrderPage").then((m) => ({ default: m.NewOrderPage })),
);
const OrderDetailPage = lazyPage(() =>
  import("@/pages/OrderDetailPage").then((m) => ({
    default: m.OrderDetailPage,
  })),
);
const AppointmentsPage = lazyPage(() =>
  import("@/pages/AppointmentsPage").then((m) => ({
    default: m.AppointmentsPage,
  })),
);
const TechniciansPage = lazyPage(() =>
  import("@/pages/TechniciansPage").then((m) => ({
    default: m.TechniciansPage,
  })),
);
const InventoryPage = lazyPage(() =>
  import("@/pages/InventoryPage").then((m) => ({ default: m.InventoryPage })),
);
const PartDetailPage = lazyPage(() =>
  import("@/pages/PartDetailPage").then((m) => ({ default: m.PartDetailPage })),
);
const ServicesPage = lazyPage(() =>
  import("@/pages/ServicesPage").then((m) => ({ default: m.ServicesPage })),
);
const ServiceCategoriesPage = lazyPage(() =>
  import("@/pages/ServiceCategoriesPage").then((m) => ({
    default: m.ServiceCategoriesPage,
  })),
);
const CustomersPage = lazyPage(() =>
  import("@/pages/CustomersPage").then((m) => ({ default: m.CustomersPage })),
);
const MotorcyclesPage = lazyPage(() =>
  import("@/pages/MotorcyclesPage").then((m) => ({
    default: m.MotorcyclesPage,
  })),
);
const CustomerDetailPage = lazyPage(() =>
  import("@/pages/CustomerDetailPage").then((m) => ({
    default: m.CustomerDetailPage,
  })),
);
const SuppliersPage = lazyPage(() =>
  import("@/pages/SuppliersPage").then((m) => ({ default: m.SuppliersPage })),
);
const SupplierDetailPage = lazyPage(() =>
  import("@/pages/SupplierDetailPage").then((m) => ({
    default: m.SupplierDetailPage,
  })),
);
const QuotesPage = lazyPage(() =>
  import("@/pages/QuotesPage").then((m) => ({ default: m.QuotesPage })),
);
const QuoteDetailPage = lazyPage(() =>
  import("@/pages/QuoteDetailPage").then((m) => ({
    default: m.QuoteDetailPage,
  })),
);
const InvoicesPage = lazyPage(() =>
  import("@/pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })),
);
const InvoiceDetailPage = lazyPage(() =>
  import("@/pages/InvoiceDetailPage").then((m) => ({
    default: m.InvoiceDetailPage,
  })),
);
const PosPage = lazyPage(() =>
  import("@/pages/PosPage").then((m) => ({ default: m.PosPage })),
);
const PosHistoryPage = lazyPage(() =>
  import("@/pages/PosHistoryPage").then((m) => ({ default: m.PosHistoryPage })),
);
const PurchaseInvoicesPage = lazyPage(() =>
  import("@/pages/PurchaseInvoicesPage").then((m) => ({
    default: m.PurchaseInvoicesPage,
  })),
);
const PurchaseInvoiceDetailPage = lazyPage(() =>
  import("@/pages/PurchaseInvoiceDetailPage").then((m) => ({
    default: m.PurchaseInvoiceDetailPage,
  })),
);
const CompanyPage = lazyPage(() =>
  import("@/pages/CompanyPage").then((m) => ({ default: m.CompanyPage })),
);
const ExpensesPage = lazyPage(() =>
  import("@/pages/ExpensesPage").then((m) => ({ default: m.ExpensesPage })),
);
const CommissionsPage = lazyPage(() =>
  import("@/pages/CommissionsPage").then((m) => ({
    default: m.CommissionsPage,
  })),
);
const AccountingPage = lazyPage(() =>
  import("@/pages/AccountingPage").then((m) => ({ default: m.AccountingPage })),
);
const SettingsPage = lazyPage(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const CuentasPorCobrarPage = lazyPage(() =>
  import("@/pages/CuentasPorCobrarPage").then((m) => ({
    default: m.CuentasPorCobrarPage,
  })),
);
const CuentasPorPagarPage = lazyPage(() =>
  import("@/pages/CuentasPorPagarPage").then((m) => ({
    default: m.CuentasPorPagarPage,
  })),
);

/**
 * Destino del callback OAuth de Google Drive. Lee `code` y `state` de la URL,
 * espera a que el actor esté autenticado y disponible, y solo entonces
 * completa la autorización. La guarda de un solo uso se activa después de
 * esperar la llamada al backend, nunca antes.
 */
function DriveCallbackPage() {
  const { actor, isFetching } = useBackend();
  const complete = useCompleteDriveAuthorization();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    if (!actor || isFetching) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      setStatus("error");
      setMessage(
        "Google no devolvió el código de autorización. Intenta conectar de nuevo desde Configuración.",
      );
      return;
    }

    startedRef.current = true;
    complete.mutate(
      { code, state },
      {
        onSuccess: (result) => {
          if (result.connected) {
            setStatus("done");
            setMessage(
              result.accountEmail
                ? `Cuenta conectada: ${result.accountEmail}`
                : "Cuenta de Google Drive conectada correctamente.",
            );
          } else {
            setStatus("error");
            setMessage(
              "Google Drive no confirmó la conexión. Intenta de nuevo desde Configuración.",
            );
          }
        },
        onError: (error) => {
          setStatus("error");
          setMessage(
            error instanceof Error && error.message
              ? error.message
              : "No se pudo completar la conexión con Google Drive.",
          );
        },
      },
    );
  }, [actor, isFetching, complete]);

  useEffect(() => {
    if (status === "working") return;
    const timer = window.setTimeout(() => {
      void navigate({ to: "/configuracion", replace: true });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [status, navigate]);

  return (
    <div
      data-ocid="drive_callback.page"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center"
    >
      {status === "working" ? (
        <>
          <Loader2
            className="size-8 animate-spin text-primary"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h1 className="font-display text-lg font-semibold">
              Conectando con Google Drive
            </h1>
            <p className="text-sm text-muted-foreground">
              Estamos terminando la autorización de tu cuenta. No cierres esta
              ventana.
            </p>
          </div>
        </>
      ) : null}

      {status === "done" ? (
        <>
          <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
          <div className="space-y-1">
            <h1 className="font-display text-lg font-semibold">
              Google Drive conectado
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">
              Volviendo a Configuración…
            </p>
          </div>
        </>
      ) : null}

      {status === "error" ? (
        <>
          <AlertTriangle
            className="size-8 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h1 className="font-display text-lg font-semibold">
              No se pudo conectar
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigate({ to: "/configuracion", replace: true });
            }}
            data-ocid="drive_callback.back_button"
          >
            Volver a Configuración
          </Button>
        </>
      ) : null}
    </div>
  );
}

// --- Panel ---------------------------------------------------------------

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

// --- Taller --------------------------------------------------------------

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ordenes",
  component: OrdersPage,
});

const newOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ordenes/nueva",
  component: NewOrderPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ordenes/$id",
  component: OrderDetailPage,
});

const appointmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/citas",
  component: AppointmentsPage,
});

const techniciansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tecnicos",
  component: TechniciansPage,
});

// --- Catálogo ------------------------------------------------------------

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventario",
  component: InventoryPage,
});

const partDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventario/$id",
  component: PartDetailPage,
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/servicios",
  component: ServicesPage,
});

const serviceCategoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/servicios/categorias",
  component: adminOnly(ServiceCategoriesPage),
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clientes",
  component: CustomersPage,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clientes/$id",
  component: CustomerDetailPage,
});

const motorcyclesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/motos",
  component: adminOnly(MotorcyclesPage),
});

const suppliersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proveedores",
  component: adminOnly(SuppliersPage),
});

const supplierDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proveedores/$id",
  component: adminOnly(SupplierDetailPage),
});

// --- Ventas --------------------------------------------------------------

const quotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cotizaciones",
  component: QuotesPage,
});

const newQuoteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cotizaciones/nueva",
  component: QuoteDetailPage,
});

const quoteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cotizaciones/$id",
  component: QuoteDetailPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas",
  component: adminOnly(InvoicesPage),
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas/$id",
  component: adminOnly(InvoiceDetailPage),
});

const posRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pos",
  component: PosPage,
});

const posHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pos/historial",
  component: PosHistoryPage,
});

// --- Compras -------------------------------------------------------------

const purchaseInvoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas-compra",
  component: adminOnly(PurchaseInvoicesPage),
});

const purchaseInvoiceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/facturas-compra/$id",
  component: adminOnly(PurchaseInvoiceDetailPage),
});

// --- Administración ------------------------------------------------------

const companyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/empresa",
  component: adminOnly(CompanyPage),
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gastos",
  component: adminOnly(ExpensesPage),
});

const commissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/comisiones",
  component: adminOnly(CommissionsPage),
});

const accountingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contabilidad",
  component: adminOnly(AccountingPage),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/configuracion",
  component: adminOnly(SettingsPage),
});

const driveCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connect/drive",
  component: adminOnly(DriveCallbackPage),
});

const receivablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cuentas-por-cobrar",
  component: adminOnly(CuentasPorCobrarPage),
});

const payablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cuentas-por-pagar",
  component: adminOnly(CuentasPorPagarPage),
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  ordersRoute,
  newOrderRoute,
  orderDetailRoute,
  appointmentsRoute,
  techniciansRoute,
  inventoryRoute,
  partDetailRoute,
  servicesRoute,
  serviceCategoriesRoute,
  customersRoute,
  customerDetailRoute,
  motorcyclesRoute,
  suppliersRoute,
  supplierDetailRoute,
  quotesRoute,
  newQuoteRoute,
  quoteDetailRoute,
  invoicesRoute,
  invoiceDetailRoute,
  posRoute,
  posHistoryRoute,
  purchaseInvoicesRoute,
  purchaseInvoiceDetailRoute,
  companyRoute,
  expensesRoute,
  commissionsRoute,
  accountingRoute,
  settingsRoute,
  driveCallbackRoute,
  receivablesRoute,
  payablesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
