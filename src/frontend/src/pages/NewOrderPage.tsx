import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  errorMessage,
  useCreateOrder,
  useCustomers,
  useMotorcycles,
} from "@/hooks/use-orders";
import { formatNumber } from "@/lib/format";
import type { Customer, Id } from "@/lib/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

/** Delays a fast-changing value so directory searches hit the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

export function NewOrderPage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<Id | null>(null);
  const [motorcycleId, setMotorcycleId] = useState<Id | null>(null);
  const [mileage, setMileage] = useState("");
  const [problem, setProblem] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);

  const customersQuery = useCustomers(debouncedCustomerSearch);
  const motorcyclesQuery = useMotorcycles(customerId);
  const createOrder = useCreateOrder();

  const customerTerm = debouncedCustomerSearch.trim();
  const customerResults = customersQuery.data ?? [];
  const customers = customerTerm.length > 0 ? customerResults : [];
  const selectedCustomer =
    customerResults.find((item) => item.id === customerId) ?? null;
  const directoryEmpty =
    customerTerm.length === 0 && customerResults.length === 0;

  const motorcycles = motorcyclesQuery.data ?? [];

  const mileageValue = mileage.trim() === "" ? null : Number(mileage);
  const mileageValid =
    mileageValue !== null &&
    Number.isFinite(mileageValue) &&
    mileageValue >= 0 &&
    Number.isInteger(mileageValue);
  const problemValid = problem.trim().length > 0;
  const canSubmit =
    customerId !== null &&
    motorcycleId !== null &&
    mileageValid &&
    problemValid &&
    !createOrder.isPending;

  function handleSelectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setMotorcycleId(null);
    setFormError(null);
  }

  function handleChangeCustomer() {
    setCustomerId(null);
    setMotorcycleId(null);
    setCustomerSearch("");
    setFormError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (customerId === null) {
      setFormError("Selecciona el cliente de la moto.");
      return;
    }
    if (motorcycleId === null) {
      setFormError("Selecciona la motocicleta que ingresa al taller.");
      return;
    }
    if (!mileageValid || mileageValue === null) {
      setFormError("Captura un kilometraje de ingreso válido (número entero).");
      return;
    }
    if (!problemValid) {
      setFormError("Describe la falla o el servicio solicitado.");
      return;
    }

    createOrder.mutate(
      {
        customerId,
        motorcycleId,
        intakeMileage: BigInt(mileageValue),
        technicianIds: [],
        problem: problem.trim(),
      },
      {
        onSuccess: (view) => {
          void navigate({
            to: "/ordenes/$id",
            params: { id: view.order.id.toString() },
          });
        },
        onError: (error) => {
          setFormError(errorMessage(error));
        },
      },
    );
  }

  return (
    <div
      data-ocid="new_order.page"
      className="mx-auto w-full max-w-3xl animate-fade-in space-y-5"
    >
      <header className="space-y-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          onClick={() => void navigate({ to: "/ordenes" })}
          data-ocid="new_order.back_button"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a órdenes
        </Button>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Nueva orden de taller
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Registra el ingreso de una moto: cliente, motocicleta, kilometraje y
          falla reportada.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <Card className="gap-0 rounded-lg py-0 shadow-none">
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
              <UserRound className="size-4 text-primary" aria-hidden="true" />
              Datos de ingreso
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 px-5 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order-customer-search">Cliente</Label>
                {selectedCustomer ? (
                  <div
                    data-ocid="new_order.customer_selected"
                    className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {selectedCustomer.name}
                      </p>
                      <p className="data-rail truncate text-xs text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleChangeCustomer}
                      data-ocid="new_order.change_customer_button"
                      className="shrink-0 gap-1.5 text-muted-foreground"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="order-customer-search"
                        type="search"
                        value={customerSearch}
                        onChange={(event) => {
                          setCustomerSearch(event.target.value);
                          setFormError(null);
                        }}
                        placeholder="Buscar por nombre, teléfono o placa…"
                        aria-label="Buscar cliente por nombre, teléfono o placa"
                        data-ocid="new_order.customer_search_input"
                        className="pl-9"
                      />
                    </div>

                    {customerTerm.length === 0 ? (
                      directoryEmpty ? (
                        <p
                          data-ocid="new_order.customer_directory_empty_state"
                          className="text-xs text-muted-foreground"
                        >
                          No hay clientes registrados. Crea un cliente antes de
                          levantar una orden.
                        </p>
                      ) : (
                        <p
                          data-ocid="new_order.customer_search.prompt_state"
                          className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground"
                        >
                          Escribe el nombre, el teléfono o la placa para ver
                          coincidencias.
                        </p>
                      )
                    ) : customersQuery.isLoading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : customersQuery.isError ? (
                      <p
                        data-ocid="new_order.customer_search.error_state"
                        className="text-xs text-destructive"
                      >
                        No se pudo cargar el directorio de clientes. Inténtalo
                        de nuevo.
                      </p>
                    ) : customers.length === 0 ? (
                      <p
                        data-ocid="new_order.customer_search.empty_state"
                        className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
                      >
                        {`Sin clientes que coincidan con “${customerTerm}”.`}
                      </p>
                    ) : (
                      <ul
                        data-ocid="new_order.customer_search.list"
                        className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
                      >
                        {customers.map((customer, index) => (
                          <li key={customer.id.toString()}>
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              data-ocid={`new_order.customer_search.item.${index + 1}`}
                              className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {customer.name}
                                </span>
                                <span className="data-rail mt-0.5 block truncate text-xs text-muted-foreground">
                                  {customer.phone}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-motorcycle">Motocicleta</Label>
                {customerId === null ? (
                  <p className="flex h-9 items-center rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground">
                    Selecciona primero un cliente
                  </p>
                ) : motorcyclesQuery.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : motorcycles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Este cliente no tiene motos registradas.
                  </p>
                ) : (
                  <Select
                    value={motorcycleId?.toString() ?? ""}
                    onValueChange={(value) => {
                      setMotorcycleId(BigInt(value));
                      setFormError(null);
                    }}
                  >
                    <SelectTrigger
                      id="order-motorcycle"
                      data-ocid="new_order.motorcycle_select"
                      className="w-full"
                    >
                      <SelectValue placeholder="Selecciona la moto" />
                    </SelectTrigger>
                    <SelectContent>
                      {motorcycles.map((moto) => (
                        <SelectItem
                          key={moto.id.toString()}
                          value={moto.id.toString()}
                        >
                          {`${moto.brand} ${moto.model} · ${moto.plate}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-mileage">Kilometraje de ingreso</Label>
              <div className="relative">
                <Bike
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="order-mileage"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={mileage}
                  onChange={(event) => {
                    setMileage(event.target.value);
                    setFormError(null);
                  }}
                  placeholder="Ej. 24500"
                  data-ocid="new_order.mileage_input"
                  className="data-rail pl-9"
                />
              </div>
              {mileageValid ? (
                <p className="data-rail text-xs text-muted-foreground">
                  {formatNumber(mileageValue)} km
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-problem">Falla o servicio solicitado</Label>
              <Textarea
                id="order-problem"
                value={problem}
                onChange={(event) => {
                  setProblem(event.target.value);
                  setFormError(null);
                }}
                rows={4}
                placeholder="Describe el síntoma reportado por el cliente, ruidos, fugas o el servicio a realizar…"
                data-ocid="new_order.problem_textarea"
              />
            </div>

            {formError ? (
              <div
                data-ocid="new_order.error_state"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <p className="text-xs text-destructive">{formError}</p>
              </div>
            ) : null}
          </CardContent>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate({ to: "/ordenes" })}
              data-ocid="new_order.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="new_order.submit_button"
              className="gap-2"
            >
              <Save className="size-4" aria-hidden="true" />
              {createOrder.isPending ? "Creando orden…" : "Crear orden"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
