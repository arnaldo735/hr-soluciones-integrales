/// Lógica del dominio de respaldo en Google Drive.
///
/// Serializa las colecciones del taller a un JSON y lo sube al Drive del
/// administrador. La carpeta destino se busca/crea con `googledrive-client`
/// (metadatos) y los bytes del archivo se suben con un outcall HTTP
/// multipart escrito a mano, porque el cliente generado es solo de metadatos.
/// El token OAuth se obtiene/renueva con `google-oauth`.

import Array "mo:core/Array";
import Char "mo:core/Char";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import IC "mo:ic/Types";
import Call "mo:ic/Call";
import { JSON; type Candid } "mo:serde-core";
import OAuth "mo:google-oauth/OAuth";
import { Client } "mo:googledrive-client/Client";
import { type Config; defaultConfig } "mo:googledrive-client/Config";
import { type File; JSON = FileJSON } "mo:googledrive-client/Models/File";
import { type FileList } "mo:googledrive-client/Models/FileList";

import Common "../types/common";
import Types "../types/backup";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import WorkshopTypes "../types/workshop";
import PurchasingTypes "../types/purchasing";
import BillingTypes "../types/billing";
import UserTypes "../types/users";
import QuoteTypes "../types/quotes";
import ServiceTypes "../types/services";
import ServiceCategoryTypes "../types/service-categories";
import TechnicianTypes "../types/technicians";
import CommissionTypes "../types/commissions";
import CompanyTypes "../types/company";
import AppointmentTypes "../types/appointments";
import ExpenseTypes "../types/expenses";
import ExpenseCategoryTypes "../types/expense-categories";
import PosTypes "../types/pos";
import ReceivableTypes "../types/receivables";
import SupplierOrderTypes "../types/supplier-orders";

module {
  /// Estado que el dominio necesita para serializar el respaldo. Se pasa como
  /// registro de referencias a las colecciones estables del actor.
  public type State = {
    parts : Map.Map<Common.Id, InventoryTypes.Part>;
    lots : Map.Map<Common.Id, InventoryTypes.Lot>;
    movements : Map.Map<Common.Id, InventoryTypes.Movement>;
    customers : Map.Map<Common.Id, CustomerTypes.Customer>;
    motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>;
    purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>;
    payments : Map.Map<Common.Id, PurchasingTypes.Payment>;
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    businessSettings : { var settings : BillingTypes.BusinessSettings };
    userProfiles : Map.Map<Principal, UserTypes.UserProfile>;
    quotes : Map.Map<Common.Id, QuoteTypes.Quote>;
    services : Map.Map<Common.Id, ServiceTypes.Service>;
    serviceCategories : Map.Map<Common.Id, ServiceCategoryTypes.ServiceCategory>;
    technicians : Map.Map<Common.Id, TechnicianTypes.Technician>;
    appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>;
    expenses : Map.Map<Common.Id, ExpenseTypes.Expense>;
    expenseCategories : Map.Map<Common.Id, ExpenseCategoryTypes.ExpenseCategory>;
    posSales : Map.Map<Common.Id, PosTypes.PosSale>;
    receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>;
    supplierOrders : Map.Map<Common.Id, SupplierOrderTypes.SupplierOrder>;
    company : { var profile : CompanyTypes.CompanyProfile };
  };

  // ── Configuración OAuth ───────────────────────────────────────────────────
  // El cliente OAuth de Google se configura por variables de entorno del
  // canister. El mixin (que sí tiene la capacidad `<system>`) las lee y las
  // pasa aquí; sin ellas la conexión no se puede iniciar y se reporta como
  // fallo de Drive (nunca como trap).

  public type OAuthConfig = {
    clientId : Text;
    clientSecret : Text;
    redirectUri : Text;
  };

  /// Nombres de las variables de entorno que configuran el cliente OAuth.
  /// Se exponen para que el mixin (que lee las variables) y la pantalla de
  /// Configuración nombren exactamente la misma variable.
  public let OAUTH_CLIENT_ID_VAR : Text = "GOOGLE_OAUTH_CLIENT_ID";
  public let OAUTH_CLIENT_SECRET_VAR : Text = "GOOGLE_OAUTH_CLIENT_SECRET";
  public let OAUTH_REDIRECT_URI_VAR : Text = "GOOGLE_OAUTH_REDIRECT_URI";

  /// Calcula el estado de configuración a partir de los valores leídos de las
  /// variables de entorno. Es puro: no lanza traps y no toca el estado, de modo
  /// que la consulta de estado siempre puede responder.
  public func configStatus(
    clientId : ?Text,
    clientSecret : ?Text,
    redirectUri : ?Text,
  ) : Types.DriveConfigStatus {
    let missing = List.empty<Text>();
    if (isBlank(clientId)) { missing.add(OAUTH_CLIENT_ID_VAR) };
    if (isBlank(clientSecret)) { missing.add(OAUTH_CLIENT_SECRET_VAR) };
    if (isBlank(redirectUri)) { missing.add(OAUTH_REDIRECT_URI_VAR) };
    let names = missing.toArray();
    { configured = names.size() == 0; missingVariables = names };
  };

  // Una variable ausente o en blanco cuenta como no configurada.
  func isBlank(value : ?Text) : Bool {
    switch (value) {
      case (?v) { v.trim(#predicate(Char.isWhitespace)) == "" };
      case null { true };
    };
  };

  let SCOPE : Text = "https://www.googleapis.com/auth/drive.file";
  let FOLDER_MIME : Text = "application/vnd.google-apps.folder";
  let JSON_MIME : Text = "application/json";
  let UPLOAD_ENDPOINT : Text = "https://www.googleapis.com/upload/drive/v3/files";

  // ── Utilidades de fecha ───────────────────────────────────────────────────

  func pad2(n : Nat) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  // Descompone nanosegundos desde la época Unix en (año, mes, día, hora,
  // minuto) en UTC. Algoritmo civil-from-days (Howard Hinnant), determinista.
  func civilFromDays(z : Int) : (Int, Int, Int) {
    let zz = z + 719468;
    let era = (if (zz >= 0) { zz } else { zz - 146096 }) / 146097;
    let doe = zz - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    (if (m <= 2) { y + 1 } else { y }, m, d);
  };

  func utcParts(now : Int) : (Int, Int, Int, Int, Int) {
    let seconds = now / 1_000_000_000;
    let days = if (seconds >= 0) { seconds / 86400 } else { (seconds - 86399) / 86400 };
    let secsOfDay = seconds - days * 86400;
    let (y, m, d) = civilFromDays(days);
    let hour = secsOfDay / 3600;
    let minute = (secsOfDay % 3600) / 60;
    (y, m, d, hour, minute);
  };

  /// Nombre del archivo de respaldo con fecha y hora:
  /// `respaldo-hr-AAAA-MM-DD-HHmm.json`.
  public func backupFileName(now : Int) : Text {
    let (y, m, d, hour, minute) = utcParts(now);
    "respaldo-hr-" # y.toText() # "-" # pad2(Int.abs(m)) # "-" # pad2(Int.abs(d))
      # "-" # pad2(Int.abs(hour)) # pad2(Int.abs(minute)) # ".json";
  };

  /// Nombre de la carpeta destino en el Drive del administrador.
  public func backupFolderName() : Text {
    "HR SOLUCIONES INTEGRALES — Respaldos";
  };

  /// Nombre del archivo de la copia local, con fecha y hora:
  /// `copia-local-hr-AAAA-MM-DD-HHmm.json`. Se distingue del nombre del
  /// respaldo en la nube para que el usuario reconozca el archivo descargado.
  public func localBackupFileName(now : Int) : Text {
    let (y, m, d, hour, minute) = utcParts(now);
    "copia-local-hr-" # y.toText() # "-" # pad2(Int.abs(m)) # "-" # pad2(Int.abs(d))
      # "-" # pad2(Int.abs(hour)) # pad2(Int.abs(minute)) # ".json";
  };

  // ── Serialización JSON ────────────────────────────────────────────────────

  func jText(v : Text) : Candid = #Text(v);
  func jNat(v : Nat) : Candid = #Nat(v);
  func jInt(v : Int) : Candid = #Int(v);
  func jBool(v : Bool) : Candid = #Bool(v);
  func jNull() : Candid = #Null;
  func jOptText(v : ?Text) : Candid = switch (v) { case (?t) #Text(t); case null #Null };
  func jOptNat(v : ?Nat) : Candid = switch (v) { case (?n) #Nat(n); case null #Null };
  func jOptInt(v : ?Int) : Candid = switch (v) { case (?n) #Int(n); case null #Null };
  func jPrincipal(v : Principal) : Candid = #Text(v.toText());
  func jArr(items : [Candid]) : Candid = #Array(items);
  func jObj(entries : [(Text, Candid)]) : Candid = #Record(entries);

  func mapValues<K, V>(m : Map.Map<K, V>, f : V -> Candid) : [Candid] {
    let out = List.empty<Candid>();
    for ((_, v) in m.entries()) {
      out.add(f(v));
    };
    out.toArray();
  };


  // ── Serializadores por entidad ────────────────────────────────────────────

  func partJson(p : InventoryTypes.Part) : Candid = jObj([
    ("id", jNat(p.id)),
    ("sku", jText(p.sku)),
    ("name", jText(p.name)),
    ("category", jText(p.category)),
    ("brand", jText(p.brand)),
    ("unit", jText(p.unit)),
    ("salePrice", jNat(p.salePrice)),
    ("costPrice", jNat(p.costPrice)),
    ("lowStockThreshold", jNat(p.lowStockThreshold)),
    ("createdAt", jInt(p.createdAt)),
  ]);

  func lotJson(l : InventoryTypes.Lot) : Candid = jObj([
    ("id", jNat(l.id)),
    ("partId", jNat(l.partId)),
    ("lotNumber", jText(l.lotNumber)),
    ("quantity", jNat(l.quantity)),
    ("unitCost", jNat(l.unitCost)),
    ("supplierId", jOptNat(l.supplierId)),
    ("purchaseId", jOptNat(l.purchaseId)),
    ("receivedAt", jInt(l.receivedAt)),
  ]);

  func movementKindText(k : InventoryTypes.MovementKind) : Text = switch (k) {
    case (#sale) { "sale" };
    case (#purchase) { "purchase" };
    case (#adjustment) { "adjustment" };
  };

  func movementJson(m : InventoryTypes.Movement) : Candid = jObj([
    ("id", jNat(m.id)),
    ("partId", jNat(m.partId)),
    ("lotId", jOptNat(m.lotId)),
    ("kind", jText(movementKindText(m.kind))),
    ("quantity", jNat(m.quantity)),
    ("unitCost", jOptNat(m.unitCost)),
    ("reason", jOptText(m.reason)),
    ("referenceId", jOptNat(m.referenceId)),
    ("performedBy", jPrincipal(m.performedBy)),
    ("at", jInt(m.at)),
  ]);

  func customerJson(c : CustomerTypes.Customer) : Candid = jObj([
    ("id", jNat(c.id)),
    ("name", jText(c.name)),
    ("phone", jText(c.phone)),
    ("email", jOptText(c.email)),
    ("document", jOptText(c.document)),
    ("address", jOptText(c.address)),
    ("createdAt", jInt(c.createdAt)),
  ]);

  func motorcycleJson(m : CustomerTypes.Motorcycle) : Candid = jObj([
    ("id", jNat(m.id)),
    ("customerId", jNat(m.customerId)),
    ("plate", jText(m.plate)),
    ("brand", jText(m.brand)),
    ("model", jText(m.model)),
    ("year", jNat(m.year)),
    ("mileage", jNat(m.mileage)),
    ("createdAt", jInt(m.createdAt)),
  ]);

  func orderStatusText(s : WorkshopTypes.OrderStatus) : Text = switch (s) {
    case (#received) { "received" };
    case (#inRepair) { "inRepair" };
    case (#ready) { "ready" };
    case (#delivered) { "delivered" };
    case (#cancelled) { "cancelled" };
  };

  func orderPartJson(p : WorkshopTypes.OrderPart) : Candid = jObj([
    ("id", jNat(p.id)),
    ("partId", jNat(p.partId)),
    ("lotId", jOptNat(p.lotId)),
    ("description", jText(p.description)),
    ("quantity", jNat(p.quantity)),
    ("unitPrice", jNat(p.unitPrice)),
    ("unitCost", jNat(p.unitCost)),
  ]);

  func laborItemJson(l : WorkshopTypes.LaborItem) : Candid = jObj([
    ("id", jNat(l.id)),
    ("description", jText(l.description)),
    ("price", jNat(l.price)),
    ("technicianId", jOptNat(l.technicianId)),
    ("serviceId", jOptNat(l.serviceId)),
  ]);

  func orderPhotoJson(p : WorkshopTypes.OrderPhoto) : Candid = jObj([
    ("id", jNat(p.id)),
    ("filename", jText(p.filename)),
    ("mimeType", jText(p.mimeType)),
    ("uploadedBy", jPrincipal(p.uploadedBy)),
    ("uploadedAt", jInt(p.uploadedAt)),
  ]);

  func statusChangeJson(s : WorkshopTypes.StatusChange) : Candid = jObj([
    ("from", switch (s.from) { case (?f) jText(orderStatusText(f)); case null jNull() }),
    ("to", jText(orderStatusText(s.to))),
    ("performedBy", jPrincipal(s.performedBy)),
    ("at", jInt(s.at)),
  ]);

  func orderJson(o : WorkshopTypes.WorkshopOrder) : Candid = jObj([
    ("id", jNat(o.id)),
    ("orderNumber", jText(o.orderNumber)),
    ("customerId", jNat(o.customerId)),
    ("motorcycleId", jNat(o.motorcycleId)),
    ("intakeMileage", jNat(o.intakeMileage)),
    ("problem", jText(o.problem)),
    ("status", jText(orderStatusText(o.status))),
    ("parts", jArr(o.parts.map(orderPartJson))),
    ("labor", jArr(o.labor.map(laborItemJson))),
    ("photos", jArr(o.photos.map(orderPhotoJson))),
    ("technicianIds", jArr(o.technicianIds.map(jNat))),
    ("statusHistory", jArr(o.statusHistory.map(statusChangeJson))),
    ("cancelReason", jOptText(o.cancelReason)),
    ("cancelledAt", jOptInt(o.cancelledAt)),
    ("createdAt", jInt(o.createdAt)),
    ("updatedAt", jInt(o.updatedAt)),
  ]);

  func supplierJson(s : PurchasingTypes.Supplier) : Candid = jObj([
    ("id", jNat(s.id)),
    ("name", jText(s.name)),
    ("contactName", jOptText(s.contactName)),
    ("phone", jText(s.phone)),
    ("email", jOptText(s.email)),
    ("taxId", jOptText(s.taxId)),
    ("address", jOptText(s.address)),
    ("createdAt", jInt(s.createdAt)),
  ]);

  func purchaseItemJson(i : PurchasingTypes.PurchaseItem) : Candid = jObj([
    ("id", jNat(i.id)),
    ("partId", jNat(i.partId)),
    ("lotNumber", jText(i.lotNumber)),
    ("quantity", jNat(i.quantity)),
    ("unitCost", jNat(i.unitCost)),
  ]);

  func purchaseJson(p : PurchasingTypes.Purchase) : Candid = jObj([
    ("id", jNat(p.id)),
    ("supplierId", jNat(p.supplierId)),
    ("items", jArr(p.items.map(purchaseItemJson))),
    ("total", jNat(p.total)),
    ("paidAmount", jNat(p.paidAmount)),
    ("createdAt", jInt(p.createdAt)),
  ]);

  func paymentMethodText(m : PurchasingTypes.PaymentMethod) : Text = switch (m) {
    case (#cash) { "cash" };
    case (#card) { "card" };
    case (#transfer) { "transfer" };
    case (#mixed) { "mixed" };
  };

  func paymentJson(p : PurchasingTypes.Payment) : Candid = jObj([
    ("id", jNat(p.id)),
    ("supplierId", jNat(p.supplierId)),
    ("purchaseId", jOptNat(p.purchaseId)),
    ("amount", jNat(p.amount)),
    ("method", jText(paymentMethodText(p.method))),
    ("note", jOptText(p.note)),
    ("performedBy", jPrincipal(p.performedBy)),
    ("at", jInt(p.at)),
  ]);

  func invoiceLineKindText(k : BillingTypes.InvoiceLineKind) : Text = switch (k) {
    case (#part) { "part" };
    case (#service) { "service" };
  };

  func invoiceLineJson(l : BillingTypes.InvoiceLine) : Candid = jObj([
    ("description", jText(l.description)),
    ("quantity", jNat(l.quantity)),
    ("unitPrice", jNat(l.unitPrice)),
    ("amount", jNat(l.amount)),
    ("kind", jText(invoiceLineKindText(l.kind))),
    ("unitCost", jNat(l.unitCost)),
  ]);

  func paymentStatusText(s : BillingTypes.PaymentStatus) : Text = switch (s) {
    case (#pending) { "pending" };
    case (#paid) { "paid" };
  };

  func paymentConditionText(c : BillingTypes.PaymentCondition) : Text = switch (c) {
    case (#cash) { "cash" };
    case (#credit) { "credit" };
  };

  func installmentJson(i : BillingTypes.Installment) : Candid = jObj([
    ("number", jNat(i.number)),
    ("amount", jNat(i.amount)),
    ("dueDate", jInt(i.dueDate)),
    ("paid", jBool(i.paid)),
    ("paidAt", jOptInt(i.paidAt)),
  ]);

  func installmentPlanJson(p : BillingTypes.InstallmentPlan) : Candid = jObj([
    ("installmentCount", jNat(p.installmentCount)),
    ("firstDueDate", jInt(p.firstDueDate)),
    ("installments", jArr(p.installments.map(installmentJson))),
  ]);

  func invoiceOriginText(o : BillingTypes.InvoiceOrigin) : Text = switch (o) {
    case (#workshopOrder) { "workshopOrder" };
    case (#pos) { "pos" };
    case (#quote) { "quote" };
  };

  func invoiceJson(i : BillingTypes.Invoice) : Candid = jObj([
    ("id", jNat(i.id)),
    ("number", jText(i.number)),
    ("origin", jText(invoiceOriginText(i.origin))),
    ("orderId", jOptNat(i.orderId)),
    ("posSaleId", jOptNat(i.posSaleId)),
    ("customerId", jOptNat(i.customerId)),
    ("customerName", jText(i.customerName)),
    ("customerTaxId", jOptText(i.customerTaxId)),
    ("customerAddress", jOptText(i.customerAddress)),
    ("lines", jArr(i.lines.map(invoiceLineJson))),
    ("subtotal", jNat(i.subtotal)),
    ("discount", jNat(i.discount)),
    ("taxRate", jNat(i.taxRate)),
    ("tax", jNat(i.tax)),
    ("total", jNat(i.total)),
    ("paymentMethod", jText(paymentMethodText(i.paymentMethod))),
    ("paymentCondition", jText(paymentConditionText(i.paymentCondition))),
    ("paymentStatus", jText(paymentStatusText(i.paymentStatus))),
    ("installments", switch (i.installments) { case (?p) installmentPlanJson(p); case null jNull() }),
    ("issuedAt", jInt(i.issuedAt)),
  ]);

  func businessSettingsJson(s : BillingTypes.BusinessSettings) : Candid = jObj([
    ("name", jText(s.name)),
    ("taxId", jText(s.taxId)),
    ("address", jText(s.address)),
    ("phone", jText(s.phone)),
    ("taxRate", jNat(s.taxRate)),
  ]);

  func userRoleText(r : UserTypes.UserRole) : Text = switch (r) {
    case (#admin) { "admin" };
    case (#user) { "user" };
    case (#guest) { "guest" };
  };

  func userProfilesJson(m : Map.Map<Principal, UserTypes.UserProfile>) : [Candid] {
    let out = List.empty<Candid>();
    for ((principal, profile) in m.entries()) {
      out.add(jObj([
        ("principal", jPrincipal(principal)),
        ("name", jText(profile.name)),
        ("role", jText(userRoleText(profile.role))),
        ("createdAt", jInt(profile.createdAt)),
      ]));
    };
    out.toArray();
  };

  func quoteStatusText(s : QuoteTypes.QuoteStatus) : Text = switch (s) {
    case (#draft) { "draft" };
    case (#sent) { "sent" };
    case (#accepted) { "accepted" };
    case (#rejected) { "rejected" };
    case (#expired) { "expired" };
  };

  func quotePartLineJson(l : QuoteTypes.QuotePartLine) : Candid = jObj([
    ("id", jNat(l.id)),
    ("partId", jNat(l.partId)),
    ("description", jText(l.description)),
    ("quantity", jNat(l.quantity)),
    ("unitPrice", jNat(l.unitPrice)),
  ]);

  func quoteServiceLineJson(l : QuoteTypes.QuoteServiceLine) : Candid = jObj([
    ("id", jNat(l.id)),
    ("serviceId", jOptNat(l.serviceId)),
    ("description", jText(l.description)),
    ("quantity", jNat(l.quantity)),
    ("unitPrice", jNat(l.unitPrice)),
  ]);

  func quoteJson(q : QuoteTypes.Quote) : Candid = jObj([
    ("id", jNat(q.id)),
    ("quoteNumber", jText(q.quoteNumber)),
    ("customerId", jNat(q.customerId)),
    ("motorcycleId", jNat(q.motorcycleId)),
    ("status", jText(quoteStatusText(q.status))),
    ("partLines", jArr(q.partLines.map(quotePartLineJson))),
    ("serviceLines", jArr(q.serviceLines.map(quoteServiceLineJson))),
    ("discount", jNat(q.discount)),
    ("taxRate", jNat(q.taxRate)),
    ("notes", jOptText(q.notes)),
    ("createdAt", jInt(q.createdAt)),
    ("updatedAt", jInt(q.updatedAt)),
  ]);

  func serviceJson(s : ServiceTypes.Service) : Candid = jObj([
    ("id", jNat(s.id)),
    ("code", jText(s.code)),
    ("name", jText(s.name)),
    ("description", jText(s.description)),
    ("category", jText(s.category)),
    ("laborRate", jNat(s.laborRate)),
    ("estimatedMinutes", jNat(s.estimatedMinutes)),
    ("active", jBool(s.active)),
    ("createdAt", jInt(s.createdAt)),
  ]);

  func serviceCategoryJson(c : ServiceCategoryTypes.ServiceCategory) : Candid = jObj([
    ("id", jNat(c.id)),
    ("name", jText(c.name)),
    ("description", jText(c.description)),
    ("createdAt", jInt(c.createdAt)),
  ]);

  func technicianJson(t : TechnicianTypes.Technician) : Candid = jObj([
    ("id", jNat(t.id)),
    ("code", jText(t.code)),
    ("name", jText(t.name)),
    ("phone", jText(t.phone)),
    ("email", jOptText(t.email)),
    ("specialty", jText(t.specialty)),
    ("hourlyRate", jNat(t.hourlyRate)),
    ("commissionRate", jNat(t.commissionRate)),
    ("active", jBool(t.active)),
    ("createdAt", jInt(t.createdAt)),
  ]);

  func appointmentStatusText(s : AppointmentTypes.AppointmentStatus) : Text = switch (s) {
    case (#scheduled) { "scheduled" };
    case (#confirmed) { "confirmed" };
    case (#attended) { "attended" };
    case (#cancelled) { "cancelled" };
    case (#noShow) { "noShow" };
  };

  func appointmentJson(a : AppointmentTypes.Appointment) : Candid = jObj([
    ("id", jNat(a.id)),
    ("customerId", jNat(a.customerId)),
    ("motorcycleId", jNat(a.motorcycleId)),
    ("technicianId", jOptNat(a.technicianId)),
    ("scheduledAt", jInt(a.scheduledAt)),
    ("durationMinutes", jNat(a.durationMinutes)),
    ("reason", jText(a.reason)),
    ("status", jText(appointmentStatusText(a.status))),
    ("createdAt", jInt(a.createdAt)),
    ("updatedAt", jInt(a.updatedAt)),
  ]);

  func expenseJson(e : ExpenseTypes.Expense) : Candid = jObj([
    ("id", jNat(e.id)),
    ("date", jInt(e.date)),
    ("concept", jText(e.concept)),
    ("categoryId", jNat(e.categoryId)),
    ("categoryName", jText(e.categoryName)),
    ("supplierId", jOptNat(e.supplierId)),
    ("supplierName", jOptText(e.supplierName)),
    ("amount", jNat(e.amount)),
    ("tax", jNat(e.tax)),
    ("paymentMethod", jText(e.paymentMethod)),
    ("receiptUrl", jOptText(e.receiptUrl)),
    ("createdAt", jInt(e.createdAt)),
  ]);

  func expenseCategoryJson(c : ExpenseCategoryTypes.ExpenseCategory) : Candid = jObj([
    ("id", jNat(c.id)),
    ("name", jText(c.name)),
    ("description", jText(c.description)),
    ("createdAt", jInt(c.createdAt)),
  ]);

  func posSaleLineJson(l : PosTypes.PosSaleLine) : Candid = jObj([
    ("partId", jNat(l.partId)),
    ("description", jText(l.description)),
    ("quantity", jNat(l.quantity)),
    ("unitPrice", jNat(l.unitPrice)),
    ("discount", jNat(l.discount)),
    ("amount", jNat(l.amount)),
  ]);

  func posSaleJson(s : PosTypes.PosSale) : Candid = jObj([
    ("id", jNat(s.id)),
    ("saleNumber", jText(s.saleNumber)),
    ("customerId", jOptNat(s.customerId)),
    ("customerName", jOptText(s.customerName)),
    ("lines", jArr(s.lines.map(posSaleLineJson))),
    ("subtotal", jNat(s.subtotal)),
    ("discount", jNat(s.discount)),
    ("taxRate", jNat(s.taxRate)),
    ("tax", jNat(s.tax)),
    ("total", jNat(s.total)),
    ("paymentMethod", jText(s.paymentMethod)),
    ("paymentCondition", jText(paymentConditionText(s.paymentCondition))),
    ("amountReceived", jNat(s.amountReceived)),
    ("change", jNat(s.change)),
    ("invoiceId", jNat(s.invoiceId)),
    ("soldBy", jPrincipal(s.soldBy)),
    ("soldAt", jInt(s.soldAt)),
  ]);

  func receivablePaymentJson(p : ReceivableTypes.ReceivablePayment) : Candid = jObj([
    ("id", jNat(p.id)),
    ("invoiceId", jNat(p.invoiceId)),
    ("amount", jNat(p.amount)),
    ("method", jText(p.method)),
    ("note", jOptText(p.note)),
    ("performedBy", jPrincipal(p.performedBy)),
    ("at", jInt(p.at)),
  ]);

  func supplierOrderJson(o : SupplierOrderTypes.SupplierOrder) : Candid = jObj([
    ("id", jNat(o.id)),
    ("supplierId", jNat(o.supplierId)),
    ("quantity", jNat(o.quantity)),
    ("sku", jText(o.sku)),
    ("description", jText(o.description)),
    ("createdBy", jPrincipal(o.createdBy)),
    ("createdAt", jInt(o.createdAt)),
  ]);

  func documentTypeText(d : CompanyTypes.DocumentType) : Text = switch (d) {
    case (#nit) { "nit" };
    case (#cedulaCiudadania) { "cedulaCiudadania" };
    case (#cedulaExtranjeria) { "cedulaExtranjeria" };
  };

  func fiscalRegimeText(r : CompanyTypes.FiscalRegime) : Text = switch (r) {
    case (#responsableIva) { "responsableIva" };
    case (#noResponsableIva) { "noResponsableIva" };
  };

  func taxResponsibilityText(t : CompanyTypes.TaxResponsibility) : Text = switch (t) {
    case (#granContribuyente) { "granContribuyente" };
    case (#autorretenedor) { "autorretenedor" };
    case (#agenteRetencionIva) { "agenteRetencionIva" };
    case (#regimenSimple) { "regimenSimple" };
    case (#noAplica) { "noAplica" };
  };

  func companyProfileJson(p : CompanyTypes.CompanyProfile) : Candid = jObj([
    ("legalName", jText(p.legalName)),
    ("tradeName", jOptText(p.tradeName)),
    ("documentType", jText(documentTypeText(p.documentType))),
    ("taxId", jText(p.taxId)),
    ("checkDigit", jOptNat(p.checkDigit)),
    ("fiscalRegime", jText(fiscalRegimeText(p.fiscalRegime))),
    ("taxResponsibility", jText(taxResponsibilityText(p.taxResponsibility))),
    ("address", jText(p.address)),
    ("city", jText(p.city)),
    ("phone", jText(p.phone)),
    ("email", jOptText(p.email)),
    ("website", jOptText(p.website)),
    ("logoUrl", jOptText(p.logoUrl)),
    ("taxRate", jNat(p.taxRate)),
    ("updatedAt", jInt(p.updatedAt)),
  ]);

  /// Serializa las colecciones del taller a un JSON.
  public func serializeBackup(state : State) : Text {
    let root = jObj([
      ("generatedAt", jInt(Time.now())),
      ("parts", jArr(mapValues(state.parts, partJson))),
      ("lots", jArr(mapValues(state.lots, lotJson))),
      ("movements", jArr(mapValues(state.movements, movementJson))),
      ("customers", jArr(mapValues(state.customers, customerJson))),
      ("motorcycles", jArr(mapValues(state.motorcycles, motorcycleJson))),
      ("orders", jArr(mapValues(state.orders, orderJson))),
      ("suppliers", jArr(mapValues(state.suppliers, supplierJson))),
      ("purchases", jArr(mapValues(state.purchases, purchaseJson))),
      ("payments", jArr(mapValues(state.payments, paymentJson))),
      ("invoices", jArr(mapValues(state.invoices, invoiceJson))),
      ("businessSettings", businessSettingsJson(state.businessSettings.settings)),
      ("userProfiles", jArr(userProfilesJson(state.userProfiles))),
      ("quotes", jArr(mapValues(state.quotes, quoteJson))),
      ("services", jArr(mapValues(state.services, serviceJson))),
      ("serviceCategories", jArr(mapValues(state.serviceCategories, serviceCategoryJson))),
      ("technicians", jArr(mapValues(state.technicians, technicianJson))),
      ("appointments", jArr(mapValues(state.appointments, appointmentJson))),
      ("expenses", jArr(mapValues(state.expenses, expenseJson))),
      ("expenseCategories", jArr(mapValues(state.expenseCategories, expenseCategoryJson))),
      ("posSales", jArr(mapValues(state.posSales, posSaleJson))),
      ("receivablePayments", jArr(mapValues(state.receivablePayments, receivablePaymentJson))),
      ("supplierOrders", jArr(mapValues(state.supplierOrders, supplierOrderJson))),
      ("company", companyProfileJson(state.company.profile)),
    ]);
    switch (JSON.fromCandid(root)) {
      case (#ok(text)) { text };
      case (#err(message)) { Runtime.trap("No se pudo serializar el respaldo: " # message) };
    };
  };

  // ── OAuth ─────────────────────────────────────────────────────────────────

  /// Inicia el flujo OAuth (PKCE) y devuelve la URL de autorización.
  public func startAuthorization(config : OAuthConfig) : async Types.DriveAuthStart {
    let verifier = await OAuth.generateCodeVerifier();
    let challenge = OAuth.computeCodeChallenge(verifier);
    let state = verifier;
    {
      authorizationUrl = OAuth.buildAuthorizeUrl(config.clientId, config.redirectUri, SCOPE, state, challenge);
      state;
    };
  };

  /// Completa el flujo OAuth intercambiando el código por tokens.
  public func completeAuthorization(config : OAuthConfig, code : Text, state : Text) : async Types.DriveAuthTokens {
    let token = await OAuth.exchangeAuthorizationCode(config.clientId, config.clientSecret, code, config.redirectUri, state);
    let accessToken = switch (token.accessToken) {
      case (?t) { t };
      case null {
        let detail = token.errorDescription ?? token.error ?? "respuesta sin access_token";
        Runtime.trap("No se pudo autorizar Google Drive: " # detail);
      };
    };
    let refreshToken = switch (token.refreshToken) {
      case (?t) { t };
      case null { Runtime.trap("Google Drive no devolvió un refresh token; vuelve a autorizar la cuenta") };
    };
    let email = await OAuth.getUserEmail(accessToken);
    let expiresAt = switch (token.expiresIn) {
      case (?secs) { ?(Time.now() + secs.toInt() * 1_000_000_000) };
      case null { null };
    };
    {
      connected = true;
      accountEmail = email;
      // Los tokens se persisten en el estado estable por el mixin.
      refreshToken;
      accessToken;
      expiresAt;
    };
  };

  /// Revoca la conexión con Google Drive del administrador.
  public func disconnect(credentials : Types.DriveCredentials) : async () {
    let token = credentials.refreshToken;
    if (token == "") { return };
    let body = Text.encodeUtf8("token=" # OAuth.urlEncode(token));
    let args : IC.HttpRequestArgs = {
      url = "https://oauth2.googleapis.com/revoke";
      max_response_bytes = ?2048.toNat64();
      headers = [{ name = "Content-Type"; value = "application/x-www-form-urlencoded" }];
      body = ?body;
      method = #post;
      transform = null;
      is_replicated = ?false;
    };
    ignore await Call.httpRequest(args);
  };

  // ── Token vigente ─────────────────────────────────────────────────────────

  // Devuelve un access token vigente, renovándolo si expiró. Devuelve `null`
  // cuando no hay conexión o la renovación falla.
  func validAccessToken(config : OAuthConfig, credentials : Types.DriveCredentials) : async ?Text {
    if (credentials.refreshToken == "") { return null };
    let now = Time.now();
    switch (credentials.accessToken, credentials.accessTokenExpiresAt) {
      case (?token, ?expiresAt) {
        // Margen de 60 s para evitar usar un token a punto de expirar.
        if (expiresAt - now > 60_000_000_000) { return ?token };
      };
      case _ {};
    };
    let refreshed = await OAuth.refreshAccessToken(config.clientId, config.clientSecret, credentials.refreshToken);
    switch (refreshed.accessToken) {
      case (?token) {
        credentials.accessToken := ?token;
        credentials.accessTokenExpiresAt := switch (refreshed.expiresIn) {
          case (?secs) { ?(Time.now() + secs.toInt() * 1_000_000_000) };
          case null { null };
        };
        ?token;
      };
      case null { null };
    };
  };

  // ── Cliente de Drive ──────────────────────────────────────────────────────

  func driveConfig(accessToken : Text) : Config = {
    defaultConfig with
    auth = ?(#bearer accessToken);
  };

  // Escapa un valor para incrustarlo en una consulta `q` de Drive.
  func escapeQuery(value : Text) : Text {
    value.replace(#char '\'', "\\'").replace(#char '\\', "\\\\");
  };

  // Busca la carpeta destino en el Drive del administrador; devuelve su id.
  func findFolder(accessToken : Text, name : Text) : async ?Text {
    let drive = Client(driveConfig(accessToken));
    let q = "mimeType='" # FOLDER_MIME # "' and name='" # escapeQuery(name) # "' and trashed=false";
    let result = await drive.files.list(
      "", "", "", "files(id,name)", "", null, "", false, "", null, "",
      "", null, "", false, "", "", false, "", 10, "", q, "", false, false, "",
    );
    switch (result.files) {
      case (?files) {
        switch (files.find(func(f : File) : Bool = f.name == ?name)) {
          case (?f) { f.id };
          case null { null };
        };
      };
      case null { null };
    };
  };

  // Crea la carpeta destino y devuelve su id.
  func createFolder(accessToken : Text, name : Text) : async ?Text {
    let drive = Client(driveConfig(accessToken));
    let metadata : File = {
      FileJSON.init({}) with
      name = ?name;
      mimeType = ?FOLDER_MIME;
    };
    let created = await drive.files.create(
      "", "", "", "id", "", null, "", false, "", null, "",
      false, false, "", "", false, "", false, false, false, metadata,
    );
    created.id;
  };

  // Devuelve el id de la carpeta destino, creándola si no existe.
  func ensureFolder(accessToken : Text, name : Text) : async ?Text {
    switch (await findFolder(accessToken, name)) {
      case (?id) { ?id };
      case null { await createFolder(accessToken, name) };
    };
  };

  // ── Subida multipart ──────────────────────────────────────────────────────

  func concatBlobs(parts : [Blob]) : Blob {
    let out = List.empty<Nat8>();
    for (part in parts.values()) {
      for (b in part.values()) {
        out.add(b);
      };
    };
    out.toArray().toBlob();
  };

  // Sube el JSON como multipart/related a la carpeta indicada. Devuelve los
  // metadatos del archivo creado o `null` si la subida falló.
  func uploadJson(
    accessToken : Text,
    folderId : Text,
    fileName : Text,
    json : Text,
  ) : async ?File {
    let boundary = "hr-backup-boundary-7f3a9c";
    let metadata = "{\"name\":\"" # escapeQuery(fileName) # "\",\"parents\":[\"" # folderId # "\"]}";
    let body = concatBlobs([
      Text.encodeUtf8("--" # boundary # "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" # metadata # "\r\n"),
      Text.encodeUtf8("--" # boundary # "\r\nContent-Type: " # JSON_MIME # "\r\n\r\n"),
      json.encodeUtf8(),
      Text.encodeUtf8("\r\n--" # boundary # "--\r\n"),
    ]);
    let args : IC.HttpRequestArgs = {
      url = UPLOAD_ENDPOINT # "?uploadType=multipart&fields=id,name,size,createdTime,webViewLink";
      max_response_bytes = ?65536.toNat64();
      headers = [
        { name = "Authorization"; value = "Bearer " # accessToken },
        { name = "Content-Type"; value = "multipart/related; boundary=" # boundary },
      ];
      body = ?body;
      method = #post;
      transform = null;
      is_replicated = ?false;
    };
    let response = await Call.httpRequest(args);
    if (response.status < 200 or response.status >= 300) { return null };
    let text = switch (response.body.decodeUtf8()) { case (?t) { t }; case null { return null } };
    switch (JSON.toCandid(text)) {
      case (#ok(candid)) { FileJSON.fromCandidValue(candid) };
      case (#err(_)) { null };
    };
  };

  // ── Operaciones de respaldo ───────────────────────────────────────────────

  /// Genera el respaldo y lo sube al Drive del administrador, creando la
  /// carpeta destino si no existe.
  public func createBackup(
    config : OAuthConfig,
    credentials : Types.DriveCredentials,
    state : State,
  ) : async Types.BackupOutcome {
    let accessToken = switch (await validAccessToken(config, credentials)) {
      case (?t) { t };
      case null { return #err(#notConnected) };
    };
    let folderName = backupFolderName();
    let folderId = switch (await ensureFolder(accessToken, folderName)) {
      case (?id) { id };
      case null { return #err(#driveFailed("No se pudo preparar la carpeta de respaldos en Google Drive")) };
    };
    let now = Time.now();
    let fileName = backupFileName(now);
    let json = serializeBackup(state);
    let uploaded = switch (await uploadJson(accessToken, folderId, fileName, json)) {
      case (?f) { f };
      case null { return #err(#driveFailed("No se pudo subir el respaldo a Google Drive")) };
    };
    let fileId = uploaded.id ?? "";
    let name = uploaded.name ?? fileName;
    let size = switch (uploaded.size) { case (?s) { textToNat(s) }; case null { json.size() } };
    let webViewLink = uploaded.webViewLink ?? ("https://drive.google.com/file/d/" # fileId # "/view");
    #ok({
      fileId;
      name;
      size;
      createdAt = now;
      webViewLink;
    });
  };

  func textToNat(t : Text) : Nat {
    switch (t.toNat()) { case (?n) { n }; case null { 0 } };
  };

  // Convierte el `createdTime` RFC 3339 de Drive (p. ej.
  // `2026-09-22T15:04:05.123Z`) a nanosegundos desde la época, conservando la
  // hora además de la fecha. Si no se puede interpretar, devuelve `0`.
  func parseCreatedTime(t : ?Text) : Int {
    switch (t) {
      case (?value) {
        // Separa la fecha de la hora en la `T`; la hora puede llevar zona
        // (`Z` o `+HH:MM`) y fracción de segundo, que se descartan.
        let parts = value.split(#char 'T').toArray();
        if (parts.size() < 2) { return 0 };
        let datePart = parts[0];
        let timePart = parts[1];
        let fields = datePart.split(#char '-').toArray();
        if (fields.size() != 3) { return 0 };
        let y = switch (fields[0].toInt()) { case (?v) { v }; case null { return 0 } };
        let m = switch (fields[1].toInt()) { case (?v) { v }; case null { return 0 } };
        let d = switch (fields[2].toInt()) { case (?v) { v }; case null { return 0 } };
        // La hora es `HH:MM:SS[.fff][Z|±HH:MM]`; se toman los dos primeros
        // campos separados por `:` (hora y minuto) y se ignora el resto.
        let timeFields = timePart.split(#char ':').toArray();
        if (timeFields.size() < 2) { return 0 };
        let hour = switch (timeFields[0].toInt()) { case (?v) { v }; case null { return 0 } };
        let minute = switch (timeFields[1].toInt()) { case (?v) { v }; case null { return 0 } };
        let days = daysFromCivil(y, m, d);
        days * 86400 * 1_000_000_000 + (hour * 3600 + minute * 60) * 1_000_000_000;
      };
      case null { 0 };
    };
  };

  // Días desde la época Unix para una fecha civil (inverso de civilFromDays).
  func daysFromCivil(y : Int, m : Int, d : Int) : Int {
    let yy = if (m <= 2) { y - 1 } else { y };
    let era = (if (yy >= 0) { yy } else { yy - 399 }) / 400;
    let yoe = yy - era * 400;
    let mp = if (m > 2) { m - 3 } else { m + 9 };
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468;
  };

  /// Lista los respaldos recientes del administrador desde su propio Drive.
  public func listBackups(
    config : OAuthConfig,
    credentials : Types.DriveCredentials,
  ) : async Types.BackupListOutcome {
    let accessToken = switch (await validAccessToken(config, credentials)) {
      case (?t) { t };
      case null { return #err(#notConnected) };
    };
    let folderName = backupFolderName();
    let folderId = switch (await findFolder(accessToken, folderName)) {
      case (?id) { id };
      case null { return #ok([]) };
    };
    let drive = Client(driveConfig(accessToken));
    let q = "'" # folderId # "' in parents and trashed=false";
    let result = await drive.files.list(
      "", "", "", "files(id,name,size,createdTime,webViewLink)", "", null, "", false, "", null, "",
      "", null, "", false, "", "", false, "createdTime desc", 50, "", q, "", false, false, "",
    );
    let files = switch (result.files) {
      case (?fs) { fs };
      case null { return #ok([]) };
    };
    let out = List.empty<Types.BackupFile>();
    for (f in files.values()) {
      let fileId = f.id ?? "";
      if (fileId != "") {
        out.add({
          fileId;
          name = f.name ?? "";
          size = switch (f.size) { case (?s) { textToNat(s) }; case null { 0 } };
          createdAt = parseCreatedTime(f.createdTime);
          webViewLink = f.webViewLink ?? ("https://drive.google.com/file/d/" # fileId # "/view");
        });
      };
    };
    #ok(out.toArray());
  };
};
