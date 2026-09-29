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
    totalCommissions: Money;
    expenseCount: bigint;
    invoiceCount: bigint;
    from?: Timestamp;
    totalIncome: Money;
    totalExpenses: Money;
    profit: bigint;
    netProfit: bigint;
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
export interface BackupSectionChunk {
    key: string;
    total: bigint;
    done: boolean;
    json: string;
    offset: bigint;
    limit: bigint;
    index: bigint;
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
export interface CashMovement {
    id: Id;
    paymentMethod: PaymentMethod;
    source: CashMovementSource;
    kind: CashMovementKind;
    reference?: string;
    description: string;
    account: CashAccount;
    timestamp: Timestamp;
    amount: Money;
    shiftId: Id;
}
export interface CashMovementFilter {
    to?: Timestamp;
    paymentMethod?: PaymentMethod;
    from?: Timestamp;
    kind?: CashMovementKind;
    account?: CashAccount;
    shiftId?: Id;
}
export interface CashMovementInput {
    paymentMethod: PaymentMethod;
    source: CashMovementSource;
    kind: CashMovementKind;
    reference?: string;
    description: string;
    account: CashAccount;
    amount: Money;
}
export interface CashMovementPage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<CashMovement>;
}
export interface CategoryBreakdown {
    total: Money;
    category: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface CloseShiftInput {
    notes?: string;
    declaredClosingBank: Money;
    declaredClosingCash: Money;
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
export interface DailyShiftReport {
    movements: Array<CashMovement>;
    bankIncome: Money;
    totalIncome: Money;
    byPaymentMethod: Array<PaymentMethodTotal>;
    shift: Shift;
    cashExpense: Money;
    cashIncome: Money;
    bankExpense: Money;
    totalExpense: Money;
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
export interface HopeMessage {
    mode: HopeMode;
    text: string;
    enabled: boolean;
    referenceDate: string;
    citation: string;
}
export interface HopeSettings {
    mode: HopeMode;
    enabled: boolean;
    updatedAt: Timestamp;
    manualText: string;
    manualCitation: string;
}
export interface HopeSettingsRawInput {
    mode: string;
    enabled: boolean;
    manualText: string;
    manualCitation: string;
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
    barcode: string;
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
    barcode: string;
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
export interface LocalBackupManifest {
    generatedAt: bigint;
    fileName: string;
    sections: Array<string>;
    maxPageSize: bigint;
    totalSections: bigint;
}
export interface LoginResult {
    token: string;
    expiresAt: Timestamp;
    user: SessionInfo;
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
export type ModuleKey = string;
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
export interface OpenShiftInput {
    openingBank: Money;
    openingCash: Money;
    notes?: string;
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
    barcode: string;
    category: string;
    salePrice: Money;
    brand: string;
    costPrice: Money;
}
export type PartLookupResult = {
    __kind__: "found";
    found: PartView;
} | {
    __kind__: "notFound";
    notFound: null;
};
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
    barcode: string;
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
export interface PaymentMethodTotal {
    method: PaymentMethod;
    expense: Money;
    income: Money;
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
export interface ProfitBlock {
    cost: Money;
    commission: Money;
    income: Money;
    margin: bigint;
    marginBps: BasisPoints;
}
export interface ProfitBreakdown {
    total: ProfitBlock;
    totalCommission: Money;
    serviceLines: Array<ServiceProfitLine>;
    parts: ProfitBlock;
    services: ProfitBlock;
    netProfit: bigint;
}
export interface Purchase {
    id: Id;
    total: Money;
    createdAt: Timestamp;
    items: Array<PurchaseItem>;
    accepted: boolean;
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
export interface ReminderAppointment {
    id: Id;
    customerName: string;
    status: string;
    customerId: Id;
    scheduledAt: Timestamp;
}
export interface ReminderFinishedOrder {
    id: Id;
    customerName: string;
    plate: string;
    orderNumber: string;
    daysInWorkshop: bigint;
}
export interface ReminderOrder {
    id: Id;
    customerName: string;
    plate: string;
    orderNumber: string;
}
export interface ReminderPayable {
    status: string;
    balance: Money;
    supplierName: string;
    dueDate: Timestamp;
    supplierId: Id;
}
export interface ReminderQuote {
    id: Id;
    customerName: string;
    status: string;
    createdAt: Timestamp;
    quoteNumber: string;
}
export interface ReminderReceivable {
    customerName: string;
    status: string;
    balance: Money;
    dueDate: Timestamp;
    invoiceId: Id;
    invoiceNumber: string;
}
export interface ReminderSection {
    count: bigint;
    items: Array<ReminderAppointment>;
}
export interface ReminderSection_1 {
    count: bigint;
    items: Array<ReminderFinishedOrder>;
}
export interface ReminderSection_2 {
    count: bigint;
    items: Array<ReminderPayable>;
}
export interface ReminderSection_3 {
    count: bigint;
    items: Array<ReminderQuote>;
}
export interface ReminderSection_4 {
    count: bigint;
    items: Array<ReminderReceivable>;
}
export interface ReminderSection_5 {
    count: bigint;
    items: Array<ReminderOrder>;
}
export interface RemindersSummary {
    payables?: ReminderSection_2;
    generatedAt: Timestamp;
    unapprovedOrders?: ReminderSection_5;
    appointments?: ReminderSection;
    finishedOrders?: ReminderSection_1;
    receivables?: ReminderSection_4;
    pendingQuotes?: ReminderSection_3;
}
export interface ResetPasswordResult {
    userId: Id;
    temporaryPassword: string;
}
export type RestoreError = {
    __kind__: "invalidFormat";
    invalidFormat: string;
} | {
    __kind__: "invalidSection";
    invalidSection: string;
} | {
    __kind__: "incompatibleVersion";
    incompatibleVersion: bigint;
} | {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "noKnownSections";
    noKnownSections: null;
} | {
    __kind__: "unknownSection";
    unknownSection: string;
};
export interface RestorePreview {
    generatedAt: bigint;
    formatVersion: bigint;
    sections: Array<RestoreSectionInfo>;
    totalSections: bigint;
}
export type RestorePreviewOutcome = {
    __kind__: "ok";
    ok: RestorePreview;
} | {
    __kind__: "err";
    err: RestoreError;
};
export interface RestoreSectionInfo {
    key: string;
    count: bigint;
    index: bigint;
}
export type RestoreSectionOutcome = {
    __kind__: "ok";
    ok: RestoreSectionResult;
} | {
    __kind__: "err";
    err: RestoreError;
};
export interface RestoreSectionResult {
    key: string;
    status: RestoreSectionStatus;
    index: bigint;
    restored: bigint;
}
export type RestoreSectionStatus = {
    __kind__: "skipped";
    skipped: null;
} | {
    __kind__: "error";
    error: string;
} | {
    __kind__: "restored";
    restored: null;
};
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
export interface Role {
    id: Id;
    kind: RoleKind;
    name: string;
    createdAt: Timestamp;
    modules: Array<ModuleKey>;
}
export interface RoleInput {
    name: string;
    modules: Array<ModuleKey>;
}
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
export interface ServiceTermsSettings {
    text: string;
    updatedAt: Timestamp;
}
export interface ServiceTermsSettingsRawInput {
    text: string;
}
export interface SessionInfo {
    roleName: string;
    username: string;
    userId: Id;
    name: string;
    roleId: Id;
    modules: Array<ModuleKey>;
}
export interface Shift {
    id: Id;
    status: ShiftStatus;
    openingBank: Money;
    openingCash: Money;
    differenceBank: bigint;
    differenceCash: bigint;
    closedAt?: Timestamp;
    closedBy?: Principal;
    notes?: string;
    declaredClosingBank?: Money;
    declaredClosingCash?: Money;
    computedClosingBank: Money;
    computedClosingCash: Money;
    openedAt: Timestamp;
    openedBy: Principal;
}
export interface ShiftFilter {
    to?: Timestamp;
    status?: ShiftStatus;
    from?: Timestamp;
}
export interface ShiftPage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<Shift>;
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
export interface UserListItem {
    id: Id;
    roleName: string;
    active: boolean;
    username: string;
    name: string;
    createdAt: Timestamp;
    roleId: Id;
}
export interface UserPage {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<UserListItem>;
}
export interface UserProfile {
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
export interface WarrantyTermsSettings {
    text: string;
    updatedAt: Timestamp;
}
export interface WarrantyTermsSettingsRawInput {
    text: string;
}
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
export enum CashAccount {
    bank = "bank",
    cash = "cash"
}
export enum CashMovementKind {
    expense = "expense",
    income = "income"
}
export enum CashMovementSource {
    pos = "pos",
    expense = "expense",
    other = "other",
    invoice = "invoice",
    commission = "commission",
    receivable = "receivable",
    manual = "manual",
    purchase = "purchase"
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
export enum HopeMode {
    auto = "auto",
    manual = "manual"
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
    commission = "commission",
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
export enum RoleKind {
    custom = "custom",
    builtin = "builtin"
}
export enum ServiceSort {
    code = "code",
    name = "name",
    category = "category",
    laborRate = "laborRate"
}
export enum ShiftStatus {
    closed = "closed",
    open = "open"
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
    addLabor(token: string | null, id: Id, input: LaborInput): Promise<OrderView>;
    addOrderPart(token: string | null, id: Id, input: OrderPartInput): Promise<OrderView>;
    addOrderPhoto(token: string | null, id: Id, input: OrderPhotoInput): Promise<OrderView>;
    adjustStock(token: string | null, input: AdjustmentInput): Promise<Movement>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignTechnician(token: string | null, id: Id, technicianId: Id): Promise<OrderView>;
    bulkCreateCustomers(token: string | null, inputs: Array<CustomerInput>): Promise<BulkResult>;
    bulkCreateParts(token: string | null, inputs: Array<PartInput>): Promise<BulkResult>;
    bulkCreateServices(token: string | null, inputs: Array<ServiceInput>): Promise<Array<Service>>;
    bulkUpdateCustomers(token: string | null, updates: Array<[Id, CustomerInput]>): Promise<BulkResult>;
    bulkUpdateParts(token: string | null, updates: Array<[Id, PartInput]>): Promise<BulkResult>;
    bulkUpdateServices(token: string | null, updates: Array<[Id, ServiceInput]>): Promise<Array<Service>>;
    cancelOrder(token: string | null, id: Id, reason: string): Promise<OrderView>;
    changeOwnPassword(token: string, currentPassword: string, newPassword: string): Promise<boolean>;
    closeShift(token: string | null, id: Id, input: CloseShiftInput): Promise<Shift>;
    /**
     * / Completa la autorización OAuth con el código devuelto por Google.
     */
    completeDriveAuthorization(token: string | null, code: string, state: string): Promise<DriveAuthResult>;
    confirmPurchaseInvoice(token: string | null, invoiceId: Id): Promise<InvoiceApplyResult>;
    convertAppointmentToOrder(token: string | null, id: Id): Promise<OrderView>;
    convertQuoteToInvoice(token: string | null, id: Id, paymentMethod: PaymentMethod): Promise<Invoice>;
    convertQuoteToOrder(token: string | null, id: Id): Promise<OrderView>;
    createAppointment(token: string | null, input: AppointmentInput): Promise<Appointment>;
    /**
     * / Genera el respaldo y lo sube al Drive del administrador.
     */
    createBackup(token: string | null): Promise<BackupOutcome>;
    createCustomer(token: string | null, input: CustomerInput): Promise<Customer>;
    createExpense(token: string | null, input: ExpenseInput): Promise<Expense>;
    createExpenseCategory(token: string | null, input: ExpenseCategoryInput): Promise<ExpenseCategory>;
    createInvoiceFromOrder(token: string | null, orderId: Id, paymentMethod: PaymentMethod, paymentCondition: PaymentCondition, creditPlan: CreditPlanInput | null): Promise<Invoice>;
    createInvoiceFromPosSale(token: string | null, posSaleId: Id, customerId: Id | null, customerName: string | null, lines: Array<InvoiceLine>, discount: Money, paymentMethod: PaymentMethod, paymentCondition: PaymentCondition, creditPlan: CreditPlanInput | null): Promise<Invoice>;
    createInvoiceFromQuote(token: string | null, quoteId: Id, customerId: Id, lines: Array<InvoiceLine>, discount: Money, paymentMethod: PaymentMethod, paymentCondition: PaymentCondition, creditPlan: CreditPlanInput | null): Promise<Invoice>;
    createMotorcycle(token: string | null, input: MotorcycleInput): Promise<Motorcycle>;
    createOrder(token: string | null, input: OrderInput): Promise<OrderView>;
    createPart(token: string | null, input: PartInput): Promise<PartView>;
    createPosSale(token: string | null, input: PosSaleInput): Promise<PosSale>;
    createPurchase(token: string | null, input: PurchaseInput): Promise<Purchase>;
    createPurchaseInvoiceDraft(token: string | null, input: CreateInvoiceInput): Promise<PurchaseInvoice>;
    createQuote(token: string | null, input: QuoteInput): Promise<QuoteView>;
    createRole(token: string | null, input: RoleInput): Promise<Role>;
    createService(token: string | null, input: ServiceInput): Promise<Service>;
    createServiceCategory(token: string | null, input: ServiceCategoryInput): Promise<ServiceCategory>;
    createSupplier(token: string | null, input: SupplierInput): Promise<Supplier>;
    createSupplierOrder(token: string | null, input: SupplierOrderInput): Promise<SupplierOrder>;
    createTechnician(token: string | null, input: TechnicianInput): Promise<Technician>;
    createTechnicianLoan(token: string | null, input: TechnicianLoanInput): Promise<TechnicianLoan>;
    createUser(token: string | null, username: string, name: string, roleId: Id, temporaryPassword: string): Promise<UserListItem>;
    deleteAppointment(token: string | null, id: Id): Promise<boolean>;
    deleteExpense(token: string | null, id: Id): Promise<boolean>;
    deleteExpenseCategory(token: string | null, id: Id): Promise<boolean>;
    deleteInvoice(token: string | null, id: Id): Promise<boolean>;
    deleteOrder(token: string | null, id: Id): Promise<boolean>;
    deletePurchase(token: string | null, id: Id): Promise<boolean>;
    deleteQuote(token: string | null, id: Id): Promise<boolean>;
    deleteRole(token: string | null, roleId: Id): Promise<boolean>;
    deleteService(token: string | null, id: Id): Promise<boolean>;
    deleteServiceCategory(token: string | null, id: Id): Promise<boolean>;
    deleteTechnician(token: string | null, id: Id): Promise<boolean>;
    deleteTechnicianLoan(token: string | null, id: Id): Promise<boolean>;
    deleteUser(token: string | null, userId: Id): Promise<boolean>;
    /**
     * / Revoca la conexión con Google Drive del administrador.
     */
    disconnectDrive(token: string | null): Promise<void>;
    execute(qJson: string): Promise<Result>;
    exportCustomersAggregated(token: string | null): Promise<Array<CustomerExportRow>>;
    exportInventoryCsv(token: string | null): Promise<Array<InventoryCsvRow>>;
    /**
     * / Busca un repuesto por **código de barras o SKU**. La comparación ignora
     * / mayúsculas y espacios externos; el código de barras tiene prioridad sobre
     * / el SKU. Devuelve `#found` con la vista del repuesto o `#notFound` cuando
     * / el código está vacío o no coincide con ningún repuesto. Es la vía que usa
     * / el lector de códigos de barras del POS y de los demás formatos.
     */
    findPartByCode(token: string | null, code: string): Promise<PartLookupResult>;
    findTechnicianByCode(token: string | null, code: string): Promise<Technician | null>;
    getAccountingReport(token: string | null, period: AccountingPeriod): Promise<AccountingReport>;
    getAccountingSummary(token: string | null, period: AccountingPeriod): Promise<AccountingSummary>;
    getApiDoc(): Promise<string>;
    getAppointment(token: string | null, id: Id): Promise<Appointment | null>;
    /**
     * / Devuelve una página de una sección del respaldo. `index` es la posición
     * / dentro de `manifest.sections`; `offset` y `limit` paginan las secciones de
     * / colección (las de un único registro los ignoran). `limit` se acota a
     * / `manifest.maxPageSize`. El frontend concatena las páginas de cada sección
     * / hasta que `done` sea `true`.
     * /
     * / Es una **consulta** de solo lectura: serializa únicamente la página
     * / pedida, de modo que ninguna llamada se acerca al límite de instrucciones
     * / por mensaje.
     */
    getBackupSection(token: string | null, index: bigint, offset: bigint, limit: bigint): Promise<BackupSectionChunk>;
    getBusinessSettings(token: string | null): Promise<BusinessSettings>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommissionPayment(token: string | null, id: Id): Promise<CommissionPayment | null>;
    getCommissionReport(token: string | null, period: CommissionPeriod): Promise<CommissionReport>;
    getCompanyProfile(token: string | null): Promise<CompanyProfile>;
    getCustomer(token: string | null, id: Id): Promise<Customer | null>;
    getCustomerDetail(token: string | null, id: Id): Promise<CustomerDetail | null>;
    getDailyHopeMessage(): Promise<HopeMessage>;
    getDailyShiftReport(token: string | null, shiftId: Id): Promise<DailyShiftReport>;
    getDashboardSummary(token: string | null): Promise<DashboardSummary>;
    /**
     * / Estado de la conexión con Google Drive del administrador. Es tolerante a
     * / credenciales ausentes: nunca lanza un trap por configuración faltante y
     * / siempre incluye `configuration` con las variables ausentes. Es una
     * / actualización (no consulta) porque lee las variables de entorno del
     * / canister, que requieren la capacidad `<system>`.
     */
    getDriveConnectionStatus(token: string | null): Promise<DriveConnectionStatus>;
    getExpense(token: string | null, id: Id): Promise<Expense | null>;
    getExpenseCategory(token: string | null, id: Id): Promise<ExpenseCategory | null>;
    getExpenseSummary(token: string | null, filter: ExpenseFilter): Promise<ExpenseSummary>;
    getHopeSettings(token: string | null): Promise<HopeSettings>;
    getInventoryValuation(token: string | null): Promise<InventoryValuation>;
    getInvoice(token: string | null, id: Id): Promise<Invoice | null>;
    /**
     * / Manifiesto de la copia de seguridad local: devuelve el nombre del archivo,
     * / el momento de generación y el plan ordenado de secciones, **sin**
     * / serializar ningún dato. Es una **consulta** de solo lectura.
     * /
     * / El frontend arma el JSON raíz así:
     * / `{ "generatedAt": <generatedAt>, "<sections[0]>": <valor>, ... }`, donde
     * / cada valor se obtiene con `getBackupSection(index, offset, limit)`.
     */
    getLocalBackupManifest(token: string | null): Promise<LocalBackupManifest>;
    getOpenShift(token: string | null): Promise<Shift | null>;
    getOrder(token: string | null, id: Id): Promise<OrderView | null>;
    getPart(token: string | null, id: Id): Promise<PartView | null>;
    getPayable(token: string | null, supplierId: Id): Promise<Payable | null>;
    getPosSale(token: string | null, id: Id): Promise<PosSale | null>;
    getPurchaseInvoice(token: string | null, invoiceId: Id): Promise<PurchaseInvoice | null>;
    getQuote(token: string | null, id: Id): Promise<QuoteView | null>;
    getReceivableSummary(token: string | null): Promise<ReceivableSummary>;
    getRemindersSummary(token: string | null): Promise<RemindersSummary>;
    getService(token: string | null, id: Id): Promise<Service | null>;
    getServiceCategory(token: string | null, id: Id): Promise<ServiceCategory | null>;
    getServiceTermsSettings(token: string | null): Promise<ServiceTermsSettings>;
    getSession(token: string): Promise<SessionInfo | null>;
    getShift(token: string | null, id: Id): Promise<Shift | null>;
    getSupplier(token: string | null, id: Id): Promise<Supplier | null>;
    getTechnician(token: string | null, id: Id): Promise<Technician | null>;
    getTechnicianCommissionSummary(token: string | null, technicianId: Id, period: CommissionPeriod): Promise<TechnicianCommissionSummary | null>;
    getTechnicianLoan(token: string | null, id: Id): Promise<TechnicianLoan | null>;
    getTechnicianWorkload(token: string | null, technicianId: Id): Promise<TechnicianWorkload | null>;
    getWarrantyTermsSettings(token: string | null): Promise<WarrantyTermsSettings>;
    importInventoryCsv(token: string | null, rows: Array<InventoryImportRow>): Promise<InventoryImportResult>;
    isCallerAdmin(): Promise<boolean>;
    listAppointments(token: string | null, filter: AppointmentFilter): Promise<Array<Appointment>>;
    /**
     * / Lista los respaldos recientes desde el Drive del administrador.
     */
    listBackups(token: string | null): Promise<BackupListOutcome>;
    listCashMovements(token: string | null, filter: CashMovementFilter, offset: bigint, limit: bigint): Promise<CashMovementPage>;
    listCommissionLines(token: string | null, technicianId: Id | null, period: CommissionPeriod): Promise<Array<CommissionLine>>;
    listCommissionPayments(token: string | null, filter: CommissionPaymentFilter): Promise<Array<CommissionPayment>>;
    listCustomers(token: string | null, search: string | null): Promise<Array<Customer>>;
    listCustomersPage(token: string | null, filter: CustomerFilter, sort: CustomerSort, offset: bigint, limit: bigint): Promise<CustomerPage>;
    listCustomersPageDir(token: string | null, filter: CustomerFilter, sort: CustomerSort, descending: boolean, offset: bigint, limit: bigint): Promise<CustomerPage>;
    listExpenseCategories(token: string | null, filter: ExpenseCategoryFilter): Promise<Array<ExpenseCategoryUsage>>;
    listExpenses(token: string | null, filter: ExpenseFilter, offset: bigint, limit: bigint): Promise<ExpensePage>;
    listInvoices(token: string | null, filter: InvoiceFilter__1, offset: bigint, limit: bigint): Promise<InvoicePage__1>;
    listLedgerEntries(token: string | null, period: AccountingPeriod): Promise<Array<LedgerEntry>>;
    listLots(token: string | null, partId: Id): Promise<Array<Lot>>;
    listMotorcycleCountsByCustomers(token: string | null, ids: Array<Id>): Promise<Array<[Id, bigint]>>;
    listMotorcycles(token: string | null, customerId: Id): Promise<Array<Motorcycle>>;
    listMotorcyclesPage(token: string | null, filter: MotorcycleFilter, sort: MotorcycleSort, offset: bigint, limit: bigint): Promise<MotorcyclePage>;
    listMotorcyclesPageDir(token: string | null, filter: MotorcycleFilter, sort: MotorcycleSort, descending: boolean, offset: bigint, limit: bigint): Promise<MotorcyclePage>;
    listMovements(token: string | null, partId: Id): Promise<Array<Movement>>;
    listOrders(token: string | null, filter: OrderFilter, offset: bigint, limit: bigint): Promise<OrderPage>;
    listPartFacets(token: string | null): Promise<PartFacets>;
    listParts(token: string | null, filter: PartFilter, sort: PartSort, offset: bigint, limit: bigint): Promise<PartPage>;
    listPartsDir(token: string | null, filter: PartFilter, sort: PartSort, descending: boolean, offset: bigint, limit: bigint): Promise<PartPage>;
    listPayables(token: string | null): Promise<Array<Payable>>;
    listPayments(token: string | null, supplierId: Id | null): Promise<Array<Payment>>;
    listPosSales(token: string | null, filter: PosSaleFilter, offset: bigint, limit: bigint): Promise<PosSalePage>;
    listPurchaseInvoices(token: string | null, filter: InvoiceFilter, sort: InvoiceSort, offset: bigint, limit: bigint): Promise<InvoicePage>;
    listPurchases(token: string | null, supplierId: Id | null): Promise<Array<Purchase>>;
    listQuotes(token: string | null, filter: QuoteFilter, sort: QuoteSort, offset: bigint, limit: bigint): Promise<QuotePage>;
    listReceivables(token: string | null, filter: ReceivableFilter): Promise<Array<Receivable>>;
    listRoles(token: string | null): Promise<Array<Role>>;
    listServiceCategories(token: string | null, filter: ServiceCategoryFilter): Promise<Array<ServiceCategoryUsage>>;
    listServices(token: string | null, filter: ServiceFilter, sort: ServiceSort, offset: bigint, limit: bigint): Promise<ServicePage>;
    listShifts(token: string | null, filter: ShiftFilter, offset: bigint, limit: bigint): Promise<ShiftPage>;
    listSupplierOrders(token: string | null, filter: SupplierOrderFilter): Promise<Array<SupplierOrder>>;
    listSuppliers(token: string | null, search: string | null): Promise<Array<Supplier>>;
    listTechnicianLoans(token: string | null, filter: TechnicianLoanFilter): Promise<Array<TechnicianLoan>>;
    listTechnicianWorkload(token: string | null): Promise<Array<TechnicianWorkload>>;
    listTechnicians(token: string | null, filter: TechnicianFilter): Promise<Array<Technician>>;
    listUsersPage(token: string | null, search: string | null, offset: bigint, limit: bigint): Promise<UserPage>;
    login(username: string, password: string): Promise<LoginResult>;
    logout(token: string): Promise<boolean>;
    lowStockParts(token: string | null): Promise<Array<PartView>>;
    markInvoicePaid(token: string | null, id: Id, paymentMethod: PaymentMethod): Promise<Invoice>;
    notifyCustomer(input: CustomerNotificationInput): Promise<CustomerNotificationResult>;
    openShift(token: string | null, input: OpenShiftInput): Promise<Shift>;
    payTechnicianCommission(token: string | null, input: CommissionPaymentInput): Promise<CommissionPayment>;
    prepareWhatsAppMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageResult>;
    registerCashMovement(token: string | null, input: CashMovementInput): Promise<CashMovement>;
    registerInstallmentPayment(token: string | null, id: Id, installmentNumber: bigint): Promise<Invoice>;
    registerPayment(token: string | null, input: PaymentInput): Promise<Payment>;
    registerReceivablePayment(token: string | null, input: ReceivablePaymentInput): Promise<ReceivablePayment>;
    removeLabor(token: string | null, id: Id, laborId: Id): Promise<OrderView>;
    removeOrderPart(token: string | null, id: Id, orderPartId: Id): Promise<OrderView>;
    removeOrderPhoto(token: string | null, id: Id, photoId: Id): Promise<OrderView>;
    resetUserPassword(token: string | null, userId: Id): Promise<ResetPasswordResult>;
    /**
     * / Restaura **una** sección del archivo de copia local, sobrescribiendo solo
     * / esa colección. `index` es la posición dentro de `manifest.sections`
     * / (el mismo orden de `SECTION_KEYS`). El frontend llama una vez por sección
     * / seleccionada, de modo que ninguna llamada procesa el archivo completo y
     * / se respeta el límite de instrucciones por mensaje.
     * /
     * / Un archivo inválido, una versión incompatible o una sección con formato
     * / incorrecto se rechazan con un error tipado **sin alterar los datos**.
     */
    restoreSection(token: string | null, json: string, index: bigint): Promise<RestoreSectionOutcome>;
    runPurchaseInvoiceExtraction(token: string | null, invoiceId: Id): Promise<PurchaseInvoice>;
    saveCallerUserProfile(name: string): Promise<UserProfile>;
    schema(): Promise<string>;
    setUserActive(token: string | null, userId: Id, active: boolean): Promise<UserListItem>;
    /**
     * / Inicia la autorización OAuth (PKCE) de la cuenta propia del
     * / administrador.
     */
    startDriveAuthorization(token: string | null): Promise<DriveAuthStart>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unassignTechnician(token: string | null, id: Id, technicianId: Id): Promise<OrderView>;
    updateAppointment(token: string | null, id: Id, input: AppointmentInput): Promise<Appointment>;
    updateAppointmentStatus(token: string | null, id: Id, status: AppointmentStatus): Promise<Appointment>;
    updateBusinessSettings(token: string | null, settings: BusinessSettings): Promise<BusinessSettings>;
    updateCallerName(token: string, name: string): Promise<SessionInfo>;
    updateCompanyProfile(token: string | null, input: CompanyProfileRawInput): Promise<CompanyProfile>;
    updateCustomer(token: string | null, id: Id, input: CustomerInput): Promise<Customer>;
    updateExpense(token: string | null, id: Id, input: ExpenseInput): Promise<Expense>;
    updateExpenseCategory(token: string | null, id: Id, input: ExpenseCategoryInput): Promise<ExpenseCategory>;
    updateHopeSettings(token: string | null, input: HopeSettingsRawInput): Promise<HopeSettings>;
    updateLaborTechnician(token: string | null, id: Id, laborId: Id, technicianId: Id | null): Promise<OrderView>;
    updateMotorcycle(token: string | null, id: Id, input: MotorcycleInput): Promise<Motorcycle>;
    updateOrderStatus(token: string | null, id: Id, status: OrderStatus): Promise<OrderView>;
    updatePart(token: string | null, id: Id, input: PartInput): Promise<PartView>;
    updatePurchaseInvoiceReview(token: string | null, invoiceId: Id, input: InvoiceReviewInput): Promise<PurchaseInvoice>;
    updateQuote(token: string | null, id: Id, input: QuoteInput): Promise<QuoteView>;
    updateQuoteStatus(token: string | null, id: Id, status: QuoteStatus): Promise<QuoteView>;
    updateRole(token: string | null, roleId: Id, input: RoleInput): Promise<Role>;
    updateService(token: string | null, id: Id, input: ServiceInput): Promise<Service>;
    updateServiceCategory(token: string | null, id: Id, input: ServiceCategoryInput): Promise<ServiceCategory>;
    updateServiceTermsSettings(token: string | null, input: ServiceTermsSettingsRawInput): Promise<ServiceTermsSettings>;
    updateSupplier(token: string | null, id: Id, input: SupplierInput): Promise<Supplier>;
    updateTechnician(token: string | null, id: Id, input: TechnicianInput): Promise<Technician>;
    updateUserRole(token: string | null, userId: Id, roleId: Id): Promise<UserListItem>;
    updateWarrantyTermsSettings(token: string | null, input: WarrantyTermsSettingsRawInput): Promise<WarrantyTermsSettings>;
    /**
     * / Valida un archivo de copia local y devuelve su vista previa (fecha de
     * / generación y secciones presentes) **sin alterar ningún dato**. El
     * / frontend la usa para mostrar la confirmación antes de restaurar.
     * /
     * / Es una **actualización** (no consulta) porque recibe el contenido del
     * / archivo como parámetro; no modifica el estado.
     */
    validateRestoreFile(token: string | null, json: string): Promise<RestorePreviewOutcome>;
    zeroInventory(token: string | null): Promise<ZeroInventoryResult>;
    zeroServices(token: string | null): Promise<ZeroServicesResult>;
}
