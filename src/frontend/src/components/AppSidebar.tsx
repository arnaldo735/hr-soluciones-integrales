import { useRole } from "@/hooks/use-role";
import type { NavFlow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  Bike,
  Boxes,
  Building2,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  FileSpreadsheet,
  FileText,
  HandCoins,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  ScanBarcode,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface FlowModule {
  label: string;
  to: string;
  icon: LucideIcon;
  adminOnly: boolean;
  /**
   * Clave de módulo del backend que habilita esta entrada. `null` significa que
   * la entrada no depende de un módulo del rol (p. ej. el panel de resumen).
   */
  moduleKey: string | null;
}

interface FlowGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  modules: FlowModule[];
}

/**
 * The six consolidated navigation flows. Every module lives inside exactly one
 * flow; the flow expands and collapses and highlights the active module.
 */
const NAV_FLOWS: FlowGroup[] = [
  {
    id: "panel",
    label: "Panel",
    icon: LayoutDashboard,
    modules: [
      {
        label: "Resumen operativo",
        to: "/",
        icon: LayoutDashboard,
        adminOnly: false,
        moduleKey: null,
      },
    ],
  },
  {
    id: "taller",
    label: "Taller",
    icon: Wrench,
    modules: [
      {
        label: "Órdenes de taller",
        to: "/ordenes",
        icon: ClipboardList,
        adminOnly: false,
        moduleKey: "workshop",
      },
      {
        label: "Citas",
        to: "/citas",
        icon: CalendarClock,
        adminOnly: false,
        moduleKey: "appointments",
      },
      {
        label: "Técnicos",
        to: "/tecnicos",
        icon: Users,
        adminOnly: false,
        moduleKey: "technicians",
      },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    icon: Boxes,
    modules: [
      {
        label: "Inventario",
        to: "/inventario",
        icon: Package,
        adminOnly: false,
        moduleKey: "inventory",
      },
      {
        label: "Servicios",
        to: "/servicios",
        icon: Wrench,
        adminOnly: false,
        moduleKey: "services",
      },
      {
        label: "Categorías de servicios",
        to: "/servicios/categorias",
        icon: Tags,
        adminOnly: true,
        moduleKey: "serviceCategories",
      },
      {
        label: "Clientes y motos",
        to: "/clientes",
        icon: Users,
        adminOnly: false,
        moduleKey: "customers",
      },
      {
        label: "Motocicletas",
        to: "/motos",
        icon: Bike,
        adminOnly: true,
        moduleKey: "motorcycles",
      },
      {
        label: "Proveedores",
        to: "/proveedores",
        icon: Truck,
        adminOnly: true,
        moduleKey: "suppliers",
      },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: ShoppingCart,
    modules: [
      {
        label: "Cotizaciones",
        to: "/cotizaciones",
        icon: FileText,
        adminOnly: false,
        moduleKey: "quotes",
      },
      {
        label: "Facturas",
        to: "/facturas",
        icon: Receipt,
        adminOnly: true,
        moduleKey: "billing",
      },
      {
        label: "POS mostrador",
        to: "/pos",
        icon: ScanBarcode,
        adminOnly: false,
        moduleKey: "pos",
      },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: Truck,
    modules: [
      {
        label: "Compras",
        to: "/proveedores",
        icon: Truck,
        adminOnly: true,
        moduleKey: "purchases",
      },
      {
        label: "Facturas de compra",
        to: "/facturas-compra",
        icon: Receipt,
        adminOnly: true,
        moduleKey: "purchaseInvoices",
      },
      {
        label: "Cuentas por pagar",
        to: "/proveedores",
        icon: Wallet,
        adminOnly: true,
        moduleKey: "payables",
      },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Settings,
    modules: [
      {
        label: "Empresa",
        to: "/empresa",
        icon: Building2,
        adminOnly: true,
        moduleKey: "company",
      },
      {
        label: "Gastos",
        to: "/gastos",
        icon: Banknote,
        adminOnly: true,
        moduleKey: "expenses",
      },
      {
        label: "Comisiones y préstamos",
        to: "/comisiones",
        icon: HandCoins,
        adminOnly: true,
        moduleKey: "commissions",
      },
      {
        label: "Contabilidad",
        to: "/contabilidad",
        icon: FileSpreadsheet,
        adminOnly: true,
        moduleKey: "accounting",
      },
      {
        label: "Caja y bancos",
        to: "/caja",
        icon: Landmark,
        adminOnly: true,
        moduleKey: "cash",
      },
      {
        label: "Cuentas por cobrar",
        to: "/cuentas-por-cobrar",
        icon: HandCoins,
        adminOnly: true,
        moduleKey: "receivables",
      },
      {
        label: "Cuentas por pagar",
        to: "/cuentas-por-pagar",
        icon: Wallet,
        adminOnly: true,
        moduleKey: "payables",
      },
      {
        label: "Usuarios",
        to: "/configuracion/usuarios",
        icon: Users,
        adminOnly: true,
        moduleKey: "users",
      },
      {
        label: "Roles",
        to: "/configuracion/roles",
        icon: ShieldCheck,
        adminOnly: true,
        moduleKey: "roles",
      },
      {
        label: "Configuración",
        to: "/configuracion",
        icon: Settings,
        adminOnly: true,
        moduleKey: "settings",
      },
      {
        label: "Respaldos en Drive",
        to: "/configuracion",
        icon: CloudUpload,
        adminOnly: true,
        moduleKey: "settings",
      },
    ],
  },
];

const STORAGE_KEY = "taller-nav-open-flows";

function readOpenFlows(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

/** The flow that owns the current pathname, or `null` for an unknown route. */
function flowForPath(pathname: string): string | null {
  for (const flow of NAV_FLOWS) {
    for (const module of flow.modules) {
      if (module.to === "/") {
        if (pathname === "/") return flow.id;
      } else if (
        pathname === module.to ||
        pathname.startsWith(`${module.to}/`)
      ) {
        return flow.id;
      }
    }
  }
  return null;
}

interface AppSidebarProps {
  /** Called after a navigation link is activated (used to close the mobile drawer). */
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { isAdmin, modules } = useRole();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const activeFlow = flowForPath(pathname);
  const [openFlows, setOpenFlows] = useState<string[]>(() => {
    const stored = readOpenFlows();
    return stored.length > 0 ? stored : activeFlow ? [activeFlow] : ["panel"];
  });

  // Keep the flow that owns the active route expanded.
  useEffect(() => {
    if (activeFlow && !openFlows.includes(activeFlow)) {
      setOpenFlows((current) => [...current, activeFlow]);
    }
  }, [activeFlow, openFlows]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(openFlows));
    } catch {
      // Session persistence is best-effort; navigation still works without it.
    }
  }, [openFlows]);

  const toggleFlow = useCallback((id: string) => {
    setOpenFlows((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }, []);

  // Con una sesión de contraseña, los módulos permitidos del rol deciden qué
  // entradas se ven; sin sesión (Internet Identity) se conserva la regla de
  // administrador. Las entradas sin módulo (el panel) siempre están visibles.
  const visibleFlows = NAV_FLOWS.map((flow) => ({
    ...flow,
    modules: flow.modules.filter((module) => {
      if (module.moduleKey === null) return true;
      if (modules !== null) return modules.includes(module.moduleKey);
      return !module.adminOnly || isAdmin;
    }),
  })).filter((flow) => flow.modules.length > 0);

  return (
    <nav
      data-ocid="sidebar.nav"
      aria-label="Navegación principal"
      className="scroll-slim flex h-full flex-col gap-0.5 overflow-y-auto bg-sidebar px-3 py-4"
    >
      <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Flujos de operación
      </p>

      {visibleFlows.map((flow) => {
        const isOpen = openFlows.includes(flow.id);
        const isActiveFlow = activeFlow === flow.id;
        const FlowIcon = flow.icon;
        return (
          <div key={flow.id} data-ocid={`sidebar.flow.${flow.id}`}>
            <button
              type="button"
              onClick={() => toggleFlow(flow.id)}
              aria-expanded={isOpen}
              data-state={isOpen ? "open" : "closed"}
              data-ocid={`sidebar.flow_toggle.${flow.id}`}
              className={cn(
                "nav-group-header",
                isActiveFlow && "text-sidebar-foreground",
              )}
            >
              <FlowIcon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{flow.label}</span>
              <ChevronRight className="nav-group-chevron" aria-hidden="true" />
            </button>

            {isOpen ? (
              <div className="mt-0.5 space-y-0.5 pb-1">
                {flow.modules.map((module) => {
                  const isActive =
                    module.to === "/"
                      ? pathname === "/"
                      : pathname === module.to ||
                        pathname.startsWith(`${module.to}/`);
                  const ModuleIcon = module.icon;
                  return (
                    <Link
                      key={`${flow.id}-${module.label}`}
                      to={module.to}
                      onClick={onNavigate}
                      data-active={isActive ? "true" : "false"}
                      data-ocid={`sidebar.link.${flow.id}.${module.label
                        .toLowerCase()
                        .replace(/\s+/g, "_")}`}
                      aria-current={isActive ? "page" : undefined}
                      className="nav-child"
                    >
                      <ModuleIcon
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{module.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-auto rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wrench className="size-3.5" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
            {isAdmin ? "Acceso total" : "Acceso mecánico"}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {isAdmin
            ? "Los seis flujos: taller, catálogo, ventas, compras y administración."
            : "Taller, catálogo, citas y POS de mostrador."}
        </p>
      </div>
    </nav>
  );
}

export type { NavFlow };
