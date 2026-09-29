import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import OQL "mo:caffeineai-oql";

// OQL resolver modules — imported top-level in the file that declares
// entities, because `.toEntity` / `.sample` / `.build` and the structural
// `_toRow` derivation resolve against top-level imports only.
import MapEntity "mo:caffeineai-oql/MapEntity";
import SetEntity "mo:caffeineai-oql/SetEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";

// Per-type `_toRow` instances for the non-primitive fields of the exposed
// records (options and variants).
import OptTextValue "OptTextValue";
import OptIdValue "OptIdValue";
import OptMoneyValue "OptMoneyValue";
import OptTimestampValue "OptTimestampValue";
import MovementKindValue "MovementKindValue";
import OrderStatusValue "OrderStatusValue";
import PaymentMethodValue "PaymentMethodValue";
import PaymentStatusValue "PaymentStatusValue";
import UserRoleValue "UserRoleValue";
import RoleKindValue "RoleKindValue";
import OrderPartListValue "OrderPartListValue";
import LaborItemListValue "LaborItemListValue";
import OrderPhotoListValue "OrderPhotoListValue";
import StatusChangeListValue "StatusChangeListValue";
import PurchaseItemListValue "PurchaseItemListValue";
import InvoiceLineListValue "InvoiceLineListValue";
import InvoiceOriginValue "InvoiceOriginValue";
import TechnicianIdListValue "TechnicianIdListValue";
import QuoteStatusValue "QuoteStatusValue";
import QuotePartLineListValue "QuotePartLineListValue";
import QuoteServiceLineListValue "QuoteServiceLineListValue";
import AppointmentStatusValue "AppointmentStatusValue";
import PosSaleLineListValue "PosSaleLineListValue";
import CommissionPeriodValue "CommissionPeriodValue";
import CommissionPaymentLoanListValue "CommissionPaymentLoanListValue";
import PaymentConditionValue "PaymentConditionValue";
import InstallmentPlanValue "InstallmentPlanValue";
import CommissionLineListValue "CommissionLineListValue";
import ExtractionStatusValue "ExtractionStatusValue";
import PurchaseInvoiceStatusValue "PurchaseInvoiceStatusValue";
import InvoiceFileKindValue "InvoiceFileKindValue";
import OptPrincipalValue "OptPrincipalValue";
import ModuleKeyListValue "ModuleKeyListValue";
import ShiftStatusValue "ShiftStatusValue";
import CashMovementKindValue "CashMovementKindValue";
import CashAccountValue "CashAccountValue";
import CashMovementSourceValue "CashMovementSourceValue";

import Common "types/common";
import InventoryTypes "types/inventory";
import CustomerTypes "types/customers";
import WorkshopTypes "types/workshop";
import PurchasingTypes "types/purchasing";
import BillingTypes "types/billing";
import UserTypes "types/users";
import QuoteTypes "types/quotes";
import ServiceTypes "types/services";
import ServiceCategoryTypes "types/service-categories";
import TechnicianTypes "types/technicians";
import CommissionTypes "types/commissions";
import CommissionLineKey "types/commission-line-key";
import CompanyTypes "types/company";
import AppointmentTypes "types/appointments";
import ExpenseTypes "types/expenses";
import ExpenseCategoryTypes "types/expense-categories";
import PosTypes "types/pos";
import ReceivableTypes "types/receivables";
import SupplierOrderTypes "types/supplier-orders";
import PurchaseInvoiceIntakeTypes "types/purchase-invoice-intake";
import BackupTypes "types/backup";
import CashTypes "types/cash";

import InventoryApi "mixins/inventory-api";
import CustomersApi "mixins/customers-api";
import WorkshopApi "mixins/workshop-api";
import PurchasingApi "mixins/purchasing-api";
import BillingApi "mixins/billing-api";
import DashboardApi "mixins/dashboard-api";
import UsersApi "mixins/users-api";
import QuotesApi "mixins/quotes-api";
import ServicesApi "mixins/services-api";
import ServiceCategoriesApi "mixins/service-categories-api";
import TechniciansApi "mixins/technicians-api";
import CommissionsApi "mixins/commissions-api";
import CompanyApi "mixins/company-api";
import AppointmentsApi "mixins/appointments-api";
import ExpensesApi "mixins/expenses-api";
import ExpenseCategoriesApi "mixins/expense-categories-api";
import AccountingApi "mixins/accounting-api";
import PosApi "mixins/pos-api";
import ReceivablesApi "mixins/receivables-api";
import RemindersApi "mixins/reminders-api";
import SupplierOrdersApi "mixins/supplier-orders-api";
import PurchaseInvoiceIntakeApi "mixins/purchase-invoice-intake-api";
import CashApi "mixins/cash-api";
import NotificationsApi "mixins/notifications-api";
import HopeApi "mixins/hope-api";
import ServiceTermsApi "mixins/service-terms-api";
import WarrantyTermsApi "mixins/warranty-terms-api";
import BackupApi "mixins/backup-api";
import BackupLib "lib/backup";
import ApiDocMixin "mixins/api-doc";
import HopeTypes "types/hope";
import ServiceTermsTypes "types/service-terms";
import WarrantyTermsTypes "types/warranty-terms";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // Almacenamiento de archivos de la plataforma: provee los métodos
  // `_immutableObjectStorage*` que el gateway usa para subir y servir los
  // bytes de las fotos de evidencia de las órdenes de taller.
  include MixinObjectStorage();

  let parts : Map.Map<Common.Id, InventoryTypes.Part>;
  let lots : Map.Map<Common.Id, InventoryTypes.Lot>;
  let movements : Map.Map<Common.Id, InventoryTypes.Movement>;

  let customers : Map.Map<Common.Id, CustomerTypes.Customer>;
  let motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>;

  let orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;

  let suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>;
  let purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>;
  let payments : Map.Map<Common.Id, PurchasingTypes.Payment>;

  let invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
  let businessSettings : { var settings : BillingTypes.BusinessSettings };

  let userProfiles : Map.Map<Principal, UserTypes.UserProfile>;

  // Acceso con usuario y contraseña: credenciales (hash + sal), sesiones
  // opacas con vencimiento y roles editables. Estado nuevo; `userProfiles`
  // se conserva intacto.
  let credentials : Map.Map<Common.Id, UserTypes.Credential>;
  let sessions : Map.Map<Text, UserTypes.Session>;
  let roles : Map.Map<Common.Id, UserTypes.Role>;
  let userCounters : { var nextUserId : Nat; var nextRoleId : Nat };

  // ── Nuevos módulos ──────────────────────────────────────────────────────
  let quotes : Map.Map<Common.Id, QuoteTypes.Quote>;
  let services : Map.Map<Common.Id, ServiceTypes.Service>;
  let serviceCategories : Map.Map<Common.Id, ServiceCategoryTypes.ServiceCategory>;
  let technicians : Map.Map<Common.Id, TechnicianTypes.Technician>;
  let technicianLoans : Map.Map<Common.Id, CommissionTypes.TechnicianLoan>;
  let commissionPayments : Map.Map<Common.Id, CommissionTypes.CommissionPayment>;
  let paidCommissionLines : Set.Set<CommissionLineKey.CommissionLineKey>;
  let company : { var profile : CompanyTypes.CompanyProfile };
  let appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>;
  let expenses : Map.Map<Common.Id, ExpenseTypes.Expense>;
  let expenseCategories : Map.Map<Common.Id, ExpenseCategoryTypes.ExpenseCategory>;
  let posSales : Map.Map<Common.Id, PosTypes.PosSale>;
  let receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>;
  let supplierOrders : Map.Map<Common.Id, SupplierOrderTypes.SupplierOrder>;

  // Facturas de compra cargadas en PDF o foto para actualizar el inventario.
  let purchaseInvoices : Map.Map<Common.Id, PurchaseInvoiceIntakeTypes.PurchaseInvoice>;

  // Caja y Bancos: turnos y movimientos de tesorería.
  let shifts : Map.Map<Common.Id, CashTypes.Shift>;
  let cashMovements : Map.Map<Common.Id, CashTypes.CashMovement>;

  // Credenciales OAuth de Google Drive del administrador (respaldo manual).
  let driveCredentials : { var credentials : ?BackupTypes.DriveCredentials };

  // Mensaje diario de esperanza bíblica: configuración persistente (fila única).
  let hope : { var settings : HopeTypes.HopeSettings };

  // Pie de página editable «Términos y condiciones del Servicio» (fila única).
  let serviceTerms : { var settings : ServiceTermsTypes.ServiceTermsSettings };

  // Términos y Condiciones de Garantía editables (fila única).
  let warrantyTerms : { var settings : WarrantyTermsTypes.WarrantyTermsSettings };

  let counters : {
    var nextPartId : Nat;
    var nextLotId : Nat;
    var nextMovementId : Nat;
    var nextCustomerId : Nat;
    var nextMotorcycleId : Nat;
    var nextOrderId : Nat;
    var nextOrderPartId : Nat;
    var nextLaborId : Nat;
    var nextOrderPhotoId : Nat;
    var nextSupplierId : Nat;
    var nextPurchaseId : Nat;
    var nextPurchaseItemId : Nat;
    var nextPaymentId : Nat;
    var nextInvoiceId : Nat;
    var nextInvoiceNumber : Nat;
    var nextQuoteId : Nat;
    var nextQuoteNumber : Nat;
    var nextQuotePartLineId : Nat;
    var nextQuoteServiceLineId : Nat;
    var nextServiceId : Nat;
    var nextServiceCategoryId : Nat;
    var nextTechnicianId : Nat;
    var nextTechnicianLoanId : Nat;
    var nextCommissionPaymentId : Nat;
    var nextAppointmentId : Nat;
    var nextExpenseId : Nat;
    var nextExpenseCategoryId : Nat;
    var nextPosSaleId : Nat;
    var nextPosSaleNumber : Nat;
    var nextReceivablePaymentId : Nat;
    var nextSupplierOrderId : Nat;
    var nextPurchaseInvoiceId : Nat;
    var nextPurchaseInvoiceLineId : Nat;
    var nextShiftId : Nat;
    var nextCashMovementId : Nat;
  };

  include InventoryApi(accessControlState, parts, lots, movements, counters, credentials, sessions, roles);
  include CustomersApi(accessControlState, customers, motorcycles, orders, counters, credentials, sessions, roles);
  include WorkshopApi(accessControlState, orders, parts, lots, movements, customers, motorcycles, services, counters, businessSettings, company, credentials, sessions, roles);
  include PurchasingApi(accessControlState, suppliers, purchases, payments, lots, movements, counters, credentials, sessions, roles);
  include BillingApi(accessControlState, invoices, businessSettings, counters, orders, customers, company, credentials, sessions, roles, posSales, receivablePayments);
  include DashboardApi(accessControlState, parts, lots, orders, purchases, payments, credentials, sessions, roles);
  include UsersApi(accessControlState, userProfiles, credentials, sessions, roles, userCounters);
  include QuotesApi(accessControlState, quotes, customers, motorcycles, parts, services, orders, invoices, businessSettings, company, counters, credentials, sessions, roles);
  include ServicesApi(accessControlState, services, counters, credentials, sessions, roles);
  include ServiceCategoriesApi(accessControlState, serviceCategories, services, counters, credentials, sessions, roles);
  include TechniciansApi(accessControlState, technicians, orders, counters, credentials, sessions, roles);
  include CommissionsApi(accessControlState, technicianLoans, commissionPayments, paidCommissionLines, technicians, orders, motorcycles, services, counters, credentials, sessions, roles);
  include CompanyApi(accessControlState, company, credentials, sessions, roles);
  include AppointmentsApi(accessControlState, appointments, customers, motorcycles, technicians, orders, businessSettings, company, counters, credentials, sessions, roles);
  include ExpensesApi(accessControlState, expenses, suppliers, expenseCategories, counters, credentials, sessions, roles);
  include ExpenseCategoriesApi(accessControlState, expenseCategories, expenses, counters, credentials, sessions, roles);
  include AccountingApi(accessControlState, invoices, expenses, parts, lots, orders, technicians, services, credentials, sessions, roles);
  include PosApi(accessControlState, posSales, parts, lots, movements, customers, invoices, businessSettings, company, counters, credentials, sessions, roles);
  include ReceivablesApi(accessControlState, invoices, receivablePayments, counters, credentials, sessions, roles);
  include RemindersApi(accessControlState, appointments, invoices, receivablePayments, suppliers, purchases, payments, quotes, orders, customers, motorcycles, credentials, sessions, roles);
  include SupplierOrdersApi(accessControlState, suppliers, supplierOrders, counters, credentials, sessions, roles);
  include PurchaseInvoiceIntakeApi(accessControlState, purchaseInvoices, parts, lots, movements, suppliers, counters, credentials, sessions, roles);
  include CashApi(accessControlState, shifts, cashMovements, counters, credentials, sessions, roles);
  include NotificationsApi(customers, suppliers, orders, quotes, invoices, appointments, services, company, hope);
  include HopeApi(accessControlState, hope, credentials, sessions, roles);
  include ServiceTermsApi(accessControlState, serviceTerms, credentials, sessions, roles);
  include WarrantyTermsApi(accessControlState, warrantyTerms, credentials, sessions, roles);
  include BackupApi(accessControlState, driveCredentials, {
    parts;
    lots;
    movements;
    customers;
    motorcycles;
    orders;
    suppliers;
    purchases;
    payments;
    invoices;
    businessSettings;
    userProfiles;
    quotes;
    services;
    serviceCategories;
    technicians;
    appointments;
    expenses;
    expenseCategories;
    posSales;
    receivablePayments;
    supplierOrders;
    company;
  } : BackupLib.State, credentials, sessions, roles);
  include ApiDocMixin();

  // Sample owner for the per-user `userProfile` entity; the value is ignored.
  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      // ── Inventario ──────────────────────────────────────────────────────
      parts.toEntity("part", "Part", "id")
        .sample({
          id = 0;
          sku = "";
          barcode = "";
          name = "";
          category = "";
          brand = "";
          unit = "";
          salePrice = 0;
          costPrice = 0;
          lowStockThreshold = 0;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      lots.toEntity("lot", "Lot", "id")
        .sample({
          id = 0;
          partId = 0;
          lotNumber = "";
          quantity = 0;
          unitCost = 0;
          supplierId = null;
          purchaseId = null;
          receivedAt = 0;
        })
        .edge("partId", "part")
        .edge("supplierId", "supplier")
        .edge("purchaseId", "purchase")
        .controllerOnly()
        .build(),
      movements.toEntity("movement", "Movement", "id")
        .sample({
          id = 0;
          partId = 0;
          lotId = null;
          kind = #adjustment;
          quantity = 0;
          unitCost = null;
          reason = null;
          referenceId = null;
          performedBy = anyPrincipal;
          at = 0;
        })
        .edge("partId", "part")
        .edge("lotId", "lot")
        .controllerOnly()
        .build(),

      // ── Clientes y motos ────────────────────────────────────────────────
      customers.toEntity("customer", "Customer", "id")
        .sample({
          id = 0;
          name = "";
          phone = "";
          email = null;
          document = null;
          address = null;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      motorcycles.toEntity("motorcycle", "Motorcycle", "id")
        .sample({
          id = 0;
          customerId = 0;
          plate = "";
          brand = "";
          model = "";
          year = 0;
          mileage = 0;
          createdAt = 0;
        })
        .edge("customerId", "customer")
        .controllerOnly()
        .build(),

      // ── Órdenes de taller ───────────────────────────────────────────────
      orders.toEntity("workshopOrder", "WorkshopOrder", "id")
        .sample({
          id = 0;
          orderNumber = "";
          customerId = 0;
          motorcycleId = 0;
          intakeMileage = 0;
          problem = "";
          status = #received;
          parts = [];
          labor = [];
          photos = [];
          technicianIds = [];
          statusHistory = [];
          cancelReason = null;
          cancelledAt = null;
          createdAt = 0;
          updatedAt = 0;
        })
        .edge("customerId", "customer")
        .edge("motorcycleId", "motorcycle")
        .controllerOnly()
        .build(),

      // ── Proveedores y compras ───────────────────────────────────────────
      suppliers.toEntity("supplier", "Supplier", "id")
        .sample({
          id = 0;
          name = "";
          contactName = null;
          phone = "";
          email = null;
          taxId = null;
          address = null;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      purchases.toEntity("purchase", "Purchase", "id")
        .sample({
          id = 0;
          supplierId = 0;
          items = [];
          total = 0;
          paidAmount = 0;
          accepted = false;
          createdAt = 0;
        })
        .edge("supplierId", "supplier")
        .controllerOnly()
        .build(),
      payments.toEntity("payment", "Payment", "id")
        .sample({
          id = 0;
          supplierId = 0;
          purchaseId = null;
          amount = 0;
          method = #cash;
          note = null;
          performedBy = anyPrincipal;
          at = 0;
        })
        .edge("supplierId", "supplier")
        .edge("purchaseId", "purchase")
        .controllerOnly()
        .build(),

      // ── Facturación ─────────────────────────────────────────────────────
      invoices.toEntity("invoice", "Invoice", "id")
        .sample({
          id = 0;
          number = "";
          origin = #workshopOrder;
          orderId = null;
          posSaleId = null;
          customerId = null;
          customerName = "";
          customerTaxId = null;
          customerAddress = null;
          lines = [];
          subtotal = 0;
          discount = 0;
          taxRate = 0;
          tax = 0;
          total = 0;
          paymentMethod = #cash;
          paymentCondition = #cash;
          paymentStatus = #pending;
          installments = null;
          issuedAt = 0;
        })
        .edge("orderId", "workshopOrder")
        .edge("customerId", "customer")
        .controllerOnly()
        .build(),

      // ── Configuración del negocio (fila única) ──────────────────────────
      OQL.Entity.manual<BillingTypes.BusinessSettings>(
        "businessSetting",
        func () = [businessSettings.settings].values(),
        "BusinessSettings",
        "name",
      )
        .sample({ name = ""; taxId = ""; address = ""; phone = ""; taxRate = 0 })
        .controllerOnly()
        .build(),

      // ── Perfiles de usuario (por usuario) ───────────────────────────────
      userProfiles.toEntityManual(
        "userProfile",
        "UserProfile",
        "principal",
      )
        .sample({ name = ""; role = #user; createdAt = 0 })
        .payload("principal", func (_ : UserTypes.UserProfile) : Principal = anyPrincipal)
        .payload("name", func (p : UserTypes.UserProfile) : Text = p.name)
        .payload("role", func (p : UserTypes.UserProfile) : UserTypes.UserRole = p.role)
        .payload("createdAt", func (p : UserTypes.UserProfile) : Common.Timestamp = p.createdAt)
        .ownedBy("principal")
        .scopedPerUser()
        .build(),

      // ── Credenciales de acceso (solo controladores) ─────────────────────
      // Contiene el hash y la sal de cada contraseña: nunca debe ser legible
      // por usuarios no administradores, por eso se expone `controllerOnly`.
      credentials.toEntityManual(
        "credential",
        "Credential",
        "id",
      )
        .sample({
          id = 0;
          username = "";
          name = "";
          roleId = 0;
          active = true;
          salt = "" : Blob;
          passwordHash = "" : Blob;
          iterations = 0;
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("id", func (c : UserTypes.Credential) : Common.Id = c.id)
        .payload("username", func (c : UserTypes.Credential) : Text = c.username)
        .payload("name", func (c : UserTypes.Credential) : Text = c.name)
        .payload("roleId", func (c : UserTypes.Credential) : Common.Id = c.roleId)
        .payload("active", func (c : UserTypes.Credential) : Bool = c.active)
        .payload("createdAt", func (c : UserTypes.Credential) : Common.Timestamp = c.createdAt)
        .payload("updatedAt", func (c : UserTypes.Credential) : Common.Timestamp = c.updatedAt)
        .edge("roleId", "role")
        .controllerOnly()
        .build(),

      // ── Roles editables (administrables) ────────────────────────────────
      roles.toEntity("role", "Role", "id")
        .sample({
          id = 0;
          name = "";
          kind = #custom;
          modules = [];
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Cotizaciones ────────────────────────────────────────────────────
      quotes.toEntity("quote", "Quote", "id")
        .sample({
          id = 0;
          quoteNumber = "";
          customerId = 0;
          motorcycleId = 0;
          status = #draft;
          partLines = [];
          serviceLines = [];
          discount = 0;
          taxRate = 0;
          notes = null;
          createdAt = 0;
          updatedAt = 0;
        })
        .edge("customerId", "customer")
        .edge("motorcycleId", "motorcycle")
        .controllerOnly()
        .build(),

      // ── Catálogo de servicios ───────────────────────────────────────────
      services.toEntity("service", "Service", "id")
        .sample({
          id = 0;
          code = "";
          name = "";
          description = "";
          category = "";
          laborRate = 0;
          estimatedMinutes = 0;
          active = true;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Categorías de servicios ─────────────────────────────────────────
      serviceCategories.toEntity("serviceCategory", "ServiceCategory", "id")
        .sample({
          id = 0;
          name = "";
          description = "";
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Técnicos ────────────────────────────────────────────────────────
      technicians.toEntity("technician", "Technician", "id")
        .sample({
          id = 0;
          code = "";
          name = "";
          phone = "";
          email = null;
          specialty = "";
          hourlyRate = 0;
          commissionRate = 0;
          active = true;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Préstamos a técnicos ────────────────────────────────────────────
      technicianLoans.toEntity("technicianLoan", "TechnicianLoan", "id")
        .sample({
          id = 0;
          technicianId = 0;
          amount = 0;
          date = 0;
          note = null;
          deducted = false;
          deductedAt = null;
          commissionPaymentId = null;
          createdAt = 0;
        })
        .edge("technicianId", "technician")
        .controllerOnly()
        .build(),

      // ── Pagos de comisiones ─────────────────────────────────────────────
      commissionPayments.toEntity("commissionPayment", "CommissionPayment", "id")
        .sample({
          id = 0;
          technicianId = 0;
          technicianCode = "";
          technicianName = "";
          period = { from = null; to = null };
          lineCount = 0;
          lines = [];
          baseAmount = 0;
          commissionAmount = 0;
          loans = [];
          loansDeducted = 0;
          netPaid = 0;
          paidBy = anyPrincipal;
          paidAt = 0;
        })
        .edge("technicianId", "technician")
        .controllerOnly()
        .build(),

      // ── Líneas de comisión ya pagadas (clave orderId + laborId) ─────────
      paidCommissionLines.toEntity("paidCommissionLine", "CommissionLineKey", "orderId")
        .sample({ orderId = 0; laborId = 0 })
        .controllerOnly()
        .build(),

      // ── Citas ───────────────────────────────────────────────────────────
      appointments.toEntity("appointment", "Appointment", "id")
        .sample({
          id = 0;
          customerId = 0;
          motorcycleId = 0;
          technicianId = null;
          scheduledAt = 0;
          durationMinutes = 0;
          reason = "";
          status = #scheduled;
          createdAt = 0;
          updatedAt = 0;
        })
        .edge("customerId", "customer")
        .edge("motorcycleId", "motorcycle")
        .edge("technicianId", "technician")
        .controllerOnly()
        .build(),

      // ── Gastos ──────────────────────────────────────────────────────────
      expenses.toEntity("expense", "Expense", "id")
        .sample({
          id = 0;
          date = 0;
          concept = "";
          categoryId = 0;
          categoryName = "";
          supplierId = null;
          supplierName = null;
          amount = 0;
          tax = 0;
          paymentMethod = "";
          receiptUrl = null;
          createdAt = 0;
        })
        .edge("supplierId", "supplier")
        .controllerOnly()
        .build(),

      // ── Categorías de gastos (administrables) ───────────────────────────
      expenseCategories.toEntity("expenseCategory", "ExpenseCategory", "id")
        .sample({
          id = 0;
          name = "";
          description = "";
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Ventas de mostrador (POS) ───────────────────────────────────────
      posSales.toEntity("posSale", "PosSale", "id")
        .sample({
          id = 0;
          saleNumber = "";
          customerId = null;
          customerName = null;
          lines = [];
          subtotal = 0;
          discount = 0;
          taxRate = 0;
          tax = 0;
          total = 0;
          paymentMethod = "";
          paymentCondition = #cash;
          amountReceived = 0;
          change = 0;
          invoiceId = 0;
          soldBy = anyPrincipal;
          soldAt = 0;
        })
        .edge("customerId", "customer")
        .edge("invoiceId", "invoice")
        .controllerOnly()
        .build(),

      // ── Abonos de cuentas por cobrar ────────────────────────────────────
      receivablePayments.toEntity("receivablePayment", "ReceivablePayment", "id")
        .sample({
          id = 0;
          invoiceId = 0;
          amount = 0;
          method = "";
          note = null;
          performedBy = anyPrincipal;
          at = 0;
        })
        .edge("invoiceId", "invoice")
        .controllerOnly()
        .build(),

      // ── Pedidos a proveedor ─────────────────────────────────────────────
      supplierOrders.toEntity("supplierOrder", "SupplierOrder", "id")
        .sample({
          id = 0;
          supplierId = 0;
          quantity = 0;
          sku = "";
          description = "";
          createdBy = anyPrincipal;
          createdAt = 0;
        })
        .edge("supplierId", "supplier")
        .controllerOnly()
        .build(),

      // ── Facturas de compra (carga de PDF o foto) ────────────────────────
      // `PurchaseInvoice` contiene un sub-registro (`file`) y variantes, por
      // eso se declara manualmente: cada columna escalar se expone con
      // `.payload(...)` y el archivo se aplana con `.flatten(...)`. Las
      // líneas (`lines`) son una colección y no se exponen como columna.
      purchaseInvoices.toEntityManual(
        "purchaseInvoice",
        "PurchaseInvoice",
        "id",
      )
        .sample({
          id = 0;
          file = {
            objectId = "";
            fileName = "";
            mimeType = "";
            sizeBytes = 0;
            kind = #pdf;
            uploadedAt = 0;
            gatewayUrl = null : ?Text;
            projectId = null : ?Text;
          };
          extractionStatus = #pending;
          extractionError = null;
          supplierId = null;
          supplierName = null;
          invoiceNumber = null;
          invoiceDate = null;
          supplierTaxId = "";
          paymentMethod = "";
          paymentMeans = "";
          lines = [];
          status = #pending;
          createdAt = 0;
          updatedAt = 0;
          confirmedAt = null;
          confirmedBy = null;
        })
        .payload("id", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : Common.Id = i.id)
        .flatten(func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : PurchaseInvoiceIntakeTypes.InvoiceFileRef = i.file)
        .payload("extractionStatus", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : PurchaseInvoiceIntakeTypes.ExtractionStatus = i.extractionStatus)
        .payload("extractionError", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Text = i.extractionError)
        .payload("supplierId", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Common.Id = i.supplierId)
        .payload("supplierName", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Text = i.supplierName)
        .payload("invoiceNumber", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Text = i.invoiceNumber)
        .payload("invoiceDate", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Common.Timestamp = i.invoiceDate)
        .payload("status", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : PurchaseInvoiceIntakeTypes.PurchaseInvoiceStatus = i.status)
        .payload("createdAt", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : Common.Timestamp = i.createdAt)
        .payload("updatedAt", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : Common.Timestamp = i.updatedAt)
        .payload("confirmedAt", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Common.Timestamp = i.confirmedAt)
        .payload("confirmedBy", func (i : PurchaseInvoiceIntakeTypes.PurchaseInvoice) : ?Principal = i.confirmedBy)
        .edge("supplierId", "supplier")
        .controllerOnly()
        .build(),

      // ── Caja y Bancos: turnos ───────────────────────────────────────────
      shifts.toEntity("shift", "Shift", "id")
        .sample({
          id = 0;
          openedAt = 0;
          closedAt = null;
          openingCash = 0;
          openingBank = 0;
          declaredClosingCash = null;
          declaredClosingBank = null;
          computedClosingCash = 0;
          computedClosingBank = 0;
          differenceCash = 0;
          differenceBank = 0;
          status = #open;
          openedBy = anyPrincipal;
          closedBy = null;
          notes = null;
        })
        .controllerOnly()
        .build(),

      // ── Caja y Bancos: movimientos ──────────────────────────────────────
      cashMovements.toEntity("cashMovement", "CashMovement", "id")
        .sample({
          id = 0;
          shiftId = 0;
          timestamp = 0;
          kind = #income;
          paymentMethod = #cash;
          amount = 0;
          account = #cash;
          description = "";
          reference = null;
          source = #manual;
        })
        .edge("shiftId", "shift")
        .controllerOnly()
        .build(),

      // ── Perfil de la empresa (fila única) ───────────────────────────────
      OQL.Entity.manual<CompanyTypes.CompanyProfile>(
        "companyProfile",
        func () = [company.profile].values(),
        "CompanyProfile",
        "legalName",
      )
        .sample({
          legalName = "";
          tradeName = null;
          documentType = #nit;
          taxId = "";
          checkDigit = null;
          fiscalRegime = #responsableIva;
          taxResponsibility = #noAplica;
          address = "";
          city = "";
          phone = "";
          email = null;
          website = null;
          logoUrl = null;
          taxRate = 0;
          updatedAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Credenciales de Google Drive (fila única, solo controladores) ───
      // Contiene tokens OAuth del administrador: nunca debe ser legible por
      // usuarios no administradores, por eso se expone como `controllerOnly`.
      OQL.Entity.manual<BackupTypes.DriveCredentials>(
        "driveCredential",
        func () = switch (driveCredentials.credentials) {
          case (?credentials) { [credentials].values() };
          case null { [].values() };
        },
        "DriveCredentials",
        "accountEmail",
      )
        .sample({
          var refreshToken = "";
          var accessToken : ?Text = null;
          var accessTokenExpiresAt : ?Int = null;
          var accountEmail : ?Text = null;
          var connectedAt : Int = 0;
        })
        .payload("accountEmail", func (c : BackupTypes.DriveCredentials) : ?Text = c.accountEmail)
        .payload("connectedAt", func (c : BackupTypes.DriveCredentials) : Int = c.connectedAt)
        .payload("hasRefreshToken", func (c : BackupTypes.DriveCredentials) : Bool = c.refreshToken != "")
        .controllerOnly()
        .build(),

      // ── Mensaje diario de esperanza bíblica (fila única) ────────────────
      OQL.Entity.manual<HopeTypes.HopeSettings>(
        "hopeSetting",
        func () = [hope.settings].values(),
        "HopeSettings",
        "mode",
      )
        .sample({
          enabled = false;
          mode = #auto;
          manualText = "";
          manualCitation = "";
          updatedAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Pie de página «Términos y condiciones del Servicio» (fila única) ─
      OQL.Entity.manual<ServiceTermsTypes.ServiceTermsSettings>(
        "serviceTermsSetting",
        func () = [serviceTerms.settings].values(),
        "ServiceTermsSettings",
        "text",
      )
        .sample({
          text = "";
          updatedAt = 0;
        })
        .controllerOnly()
        .build(),

      // ── Términos y Condiciones de Garantía (fila única) ─────────────────
      OQL.Entity.manual<WarrantyTermsTypes.WarrantyTermsSettings>(
        "warrantyTermsSetting",
        func () = [warrantyTerms.settings].values(),
        "WarrantyTermsSettings",
        "text",
      )
        .sample({
          text = "";
          updatedAt = 0;
        })
        .controllerOnly()
        .build(),
    ];
  });
};
