/**
 * Shared domain types re-exported from the generated backend bindings.
 *
 * Value exports (enums) are re-exported as values so they can be used in
 * comparisons and `switch` statements; interfaces and type aliases are
 * re-exported as types only.
 */

export type {
  AccountingPeriod,
  AccountingReport,
  AccountingSummary,
  AdjustmentInput,
  Appointment,
  CashMovement,
  CashMovementFilter,
  CashMovementInput,
  CashMovementPage,
  CloseShiftInput,
  DailyShiftReport,
  OpenShiftInput,
  PaymentMethodTotal,
  Shift,
  ShiftFilter,
  ShiftPage,
  AppointmentFilter,
  AppointmentInput,
  BulkResult,
  BulkRowResult,
  BusinessSettings,
  CategoryBreakdown,
  Cell,
  CommissionLine,
  CommissionPayment,
  CommissionPaymentFilter,
  CommissionPaymentInput,
  CommissionPaymentLoan,
  CommissionPeriod,
  CommissionReport,
  CompanyProfile,
  CompanyProfileRawInput as CompanyProfileInput,
  CreditPlanInput,
  Customer,
  CustomerDetail,
  CustomerExportRow,
  CustomerFilter,
  CustomerInput,
  CustomerListItem,
  CustomerNotificationInput,
  CustomerNotificationResult,
  CustomerOrderSummary,
  CustomerPage,
  DashboardSummary,
  Expense,
  ExpenseCategory,
  ExpenseCategoryFilter,
  ExpenseCategoryInput,
  ExpenseCategoryTotal,
  ExpenseCategoryUsage,
  ExpenseFilter,
  ExpenseInput,
  ExpensePage,
  ExpenseSummary,
  HopeMessage,
  HopeSettings,
  HopeSettingsRawInput as HopeSettingsInput,
  Id,
  Installment,
  InstallmentPlan,
  InventoryCsvRow,
  InventoryImportResult,
  InventoryImportRow,
  InventoryImportRowResult,
  InventoryValuation,
  InventoryValuationCategory,
  InventoryValuationRow,
  InventoryValuationTotals,
  Invoice,
  InvoiceApplyLineResult,
  InvoiceApplyResult,
  InvoiceFilter,
  InvoiceHeaderInput,
  InvoiceLine,
  InvoiceLineInput,
  InvoicePage__1 as InvoicePage,
  InvoiceReviewInput,
  InvoicePage as PurchaseInvoicePage,
  InvoiceSort,
  InvoiceFileRef,
  CreateInvoiceInput,
  LaborInput,
  LaborItem,
  LedgerEntry,
  Lot,
  LowStockItem,
  Money,
  Motorcycle,
  MotorcycleFilter,
  MotorcycleInput,
  MotorcycleListItem,
  MotorcyclePage,
  Movement,
  OrderFilter,
  OrderInput,
  OrderPage,
  OrderPart,
  OrderPartInput,
  OrderPhoto,
  OrderPhotoInput,
  OrderStatusCount,
  OrderTotals,
  OrderView,
  PartFilter,
  PartInput,
  PartLookupResult,
  PartPage,
  PartView,
  Payable,
  Payment,
  PaymentInput,
  PaymentMethodBreakdown,
  PosSale,
  PosSaleFilter,
  PosSaleInput,
  PosSaleLine,
  PosSaleLineInput,
  PosSalePage,
  ProfitBlock,
  ProfitBreakdown,
  Purchase,
  PurchaseInput,
  PurchaseInvoice,
  PurchaseInvoiceLine,
  PurchaseItem,
  PurchaseItemInput,
  Quote,
  QuoteFilter,
  QuoteInput,
  QuotePage,
  QuotePartLine,
  QuotePartLineInput,
  QuoteServiceLine,
  QuoteServiceLineInput,
  QuoteTotals,
  QuoteView,
  Receivable,
  ReceivableFilter,
  ReceivablePayment,
  ReceivablePaymentInput,
  ReceivableSummary,
  Result,
  Service,
  ServiceCategory,
  ServiceCategoryFilter,
  ServiceCategoryInput,
  ServiceCategoryUsage,
  ServiceFilter,
  ServiceInput,
  ServicePage,
  ServiceTermsSettings,
  ServiceTermsSettingsRawInput as ServiceTermsSettingsInput,
  WarrantyTermsSettings,
  WarrantyTermsSettingsRawInput as WarrantyTermsSettingsInput,
  SessionInfo,
  StatusChange,
  Supplier,
  SupplierInput,
  SupplierOrder,
  SupplierOrderFilter,
  SupplierOrderInput,
  TaxRate,
  Technician,
  TechnicianCommissionSummary,
  TechnicianFilter,
  TechnicianInput,
  TechnicianLoan,
  TechnicianLoanFilter,
  TechnicianLoanInput,
  TechnicianWorkload,
  Timestamp,
  UserProfile,
  WhatsAppMessageInput,
  WhatsAppMessageResult,
  WorkshopOrder,
  ZeroInventoryResult,
} from "@/backend";

import type {
  AccountingReport,
  InvoiceHeaderInput,
  InvoiceLineInput,
  Money,
  PurchaseInvoice,
  PurchaseInvoiceLine,
  Timestamp,
} from "@/backend";

export {
  AdjustmentDirection,
  AppointmentStatus,
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  CustomerSort,
  DocumentType,
  ExtractionStatus,
  FiscalRegime,
  HopeMode,
  ImportRowStatus,
  InvoiceFileKind,
  InvoiceLineKind,
  InvoiceOrigin,
  LedgerEntryKind,
  LineApplyStatus,
  LineMatchStatus,
  MovementKind,
  MotorcycleSort,
  PurchaseInvoiceStatus,
  NotificationSource,
  OrderStatus,
  PartSort,
  PayableStatus,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  QuoteSort,
  QuoteStatus,
  ReceivableStatus,
  RoleKind,
  ServiceSort,
  ShiftStatus,
  TaxResponsibility,
  UserRole,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/backend";

/** A single navigation entry in the application shell. */
export interface NavItem {
  label: string;
  to: string;
  icon: string;
  adminOnly: boolean;
}

/** A module inside one of the six consolidated navigation flows. */
export interface NavModule {
  /** Visible Spanish label. */
  label: string;
  /** Route path this module navigates to. */
  to: string;
  /** True when the module is restricted to administrators. */
  adminOnly: boolean;
  /**
   * Clave de módulo del backend que habilita esta entrada, o `null` cuando la
   * entrada no depende de un módulo del rol (p. ej. el panel de resumen).
   */
  moduleKey?: string | null;
}

/** One of the six consolidated navigation flows in the sidebar. */
export interface NavFlow {
  /** Stable identifier used for expansion persistence and test markers. */
  id: string;
  /** Visible Spanish label of the flow. */
  label: string;
  /** Modules contained by the flow. */
  modules: NavModule[];
}

/** A single column definition for the shared `DataTable`. */
export interface DataColumn<T> {
  /** Stable column key. */
  key: string;
  /** Column header text. */
  header: string;
  /** Right-align numeric columns. */
  numeric?: boolean;
  /** Render the cell content for a row. */
  render: (row: T) => React.ReactNode;
}

/** Row action identifiers shared by every list view. */
export type RowActionKind = "edit" | "save" | "cancel" | "delete";

/** A single row action rendered inside the shared `DataTable`. */
export interface RowAction<T> {
  kind: RowActionKind;
  /** Accessible label, e.g. "Editar repuesto". */
  label: string;
  onClick: (row: T) => void;
  /** Hide the action for rows where it does not apply. */
  hidden?: (row: T) => boolean;
  /** Disable the action for rows where it is not currently valid. */
  disabled?: (row: T) => boolean;
}

/** Document widths supported by the shared print preview. */
export type DocumentFormat = "a4" | "receipt80";

/** A single line item rendered inside a printable document. */
export interface DocumentLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/** Header metadata rendered at the top of a printable document. */
export interface DocumentMeta {
  label: string;
  value: string;
  /** Render the value in the monospaced data rail. */
  rail?: boolean;
}

/** Totals block rendered at the bottom of a printable document. */
export interface DocumentTotals {
  label: string;
  value: string;
  /** Emphasize the grand total row. */
  emphasis?: boolean;
}

/** A parsed CSV row keyed by column header. */
export type CsvRow = Record<string, string>;

/* ---------------------------------------------------------------------------
 * Printable contact documents (ficha de cliente / ficha de proveedor) and the
 * shared spreadsheet import preview. These are presentation-only shapes: they
 * carry the same data the on-screen document shows so the PDF and the preview
 * never diverge.
 * ------------------------------------------------------------------------- */

/** Which contact a printable ficha belongs to. */
export type ContactDocumentKind = "customer" | "supplier";

/** A labelled block of related fields inside a contact document. */
export interface ContactDocumentSection {
  /** Stable key used for list keys and test markers. */
  key: string;
  /** Visible Spanish heading, e.g. "Motos registradas". */
  title: string;
  /** Column headers for the section table. */
  columns: string[];
  /** Rows aligned with `columns`. */
  rows: string[][];
  /** Optional note rendered under the table when there are no rows. */
  emptyNote?: string;
}

/**
 * A printable contact document (ficha de cliente o de proveedor). Rendered
 * identically on screen and in the generated PDF, in A4 or 80mm tirilla.
 */
export interface ContactDocument {
  kind: ContactDocumentKind;
  /** Document title, e.g. "Ficha de cliente". */
  title: string;
  /** Document number rendered next to the title. */
  number: string;
  /** Contact display name. */
  name: string;
  /** Header metadata blocks (documento, teléfono, correo, dirección…). */
  meta: DocumentMeta[];
  /** Related-record sections (motos, órdenes, compras, pagos…). */
  sections: ContactDocumentSection[];
  /** Optional footer note. */
  footer?: string;
}

/** Validation state of one row in an import preview. */
export type ImportPreviewStatus = "valid" | "invalid";

/** One parsed import row shown in the preview before the backend call. */
export interface ImportPreviewRow {
  /** 1-based position in the source file, including the header row. */
  rowNumber: number;
  /** Stable key for list rendering. */
  key: string;
  /** True when the row can be imported as-is. */
  status: ImportPreviewStatus;
  /** Spanish reason shown when `status` is "invalid". */
  error?: string;
  /** Human-readable summary of the row, e.g. the contact name. */
  label: string;
  /** Secondary detail, e.g. the phone or document. */
  detail: string;
}

/** Outcome of a bulk contact import, mirroring the backend `BulkResult`. */
export interface ImportPreviewResult {
  created: bigint;
  updated: bigint;
  failed: bigint;
  /** Per-row outcome keyed by the preview row key. */
  rows: Array<{
    key: string;
    status: ImportPreviewStatus;
    error?: string;
  }>;
}

/* ---------------------------------------------------------------------------
 * UI display types for the new workshop, billing, POS, commission and
 * accounting surfaces. These are presentation-only shapes derived from the
 * backend contracts; they never replace the generated bindings.
 * ------------------------------------------------------------------------- */

/** Maximum number of process-evidence photos an order accepts. */
export const ORDER_PHOTO_LIMIT = 6;

/** A single installment row prepared for display in the invoice detail. */
export interface InstallmentRow {
  /** 1-based installment number. */
  number: number;
  /** Amount owed for this installment, in cents. */
  amount: Money;
  /** Due date as a backend timestamp. */
  dueDate: Timestamp;
  /** True once the installment has been paid. */
  paid: boolean;
  /** Payment timestamp when the installment is settled. */
  paidAt: Timestamp | null;
}

/** A credit plan prepared for display: rows plus derived progress. */
export interface InstallmentPlanView {
  installmentCount: number;
  firstDueDate: Timestamp;
  rows: InstallmentRow[];
  paidCount: number;
  pendingCount: number;
  /** Sum of the pending installments, in cents. */
  pendingAmount: Money;
  /** Sum of every installment, in cents. */
  totalAmount: Money;
}

/** One side of the accounting profit breakdown (repuestos o servicios). */
export interface ProfitBlockView {
  /** Stable key used for test markers and list keys. */
  key: "parts" | "services" | "total";
  /** Visible Spanish label. */
  label: string;
  /** Revenue for the period, in cents. */
  income: Money;
  /** Cost of goods or labor for the period, in cents. */
  cost: Money;
  /**
   * Technician commission for the period, in cents. Equals `cost` on the
   * services block and 0 on the parts block.
   */
  commission: Money;
  /** Income minus cost, in cents. */
  margin: bigint;
  /** Margin as basis points of income. */
  marginBps: bigint;
}

/**
 * One service line of a paid invoice, flattened for the per-service profit
 * detail. Utilidad por servicio = valor cobrado − comisión del técnico.
 */
export interface ServiceProfitLineView {
  /** Stable row key: the invoice id plus the line position. */
  key: string;
  /** Invoice the line belongs to. */
  invoiceId: bigint;
  /** Human-readable invoice number, e.g. "FV-000123". */
  invoiceNumber: string;
  /** Workshop order the invoice came from, when it did. */
  orderId: bigint | null;
  /** Service line description captured on the invoice. */
  description: string;
  /** Catalog service performed, when the line came from one. */
  serviceId: bigint | null;
  /** Technician responsible for the line, when one is assigned. */
  technicianId: bigint | null;
  /** Technician display name, empty when the line has no technician. */
  technicianName: string;
  /** Amount charged for the line, in cents. */
  charged: Money;
  /** Technician commission for the line, in cents. */
  commission: Money;
  /** Charged minus commission, in cents; may be negative. */
  profit: bigint;
}

/** The full profit breakdown: repuestos, servicios y total consolidado. */
export interface ProfitBreakdownView {
  parts: ProfitBlockView;
  services: ProfitBlockView;
  total: ProfitBlockView;
  /** Total technician commission deducted in the period, in cents. */
  totalCommission: Money;
  /** Net profit after deducting technician commissions, in cents. */
  netProfit: bigint;
  /** Per-service detail backing the services block. */
  serviceLines: ServiceProfitLineView[];
}

/**
 * The accounting report as the page consumes it: the generated report plus the
 * profit breakdown carrying the technician commission and the per-service
 * detail. The generated bindings are the source of truth for every other
 * field; only `profit` is widened here.
 */
export interface AccountingReportView extends Omit<AccountingReport, "profit"> {
  profit: ProfitBreakdownView;
}

/** A commission line flattened for the service/motorcycle breakdown table. */
export interface CommissionLineBreakdown {
  /** Stable row key: the labor line id. */
  key: string;
  orderNumber: string;
  /** Catalog service performed, e.g. "Cambio de aceite". */
  serviceName: string;
  /** Free-text labor description captured on the order. */
  description: string;
  motorcycleBrand: string;
  motorcycleModel: string;
  motorcyclePlate: string;
  /** Date the service was performed. */
  serviceDate: Timestamp;
  baseAmount: Money;
  commissionRate: bigint;
  commissionAmount: Money;
}

/* ---------------------------------------------------------------------------
 * Purchase-invoice intake views. The generated bindings stay the source of
 * truth; these aliases only widen the header and line shapes the editable
 * review table consumes, so the new extraction fields (NIT, forma y medio de
 * pago, IVA %, descuento % y valor total) are typed in one place.
 * ------------------------------------------------------------------------- */

/**
 * A purchase-invoice line as the review table consumes it: the generated line
 * plus the extracted `taxRate`, `discountRate` and `total` fields.
 */
export type PurchaseInvoiceLineView = PurchaseInvoiceLine;

/**
 * A purchase-invoice header as the review table consumes it: the generated
 * invoice plus the extracted `supplierTaxId`, `paymentMethod` and
 * `paymentMeans` fields.
 */
export type PurchaseInvoiceView = PurchaseInvoice;

/**
 * The header payload sent to `updatePurchaseInvoiceReview` /
 * `confirmPurchaseInvoice`. `supplierTaxId`, `paymentMethod` and
 * `paymentMeans` are required by the backend, so the review always sends a
 * string (empty when the extraction did not detect them).
 */
export type PurchaseInvoiceHeaderInput = InvoiceHeaderInput;

/**
 * One line payload sent to `updatePurchaseInvoiceReview`. `taxRate` and
 * `discountRate` are whole percentages; `total` is the line total in integer
 * cents.
 */
export type PurchaseInvoiceLineInput = InvoiceLineInput;

/* ---------------------------------------------------------------------------
 * Términos y condiciones de garantía (documento de la orden de trabajo).
 * ------------------------------------------------------------------------- */

/** A single numbered clause of the warranty legend. */
export interface WarrantyClause {
  /** 1-based clause number, rendered as "1." … "8.". */
  number: number;
  /** Clause title in upper case, e.g. "ALCANCE DE LA GARANTÍA". */
  title: string;
  /** Full clause body text. */
  body: string;
}

/**
 * The identification block printed at the top of the warranty document:
 * cliente, motocicleta, fecha del servicio y técnico responsable.
 */
export interface WarrantyDocumentData {
  /** Workshop order number the warranty belongs to, e.g. "OT-000123". */
  orderNumber: string;
  /** Customer full name. */
  customerName: string;
  /** Customer document number; empty when the customer has none on file. */
  customerDocument: string;
  /** Motorcycle brand, e.g. "Yamaha". */
  motorcycleBrand: string;
  /** Motorcycle model, e.g. "FZ 2.0". */
  motorcycleModel: string;
  /** Motorcycle model year. */
  motorcycleYear: bigint;
  /** Motorcycle plate, e.g. "ABC12D". */
  motorcyclePlate: string;
  /** Date the service was performed, as a backend timestamp. */
  serviceDate: Timestamp;
  /** Technician code, e.g. "TEC-01"; empty when none is assigned. */
  technicianCode: string;
  /** Technician full name; empty when none is assigned. */
  technicianName: string;
}
