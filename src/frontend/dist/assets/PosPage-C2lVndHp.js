import { Y as createLucideIcon, t as reactExports, aH as PaymentMethod, aN as PaymentCondition, y as formatMoney, am as formatTaxRate, j as jsxRuntimeExports, B as Button, aO as ShoppingCart, az as CircleCheck, R as Receipt, T as TriangleAlert, X, K as Label, w as Input, v as Search, o as formatNumber, Z as cn, J as UserRound, A as WhatsAppContext, D as WhatsAppContactKind, a as CalendarClock, N as NotificationSource, av as ue } from "./index-EqGEeyjs.js";
import { S as ScanLine, C as Camera, B as BarcodeScanner } from "./BarcodeScanner-DxFj0yM1.js";
import { C as CustomerFormDialog } from "./CustomerFormDialog-Kkv26ksN.js";
import { D as DocumentPreview } from "./DocumentPreview-C4gHQdTZ.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-DUFQVTg_.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { b as useBusinessSettings, u as useCompanyProfile, a as useIvaSettings } from "./use-company-B0ILLjch.js";
import { u as useCustomers } from "./use-customers-97P-fDYn.js";
import { u as useDailyHopeMessage } from "./use-hope-35eM4bcJ.js";
import { i as useParts } from "./use-orders-BVudDwaF.js";
import { u as useCreatePosSale, a as useFindPartByCode } from "./use-pos-CvVTrpKB.js";
import { u as useServiceTermsSettings, S as SERVICE_TERMS_DEFAULT_TEXT } from "./use-service-terms-DA5dJHUn.js";
import { c as companyHeaderFromProfile, b as companyContactLine, a as companyFiscalLines } from "./company-header-Ds_ApIKF.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, l as loadPdfLibs, a as drawHopeMessage } from "./pdf-BjjrMDP3.js";
import { B as Barcode } from "./barcode-BnvWfLCf.js";
import { U as UserRoundPlus } from "./user-round-plus-QlSApeWF.js";
import { M as Mail } from "./mail-B11strfl.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import "./check-LdjEv5O-.js";
import "./printer-CZZ39YEy.js";
import "./download-C8tLpeh6.js";
import "./textarea-B0CUuiY-.js";
import "./use-whatsapp-DIGqY6EY.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
import "./warranty-BU5LnZHy.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [["path", { d: "M5 12h14", key: "1ays0h" }]];
const Minus = createLucideIcon("minus", __iconNode);
const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto"
};
const PAYMENT_METHOD_OPTIONS = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer
];
const CONDITION_LABELS = {
  [PaymentCondition.cash]: "Contado",
  [PaymentCondition.credit]: "Crédito"
};
const MAX_INSTALLMENTS = 36;
function parseAmount(value) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
function parseQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}
function addMonths(isoDate, months) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const clamped = Math.min(day, lastDay);
  const mm = `${target.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${clamped}`.padStart(2, "0");
  return `${target.getUTCFullYear()}-${mm}-${dd}`;
}
function formatIsoDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "—";
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function CartRow({
  line,
  index,
  onQuantity,
  onDiscount,
  onRemove
}) {
  const lineAmount = line.unitPrice * line.quantity - line.discount;
  const overStock = line.quantity > line.stock;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      "data-ocid": `pos.cart_item.${index + 1}`,
      className: cn(
        "space-y-2 border-b border-border px-3 py-3 last:border-b-0",
        overStock && "bg-destructive/5"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: line.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-[11px] text-muted-foreground", children: line.sku })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "aria-label": `Quitar ${line.name} del carrito`,
              "data-ocid": `pos.remove_button.${index + 1}`,
              onClick: () => onRemove(line.partId),
              className: "row-action shrink-0",
              "data-variant": "destructive",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5", "aria-hidden": "true" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-2 gap-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center rounded-sm border border-input", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "aria-label": `Disminuir cantidad de ${line.name}`,
                "data-ocid": `pos.quantity_decrease.${index + 1}`,
                onClick: () => onQuantity(line.partId, line.quantity - 1),
                className: "flex size-7 items-center justify-center text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "size-3.5", "aria-hidden": "true" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                value: line.quantity,
                "aria-label": `Cantidad de ${line.name}`,
                "data-ocid": `pos.quantity_input.${index + 1}`,
                onChange: (event) => onQuantity(line.partId, parseQuantity(event.target.value)),
                className: "data-rail h-7 w-12 border-x border-input bg-transparent text-center text-sm outline-none"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "aria-label": `Aumentar cantidad de ${line.name}`,
                "data-ocid": `pos.quantity_increase.${index + 1}`,
                onClick: () => onQuantity(line.partId, line.quantity + 1),
                className: "flex size-7 items-center justify-center text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5", "aria-hidden": "true" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: `pos-discount-${index}`,
                className: "text-[11px] text-muted-foreground",
                children: "Desc."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: `pos-discount-${index}`,
                type: "number",
                min: 0,
                step: "0.01",
                value: (line.discount / 100).toFixed(2),
                "aria-label": `Descuento de ${line.name}`,
                "data-ocid": `pos.discount_input.${index + 1}`,
                onChange: (event) => onDiscount(line.partId, parseAmount(event.target.value)),
                className: "data-rail h-7 w-16 text-right text-sm sm:w-20"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail ml-auto shrink-0 text-sm font-semibold", children: formatMoney(BigInt(lineAmount)) })
        ] }),
        overStock ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": `pos.line_stock_warning.${index + 1}`,
            className: "flex items-center gap-1 text-[11px] text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3", "aria-hidden": "true" }),
              "Solo hay ",
              formatNumber(line.stock),
              " en existencia."
            ]
          }
        ) : null
      ]
    }
  );
}
async function buildReceiptPdf(format, number, company, meta, lines, totals, footer, hope) {
  var _a, _b, _c;
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({
    unit: "mm",
    format: narrow ? [80, 297] : "a4"
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 10 : 15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone].filter((value) => !!value && value.trim() !== "").join(narrow ? " · " : "  ·  ");
  let cursor = 18.5;
  if (contact !== "") {
    const contactLines = doc.splitTextToSize(contact, right - margin);
    doc.text(contactLines, margin, cursor);
    cursor += contactLines.length * (narrow ? 3 : 4);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 8.5 : 11);
  doc.setTextColor(30, 41, 59);
  doc.text("COMPROBANTE", right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 9);
  doc.setTextColor(100, 116, 139);
  doc.text(number, right, 18.5, { align: "right" });
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 1, right, cursor + 1);
  cursor += 5;
  if (narrow) {
    for (const entry of meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(entry.label, margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const value = doc.splitTextToSize(entry.value, right - margin);
      doc.text(value, margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 40, textColor: [100, 116, 139] },
        1: { fontStyle: "bold", textColor: [30, 41, 59] }
      },
      margin: { left: margin, right: margin }
    });
    cursor = (((_a = doc.lastAutoTable) == null ? void 0 : _a.finalY) ?? cursor) + 4;
  }
  autoTable(doc, {
    startY: cursor,
    head: [["Concepto", "Cant.", "P. unit.", "Importe"]],
    body: lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(BigInt(Math.round(line.unitPrice * 100))),
      formatMoney(BigInt(Math.round(line.amount * 100)))
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak"
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" }
    },
    margin: { left: margin, right: margin }
  });
  const afterLines = ((_b = doc.lastAutoTable) == null ? void 0 : _b.finalY) ?? cursor;
  autoTable(doc, {
    startY: afterLines + 4,
    body: totals.map((entry) => [entry.label, entry.value]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 7 : 9,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] }
    },
    margin: { left: narrow ? margin : right - 90, right: margin }
  });
  const afterTotals = ((_c = doc.lastAutoTable) == null ? void 0 : _c.finalY) ?? afterLines + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow
  });
  return doc;
}
function PosPage() {
  var _a, _b, _c, _d;
  const [search, setSearch] = reactExports.useState("");
  const [barcode, setBarcode] = reactExports.useState("");
  const [cart, setCart] = reactExports.useState([]);
  const [customerId, setCustomerId] = reactExports.useState("none");
  const [customerSearch, setCustomerSearch] = reactExports.useState("");
  const [customerDialogOpen, setCustomerDialogOpen] = reactExports.useState(false);
  const [paymentMethod, setPaymentMethod] = reactExports.useState(
    PaymentMethod.cash
  );
  const [condition, setCondition] = reactExports.useState(
    PaymentCondition.cash
  );
  const [installmentCount, setInstallmentCount] = reactExports.useState("3");
  const [firstDueDate, setFirstDueDate] = reactExports.useState("");
  const [amountReceived, setAmountReceived] = reactExports.useState("");
  const [completedSale, setCompletedSale] = reactExports.useState(null);
  const [notifyOpen, setNotifyOpen] = reactExports.useState(false);
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const [scanPending, setScanPending] = reactExports.useState(false);
  const [scannerOpen, setScannerOpen] = reactExports.useState(false);
  const barcodeRef = reactExports.useRef(null);
  const debouncedPartSearch = useDebouncedValue(search, 250);
  const partsQuery = useParts(debouncedPartSearch);
  const isPartSearchPending = search.trim() !== "" && (search.trim() !== debouncedPartSearch.trim() || partsQuery.isFetching);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);
  const customersQuery = useCustomers(debouncedCustomerSearch);
  const isCustomerSearchPending = customerSearch.trim() !== "" && (customerSearch.trim() !== debouncedCustomerSearch.trim() || customersQuery.isFetching);
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const serviceTermsQuery = useServiceTermsSettings();
  const { isIvaResponsible, taxRate: effectiveTaxRate } = useIvaSettings();
  const createSale = useCreatePosSale();
  const findPartByCode = useFindPartByCode();
  const parts = ((_a = partsQuery.data) == null ? void 0 : _a.items) ?? [];
  const customers = customersQuery.data ?? [];
  const business = businessQuery.data ?? null;
  const companyHeader = companyHeaderFromProfile(companyQuery.data);
  const receiptCompanyName = (companyHeader == null ? void 0 : companyHeader.legalName) ?? (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES";
  const receiptCompanyLogoUrl = companyHeader == null ? void 0 : companyHeader.logoUrl;
  const receiptCompanyContact = companyContactLine(companyHeader);
  const receiptCompanyFiscal = companyFiscalLines(companyHeader);
  const selectedCustomer = customerId === "none" ? null : customers.find((customer) => customer.id.toString() === customerId) ?? null;
  const selectedCustomerEmail = ((_b = selectedCustomer == null ? void 0 : selectedCustomer.email) == null ? void 0 : _b.trim()) ? selectedCustomer.email : null;
  const knownCustomerIdsRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (customerDialogOpen) {
      knownCustomerIdsRef.current = new Set(
        customers.map((customer) => customer.id.toString())
      );
      return;
    }
    const known = knownCustomerIdsRef.current;
    if (known === null) return;
    const created = customers.find(
      (customer) => !known.has(customer.id.toString())
    );
    knownCustomerIdsRef.current = null;
    if (created) {
      setCustomerId(created.id.toString());
      setCustomerSearch("");
    }
  }, [customerDialogOpen, customers]);
  const totals = reactExports.useMemo(() => {
    const subtotal = cart.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0
    );
    const discount = cart.reduce((sum, line) => sum + line.discount, 0);
    const taxable = Math.max(subtotal - discount, 0);
    const taxRate = Number(effectiveTaxRate);
    const tax = Math.round(taxable * taxRate / 100);
    return { subtotal, discount, tax, total: taxable + tax };
  }, [cart, effectiveTaxRate]);
  const receivedCents = parseAmount(amountReceived);
  const change = receivedCents - totals.total;
  const isCredit = condition === PaymentCondition.credit;
  const isCash = paymentMethod === PaymentMethod.cash && !isCredit;
  const insufficientCash = isCash && receivedCents < totals.total;
  const parsedCount = Number.parseInt(installmentCount, 10);
  const validCount = Number.isFinite(parsedCount) && parsedCount >= 1 && parsedCount <= MAX_INSTALLMENTS;
  const creditReady = validCount && firstDueDate !== "";
  const creditCustomerMissing = isCredit && customerId === "none";
  const previewRows = reactExports.useMemo(() => {
    if (!isCredit || !creditReady) return [];
    const total = BigInt(totals.total);
    const base = total / BigInt(parsedCount);
    const remainder = total - base * BigInt(parsedCount);
    return Array.from({ length: parsedCount }, (_, index) => ({
      number: index + 1,
      amount: index === parsedCount - 1 ? base + remainder : base,
      dueDate: addMonths(firstDueDate, index)
    }));
  }, [isCredit, creditReady, totals.total, parsedCount, firstDueDate]);
  const stockIssues = cart.filter((line) => line.quantity > line.stock);
  const hasStockIssue = stockIssues.length > 0;
  const canCharge = cart.length > 0 && !hasStockIssue && !insufficientCash && !creditCustomerMissing && (!isCredit || creditReady) && !createSale.isPending;
  const addPart = (part) => {
    setCart((current) => {
      const existing = current.find((line) => line.partId === part.id);
      if (existing) {
        return current.map(
          (line) => line.partId === part.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...current,
        {
          partId: part.id,
          sku: part.sku,
          name: part.name,
          unitPrice: Number(part.salePrice),
          quantity: 1,
          discount: 0,
          stock: Number(part.totalStock)
        }
      ];
    });
  };
  const handleBarcode = async (event) => {
    var _a2;
    event.preventDefault();
    const code = barcode.trim();
    if (code === "" || scanPending) return;
    setScanPending(true);
    try {
      const match = await findPartByCode.mutateAsync(code);
      if (!match) {
        ue.error(`Producto no encontrado para el código ${code}`);
        return;
      }
      addPart(match);
      setBarcode("");
      (_a2 = barcodeRef.current) == null ? void 0 : _a2.focus();
    } catch {
      ue.error("No se pudo consultar el catálogo. Intenta de nuevo.");
    } finally {
      setScanPending(false);
    }
  };
  const handleScanDetected = (part) => {
    addPart(part);
    ue.success(`${part.name} agregado al carrito`);
  };
  const handleScanNotFound = (code) => {
    ue.error(`Producto no encontrado para el código ${code}`);
  };
  const updateQuantity = (partId, quantity) => {
    setCart(
      (current) => current.map(
        (line) => line.partId === partId ? { ...line, quantity: Math.max(1, quantity) } : line
      )
    );
  };
  const updateDiscount = (partId, discount) => {
    setCart(
      (current) => current.map(
        (line) => line.partId === partId ? { ...line, discount } : line
      )
    );
  };
  const removeLine = (partId) => {
    setCart((current) => current.filter((line) => line.partId !== partId));
  };
  const resetSale = () => {
    setCart([]);
    setCustomerId("none");
    setCustomerSearch("");
    setPaymentMethod(PaymentMethod.cash);
    setCondition(PaymentCondition.cash);
    setInstallmentCount("3");
    setFirstDueDate("");
    setAmountReceived("");
    setCompletedSale(null);
  };
  const handleCharge = () => {
    if (!canCharge) return;
    const lines = cart.map((line) => ({
      partId: line.partId,
      quantity: BigInt(line.quantity),
      discount: BigInt(line.discount)
    }));
    const selectedCustomer2 = customerId === "none" ? null : BigInt(customerId);
    const creditPlan = isCredit && creditReady ? {
      installmentCount: BigInt(parsedCount),
      firstDueDate: BigInt((/* @__PURE__ */ new Date(`${firstDueDate}T00:00:00Z`)).getTime()) * 1000000n
    } : void 0;
    createSale.mutate(
      {
        lines,
        paymentMethod,
        paymentCondition: condition,
        amountReceived: BigInt(isCash ? receivedCents : totals.total),
        customerId: selectedCustomer2 ?? void 0,
        creditPlan
      },
      {
        onSuccess: (sale) => {
          setCompletedSale(sale);
          setCart([]);
          setAmountReceived("");
          ue.success(`Venta ${sale.saleNumber} registrada`);
        },
        onError: (error) => {
          const message = String(error);
          if (message.includes("insufficientStock")) {
            ue.error(
              "Stock insuficiente en uno o más productos. Ajusta el carrito."
            );
          } else if (message.includes("emptyCart")) {
            ue.error("El carrito está vacío.");
          } else if (message.includes("insufficientPayment")) {
            ue.error("El monto recibido no cubre el total de la venta.");
          } else if (message.includes("customerRequired") || message.includes("creditRequiresCustomer")) {
            ue.error(
              "La venta a crédito exige un cliente registrado. Selecciona uno."
            );
          } else {
            ue.error("No se pudo registrar la venta. Intenta de nuevo.");
          }
        }
      }
    );
  };
  const receiptLines = ((completedSale == null ? void 0 : completedSale.lines) ?? []).map(
    (line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      amount: Number(line.amount)
    })
  );
  const receiptMeta = completedSale ? [
    {
      label: "Cliente",
      value: completedSale.customerName ?? "Venta de mostrador"
    },
    {
      label: "Método",
      value: PAYMENT_METHOD_LABELS[completedSale.paymentMethod] ?? completedSale.paymentMethod
    },
    {
      label: "Condición",
      value: CONDITION_LABELS[completedSale.paymentCondition]
    },
    {
      label: "Recibido",
      value: formatMoney(completedSale.amountReceived)
    },
    { label: "Cambio", value: formatMoney(completedSale.change) }
  ] : [];
  const receiptTotals = completedSale ? [
    { label: "Subtotal", value: formatMoney(completedSale.subtotal) },
    ...isIvaResponsible ? [
      {
        label: `Impuesto (${formatTaxRate(completedSale.taxRate)})`,
        value: formatMoney(completedSale.tax)
      }
    ] : [],
    {
      label: "Descuento",
      value: `-${formatMoney(completedSale.discount)}`
    },
    {
      label: "Total",
      value: formatMoney(completedSale.total),
      emphasis: true
    }
  ] : [];
  const serviceTermsText = ((_d = (_c = serviceTermsQuery.data) == null ? void 0 : _c.text) == null ? void 0 : _d.trim()) ?? "";
  const receiptFooter = serviceTermsText !== "" ? serviceTermsText : SERVICE_TERMS_DEFAULT_TEXT;
  async function handleDownloadReceipt(nextFormat) {
    if (!completedSale) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildReceiptPdf(
        nextFormat,
        completedSale.saleNumber,
        pdfCompanyFromProfile(companyQuery.data),
        receiptMeta,
        receiptLines,
        receiptTotals,
        receiptFooter,
        hopeMessage
      );
      await downloadFile({
        filename: `Comprobante-${completedSale.saleNumber}.pdf`,
        mimeType: "application/pdf",
        data: doc.output("blob")
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo."
      );
    } finally {
      setIsDownloading(false);
    }
  }
  if (completedSale) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "pos.page",
        className: "mx-auto w-full min-w-0 max-w-3xl animate-fade-in space-y-5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PageHeader,
            {
              eyebrow: "Ventas",
              title: "Venta registrada",
              description: `La venta ${completedSale.saleNumber} se cobró correctamente y el stock ya fue descontado.`,
              actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: resetSale,
                  "data-ocid": "pos.new_sale_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "size-4", "aria-hidden": "true" }),
                    "Nueva venta"
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "pos.success_state",
              className: "flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-5 text-success", "aria-hidden": "true" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Cobro completado" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    "Total cobrado ",
                    formatMoney(completedSale.total),
                    " · Cambio",
                    " ",
                    formatMoney(completedSale.change)
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Receipt,
                {
                  className: "size-4 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Comprobante de venta" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DocumentPreview,
              {
                title: "Comprobante",
                number: completedSale.saleNumber,
                companyName: receiptCompanyName,
                companyLogoUrl: receiptCompanyLogoUrl,
                companyContact: receiptCompanyContact,
                companyFiscal: receiptCompanyFiscal,
                meta: receiptMeta,
                lines: receiptLines,
                totals: receiptTotals,
                footer: receiptFooter,
                hopeMessage,
                format: "a4",
                ocid: "pos.receipt_a4",
                onDownloadPdf: handleDownloadReceipt,
                isDownloading
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DocumentPreview,
              {
                title: "Comprobante",
                number: completedSale.saleNumber,
                companyName: receiptCompanyName,
                companyLogoUrl: receiptCompanyLogoUrl,
                companyContact: receiptCompanyContact,
                companyFiscal: receiptCompanyFiscal,
                meta: receiptMeta,
                lines: receiptLines,
                totals: receiptTotals,
                footer: receiptFooter,
                hopeMessage,
                format: "receipt80",
                ocid: "pos.receipt_80mm",
                onDownloadPdf: handleDownloadReceipt,
                isDownloading
              }
            ),
            downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "pos.download_error",
                className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 text-xs text-destructive", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TriangleAlert,
                      {
                        className: "mt-0.5 size-3.5 shrink-0",
                        "aria-hidden": "true"
                      }
                    ),
                    downloadError
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => void handleDownloadReceipt("a4"),
                      "data-ocid": "pos.download_retry_button",
                      children: "Reintentar"
                    }
                  )
                ]
              }
            ) : null
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "pos.page", className: "animate-fade-in space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        eyebrow: "Ventas",
        title: "POS de mostrador",
        description: "Venta directa con búsqueda por texto y lector de código de barras. Descuenta stock y genera la factura al cobrar, de contado o a crédito con cuotas.",
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: resetSale,
            disabled: cart.length === 0,
            "data-ocid": "pos.clear_button",
            className: "gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" }),
              "Vaciar carrito"
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          "data-ocid": "pos.product_panel",
          className: "counter-panel flex min-w-0 flex-col lg:min-h-[520px]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-b border-border p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleBarcode, className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pos-barcode", className: "text-xs", children: "Código de barras" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1 basis-48", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ScanLine,
                      {
                        className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "pos-barcode",
                        ref: barcodeRef,
                        value: barcode,
                        onChange: (event) => setBarcode(event.target.value),
                        placeholder: "Escanea o escribe el SKU y presiona Enter",
                        autoComplete: "off",
                        "aria-label": "Código de barras",
                        "data-ocid": "pos.barcode_input",
                        className: "counter-scan pl-9"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: scannerOpen ? "default" : "outline",
                      onClick: () => setScannerOpen((open) => !open),
                      "aria-expanded": scannerOpen,
                      "data-ocid": "pos.scan_button",
                      className: "shrink-0 gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-4", "aria-hidden": "true" }),
                        scannerOpen ? "Cerrar escáner" : "Escanear"
                      ]
                    }
                  )
                ] })
              ] }),
              scannerOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                BarcodeScanner,
                {
                  ocid: "pos.scanner",
                  title: "Escanear código de barras",
                  hint: "Apunta la cámara al código del producto o ingrésalo manualmente. Se agrega al carrito.",
                  onDetected: handleScanDetected,
                  onNotFound: handleScanNotFound,
                  className: "rounded-md border border-border bg-muted/20 p-3"
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pos-search", className: "text-xs", children: "Buscar producto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Search,
                    {
                      className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "pos-search",
                      value: search,
                      onChange: (event) => setSearch(event.target.value),
                      placeholder: "Nombre, marca o SKU",
                      "aria-label": "Buscar producto",
                      "data-ocid": "pos.search_input",
                      className: "pl-9"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim flex-1 overflow-y-auto", children: search.trim() === "" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "pos.search_prompt_state",
                className: "flex flex-col items-center gap-2 px-6 py-16 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Search,
                    {
                      className: "size-6 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Busca un producto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: "Escribe el nombre, la marca o el SKU para ver coincidencias, o escanea el código de barras para agregarlo al carrito." })
                ]
              }
            ) : isPartSearchPending ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "pos.loading_state", className: "space-y-2 p-4", children: Array.from({ length: 6 }, (_, i) => `pos-skeleton-${i}`).map(
              (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, id)
            ) }) : partsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "pos.error_state",
                className: "flex flex-col items-center gap-2 px-6 py-16 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "size-6 text-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudo cargar el catálogo" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => void partsQuery.refetch({ cancelRefetch: true }),
                      "data-ocid": "pos.retry_button",
                      children: "Reintentar"
                    }
                  )
                ]
              }
            ) : parts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "pos.empty_state",
                className: "flex flex-col items-center gap-2 px-6 py-16 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Barcode,
                    {
                      className: "size-6 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin resultados" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: `Ningún producto coincide con “${debouncedPartSearch.trim()}”. Ajusta el término o regístralo en el catálogo.` })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "ul",
              {
                "data-ocid": "pos.product_list",
                className: "divide-y divide-border",
                children: parts.map((part, index) => {
                  const outOfStock = Number(part.totalStock) <= 0;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      disabled: outOfStock,
                      onClick: () => addPart(part),
                      "data-ocid": `pos.product_item.${index + 1}`,
                      className: "flex w-full items-center gap-3 px-4 py-3 text-left transition-smooth hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: part.name }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-[11px] text-muted-foreground", children: [
                            part.sku,
                            " · ",
                            part.brand
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 text-right", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-sm font-semibold", children: formatMoney(part.salePrice) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "p",
                            {
                              className: cn(
                                "data-rail text-[11px]",
                                outOfStock ? "text-destructive" : "text-muted-foreground"
                              ),
                              children: outOfStock ? "Sin existencia" : `${formatNumber(part.totalStock)} disp.`
                            }
                          )
                        ] })
                      ]
                    }
                  ) }, part.id.toString());
                })
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          "data-ocid": "pos.cart_panel",
          className: "counter-panel flex min-w-0 flex-col lg:min-h-[520px]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between gap-2 border-b border-border px-4 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ShoppingCart,
                  {
                    className: "size-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Carrito" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs text-muted-foreground", children: [
                formatNumber(cart.length),
                " art."
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim flex-1 overflow-y-auto", children: cart.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "pos.cart_empty_state",
                className: "flex flex-col items-center gap-2 px-6 py-16 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ShoppingCart,
                    {
                      className: "size-6 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Carrito vacío" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: "Escanea un código de barras o selecciona un producto para comenzar la venta." })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "pos.cart_list", children: cart.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              CartRow,
              {
                line,
                index,
                onQuantity: updateQuantity,
                onDiscount: updateDiscount,
                onRemove: removeLine
              },
              line.partId.toString()
            )) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-t border-border p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Label,
                  {
                    htmlFor: "pos-customer",
                    className: "flex items-center gap-1.5 text-xs",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-3.5", "aria-hidden": "true" }),
                      "Cliente ",
                      isCredit ? "(obligatorio a crédito)" : "(opcional)"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1 basis-48", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Search,
                      {
                        className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "pos-customer-search",
                        type: "search",
                        value: customerSearch,
                        onChange: (event) => setCustomerSearch(event.target.value),
                        placeholder: "Buscar por nombre, teléfono o placa",
                        "aria-label": "Buscar cliente por nombre, teléfono o placa",
                        autoComplete: "off",
                        "data-ocid": "pos.customer_search_input",
                        className: "pl-9"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: () => setCustomerDialogOpen(true),
                      "data-ocid": "pos.create_customer_button",
                      className: "shrink-0 gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(UserRoundPlus, { className: "size-4", "aria-hidden": "true" }),
                        "Crear cliente"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: customerId, onValueChange: setCustomerId, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "pos-customer",
                      "aria-label": "Cliente",
                      "data-ocid": "pos.customer_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Venta de mostrador" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Venta de mostrador" }),
                    customers.map((customer) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: customer.id.toString(),
                        children: customer.name
                      },
                      customer.id.toString()
                    ))
                  ] })
                ] }),
                debouncedCustomerSearch.trim() !== "" && isCustomerSearchPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": "pos.customer_search_loading_state",
                    className: "space-y-2",
                    children: Array.from(
                      { length: 3 },
                      (_, i) => `pos-customer-skeleton-${i}`
                    ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id))
                  }
                ) : debouncedCustomerSearch.trim() !== "" && !customersQuery.isError && customers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "p",
                  {
                    "data-ocid": "pos.customer_search_empty_state",
                    className: "text-xs text-muted-foreground",
                    children: [
                      "Sin clientes que coincidan con “",
                      debouncedCustomerSearch.trim(),
                      "”. Puedes crear uno nuevo."
                    ]
                  }
                ) : null,
                selectedCustomer ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => setNotifyOpen(true),
                      "data-ocid": "pos.notify_button",
                      className: "flex-1 gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "size-4", "aria-hidden": "true" }),
                        "Notificar al cliente"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    WhatsAppNotifyButton,
                    {
                      contactKind: WhatsAppContactKind.customer,
                      contactId: selectedCustomer.id,
                      context: WhatsAppContext.service,
                      contactName: selectedCustomer.name,
                      variant: "outline",
                      size: "sm",
                      className: "flex-1",
                      ocid: "pos.whatsapp_button"
                    }
                  )
                ] }) : null
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "text-xs font-medium", children: "Condición de pago" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      "aria-pressed": !isCredit,
                      onClick: () => setCondition(PaymentCondition.cash),
                      "data-ocid": "pos.condition_cash_button",
                      className: cn(
                        "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                        !isCredit ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground hover:bg-muted/60"
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-medium", children: "Contado" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Pago único" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      "aria-pressed": isCredit,
                      onClick: () => setCondition(PaymentCondition.credit),
                      "data-ocid": "pos.condition_credit_button",
                      className: cn(
                        "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                        isCredit ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground hover:bg-muted/60"
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-medium", children: "Crédito" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Cuotas" })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pos-method", className: "text-xs", children: "Método de pago" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: paymentMethod,
                    onValueChange: (value) => setPaymentMethod(value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "pos-method",
                          "aria-label": "Método de pago",
                          "data-ocid": "pos.payment_method_select",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: PAYMENT_METHOD_LABELS[option] }, option)) })
                    ]
                  }
                )
              ] }),
              isCredit ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-md border border-border bg-muted/30 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pos-installments", className: "text-xs", children: "Número de cuotas" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "pos-installments",
                        type: "number",
                        min: 1,
                        max: MAX_INSTALLMENTS,
                        value: installmentCount,
                        onChange: (event) => setInstallmentCount(event.target.value),
                        "aria-label": "Número de cuotas",
                        "data-ocid": "pos.installment_count_input",
                        className: "data-rail"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pos-first-due", className: "text-xs", children: "Primera cuota" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "pos-first-due",
                        type: "date",
                        value: firstDueDate,
                        onChange: (event) => setFirstDueDate(event.target.value),
                        "aria-label": "Fecha de la primera cuota",
                        "data-ocid": "pos.first_due_date_input",
                        className: "data-rail"
                      }
                    )
                  ] })
                ] }),
                !validCount ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "p",
                  {
                    "data-ocid": "pos.installment_count_error",
                    className: "text-xs text-destructive",
                    children: [
                      "Define entre 1 y ",
                      MAX_INSTALLMENTS,
                      " cuotas."
                    ]
                  }
                ) : null,
                creditReady ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "pos.installment_preview",
                    className: "scroll-slim overflow-x-auto",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Plan de cuotas" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "installment-table min-w-[320px]", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Cuota" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Vencimiento" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", className: "text-right", children: "Valor" })
                        ] }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "installment-number", children: [
                            row.number,
                            " / ",
                            parsedCount
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "installment-due", children: formatIsoDate(row.dueDate) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "installment-amount", children: formatMoney(row.amount) })
                        ] }, row.number)) })
                      ] })
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "pos.installment_preview_empty",
                    className: "text-xs text-muted-foreground",
                    children: "Completa el número de cuotas y la fecha de la primera cuota para ver el plan."
                  }
                )
              ] }) : null,
              isCash ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pos-received", className: "text-xs", children: "Efectivo recibido" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "pos-received",
                    type: "number",
                    min: 0,
                    step: "0.01",
                    value: amountReceived,
                    onChange: (event) => setAmountReceived(event.target.value),
                    placeholder: "0.00",
                    "aria-label": "Efectivo recibido",
                    "data-ocid": "pos.amount_received_input",
                    className: "data-rail text-right"
                  }
                )
              ] }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "space-y-1.5 border-t border-border pt-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "Subtotal" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail", children: formatMoney(BigInt(totals.subtotal)) })
                ] }),
                isIvaResponsible ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("dt", { className: "text-muted-foreground", children: [
                    "Impuesto (",
                    formatTaxRate(effectiveTaxRate),
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail", children: formatMoney(BigInt(totals.tax)) })
                ] }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "Descuento" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { className: "data-rail", children: [
                    "-",
                    formatMoney(BigInt(totals.discount))
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border pt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-display text-sm font-semibold", children: "Total" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "dd",
                    {
                      "data-ocid": "pos.total_value",
                      className: "counter-total text-2xl text-primary sm:text-3xl",
                      children: formatMoney(BigInt(totals.total))
                    }
                  )
                ] }),
                isCash && receivedCents > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "Cambio" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "dd",
                    {
                      "data-ocid": "pos.change_value",
                      className: cn(
                        "data-rail font-medium",
                        change < 0 && "text-destructive"
                      ),
                      children: formatMoney(BigInt(Math.max(change, 0)))
                    }
                  )
                ] }) : null
              ] }),
              hasStockIssue ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "p",
                {
                  "data-ocid": "pos.stock_warning",
                  className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TriangleAlert,
                      {
                        className: "mt-0.5 size-3.5 shrink-0",
                        "aria-hidden": "true"
                      }
                    ),
                    "Stock insuficiente en ",
                    formatNumber(stockIssues.length),
                    " ",
                    stockIssues.length === 1 ? "producto" : "productos",
                    ". Ajusta las cantidades antes de cobrar."
                  ]
                }
              ) : null,
              insufficientCash ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "p",
                {
                  "data-ocid": "pos.payment_warning",
                  className: "flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TriangleAlert,
                      {
                        className: "mt-0.5 size-3.5 shrink-0",
                        "aria-hidden": "true"
                      }
                    ),
                    "El efectivo recibido no cubre el total de la venta."
                  ]
                }
              ) : null,
              creditCustomerMissing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "p",
                {
                  "data-ocid": "pos.credit_customer_warning",
                  className: "flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TriangleAlert,
                      {
                        className: "mt-0.5 size-3.5 shrink-0",
                        "aria-hidden": "true"
                      }
                    ),
                    "La venta a crédito exige un cliente registrado. Selecciona un cliente para continuar."
                  ]
                }
              ) : null,
              isCredit && !creditReady ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "p",
                {
                  "data-ocid": "pos.credit_plan_warning",
                  className: "flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      CalendarClock,
                      {
                        className: "mt-0.5 size-3.5 shrink-0",
                        "aria-hidden": "true"
                      }
                    ),
                    "Define el número de cuotas y la fecha de la primera cuota para generar la factura a crédito."
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: handleCharge,
                  disabled: !canCharge,
                  "data-ocid": "pos.charge_button",
                  className: "w-full gap-2",
                  size: "lg",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "size-4", "aria-hidden": "true" }),
                    createSale.isPending ? "Cobrando…" : isCredit ? "Cobrar a crédito" : "Cobrar"
                  ]
                }
              )
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CustomerFormDialog,
      {
        open: customerDialogOpen,
        onOpenChange: setCustomerDialogOpen,
        customer: null
      }
    ),
    selectedCustomer ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      NotifyCustomerDialog,
      {
        open: notifyOpen,
        onOpenChange: setNotifyOpen,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomerEmail,
        source: NotificationSource.pos,
        defaultSubject: "Información de tu compra en mostrador",
        defaultMessage: `Hola ${selectedCustomer.name}, gracias por tu compra en nuestro mostrador. Si necesitas la factura, el detalle de los repuestos o quieres agendar una revisión, respóndenos a este correo y con gusto te atendemos.`
      }
    ) : null
  ] });
}
export {
  PosPage,
  PosPage as default
};
