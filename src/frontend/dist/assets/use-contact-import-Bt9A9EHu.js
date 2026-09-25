import { j as jsxRuntimeExports, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, ae as cn, T as TriangleAlert, aw as CircleCheck, $ as DialogFooter, B as Button, ah as LoaderCircle, k as useBackend, ak as useQueryClient, al as useMutation } from "./index-CzQEXdHP.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
const KIND_LABEL = {
  customer: "clientes",
  supplier: "proveedores"
};
const STATUS_LABEL = {
  valid: "Válida",
  invalid: "Con error"
};
const STATUS_TONE = {
  valid: "accepted",
  invalid: "rejected"
};
function ContactImportDialog({
  open,
  onOpenChange,
  kind,
  rows,
  result,
  isPending,
  hasError,
  onConfirm
}) {
  const validRows = rows.filter((row) => !row.error);
  const invalidRows = rows.filter((row) => row.error);
  const resultByKey = new Map(
    ((result == null ? void 0 : result.rows) ?? []).map((row) => [row.key, row])
  );
  const failedRows = ((result == null ? void 0 : result.rows) ?? []).filter(
    (row) => row.status === "invalid"
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": `contacts.import_dialog.${kind}`,
      className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: result ? "Resultado de la importación" : `Importar ${KIND_LABEL[kind]}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: result ? "Revisa el detalle por fila. Corrige las filas con error en tu archivo y vuelve a importar." : "Revisa las filas detectadas antes de confirmar. Las filas con error no se importan hasta corregirlas." })
        ] }),
        result ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": `contacts.import_summary.${kind}`,
              className: "flex flex-wrap items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-accepted", children: [
                  result.created.toString(),
                  " creados"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-sent", children: [
                  result.updated.toString(),
                  " actualizados"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: cn(
                      "badge-status",
                      result.failed > 0n ? "badge-rejected" : "badge-neutral"
                    ),
                    children: [
                      result.failed.toString(),
                      " con error"
                    ]
                  }
                )
              ]
            }
          ),
          failedRows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "mt-0.5 size-4 shrink-0",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              failedRows.length === 1 ? "Una fila no se pudo importar." : `${failedRows.length} filas no se pudieron importar.`,
              " ",
              "Corrige el motivo indicado y vuelve a intentarlo."
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CircleCheck,
              {
                className: "size-4 text-primary",
                "aria-hidden": "true"
              }
            ),
            "Todas las filas se procesaron correctamente."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fila" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Nombre" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Estado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Motivo" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, index) => {
              var _a;
              const outcome = resultByKey.get(row.key);
              const status = (outcome == null ? void 0 : outcome.status) ?? "valid";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  "data-ocid": `contacts.import_row.${kind}.${index + 1}`,
                  className: cn(
                    "border-b border-border/60 last:border-0",
                    status === "invalid" && "bg-destructive/[0.06]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-muted-foreground", children: row.rowNumber }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: row.name || "—" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      StatusBadge,
                      {
                        label: STATUS_LABEL[status],
                        tone: STATUS_TONE[status]
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: ((_a = outcome == null ? void 0 : outcome.error) == null ? void 0 : _a.trim()) || "—" })
                  ]
                },
                row.key
              );
            }) })
          ] }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-accepted", children: [
              validRows.length,
              " listas"
            ] }),
            invalidRows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-rejected", children: [
              invalidRows.length,
              " con error"
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fila" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Nombre" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Documento / Teléfono" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Acción" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Motivo" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, index) => {
              var _a;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  "data-ocid": `contacts.import_row.${kind}.${index + 1}`,
                  className: cn(
                    "border-b border-border/60 last:border-0",
                    row.error && "bg-destructive/[0.06]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-muted-foreground", children: row.rowNumber }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: row.name || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "Falta nombre" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-muted-foreground", children: row.document || row.phone || "—" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: row.error ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Con error", tone: "rejected" }) : row.matchedId !== null ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Actualizar", tone: "sent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Crear", tone: "accepted" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: ((_a = row.error) == null ? void 0 : _a.trim()) || "—" })
                  ]
                },
                row.key
              );
            }) })
          ] }) }),
          hasError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": `contacts.import_error.${kind}`,
              className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
              children: "No se pudo completar la importación. Intenta de nuevo."
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => onOpenChange(false),
              "data-ocid": `contacts.import_close_button.${kind}`,
              children: result ? "Cerrar" : "Cancelar"
            }
          ),
          result ? null : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              disabled: isPending || validRows.length === 0,
              onClick: onConfirm,
              "data-ocid": `contacts.import_confirm_button.${kind}`,
              className: "gap-2",
              children: [
                isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
                isPending ? "Importando…" : `Importar ${validRows.length} fila${validRows.length === 1 ? "" : "s"}`
              ]
            }
          )
        ] })
      ]
    }
  ) });
}
const CUSTOMER_CSV_HEADERS = [
  "nombre",
  "telefono",
  "documento",
  "direccion",
  "correo",
  "motos"
];
const SUPPLIER_CSV_HEADERS = [
  "nombre",
  "documento",
  "telefono",
  "correo",
  "direccion"
];
function normalizeKey(value) {
  return value.trim().toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
}
function matchKey(kind, row) {
  const name = normalizeKey(row.name);
  if (kind === "supplier") return `${normalizeKey(row.document)}|${name}`;
  return `${normalizeKey(row.phone)}|${name}`;
}
function isSupplierRecord(contact) {
  return "taxId" in contact;
}
function buildContactImportRows(kind, rawRows, existing) {
  const byKey = /* @__PURE__ */ new Map();
  for (const contact of existing) {
    const supplier = isSupplierRecord(contact);
    const row = {
      name: contact.name,
      phone: contact.phone,
      document: supplier ? contact.taxId ?? "" : contact.document ?? "",
      email: contact.email ?? "",
      address: contact.address ?? "",
      contactName: supplier ? contact.contactName ?? "" : ""
    };
    byKey.set(matchKey(kind, row), contact.id);
  }
  return rawRows.map((raw, index) => {
    const row = {
      rowNumber: index + 1,
      key: `contact-row-${index + 1}`,
      name: (raw.nombre ?? "").trim(),
      phone: (raw.telefono ?? "").trim(),
      document: (raw.documento ?? "").trim(),
      email: (raw.correo ?? "").trim(),
      address: (raw.direccion ?? "").trim(),
      contactName: (raw.contacto ?? "").trim(),
      motorcycles: (raw.motos ?? "").trim(),
      matchedId: null
    };
    if (row.name === "") {
      row.error = "Falta el nombre";
      return row;
    }
    if (kind === "customer" && row.phone === "") {
      row.error = "Falta el teléfono";
      return row;
    }
    if (kind === "supplier" && row.phone === "") {
      row.error = "Falta el teléfono";
      return row;
    }
    if (kind === "supplier" && row.document === "") {
      row.error = "Falta el documento o NIT";
      return row;
    }
    row.matchedId = byKey.get(matchKey(kind, row)) ?? null;
    return row;
  });
}
function toCustomerInput(row) {
  return {
    name: row.name,
    phone: row.phone,
    email: row.email === "" ? void 0 : row.email,
    document: row.document === "" ? void 0 : row.document,
    address: row.address === "" ? void 0 : row.address
  };
}
function toSupplierInput(row) {
  return {
    name: row.name,
    phone: row.phone,
    contactName: row.contactName === "" ? void 0 : row.contactName,
    email: row.email === "" ? void 0 : row.email,
    taxId: row.document === "" ? void 0 : row.document,
    address: row.address === "" ? void 0 : row.address
  };
}
function useContactImport(kind) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows) => {
      if (!actor) throw new Error("Backend no disponible");
      const importable = rows.filter((row) => !row.error);
      const updates = importable.filter((row) => row.matchedId !== null);
      const creations = importable.filter((row) => row.matchedId === null);
      let created = 0n;
      let updated = 0n;
      let failed = 0n;
      const outcomes = /* @__PURE__ */ new Map();
      if (kind === "customer") {
        if (creations.length > 0) {
          const result = await actor.bulkCreateCustomers(
            creations.map(toCustomerInput)
          );
          created += result.created;
          failed += result.failed;
          creations.forEach((row, index) => {
            const entry = result.rows.find(
              (candidate) => candidate.index === BigInt(index)
            );
            outcomes.set(row.key, {
              status: (entry == null ? void 0 : entry.ok) === false ? "invalid" : "valid",
              error: (entry == null ? void 0 : entry.error) ?? void 0
            });
          });
        }
        if (updates.length > 0) {
          const result = await actor.bulkUpdateCustomers(
            updates.map(
              (row) => [row.matchedId, toCustomerInput(row)]
            )
          );
          updated += result.updated;
          failed += result.failed;
          updates.forEach((row, index) => {
            const entry = result.rows.find(
              (candidate) => candidate.index === BigInt(index)
            );
            outcomes.set(row.key, {
              status: (entry == null ? void 0 : entry.ok) === false ? "invalid" : "valid",
              error: (entry == null ? void 0 : entry.error) ?? void 0
            });
          });
        }
      } else {
        for (const row of creations) {
          try {
            await actor.createSupplier(toSupplierInput(row));
            created += 1n;
            outcomes.set(row.key, { status: "valid" });
          } catch (error) {
            failed += 1n;
            outcomes.set(row.key, {
              status: "invalid",
              error: error instanceof Error ? error.message : "No se pudo crear el proveedor"
            });
          }
        }
        for (const row of updates) {
          try {
            await actor.updateSupplier(
              row.matchedId,
              toSupplierInput(row)
            );
            updated += 1n;
            outcomes.set(row.key, { status: "valid" });
          } catch (error) {
            failed += 1n;
            outcomes.set(row.key, {
              status: "invalid",
              error: error instanceof Error ? error.message : "No se pudo actualizar el proveedor"
            });
          }
        }
      }
      for (const row of rows) {
        if (row.error) {
          failed += 1n;
          outcomes.set(row.key, { status: "invalid", error: row.error });
        }
      }
      return {
        created,
        updated,
        failed,
        rows: rows.map((row) => {
          var _a, _b;
          return {
            key: row.key,
            status: ((_a = outcomes.get(row.key)) == null ? void 0 : _a.status) ?? "valid",
            error: (_b = outcomes.get(row.key)) == null ? void 0 : _b.error
          };
        })
      };
    },
    onSuccess: () => {
      if (kind === "customer") {
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
        void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
        void queryClient.invalidateQueries({ queryKey: ["customer-detail"] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        void queryClient.invalidateQueries({ queryKey: ["payables"] });
      }
    }
  });
}
export {
  ContactImportDialog as C,
  SUPPLIER_CSV_HEADERS as S,
  CUSTOMER_CSV_HEADERS as a,
  buildContactImportRows as b,
  useContactImport as u
};
