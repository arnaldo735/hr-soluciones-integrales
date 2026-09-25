import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AccountingPeriod {
    to?: Timestamp;
    from?: Timestamp;
}
export interface AccountingReport {
    byPaymentMethod: Array<PaymentMethodBreakdown>;
    entries: Array<LedgerEntry>;
    summary: AccountingSummary;
    byExpenseCategory: Array<CategoryBreakdown>;
    profit: ProfitBreakdown;
}
export interface AccountingSummary {
    to?: Timestamp;
    expenseCount: bigint;
    invoiceCount: bigint;
    from?: Timestamp;
    totalIncome: Money;
    totalExpenses: Money;
    profit: bigint;
}
export interface AdjustmentInput {
    direction: AdjustmentDirection;
    lotId?: Id;
    quantity: bigint;
    partId: Id;
    reason: string;
}
export interface Appointment {
    id: Id;
    status: AppointmentStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    durationMinutes: bigint;
    technicianId?: Id;
    motorcycleId: Id;
    customerId: Id;
    scheduledAt: Timestamp;
    reason: string;
}
export interface AppointmentFilter {
    to?: Timestamp;
    status?: AppointmentStatus;
    from?: Timestamp;
    technicianId?: Id;
}
export interface AppointmentInput {
    durationMinutes: bigint;
    technicianId?: Id;
    motorcycleId: Id;
    customerId: Id;
    scheduledAt: Timestamp;
    reason: string;
}
export type BackupError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "driveFailed";
    driveFailed: string;
} | {
    __kind__: "notConnected";
    notConnected: null;
};
export interface BackupFile {
    name: string;
    createdAt: bigint;
    size: bigint;
    fileId: string;
    webViewLink: string;
}
export type BackupListOutcome = {
    __kind__: "ok";
    ok: Array<BackupFile>;
} | {
    __kind__: "err";
    err: BackupError;
};
export type BackupOutcome = {
    __kind__: "ok";
    ok: BackupResult;
} | {
    __kind__: "err";
    err: BackupError;
};
export interface BackupResult {
    name: string;
    createdAt: bigint;
    size: bigint;
    fileId: string;
    webViewLink: string;
}
export type BasisPoints = bigint;
export interface BulkResult {
    created: bigint;
    skipped: bigint;
    rows: Array<BulkRowResult>;
    updated: bigint;
    failed: bigint;
}
export interface BulkRowResult {
    id?: Id;
    ok: boolean;
    error?: string;
    index: bigint;
}
export interface BusinessSettings {
    taxId: string;
    name: string;
    address: string;
    phone: string;
    taxRate: TaxRate;
}
export interface CategoryBreakdown {
    total: Money;
    category: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface CommissionLine {
    at: Timestamp;
    serviceDate: Timestamp;
    laborId: Id;
    serviceName: string;
    motorcycleModel: string;
    technicianCode: string;
    technicianName: string;
    description: string;
    orderId: Id;
    technicianId: Id;
    baseAmount: Money;
    commissionAmount: Money;
    commissionRate: bigint;
    serviceId: Id;
    motorcycleBrand: string;
    motorcyclePlate: string;
    orderNumber: string;
}
export interface CommissionPayment {
    id: Id;
    technicianCode: string;
    technicianName: string;
    period: CommissionPeriod;
    netPaid: Money;
    loansDeducted: Money;
    lines: Array<CommissionLine>;
    loans: Array<CommissionPaymentLoan>;
    lineCount: bigint;
    technicianId: Id;
    baseAmount: Money;
    commissionAmount: Money;
    paidAt: Timestamp;
    paidBy: Principal;
}
export interface CommissionPaymentFilter {
    to?: Timestamp;
    from?: Timestamp;
    technicianId?: Id;
}
export interface CommissionPaymentInput {
    period: CommissionPeriod;
    technicianId: Id;
}
export interface CommissionPaymentLoan {
    date: Timestamp;
    note?: string;
    loanId: Id;
    amount: Money;
}
export interface CommissionPeriod {
    to?: Timestamp;
    from?: Timestamp;
}
export interface CommissionReport {
    totalCommission: Money;
    technicians: Array<TechnicianCommissionSummary>;
    period: CommissionPeriod;
    totalNetPayable: Money;
    totalBase: Money;
    totalPendingLoans: Money;
}
export interface CompanyProfile {
    taxId: string;
    documentType: DocumentType;
    taxResponsibility: TaxResponsibility;
    tradeName?: string;
    city: string;
    fiscalRegime: FiscalRegime;
    email?: string;
    website?: string;
    legalName: string;
    updatedAt: Timestamp;
    logoUrl?: string;
    address: string;
    phone: string;
    checkDigit?: bigint;
    taxRate: TaxRate;
}
export interface CompanyProfileRawInput {
    taxId: string;
    documentType: string;
    taxResponsibility: string;
    tradeName?: string;
    city: string;
    fiscalRegime: string;
    email?: string;
    website?: string;
    legalName: string;
    logoUrl?: string;
    address: string;
    phone: string;
    checkDigit?: bigint;
    taxRate: TaxRate;
}
export interface CreateInvoiceInput {
    kind: InvoiceFileKind;
    gatewayUrl?: string;
    mimeType: string;
    fileName: string;
    objectId: string;
    projectId?: string;
    sizeBytes: bigint;
}
export interface CreditPlanInput {
    firstDueDate: Timestamp;
    installmentCount: bigint;
}
export interface Customer {
    id: Id;
    name: string;
    createdAt: Timestamp;
    email?: string;
    document?: string;
    address?: string;
    phone: string;
}
export interface CustomerDetail {
    customer: Customer;
    orders: Array<CustomerOrderSummary>;
    motorcycles: Array<Motorcycle>;
}
export interface CustomerExportRow {
    customer: Customer;
    motorcycles: Array<Motorcycle>;
}
export interface CustomerFilter {
    search?: string;
    hasMotorcycles?: boolean;
}
export interface CustomerInput {
    name: string;
    email?: string;
    document?: string;
    address?: string;
    phone: string;
}
export interface CustomerListItem {
    id: Id;
    name: string;
    createdAt: Timestamp;
    motorcycleCount: bigint;
    email?: string;
    document?: string;
    address?: string;
    phone: string;
}
export interface CustomerNotificationInput {
    subject: string;
    source: NotificationSource;
    referenceId?: Id;
    message: string;
    customerId: Id;
}
export interface CustomerNotificationResult {
    sent: boolean;
    email: string;
    customerId: Id;
}
export interface CustomerOrderSummary {
    status: string;
    total: bigint;
    createdAt: Timestamp;
    orderId: Id;
    motorcyclePlate: string;
    orderNumber: string;
}
export interface CustomerPage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<CustomerListItem>;
}
export interface DashboardSummary {
    pendingPayablesTotal: Money;
    pendingPayablesCount: bigint;
    activeOrders: Array<OrderStatusCount>;
    lowStock: Array<LowStockItem>;
}
export interface DriveAuthResult {
    connected: boolean;
    accountEmail?: string;
}
export interface DriveAuthStart {
    authorizationUrl: string;
    state: string;
}
export interface DriveConfigStatus {
    missingVariables: Array<string>;
    configured: boolean;
}
export interface DriveConnectionStatus {
    connectedAt?: bigint;
    connected: boolean;
    configuration: DriveConfigStatus;
    accountEmail?: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Expense {
    id: Id;
    tax: Money;
    categoryId: Id;
    concept: string;
    paymentMethod: string;
    categoryName: string;
    receiptUrl?: string;
    supplierName?: string;
    date: Timestamp;
    createdAt: Timestamp;
    amount: Money;
    supplierId?: Id;
}
export interface ExpenseCategory {
    id: Id;
    name: string;
    createdAt: Timestamp;
    description: string;
}
export interface ExpenseCategoryFilter {
    search?: string;
}
export interface ExpenseCategoryInput {
    name: string;
    description: string;
}
export interface ExpenseCategoryTotal {
    categoryId: Id;
    total: Money;
    categoryName: string;
}
export interface ExpenseCategoryUsage {
    expenseCount: bigint;
    category: ExpenseCategory;
}
export interface ExpenseFilter {
    to?: Timestamp;
    categoryId?: Id;
    paymentMethod?: string;
    from?: Timestamp;
    search?: string;
}
export interface ExpenseInput {
    tax: Money;
    categoryId: Id;
    concept: string;
    paymentMethod: string;
    receiptUrl?: string;
    date: Timestamp;
    amount: Money;
    supplierId?: Id;
}
export interface ExpensePage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    summary: ExpenseSummary;
    items: Array<Expense>;
}
export interface ExpenseSummary {
    total: Money;
    count: bigint;
    byCategory: Array<ExpenseCategoryTotal>;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type Id = bigint;
export interface Installment {
    paid: boolean;
    dueDate: Timestamp;
    number: bigint;
    amount: Money;
    paidAt?: Timestamp;
}
export interface InstallmentPlan {
    firstDueDate: Timestamp;
    installmentCount: bigint;
    installments: Array<Installment>;
}
export interface InventoryCsvRow {
    sku: string;
    lowStockThreshold: bigint;
    name: string;
    unit: string;
    quantity: bigint;
    category: string;
    salePrice: Money;
    brand: string;
    costPrice: Money;
}
export interface InventoryImportResult {
    created: bigint;
    rows: Array<InventoryImportRowResult>;
    updated: bigint;
    failed: bigint;
}
export interface InventoryImportRow {
    sku: string;
    lowStockThreshold: bigint;
    name: string;
    unit: string;
    quantity: bigint;
    category: string;
    salePrice: Money;
    brand: string;
    costPrice: Money;
    rowNumber: bigint;
}
export interface InventoryImportRowResult {
    id?: Id;
    sku: string;
    status: ImportRowStatus;
    error?: string;
    rowNumber: bigint;
}
export interface InventoryValuation {
    rows: Array<InventoryValuationRow>;
    totals: InventoryValuationTotals;
    byCategory: Array<InventoryValuationCategory>;
}
export interface InventoryValuationCategory {
    saleValue: Money;
    costValue: Money;
    units: bigint;
    category: string;
    partCount: bigint;
    margin: bigint;
    marginBps: BasisPoints;
}
export interface InventoryValuationRow {
    sku: string;
    saleValue: Money;
    costValue: Money;
    name: string;
    units: bigint;
    category: string;
    margin: bigint;
    partId: Id;
    marginBps: BasisPoints;
}
export interface InventoryValuationTotals {
    totalCostValue: Money;
    totalMargin: bigint;
    totalUnits: bigint;
    partCount: bigint;
    marginBps: BasisPoints;
    totalSaleValue: Money;
}
export interface Invoice {
    id: Id;
    tax: Money;
    customerName: string;
    total: Money;
    paymentStatus: PaymentStatus;
    posSaleId?: Id;
    paymentMethod: PaymentMethod;
    origin: InvoiceOrigin;
    paymentCondition: PaymentCondition;
    orderId?: Id;
    lines: Array<InvoiceLine>;
    customerTaxId?: string;
    customerAddress?: string;
    number: string;
    discount: Money;
    customerId?: Id;
    installments?: InstallmentPlan;
    issuedAt: Timestamp;
    taxRate: TaxRate;
    subtotal: Money;
}
export interface InvoiceApplyLineResult {
    status: LineApplyStatus;
    movementId?: Id;
    code: string;
    error?: string;
    lineNumber: bigint;
    lotId?: Id;
    lineId: Id;
    partId?: Id;
}
export interface InvoiceApplyResult {
    status: PurchaseInvoiceStatus;
    created: bigint;
    invoiceId: Id;
    lines: Array<InvoiceApplyLineResult>;
    updated: bigint;
    failed: bigint;
}
export interface InvoiceFileRef {
    kind: InvoiceFileKind;
    gatewayUrl?: string;
    mimeType: string;
    fileName: string;
    objectId: string;
    projectId?: string;
    sizeBytes: bigint;
    uploadedAt: Timestamp;
}
export interface InvoiceFilter {
    status?: PurchaseInvoiceStatus;
    search?: string;
    supplierId?: Id;
}
export interface InvoiceFilter__1 {
    to?: Timestamp;
    from?: Timestamp;
    search?: string;
}
export interface InvoiceHeaderInput {
    paymentMethod: string;
    supplierName?: string;
    invoiceDate?: Timestamp;
    invoiceNumber?: string;
    paymentMeans: string;
    supplierId?: Id;
    supplierTaxId: string;
}
export interface InvoiceLine {
    kind: InvoiceLineKind;
    description: string;
    quantity: bigint;
    unitPrice: Money;
    amount: Money;
    unitCost: Money;
}
export interface InvoiceLineInput {
    id?: Id;
    total: Money;
    code: string;
    discountRate: bigint;
    description: string;
    quantity: bigint;
    taxRate: bigint;
    unitCost: Money;
}
export interface InvoicePage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<PurchaseInvoice>;
}
export interface InvoicePage__1 {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<Invoice>;
}
export interface InvoiceReviewInput {
    lines: Array<InvoiceLineInput>;
    header: InvoiceHeaderInput;
}
export interface LaborInput {
    description: string;
    technicianId?: Id;
    serviceId?: Id;
    price: Money;
}
export interface LaborItem {
    id: Id;
    description: string;
    technicianId?: Id;
    serviceId?: Id;
    price: Money;
}
export interface LedgerEntry {
    id: Id;
    concept: string;
    date: Timestamp;
    kind: LedgerEntryKind;
    referenceId?: Id;
    referenceType?: string;
    category: string;
    amount: Money;
}
export interface LocalBackup {
    generatedAt: bigint;
    json: string;
    fileName: string;
}
export interface Lot {
    id: Id;
    lotNumber: string;
    receivedAt: Timestamp;
    quantity: bigint;
    purchaseId?: Id;
    supplierId?: Id;
    partId: Id;
    unitCost: Money;
}
export interface LowStockItem {
    sku: string;
    lowStockThreshold: bigint;
    name: string;
    totalStock: bigint;
    partId: Id;
}
export type Money = bigint;
export interface Motorcycle {
    id: Id;
    model: string;
    mileage: bigint;
    createdAt: Timestamp;
    year: bigint;
    customerId: Id;
    brand: string;
    plate: string;
}
export interface MotorcycleFilter {
    search?: string;
    brand?: string;
}
export interface MotorcycleInput {
    model: string;
    mileage: bigint;
    year: bigint;
    customerId: Id;
    brand: string;
    plate: string;
}
export interface MotorcycleListItem {
    id: Id;
    customerName: string;
    model: string;
    mileage: bigint;
    customerPhone: string;
    createdAt: Timestamp;
    year: bigint;
    customerId: Id;
    brand: string;
    plate: string;
}
export interface MotorcyclePage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<MotorcycleListItem>;
}
export interface Movement {
    at: Timestamp;
    id: Id;
    kind: MovementKind;
    referenceId?: Id;
    lotId?: Id;
    performedBy: Principal;
    quantity: bigint;
    partId: Id;
    unitCost?: Money;
    reason?: string;
}
export interface OrderFilter {
    status?: OrderStatus;
    search?: string;
}
export interface OrderInput {
    motorcycleId: Id;
    customerId: Id;
    intakeMileage: bigint;
    technicianIds: Array<Id>;
    problem: string;
}
export interface OrderPage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<OrderView>;
}
export interface OrderPart {
    id: Id;
    description: string;
    lotId?: Id;
    quantity: bigint;
    unitPrice: Money;
    partId: Id;
    unitCost: Money;
}
export interface OrderPartInput {
    lotId?: Id;
    quantity: bigint;
    partId: Id;
}
export interface OrderPhoto {
    id: Id;
    blob: ExternalBlob;
    mimeType: string;
    filename: string;
    uploadedAt: Timestamp;
    uploadedBy: Principal;
}
export interface OrderPhotoInput {
    blob: ExternalBlob;
    mimeType: string;
    filename: string;
}
export interface OrderStatusCount {
    status: string;
    count: bigint;
}
export interface OrderTotals {
    tax: Money;
    total: Money;
    partsSubtotal: Money;
    laborSubtotal: Money;
    taxRate: TaxRate;
    subtotal: Money;
}
export interface OrderView {
    order: WorkshopOrder;
    totals: OrderTotals;
}
export interface PartFacets {
    categories: Array<string>;
    brands: Array<string>;
}
export interface PartFilter {
    search?: string;
    category?: string;
    brand?: string;
    lowStockOnly?: boolean;
}
export interface PartInput {
    sku: string;
    lowStockThreshold: bigint;
    name: string;
    unit: string;
    category: string;
    salePrice: Money;
    brand: string;
    costPrice: Money;
}
export interface PartPage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<PartView>;
}
export interface PartView {
    id: Id;
    sku: string;
    lowStockThreshold: bigint;
    name: string;
    createdAt: Timestamp;
    unit: string;
    totalStock: bigint;
    category: string;
    salePrice: Money;
    brand: string;
    costPrice: Money;
    lowStock: boolean;
}
export interface Payable {
    status: PayableStatus;
    balance: Money;
    supplierName: string;
    dueDate: Timestamp;
    totalPaid: Money;
    totalPurchased: Money;
    supplierId: Id;
}
export interface Payment {
    at: Timestamp;
    id: Id;
    method: PaymentMethod;
    note?: string;
    performedBy: Principal;
    purchaseId?: Id;
    amount: Money;
    supplierId: Id;
}
export interface PaymentInput {
    method: PaymentMethod;
    note?: string;
    purchaseId?: Id;
    amount: Money;
    supplierId: Id;
}
export interface PaymentMethodBreakdown {
    method: string;
    total: Money;
}
export interface PosSale {
    id: Id;
    tax: Money;
    customerName?: string;
    total: Money;
    paymentMethod: string;
    soldAt: Timestamp;
    soldBy: Principal;
    invoiceId: Id;
    paymentCondition: PaymentCondition;
    lines: Array<PosSaleLine>;
    discount: Money;
    saleNumber: string;
    customerId?: Id;
    change: Money;
    amountReceived: Money;
    taxRate: TaxRate;
    subtotal: Money;
}
export interface PosSaleFilter {
    to?: Timestamp;
    from?: Timestamp;
    search?: string;
}
export interface PosSaleInput {
    creditPlan?: CreditPlanInput;
    paymentMethod: string;
    paymentCondition: PaymentCondition;
    lines: Array<PosSaleLineInput>;
    customerId?: Id;
    amountReceived: Money;
}
export interface PosSaleLine {
    description: string;
    discount: Money;
    quantity: bigint;
    unitPrice: Money;
    amount: Money;
    partId: Id;
}
export interface PosSaleLineInput {
    discount: Money;
    quantity: bigint;
    partId: Id;
}
export interface PosSalePage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<PosSale>;
}
export type Principal = Principal;
export interface ProfitBlock {
    cost: Money;
    commission: Money;
    income: Money;
    margin: bigint;
    marginBps: BasisPoints;
}
export interface ProfitBreakdown {
    total: ProfitBlock;
    serviceLines: Array<ServiceProfitLine>;
    parts: ProfitBlock;
    services: ProfitBlock;
}
export interface Purchase {
    id: Id;
    total: Money;
    createdAt: Timestamp;
    items: Array<PurchaseItem>;
    paidAmount: Money;
    supplierId: Id;
}
export interface PurchaseInput {
    items: Array<PurchaseItemInput>;
    supplierId: Id;
}
export interface PurchaseInvoice {
    id: Id;
    status: PurchaseInvoiceStatus;
    paymentMethod: string;
    extractionError?: string;
    supplierName?: string;
    file: InvoiceFileRef;
    createdAt: Timestamp;
    confirmedAt?: Timestamp;
    confirmedBy?: Principal;
    lines: Array<PurchaseInvoiceLine>;
    invoiceDate?: Timestamp;
    updatedAt: Timestamp;
    invoiceNumber?: string;
    paymentMeans: string;
    supplierId?: Id;
    supplierTaxId: string;
    extractionStatus: ExtractionStatus;
}
export interface PurchaseInvoiceLine {
    id: Id;
    matchedPartId?: Id;
    total: Money;
    applyError?: string;
    movementId?: Id;
    code: string;
    applyStatus: LineApplyStatus;
    discountRate: bigint;
    description: string;
    lineNumber: bigint;
    lotId?: Id;
    matchStatus: LineMatchStatus;
    quantity: bigint;
    taxRate: bigint;
    unitCost: Money;
}
export interface PurchaseItem {
    id: Id;
    lotNumber: string;
    quantity: bigint;
    partId: Id;
    unitCost: Money;
}
export interface PurchaseItemInput {
    lotNumber: string;
    quantity: bigint;
    partId: Id;
    unitCost: Money;
}
export interface Quote {
    id: Id;
    status: QuoteStatus;
    serviceLines: Array<QuoteServiceLine>;
    createdAt: Timestamp;
    quoteNumber: string;
    updatedAt: Timestamp;
    notes?: string;
    discount: Money;
    motorcycleId: Id;
    customerId: Id;
    partLines: Array<QuotePartLine>;
    taxRate: TaxRate;
}
export interface QuoteFilter {
    status?: QuoteStatus;
    search?: string;
}
export interface QuoteInput {
    serviceLines: Array<QuoteServiceLineInput>;
    notes?: string;
    discount: Money;
    motorcycleId: Id;
    customerId: Id;
    partLines: Array<QuotePartLineInput>;
}
export interface QuotePage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<QuoteView>;
}
export interface QuotePartLine {
    id: Id;
    description: string;
    quantity: bigint;
    unitPrice: Money;
    partId: Id;
}
export interface QuotePartLineInput {
    quantity: bigint;
    unitPrice: Money;
    partId: Id;
}
export interface QuoteServiceLine {
    id: Id;
    description: string;
    quantity: bigint;
    serviceId?: Id;
    unitPrice: Money;
}
export interface QuoteServiceLineInput {
    description: string;
    quantity: bigint;
    serviceId?: Id;
    unitPrice: Money;
}
export interface QuoteTotals {
    tax: Money;
    total: Money;
    taxableBase: Money;
    servicesSubtotal: Money;
    partsSubtotal: Money;
    discount: Money;
    taxRate: TaxRate;
    subtotal: Money;
}
export interface QuoteView {
    quote: Quote;
    totals: QuoteTotals;
}
export interface Receivable {
    customerName: string;
    status: ReceivableStatus;
    total: Money;
    balance: Money;
    dueDate: Timestamp;
    invoiceId: Id;
    invoiceNumber: string;
    customerId?: Id;
    issuedAt: Timestamp;
    paidAmount: Money;
}
export interface ReceivableFilter {
    status?: ReceivableStatus;
    search?: string;
}
export interface ReceivablePayment {
    at: Timestamp;
    id: Id;
    method: string;
    note?: string;
    invoiceId: Id;
    performedBy: Principal;
    amount: Money;
}
export interface ReceivablePaymentInput {
    method: string;
    note?: string;
    invoiceId: Id;
    amount: Money;
}
export interface ReceivableSummary {
    totalOverdue: Money;
    totalOutstanding: Money;
    openCount: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Service {
    id: Id;
    active: boolean;
    code: string;
    name: string;
    createdAt: Timestamp;
    description: string;
    category: string;
    laborRate: Money;
    estimatedMinutes: bigint;
}
export interface ServiceCategory {
    id: Id;
    name: string;
    createdAt: Timestamp;
    description: string;
}
export interface ServiceCategoryFilter {
    search?: string;
}
export interface ServiceCategoryInput {
    name: string;
    description: string;
}
export interface ServiceCategoryUsage {
    serviceCount: bigint;
    activeServiceCount: bigint;
    category: ServiceCategory;
}
export interface ServiceFilter {
    search?: string;
    category?: string;
    activeOnly?: boolean;
}
export interface ServiceInput {
    active: boolean;
    code: string;
    name: string;
    description: string;
    category: string;
    laborRate: Money;
    estimatedMinutes: bigint;
}
export interface ServicePage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<Service>;
}
export interface ServiceProfitLine {
    technicianName: string;
    invoiceId: Id;
    description: string;
    commission: Money;
    orderId?: Id;
    invoiceNumber: string;
    technicianId?: Id;
    profit: bigint;
    serviceId?: Id;
    charged: Money;
}
export interface StatusChange {
    at: Timestamp;
    to: OrderStatus;
    from?: OrderStatus;
    performedBy: Principal;
}
export interface Supplier {
    id: Id;
    taxId?: string;
    contactName?: string;
    name: string;
    createdAt: Timestamp;
    email?: string;
    address?: string;
    phone: string;
}
export interface SupplierInput {
    taxId?: string;
    contactName?: string;
    name: string;
    email?: string;
    address?: string;
    phone: string;
}
export interface SupplierOrder {
    id: Id;
    sku: string;
    createdAt: Timestamp;
    createdBy: Principal;
    description: string;
    quantity: bigint;
    supplierId: Id;
}
export interface SupplierOrderFilter {
    search?: string;
    supplierId?: Id;
}
export interface SupplierOrderInput {
    sku: string;
    description: string;
    quantity: bigint;
    supplierId: Id;
}
export type TaxRate = bigint;
export interface Technician {
    id: Id;
    active: boolean;
    code: string;
    name: string;
    createdAt: Timestamp;
    hourlyRate: Money;
    email?: string;
    specialty: string;
    commissionRate: bigint;
    phone: string;
}
export interface TechnicianCommissionSummary {
    technicianCode: string;
    technicianName: string;
    netPayable: Money;
    pendingLoanCount: bigint;
    lineCount: bigint;
    technicianId: Id;
    pendingLoansAmount: Money;
    baseAmount: Money;
    commissionAmount: Money;
    commissionRate: bigint;
}
export interface TechnicianFilter {
    search?: string;
    specialty?: string;
    activeOnly?: boolean;
}
export interface TechnicianInput {
    active: boolean;
    code: string;
    name: string;
    hourlyRate: Money;
    email?: string;
    specialty: string;
    commissionRate: bigint;
    phone: string;
}
export interface TechnicianLoan {
    id: Id;
    commissionPaymentId?: Id;
    date: Timestamp;
    note?: string;
    createdAt: Timestamp;
    deductedAt?: Timestamp;
    deducted: boolean;
    technicianId: Id;
    amount: Money;
}
export interface TechnicianLoanFilter {
    technicianId?: Id;
    pendingOnly?: boolean;
}
export interface TechnicianLoanInput {
    date: Timestamp;
    note?: string;
    technicianId: Id;
    amount: Money;
}
export interface TechnicianWorkload {
    technician: Technician;
    activeOrders: bigint;
    orderIds: Array<Id>;
}
export type Timestamp = bigint;
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface UserProfile {
    name: string;
    createdAt: Timestamp;
    role: UserRole;
}
export interface UserView {
    principal: Principal;
    name: string;
    createdAt: Timestamp;
    role: UserRole;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface WhatsAppMessageInput {
    contactKind: WhatsAppContactKind;
    context: WhatsAppContext;
    referenceId?: Id;
    contactId: Id;
}
export interface WhatsAppMessageResult {
    contactKind: WhatsAppContactKind;
    contactName: string;
    hasPhone: boolean;
    message: string;
    contactId: Id;
    phone?: string;
}
export interface WorkshopOrder {
    id: Id;
    status: OrderStatus;
    createdAt: Timestamp;
    statusHistory: Array<StatusChange>;
    labor: Array<LaborItem>;
    cancelledAt?: Timestamp;
    updatedAt: Timestamp;
    motorcycleId: Id;
    customerId: Id;
    parts: Array<OrderPart>;
    cancelReason?: string;
    intakeMileage: bigint;
    technicianIds: Array<Id>;
    orderNumber: string;
    problem: string;
    photos: Array<OrderPhoto>;
}
export interface ZeroInventoryResult {
    affected: bigint;
}
export interface ZeroServicesResult {
    deleted: bigint;
}
export enum AdjustmentDirection {
    in = "in",
    out = "out"
}
export enum AppointmentStatus {
    scheduled = "scheduled",
    noShow = "noShow",
    cancelled = "cancelled",
    attended = "attended",
    confirmed = "confirmed"
}
export enum CustomerSort {
    name = "name",
    createdAt = "createdAt",
    motorcycleCount = "motorcycleCount"
}
export enum DocumentType {
    nit = "nit",
    cedulaCiudadania = "cedulaCiudadania",
    cedulaExtranjeria = "cedulaExtranjeria"
}
export enum ExtractionStatus {
    pending = "pending",
    extracting = "extracting",
    extracted = "extracted",
    failed = "failed"
}
export enum FiscalRegime {
    noResponsableIva = "noResponsableIva",
    responsableIva = "responsableIva"
}
export enum ImportRowStatus {
    created = "created",
    error = "error",
    updated = "updated"
}
export enum InvoiceFileKind {
    pdf = "pdf",
    image = "image"
}
export enum InvoiceLineKind {
    service = "service",
    part = "part"
}
export enum InvoiceOrigin {
    pos = "pos",
    workshopOrder = "workshopOrder",
    quote = "quote"
}
export enum InvoiceSort {
    createdAt = "createdAt",
    invoiceDate = "invoiceDate",
    invoiceNumber = "invoiceNumber"
}
export enum LedgerEntryKind {
    expense = "expense",
    income = "income"
}
export enum LineApplyStatus {
    created = "created",
    pending = "pending",
    error = "error",
    updated = "updated"
}
export enum LineMatchStatus {
    new = "new",
    existing = "existing"
}
export enum MotorcycleSort {
    customerName = "customerName",
    year = "year",
    brand = "brand",
    plate = "plate"
}
export enum MovementKind {
    adjustment = "adjustment",
    sale = "sale",
    purchase = "purchase"
}
export enum NotificationSource {
    pos = "pos",
    service = "service",
    order = "order",
    invoice = "invoice",
    quote = "quote"
}
export enum OrderStatus {
    cancelled = "cancelled",
    inRepair = "inRepair",
    delivered = "delivered",
    received = "received",
    ready = "ready"
}
export enum PartSort {
    sku = "sku",
    name = "name",
    createdAt = "createdAt",
    stock = "stock"
}
export enum PayableStatus {
    pending = "pending",
    paid = "paid",
    overdue = "overdue"
}
export enum PaymentCondition {
    cash = "cash",
    credit = "credit"
}
export enum PaymentMethod {
    mixed = "mixed",
    card = "card",
    cash = "cash",
    transfer = "transfer"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid"
}
export enum PurchaseInvoiceStatus {
    pending = "pending",
    withErrors = "withErrors",
    confirmed = "confirmed"
}
export enum QuoteSort {
    total = "total",
    customer = "customer",
    createdAt = "createdAt",
    number = "number"
}
export enum QuoteStatus {
    expired = "expired",
    sent = "sent",
    rejected = "rejected",
    accepted = "accepted",
    draft = "draft"
}
export enum ReceivableStatus {
    pending = "pending",
    paid = "paid",
    overdue = "overdue"
}
export enum ServiceSort {
    code = "code",
    name = "name",
    category = "category",
    laborRate = "laborRate"
}
export enum TaxResponsibility {
    agenteRetencionIva = "agenteRetencionIva",
    autorretenedor = "autorretenedor",
    noAplica = "noAplica",
    granContribuyente = "granContribuyente",
    regimenSimple = "regimenSimple"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WhatsAppContactKind {
    customer = "customer",
    supplier = "supplier"
}
export enum WhatsAppContext {
    service = "service",
    appointment = "appointment",
    order = "order",
    invoice = "invoice",
    quote = "quote",
    receivable = "receivable"
}
export interface backendInterface {
    addLabor(id: Id, input: LaborInput): Promise<OrderView>;
    addOrderPart(id: Id, input: OrderPartInput): Promise<OrderView>;
    addOrderPhoto(id: Id, input: OrderPhotoInput): Promise<OrderView>;
    adjustStock(input: AdjustmentInput): Promise<Movement>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignTechnician(id: Id, technicianId: Id): Promise<OrderView>;
    bulkCreateCustomers(inputs: Array<CustomerInput>): Promise<BulkResult>;
    bulkCreateParts(inputs: Array<PartInput>): Promise<BulkResult>;
    bulkCreateServices(inputs: Array<ServiceInput>): Promise<Array<Service>>;
    bulkUpdateCustomers(updates: Array<[Id, CustomerInput]>): Promise<BulkResult>;
    bulkUpdateParts(updates: Array<[Id, PartInput]>): Promise<BulkResult>;
    bulkUpdateServices(updates: Array<[Id, ServiceInput]>): Promise<Array<Service>>;
    cancelOrder(id: Id, reason: string): Promise<OrderView>;
    /**
     * / Completa la autorización OAuth con el código devuelto por Google.
     */
    completeDriveAuthorization(code: string, state: string): Promise<DriveAuthResult>;
    confirmPurchaseInvoice(invoiceId: Id): Promise<InvoiceApplyResult>;
    convertAppointmentToOrder(id: Id): Promise<OrderView>;
    convertQuoteToInvoice(id: Id, paymentMethod: PaymentMethod): Promise<Invoice>;
    convertQuoteToOrder(id: Id): Promise<OrderView>;
    createAppointment(input: AppointmentInput): Promise<Appointment>;
    /**
     * / Genera el respaldo y lo sube al Drive del administrador.
     */
    createBackup(): Promise<BackupOutcome>;
    createCustomer(input: CustomerInput): Promise<Customer>;
    createExpense(input: ExpenseInput): Promise<Expense>;
    createExpenseCategory(input: ExpenseCategoryInput): Promise<ExpenseCategory>;
    createInvoiceFromOrder(orderId: Id, paymentMethod: PaymentMethod, paymentCondition: PaymentCondition, creditPlan: CreditPlanInput | null): Promise<Invoice>;
    createInvoiceFromPosSale(posSaleId: Id, customerId: Id | null, customerName: string | null, lines: Array<InvoiceLine>, discount: Money, paymentMethod: PaymentMethod, paymentCondition: PaymentCondition, creditPlan: CreditPlanInput | null): Promise<Invoice>;
    createInvoiceFromQuote(quoteId: Id, customerId: Id, lines: Array<InvoiceLine>, discount: Money, paymentMethod: PaymentMethod, paymentCondition: PaymentCondition, creditPlan: CreditPlanInput | null): Promise<Invoice>;
    createMotorcycle(input: MotorcycleInput): Promise<Motorcycle>;
    createOrder(input: OrderInput): Promise<OrderView>;
    createPart(input: PartInput): Promise<PartView>;
    createPosSale(input: PosSaleInput): Promise<PosSale>;
    createPurchase(input: PurchaseInput): Promise<Purchase>;
    createPurchaseInvoiceDraft(input: CreateInvoiceInput): Promise<PurchaseInvoice>;
    createQuote(input: QuoteInput): Promise<QuoteView>;
    createService(input: ServiceInput): Promise<Service>;
    createServiceCategory(input: ServiceCategoryInput): Promise<ServiceCategory>;
    createSupplier(input: SupplierInput): Promise<Supplier>;
    createSupplierOrder(input: SupplierOrderInput): Promise<SupplierOrder>;
    createTechnician(input: TechnicianInput): Promise<Technician>;
    createTechnicianLoan(input: TechnicianLoanInput): Promise<TechnicianLoan>;
    deleteAppointment(id: Id): Promise<boolean>;
    deleteExpense(id: Id): Promise<boolean>;
    deleteExpenseCategory(id: Id): Promise<boolean>;
    deleteOrder(id: Id): Promise<boolean>;
    deleteQuote(id: Id): Promise<boolean>;
    deleteService(id: Id): Promise<boolean>;
    deleteServiceCategory(id: Id): Promise<boolean>;
    deleteTechnician(id: Id): Promise<boolean>;
    deleteTechnicianLoan(id: Id): Promise<boolean>;
    /**
     * / Revoca la conexión con Google Drive del administrador.
     */
    disconnectDrive(): Promise<void>;
    /**
     * / Genera la copia de seguridad local: devuelve el mismo JSON que el
     * / respaldo a Drive y el nombre del archivo con fecha y hora, para que el
     * / frontend lo descargue en el equipo del usuario. Es una **consulta** de
     * / solo lectura: no espera a ningún canister ni muta estado.
     */
    downloadLocalBackup(): Promise<LocalBackup>;
    execute(qJson: string): Promise<Result>;
    exportCustomersAggregated(): Promise<Array<CustomerExportRow>>;
    exportInventoryCsv(): Promise<Array<InventoryCsvRow>>;
    findTechnicianByCode(code: string): Promise<Technician | null>;
    getAccountingReport(period: AccountingPeriod): Promise<AccountingReport>;
    getAccountingSummary(period: AccountingPeriod): Promise<AccountingSummary>;
    getApiDoc(): Promise<string>;
    getAppointment(id: Id): Promise<Appointment | null>;
    getBusinessSettings(): Promise<BusinessSettings>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommissionPayment(id: Id): Promise<CommissionPayment | null>;
    getCommissionReport(period: CommissionPeriod): Promise<CommissionReport>;
    getCompanyProfile(): Promise<CompanyProfile>;
    getCustomer(id: Id): Promise<Customer | null>;
    getCustomerDetail(id: Id): Promise<CustomerDetail | null>;
    getDashboardSummary(): Promise<DashboardSummary>;
    /**
     * / Estado de la conexión con Google Drive del administrador. Es tolerante a
     * / credenciales ausentes: nunca lanza un trap por configuración faltante y
     * / siempre incluye `configuration` con las variables ausentes. Es una
     * / actualización (no consulta) porque lee las variables de entorno del
     * / canister, que requieren la capacidad `<system>`.
     */
    getDriveConnectionStatus(): Promise<DriveConnectionStatus>;
    getExpense(id: Id): Promise<Expense | null>;
    getExpenseCategory(id: Id): Promise<ExpenseCategory | null>;
    getExpenseSummary(filter: ExpenseFilter): Promise<ExpenseSummary>;
    getInventoryValuation(): Promise<InventoryValuation>;
    getInvoice(id: Id): Promise<Invoice | null>;
    getOrder(id: Id): Promise<OrderView | null>;
    getPart(id: Id): Promise<PartView | null>;
    getPayable(supplierId: Id): Promise<Payable | null>;
    getPosSale(id: Id): Promise<PosSale | null>;
    getPurchaseInvoice(invoiceId: Id): Promise<PurchaseInvoice | null>;
    getQuote(id: Id): Promise<QuoteView | null>;
    getReceivableSummary(): Promise<ReceivableSummary>;
    getService(id: Id): Promise<Service | null>;
    getServiceCategory(id: Id): Promise<ServiceCategory | null>;
    getSupplier(id: Id): Promise<Supplier | null>;
    getTechnician(id: Id): Promise<Technician | null>;
    getTechnicianCommissionSummary(technicianId: Id, period: CommissionPeriod): Promise<TechnicianCommissionSummary | null>;
    getTechnicianLoan(id: Id): Promise<TechnicianLoan | null>;
    getTechnicianWorkload(technicianId: Id): Promise<TechnicianWorkload | null>;
    importInventoryCsv(rows: Array<InventoryImportRow>): Promise<InventoryImportResult>;
    isCallerAdmin(): Promise<boolean>;
    listAppointments(filter: AppointmentFilter): Promise<Array<Appointment>>;
    /**
     * / Lista los respaldos recientes desde el Drive del administrador.
     */
    listBackups(): Promise<BackupListOutcome>;
    listCommissionLines(technicianId: Id | null, period: CommissionPeriod): Promise<Array<CommissionLine>>;
    listCommissionPayments(filter: CommissionPaymentFilter): Promise<Array<CommissionPayment>>;
    listCustomers(search: string | null): Promise<Array<Customer>>;
    listCustomersPage(filter: CustomerFilter, sort: CustomerSort, offset: bigint, limit: bigint): Promise<CustomerPage>;
    listCustomersPageDir(filter: CustomerFilter, sort: CustomerSort, descending: boolean, offset: bigint, limit: bigint): Promise<CustomerPage>;
    listExpenseCategories(filter: ExpenseCategoryFilter): Promise<Array<ExpenseCategoryUsage>>;
    listExpenses(filter: ExpenseFilter, offset: bigint, limit: bigint): Promise<ExpensePage>;
    listInvoices(filter: InvoiceFilter__1, offset: bigint, limit: bigint): Promise<InvoicePage__1>;
    listLedgerEntries(period: AccountingPeriod): Promise<Array<LedgerEntry>>;
    listLots(partId: Id): Promise<Array<Lot>>;
    listMotorcycleCountsByCustomers(ids: Array<Id>): Promise<Array<[Id, bigint]>>;
    listMotorcycles(customerId: Id): Promise<Array<Motorcycle>>;
    listMotorcyclesPage(filter: MotorcycleFilter, sort: MotorcycleSort, offset: bigint, limit: bigint): Promise<MotorcyclePage>;
    listMotorcyclesPageDir(filter: MotorcycleFilter, sort: MotorcycleSort, descending: boolean, offset: bigint, limit: bigint): Promise<MotorcyclePage>;
    listMovements(partId: Id): Promise<Array<Movement>>;
    listOrders(filter: OrderFilter, offset: bigint, limit: bigint): Promise<OrderPage>;
    listPartFacets(): Promise<PartFacets>;
    listParts(filter: PartFilter, sort: PartSort, offset: bigint, limit: bigint): Promise<PartPage>;
    listPartsDir(filter: PartFilter, sort: PartSort, descending: boolean, offset: bigint, limit: bigint): Promise<PartPage>;
    listPayables(): Promise<Array<Payable>>;
    listPayments(supplierId: Id | null): Promise<Array<Payment>>;
    listPosSales(filter: PosSaleFilter, offset: bigint, limit: bigint): Promise<PosSalePage>;
    listPurchaseInvoices(filter: InvoiceFilter, sort: InvoiceSort, offset: bigint, limit: bigint): Promise<InvoicePage>;
    listPurchases(supplierId: Id | null): Promise<Array<Purchase>>;
    listQuotes(filter: QuoteFilter, sort: QuoteSort, offset: bigint, limit: bigint): Promise<QuotePage>;
    listReceivables(filter: ReceivableFilter): Promise<Array<Receivable>>;
    listServiceCategories(filter: ServiceCategoryFilter): Promise<Array<ServiceCategoryUsage>>;
    listServices(filter: ServiceFilter, sort: ServiceSort, offset: bigint, limit: bigint): Promise<ServicePage>;
    listSupplierOrders(filter: SupplierOrderFilter): Promise<Array<SupplierOrder>>;
    listSuppliers(search: string | null): Promise<Array<Supplier>>;
    listTechnicianLoans(filter: TechnicianLoanFilter): Promise<Array<TechnicianLoan>>;
    listTechnicianWorkload(): Promise<Array<TechnicianWorkload>>;
    listTechnicians(filter: TechnicianFilter): Promise<Array<Technician>>;
    listUsers(): Promise<Array<UserView>>;
    lowStockParts(): Promise<Array<PartView>>;
    markInvoicePaid(id: Id, paymentMethod: PaymentMethod): Promise<Invoice>;
    notifyCustomer(input: CustomerNotificationInput): Promise<CustomerNotificationResult>;
    payTechnicianCommission(input: CommissionPaymentInput): Promise<CommissionPayment>;
    prepareWhatsAppMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageResult>;
    registerInstallmentPayment(id: Id, installmentNumber: bigint): Promise<Invoice>;
    registerPayment(input: PaymentInput): Promise<Payment>;
    registerReceivablePayment(input: ReceivablePaymentInput): Promise<ReceivablePayment>;
    removeLabor(id: Id, laborId: Id): Promise<OrderView>;
    removeOrderPart(id: Id, orderPartId: Id): Promise<OrderView>;
    removeOrderPhoto(id: Id, photoId: Id): Promise<OrderView>;
    runPurchaseInvoiceExtraction(invoiceId: Id): Promise<PurchaseInvoice>;
    saveCallerUserProfile(name: string): Promise<UserProfile>;
    schema(): Promise<string>;
    setUserRole(user: Principal, role: UserRole): Promise<UserView>;
    /**
     * / Inicia la autorización OAuth (PKCE) de la cuenta propia del
     * / administrador.
     */
    startDriveAuthorization(): Promise<DriveAuthStart>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unassignTechnician(id: Id, technicianId: Id): Promise<OrderView>;
    updateAppointment(id: Id, input: AppointmentInput): Promise<Appointment>;
    updateAppointmentStatus(id: Id, status: AppointmentStatus): Promise<Appointment>;
    updateBusinessSettings(settings: BusinessSettings): Promise<BusinessSettings>;
    updateCompanyProfile(input: CompanyProfileRawInput): Promise<CompanyProfile>;
    updateCustomer(id: Id, input: CustomerInput): Promise<Customer>;
    updateExpense(id: Id, input: ExpenseInput): Promise<Expense>;
    updateExpenseCategory(id: Id, input: ExpenseCategoryInput): Promise<ExpenseCategory>;
    updateLaborTechnician(id: Id, laborId: Id, technicianId: Id | null): Promise<OrderView>;
    updateMotorcycle(id: Id, input: MotorcycleInput): Promise<Motorcycle>;
    updateOrderStatus(id: Id, status: OrderStatus): Promise<OrderView>;
    updatePart(id: Id, input: PartInput): Promise<PartView>;
    updatePurchaseInvoiceReview(invoiceId: Id, input: InvoiceReviewInput): Promise<PurchaseInvoice>;
    updateQuote(id: Id, input: QuoteInput): Promise<QuoteView>;
    updateQuoteStatus(id: Id, status: QuoteStatus): Promise<QuoteView>;
    updateService(id: Id, input: ServiceInput): Promise<Service>;
    updateServiceCategory(id: Id, input: ServiceCategoryInput): Promise<ServiceCategory>;
    updateSupplier(id: Id, input: SupplierInput): Promise<Supplier>;
    updateTechnician(id: Id, input: TechnicianInput): Promise<Technician>;
    zeroInventory(): Promise<ZeroInventoryResult>;
    zeroServices(): Promise<ZeroServicesResult>;
}
