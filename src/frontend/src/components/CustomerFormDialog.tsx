import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import type { Customer, CustomerInput } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing customer to edit, or `null` to register a new one. */
  customer: Customer | null;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  document: string;
  address: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  document: "",
  address: "",
};

function toFormState(customer: Customer | null): FormState {
  if (!customer) return EMPTY_FORM;
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? "",
    document: customer.document ?? "",
    address: customer.address ?? "",
  };
}

/**
 * Create/edit dialog for a customer record. The draft lives in local state and
 * is seeded once when the dialog opens for an existing customer.
 */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: CustomerFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEditing = customer !== null;
  const isPending = createCustomer.isPending || updateCustomer.isPending;

  useEffect(() => {
    if (open) {
      setForm(toFormState(customer));
      setError(null);
    }
  }, [open, customer]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (name === "" || phone === "") {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }
    setError(null);

    const input: CustomerInput = {
      name,
      phone,
      email: form.email.trim() === "" ? undefined : form.email.trim(),
      document: form.document.trim() === "" ? undefined : form.document.trim(),
      address: form.address.trim() === "" ? undefined : form.address.trim(),
    };

    if (isEditing && customer) {
      updateCustomer.mutate(
        { id: customer.id, input },
        {
          onSuccess: () => {
            toast.success("Cliente actualizado");
            onOpenChange(false);
          },
          onError: () => setError("No se pudo guardar el cliente."),
        },
      );
      return;
    }

    createCustomer.mutate(input, {
      onSuccess: () => {
        toast.success("Cliente registrado");
        onOpenChange(false);
      },
      onError: () => setError("No se pudo guardar el cliente."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="customer.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos de contacto del cliente."
              : "Registra los datos de contacto para vincular motos y órdenes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Nombre completo</Label>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ej. Marco Antonio Ruiz"
              autoComplete="name"
              data-ocid="customer.name_input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="55 1234 5678"
                inputMode="tel"
                autoComplete="tel"
                className="data-rail"
                data-ocid="customer.phone_input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-document">Documento</Label>
              <Input
                id="customer-document"
                value={form.document}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    document: event.target.value,
                  }))
                }
                placeholder="INE / RFC"
                className="data-rail"
                data-ocid="customer.document_input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-address">Dirección fiscal</Label>
            <Input
              id="customer-address"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              placeholder="Calle 45 #12-30, Bogotá"
              autoComplete="street-address"
              data-ocid="customer.address_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-email">Correo</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="cliente@correo.com"
              autoComplete="email"
              data-ocid="customer.email_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="customer.form.error_state"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="customer.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="customer.submit_button"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEditing ? "Guardar cambios" : "Registrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
