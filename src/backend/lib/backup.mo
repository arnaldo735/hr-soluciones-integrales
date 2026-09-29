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
import Order "mo:core/Order";
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

  func userProfileJson(principal : Principal, profile : UserTypes.UserProfile) : Candid = jObj([
    ("principal", jPrincipal(principal)),
    ("name", jText(profile.name)),
    ("role", jText(userRoleText(profile.role))),
    ("createdAt", jInt(profile.createdAt)),
  ]);

  func userProfilesJson(m : Map.Map<Principal, UserTypes.UserProfile>) : [Candid] {
    let out = List.empty<Candid>();
    for ((principal, profile) in m.entries()) {
      out.add(userProfileJson(principal, profile));
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

  // ── Secciones del respaldo (exportación paginada) ─────────────────────────
  //
  // El respaldo se divide en 23 secciones, una por clave raíz del JSON, en el
  // mismo orden en que las producía `serializeBackup`. Cada sección se
  // serializa en su propia llamada, de modo que ninguna consulta se acerca al
  // límite de instrucciones por mensaje. Las secciones de colección se pueden
  // paginar además por `offset`/`limit` para que una sola colección muy grande
  // tampoco desborde el límite.

  /// Claves raíz del JSON, en el orden exacto de `serializeBackup`.
  public let SECTION_KEYS : [Text] = [
    "parts",
    "lots",
    "movements",
    "customers",
    "motorcycles",
    "orders",
    "suppliers",
    "purchases",
    "payments",
    "invoices",
    "businessSettings",
    "userProfiles",
    "quotes",
    "services",
    "serviceCategories",
    "technicians",
    "appointments",
    "expenses",
    "expenseCategories",
    "posSales",
    "receivablePayments",
    "supplierOrders",
    "company",
  ];

  /// Tamaño máximo de página que acepta `getBackupSection`. Acota cuántos
  /// elementos se serializan por llamada.
  public let MAX_PAGE_SIZE : Nat = 200;

  /// Serializa un valor Candid a JSON, con el mismo mensaje de error que usaba
  /// `serializeBackup`.
  func toJson(value : Candid) : Text {
    switch (JSON.fromCandid(value)) {
      case (#ok(text)) { text };
      case (#err(message)) { Runtime.trap("No se pudo serializar el respaldo: " # message) };
    };
  };

  // Serializa una página de una colección: toma los elementos
  // `[offset, offset+limit)` del arreglo completo y los serializa como un
  // arreglo JSON. Solo se serializa la página, nunca la colección entera.
  // Devuelve el JSON y el total de elementos de la sección.
  func pageJson<V>(items : [V], f : V -> Candid, offset : Nat, limit : Nat) : (Text, Nat) {
    let total = items.size();
    let start = if (offset > total) { total } else { offset };
    let end = if (start + limit > total) { total } else { start + limit };
    let page = List.empty<Candid>();
    var i = start;
    while (i < end) {
      page.add(f(items[i]));
      i += 1;
    };
    (toJson(jArr(page.toArray())), total);
  };

  // Valores de un mapa como arreglo, sin serializar. Es una copia barata que
  // permite paginar por índice antes de serializar.
  func mapValuesRaw<K, V>(m : Map.Map<K, V>) : [V] {
    let out = List.empty<V>();
    for ((_, v) in m.entries()) {
      out.add(v);
    };
    out.toArray();
  };

  // Pares (clave, valor) de un mapa como arreglo, sin serializar. Se usa para
  // los perfiles de usuario, cuya clave (el principal) forma parte del JSON.
  func mapEntriesRaw<K, V>(m : Map.Map<K, V>) : [(K, V)] {
    let out = List.empty<(K, V)>();
    for (entry in m.entries()) {
      out.add(entry);
    };
    out.toArray();
  };

  /// Manifiesto de la copia local paginada: nombre del archivo, momento de
  /// generación y el plan ordenado de secciones. No serializa ningún dato, así
  /// que la consulta siempre responde muy por debajo del límite de
  /// instrucciones por mensaje.
  public func localBackupManifest(now : Int) : Types.LocalBackupManifest {
    {
      fileName = localBackupFileName(now);
      generatedAt = now;
      sections = SECTION_KEYS;
      totalSections = SECTION_KEYS.size();
      maxPageSize = MAX_PAGE_SIZE;
    };
  };

  /// Serializa una sección completa del respaldo como valor JSON. `offset` y
  /// `limit` solo aplican a las secciones de colección; las secciones de un
  /// único registro los ignoran. Devuelve el JSON de la página, el total de
  /// elementos de la sección y si la página es la última.
  public func sectionChunk(
    state : State,
    index : Nat,
    offset : Nat,
    limit : Nat,
  ) : (Text, Nat, Bool) {
    let bounded = if (limit == 0 or limit > MAX_PAGE_SIZE) { MAX_PAGE_SIZE } else { limit };
    switch (index) {
      case (0) {
        let (json, total) = pageJson(mapValuesRaw(state.parts), partJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (1) {
        let (json, total) = pageJson(mapValuesRaw(state.lots), lotJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (2) {
        let (json, total) = pageJson(mapValuesRaw(state.movements), movementJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (3) {
        let (json, total) = pageJson(mapValuesRaw(state.customers), customerJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (4) {
        let (json, total) = pageJson(mapValuesRaw(state.motorcycles), motorcycleJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (5) {
        let (json, total) = pageJson(mapValuesRaw(state.orders), orderJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (6) {
        let (json, total) = pageJson(mapValuesRaw(state.suppliers), supplierJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (7) {
        let (json, total) = pageJson(mapValuesRaw(state.purchases), purchaseJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (8) {
        let (json, total) = pageJson(mapValuesRaw(state.payments), paymentJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (9) {
        let (json, total) = pageJson(mapValuesRaw(state.invoices), invoiceJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (10) {
        (toJson(businessSettingsJson(state.businessSettings.settings)), 0, true);
      };
      case (11) {
        let (json, total) = pageJson(mapEntriesRaw(state.userProfiles), func (entry : (Principal, UserTypes.UserProfile)) : Candid = userProfileJson(entry.0, entry.1), offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (12) {
        let (json, total) = pageJson(mapValuesRaw(state.quotes), quoteJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (13) {
        let (json, total) = pageJson(mapValuesRaw(state.services), serviceJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (14) {
        let (json, total) = pageJson(mapValuesRaw(state.serviceCategories), serviceCategoryJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (15) {
        let (json, total) = pageJson(mapValuesRaw(state.technicians), technicianJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (16) {
        let (json, total) = pageJson(mapValuesRaw(state.appointments), appointmentJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (17) {
        let (json, total) = pageJson(mapValuesRaw(state.expenses), expenseJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (18) {
        let (json, total) = pageJson(mapValuesRaw(state.expenseCategories), expenseCategoryJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (19) {
        let (json, total) = pageJson(mapValuesRaw(state.posSales), posSaleJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (20) {
        let (json, total) = pageJson(mapValuesRaw(state.receivablePayments), receivablePaymentJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (21) {
        let (json, total) = pageJson(mapValuesRaw(state.supplierOrders), supplierOrderJson, offset, bounded);
        (json, total, offset + bounded >= total);
      };
      case (22) {
        (toJson(companyProfileJson(state.company.profile)), 0, true);
      };
      case (_) {
        Runtime.trap("Sección de respaldo fuera de rango: " # index.toText());
      };
    };
  };

  /// Serializa las colecciones del taller a un JSON. Se conserva para el
  /// respaldo a Google Drive, que sube el archivo en una sola llamada de
  /// actualización (no de consulta) y por tanto no está sujeto al límite de
  /// instrucciones de las consultas.
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
    toJson(root);
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

  // ── Restauración desde una copia local ────────────────────────────────────
  //
  // El archivo de copia es el JSON que produce `getLocalBackupManifest` +
  // `getBackupSection`: un objeto raíz con `generatedAt`, `formatVersion` y
  // una clave por sección. La restauración se hace en dos pasos para respetar
  // el límite de instrucciones por mensaje:
  //
  //   1. `validateRestoreFile` parsea el archivo una vez y describe su fecha y
  //      sus secciones, sin tocar el estado.
  //   2. `restoreSection` parsea el archivo de nuevo y aplica **una** sección,
  //      sobrescribiendo solo esa colección.
  //
  // Cada sección se deserializa con su propio lector; un registro con formato
  // inválido hace fallar la sección completa sin escribir nada (la sección se
  // construye primero en memoria y solo se vuelca al mapa al final).

  // ── Lectura de valores JSON (Candid) ──────────────────────────────────────

  func asRecord(v : Candid) : ?[(Text, Candid)] {
    switch (v) {
      case (#Record(entries)) { ?entries };
      case (#Map(entries)) { ?entries };
      case _ { null };
    };
  };

  func field(v : Candid, name : Text) : ?Candid {
    switch (asRecord(v)) {
      case (?entries) {
        var found : ?Candid = null;
        for ((key, value) in entries.values()) {
          if (key == name) { found := ?value };
        };
        found;
      };
      case null { null };
    };
  };

  func asText(v : Candid) : ?Text {
    switch (v) { case (#Text(t)) { ?t }; case _ { null } };
  };

  func asNat(v : Candid) : ?Nat {
    switch (v) { case (#Nat(n)) { ?n }; case _ { null } };
  };

  func asInt(v : Candid) : ?Int {
    switch (v) {
      case (#Int(n)) { ?n };
      case (#Nat(n)) { ?n.toInt() };
      case _ { null };
    };
  };

  func asBool(v : Candid) : ?Bool {
    switch (v) { case (#Bool(b)) { ?b }; case _ { null } };
  };

  func asArray(v : Candid) : ?[Candid] {
    switch (v) { case (#Array(items)) { ?items }; case _ { null } };
  };

  // Un valor opcional: `#Null` (o ausente) es `null`; cualquier otro valor es
  // `?valor`.
  func asOpt(v : ?Candid) : ?Candid {
    switch (v) {
      case null { null };
      case (?inner) {
        switch (inner) { case (#Null) { null }; case _ { ?inner } };
      };
    };
  };

  func asPrincipal(v : Candid) : ?Principal {
    switch (v) {
      case (#Principal(p)) { ?p };
      case (#Text(t)) { ?Principal.fromText(t) };
      case _ { null };
    };
  };

  // ── Lectores por entidad ──────────────────────────────────────────────────
  // Cada lector devuelve `null` si el registro no tiene la forma esperada; el
  // llamador convierte ese `null` en un error de sección.

  func readPart(v : Candid) : ?InventoryTypes.Part {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?sku = asText(field(v, "sku") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?category = asText(field(v, "category") ?? #Null) else return null;
    let ?brand = asText(field(v, "brand") ?? #Null) else return null;
    let ?unit = asText(field(v, "unit") ?? #Null) else return null;
    let ?salePrice = asNat(field(v, "salePrice") ?? #Null) else return null;
    let ?costPrice = asNat(field(v, "costPrice") ?? #Null) else return null;
    let ?lowStockThreshold = asNat(field(v, "lowStockThreshold") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    // `barcode` es opcional en archivos anteriores a su incorporación.
    let barcode = asText(field(v, "barcode") ?? #Null) ?? "";
    ?{ id; sku; barcode; name; category; brand; unit; salePrice; costPrice; lowStockThreshold; createdAt };
  };

  func readLot(v : Candid) : ?InventoryTypes.Lot {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?partId = asNat(field(v, "partId") ?? #Null) else return null;
    let ?lotNumber = asText(field(v, "lotNumber") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitCost = asNat(field(v, "unitCost") ?? #Null) else return null;
    let ?receivedAt = asInt(field(v, "receivedAt") ?? #Null) else return null;
    ?{
      id; partId; lotNumber; quantity; unitCost;
      supplierId = asOpt(field(v, "supplierId")).map(func (x) = asNat(x) ?? 0);
      purchaseId = asOpt(field(v, "purchaseId")).map(func (x) = asNat(x) ?? 0);
      receivedAt;
    };
  };

  func readMovementKind(v : Candid) : ?InventoryTypes.MovementKind {
    switch (asText(v)) {
      case (?"sale") { ?#sale };
      case (?"purchase") { ?#purchase };
      case (?"adjustment") { ?#adjustment };
      case _ { null };
    };
  };

  func readMovement(v : Candid) : ?InventoryTypes.Movement {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?partId = asNat(field(v, "partId") ?? #Null) else return null;
    let ?kind = readMovementKind(field(v, "kind") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?performedBy = asPrincipal(field(v, "performedBy") ?? #Null) else return null;
    let ?at = asInt(field(v, "at") ?? #Null) else return null;
    ?{
      id; partId; kind; quantity; performedBy; at;
      lotId = asOpt(field(v, "lotId")).map(func (x) = asNat(x) ?? 0);
      unitCost = asOpt(field(v, "unitCost")).map(func (x) = asNat(x) ?? 0);
      reason = asOpt(field(v, "reason")).map(func (x) = asText(x) ?? "");
      referenceId = asOpt(field(v, "referenceId")).map(func (x) = asNat(x) ?? 0);
    };
  };

  func readCustomer(v : Candid) : ?CustomerTypes.Customer {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?phone = asText(field(v, "phone") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{
      id; name; phone; createdAt;
      email = asOpt(field(v, "email")).map(func (x) = asText(x) ?? "");
      document = asOpt(field(v, "document")).map(func (x) = asText(x) ?? "");
      address = asOpt(field(v, "address")).map(func (x) = asText(x) ?? "");
    };
  };

  func readMotorcycle(v : Candid) : ?CustomerTypes.Motorcycle {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?customerId = asNat(field(v, "customerId") ?? #Null) else return null;
    let ?plate = asText(field(v, "plate") ?? #Null) else return null;
    let ?brand = asText(field(v, "brand") ?? #Null) else return null;
    let ?model = asText(field(v, "model") ?? #Null) else return null;
    let ?year = asNat(field(v, "year") ?? #Null) else return null;
    let ?mileage = asNat(field(v, "mileage") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{ id; customerId; plate; brand; model; year; mileage; createdAt };
  };

  func readOrderStatus(v : Candid) : ?WorkshopTypes.OrderStatus {
    switch (asText(v)) {
      case (?"received") { ?#received };
      case (?"inRepair") { ?#inRepair };
      case (?"ready") { ?#ready };
      case (?"delivered") { ?#delivered };
      case (?"cancelled") { ?#cancelled };
      case _ { null };
    };
  };

  func readOrderPart(v : Candid) : ?WorkshopTypes.OrderPart {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?partId = asNat(field(v, "partId") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitPrice = asNat(field(v, "unitPrice") ?? #Null) else return null;
    let ?unitCost = asNat(field(v, "unitCost") ?? #Null) else return null;
    ?{
      id; partId; description; quantity; unitPrice; unitCost;
      lotId = asOpt(field(v, "lotId")).map(func (x) = asNat(x) ?? 0);
    };
  };

  func readLaborItem(v : Candid) : ?WorkshopTypes.LaborItem {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?price = asNat(field(v, "price") ?? #Null) else return null;
    ?{
      id; description; price;
      technicianId = asOpt(field(v, "technicianId")).map(func (x) = asNat(x) ?? 0);
      serviceId = asOpt(field(v, "serviceId")).map(func (x) = asNat(x) ?? 0);
    };
  };

  func readOrderPhoto(v : Candid) : ?WorkshopTypes.OrderPhoto {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?filename = asText(field(v, "filename") ?? #Null) else return null;
    let ?mimeType = asText(field(v, "mimeType") ?? #Null) else return null;
    let ?uploadedBy = asPrincipal(field(v, "uploadedBy") ?? #Null) else return null;
    let ?uploadedAt = asInt(field(v, "uploadedAt") ?? #Null) else return null;
    // Los bytes de la foto viven en el almacenamiento de la plataforma y no
    // forman parte del respaldo; se restaura la referencia vacía.
    ?{ id; blob = ([] : [Nat8]).toBlob(); filename; mimeType; uploadedBy; uploadedAt };
  };

  func readStatusChange(v : Candid) : ?WorkshopTypes.StatusChange {
    let ?to = readOrderStatus(field(v, "to") ?? #Null) else return null;
    let ?performedBy = asPrincipal(field(v, "performedBy") ?? #Null) else return null;
    let ?at = asInt(field(v, "at") ?? #Null) else return null;
    let from = switch (asOpt(field(v, "from"))) {
      case null { null };
      case (?inner) { readOrderStatus(inner) };
    };
    ?{ from; to; performedBy; at };
  };

  func readOrder(v : Candid) : ?WorkshopTypes.WorkshopOrder {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?orderNumber = asText(field(v, "orderNumber") ?? #Null) else return null;
    let ?customerId = asNat(field(v, "customerId") ?? #Null) else return null;
    let ?motorcycleId = asNat(field(v, "motorcycleId") ?? #Null) else return null;
    let ?intakeMileage = asNat(field(v, "intakeMileage") ?? #Null) else return null;
    let ?problem = asText(field(v, "problem") ?? #Null) else return null;
    let ?status = readOrderStatus(field(v, "status") ?? #Null) else return null;
    let ?parts = readList(field(v, "parts"), readOrderPart) else return null;
    let ?labor = readList(field(v, "labor"), readLaborItem) else return null;
    let ?photos = readList(field(v, "photos"), readOrderPhoto) else return null;
    let ?technicianIds = readNatList(field(v, "technicianIds")) else return null;
    let ?statusHistory = readList(field(v, "statusHistory"), readStatusChange) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    let ?updatedAt = asInt(field(v, "updatedAt") ?? #Null) else return null;
    ?{
      id; orderNumber; customerId; motorcycleId; intakeMileage; problem; status;
      parts; labor; photos; technicianIds; statusHistory; createdAt; updatedAt;
      cancelReason = asOpt(field(v, "cancelReason")).map(func (x) = asText(x) ?? "");
      cancelledAt = asOpt(field(v, "cancelledAt")).map(func (x) = asInt(x) ?? 0);
    };
  };

  func readSupplier(v : Candid) : ?PurchasingTypes.Supplier {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?phone = asText(field(v, "phone") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{
      id; name; phone; createdAt;
      contactName = asOpt(field(v, "contactName")).map(func (x) = asText(x) ?? "");
      email = asOpt(field(v, "email")).map(func (x) = asText(x) ?? "");
      taxId = asOpt(field(v, "taxId")).map(func (x) = asText(x) ?? "");
      address = asOpt(field(v, "address")).map(func (x) = asText(x) ?? "");
    };
  };

  func readPurchaseItem(v : Candid) : ?PurchasingTypes.PurchaseItem {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?partId = asNat(field(v, "partId") ?? #Null) else return null;
    let ?lotNumber = asText(field(v, "lotNumber") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitCost = asNat(field(v, "unitCost") ?? #Null) else return null;
    ?{ id; partId; lotNumber; quantity; unitCost };
  };

  func readPurchase(v : Candid) : ?PurchasingTypes.Purchase {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?supplierId = asNat(field(v, "supplierId") ?? #Null) else return null;
    let ?items = readList(field(v, "items"), readPurchaseItem) else return null;
    let ?total = asNat(field(v, "total") ?? #Null) else return null;
    let ?paidAmount = asNat(field(v, "paidAmount") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    // `accepted` es opcional en archivos anteriores; se asume aceptada para no
    // habilitar el borrado de compras que ya afectaron el inventario.
    let accepted = asBool(field(v, "accepted") ?? #Null) ?? true;
    ?{ id; supplierId; items; total; paidAmount; accepted; createdAt };
  };

  func readPaymentMethod(v : Candid) : ?PurchasingTypes.PaymentMethod {
    switch (asText(v)) {
      case (?"cash") { ?#cash };
      case (?"card") { ?#card };
      case (?"transfer") { ?#transfer };
      case (?"mixed") { ?#mixed };
      case _ { null };
    };
  };

  func readPayment(v : Candid) : ?PurchasingTypes.Payment {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?supplierId = asNat(field(v, "supplierId") ?? #Null) else return null;
    let ?amount = asNat(field(v, "amount") ?? #Null) else return null;
    let ?method = readPaymentMethod(field(v, "method") ?? #Null) else return null;
    let ?performedBy = asPrincipal(field(v, "performedBy") ?? #Null) else return null;
    let ?at = asInt(field(v, "at") ?? #Null) else return null;
    ?{
      id; supplierId; amount; method; performedBy; at;
      purchaseId = asOpt(field(v, "purchaseId")).map(func (x) = asNat(x) ?? 0);
      note = asOpt(field(v, "note")).map(func (x) = asText(x) ?? "");
    };
  };

  func readInvoiceLineKind(v : Candid) : ?BillingTypes.InvoiceLineKind {
    switch (asText(v)) {
      case (?"part") { ?#part };
      case (?"service") { ?#service };
      case _ { null };
    };
  };

  func readInvoiceLine(v : Candid) : ?BillingTypes.InvoiceLine {
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitPrice = asNat(field(v, "unitPrice") ?? #Null) else return null;
    let ?amount = asNat(field(v, "amount") ?? #Null) else return null;
    let ?kind = readInvoiceLineKind(field(v, "kind") ?? #Null) else return null;
    let ?unitCost = asNat(field(v, "unitCost") ?? #Null) else return null;
    ?{ description; quantity; unitPrice; amount; kind; unitCost };
  };

  func readPaymentStatus(v : Candid) : ?BillingTypes.PaymentStatus {
    switch (asText(v)) {
      case (?"pending") { ?#pending };
      case (?"paid") { ?#paid };
      case _ { null };
    };
  };

  func readPaymentCondition(v : Candid) : ?BillingTypes.PaymentCondition {
    switch (asText(v)) {
      case (?"cash") { ?#cash };
      case (?"credit") { ?#credit };
      case _ { null };
    };
  };

  func readInstallment(v : Candid) : ?BillingTypes.Installment {
    let ?number = asNat(field(v, "number") ?? #Null) else return null;
    let ?amount = asNat(field(v, "amount") ?? #Null) else return null;
    let ?dueDate = asInt(field(v, "dueDate") ?? #Null) else return null;
    let ?paid = asBool(field(v, "paid") ?? #Null) else return null;
    ?{
      number; amount; dueDate; paid;
      paidAt = asOpt(field(v, "paidAt")).map(func (x) = asInt(x) ?? 0);
    };
  };

  func readInstallmentPlan(v : Candid) : ?BillingTypes.InstallmentPlan {
    let ?installmentCount = asNat(field(v, "installmentCount") ?? #Null) else return null;
    let ?firstDueDate = asInt(field(v, "firstDueDate") ?? #Null) else return null;
    let ?installments = readList(field(v, "installments"), readInstallment) else return null;
    ?{ installmentCount; firstDueDate; installments };
  };

  func readInvoiceOrigin(v : Candid) : ?BillingTypes.InvoiceOrigin {
    switch (asText(v)) {
      case (?"workshopOrder") { ?#workshopOrder };
      case (?"pos") { ?#pos };
      case (?"quote") { ?#quote };
      case _ { null };
    };
  };

  func readInvoice(v : Candid) : ?BillingTypes.Invoice {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?number = asText(field(v, "number") ?? #Null) else return null;
    let ?origin = readInvoiceOrigin(field(v, "origin") ?? #Null) else return null;
    let ?customerName = asText(field(v, "customerName") ?? #Null) else return null;
    let ?lines = readList(field(v, "lines"), readInvoiceLine) else return null;
    let ?subtotal = asNat(field(v, "subtotal") ?? #Null) else return null;
    let ?discount = asNat(field(v, "discount") ?? #Null) else return null;
    let ?taxRate = asNat(field(v, "taxRate") ?? #Null) else return null;
    let ?tax = asNat(field(v, "tax") ?? #Null) else return null;
    let ?total = asNat(field(v, "total") ?? #Null) else return null;
    let ?paymentMethod = readPaymentMethod(field(v, "paymentMethod") ?? #Null) else return null;
    let ?paymentCondition = readPaymentCondition(field(v, "paymentCondition") ?? #Null) else return null;
    let ?paymentStatus = readPaymentStatus(field(v, "paymentStatus") ?? #Null) else return null;
    let ?issuedAt = asInt(field(v, "issuedAt") ?? #Null) else return null;
    ?{
      id; number; origin; customerName; lines; subtotal; discount; taxRate; tax;
      total; paymentMethod; paymentCondition; paymentStatus; issuedAt;
      orderId = asOpt(field(v, "orderId")).map(func (x) = asNat(x) ?? 0);
      posSaleId = asOpt(field(v, "posSaleId")).map(func (x) = asNat(x) ?? 0);
      customerId = asOpt(field(v, "customerId")).map(func (x) = asNat(x) ?? 0);
      customerTaxId = asOpt(field(v, "customerTaxId")).map(func (x) = asText(x) ?? "");
      customerAddress = asOpt(field(v, "customerAddress")).map(func (x) = asText(x) ?? "");
      installments = switch (asOpt(field(v, "installments"))) {
        case null { null };
        case (?inner) { readInstallmentPlan(inner) };
      };
    };
  };

  func readBusinessSettings(v : Candid) : ?BillingTypes.BusinessSettings {
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?taxId = asText(field(v, "taxId") ?? #Null) else return null;
    let ?address = asText(field(v, "address") ?? #Null) else return null;
    let ?phone = asText(field(v, "phone") ?? #Null) else return null;
    let ?taxRate = asNat(field(v, "taxRate") ?? #Null) else return null;
    ?{ name; taxId; address; phone; taxRate };
  };

  func readUserRole(v : Candid) : ?UserTypes.UserRole {
    switch (asText(v)) {
      case (?"admin") { ?#admin };
      case (?"user") { ?#user };
      case (?"guest") { ?#guest };
      case _ { null };
    };
  };

  func readUserProfile(v : Candid) : ?UserTypes.UserProfile {
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?role = readUserRole(field(v, "role") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{ name; role; createdAt };
  };

  func readQuoteStatus(v : Candid) : ?QuoteTypes.QuoteStatus {
    switch (asText(v)) {
      case (?"draft") { ?#draft };
      case (?"sent") { ?#sent };
      case (?"accepted") { ?#accepted };
      case (?"rejected") { ?#rejected };
      case (?"expired") { ?#expired };
      case _ { null };
    };
  };

  func readQuotePartLine(v : Candid) : ?QuoteTypes.QuotePartLine {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?partId = asNat(field(v, "partId") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitPrice = asNat(field(v, "unitPrice") ?? #Null) else return null;
    ?{ id; partId; description; quantity; unitPrice };
  };

  func readQuoteServiceLine(v : Candid) : ?QuoteTypes.QuoteServiceLine {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitPrice = asNat(field(v, "unitPrice") ?? #Null) else return null;
    ?{
      id; description; quantity; unitPrice;
      serviceId = asOpt(field(v, "serviceId")).map(func (x) = asNat(x) ?? 0);
    };
  };

  func readQuote(v : Candid) : ?QuoteTypes.Quote {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?quoteNumber = asText(field(v, "quoteNumber") ?? #Null) else return null;
    let ?customerId = asNat(field(v, "customerId") ?? #Null) else return null;
    let ?motorcycleId = asNat(field(v, "motorcycleId") ?? #Null) else return null;
    let ?status = readQuoteStatus(field(v, "status") ?? #Null) else return null;
    let ?partLines = readList(field(v, "partLines"), readQuotePartLine) else return null;
    let ?serviceLines = readList(field(v, "serviceLines"), readQuoteServiceLine) else return null;
    let ?discount = asNat(field(v, "discount") ?? #Null) else return null;
    let ?taxRate = asNat(field(v, "taxRate") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    let ?updatedAt = asInt(field(v, "updatedAt") ?? #Null) else return null;
    ?{
      id; quoteNumber; customerId; motorcycleId; status; partLines; serviceLines;
      discount; taxRate; createdAt; updatedAt;
      notes = asOpt(field(v, "notes")).map(func (x) = asText(x) ?? "");
    };
  };

  func readService(v : Candid) : ?ServiceTypes.Service {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?code = asText(field(v, "code") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?category = asText(field(v, "category") ?? #Null) else return null;
    let ?laborRate = asNat(field(v, "laborRate") ?? #Null) else return null;
    let ?estimatedMinutes = asNat(field(v, "estimatedMinutes") ?? #Null) else return null;
    let ?active = asBool(field(v, "active") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{ id; code; name; description; category; laborRate; estimatedMinutes; active; createdAt };
  };

  func readServiceCategory(v : Candid) : ?ServiceCategoryTypes.ServiceCategory {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{ id; name; description; createdAt };
  };

  func readTechnician(v : Candid) : ?TechnicianTypes.Technician {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?code = asText(field(v, "code") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?phone = asText(field(v, "phone") ?? #Null) else return null;
    let ?specialty = asText(field(v, "specialty") ?? #Null) else return null;
    let ?hourlyRate = asNat(field(v, "hourlyRate") ?? #Null) else return null;
    let ?commissionRate = asNat(field(v, "commissionRate") ?? #Null) else return null;
    let ?active = asBool(field(v, "active") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{
      id; code; name; phone; specialty; hourlyRate; commissionRate; active; createdAt;
      email = asOpt(field(v, "email")).map(func (x) = asText(x) ?? "");
    };
  };

  func readAppointmentStatus(v : Candid) : ?AppointmentTypes.AppointmentStatus {
    switch (asText(v)) {
      case (?"scheduled") { ?#scheduled };
      case (?"confirmed") { ?#confirmed };
      case (?"attended") { ?#attended };
      case (?"cancelled") { ?#cancelled };
      case (?"noShow") { ?#noShow };
      case _ { null };
    };
  };

  func readAppointment(v : Candid) : ?AppointmentTypes.Appointment {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?customerId = asNat(field(v, "customerId") ?? #Null) else return null;
    let ?motorcycleId = asNat(field(v, "motorcycleId") ?? #Null) else return null;
    let ?scheduledAt = asInt(field(v, "scheduledAt") ?? #Null) else return null;
    let ?durationMinutes = asNat(field(v, "durationMinutes") ?? #Null) else return null;
    let ?reason = asText(field(v, "reason") ?? #Null) else return null;
    let ?status = readAppointmentStatus(field(v, "status") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    let ?updatedAt = asInt(field(v, "updatedAt") ?? #Null) else return null;
    ?{
      id; customerId; motorcycleId; scheduledAt; durationMinutes; reason; status;
      createdAt; updatedAt;
      technicianId = asOpt(field(v, "technicianId")).map(func (x) = asNat(x) ?? 0);
    };
  };

  func readExpense(v : Candid) : ?ExpenseTypes.Expense {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?date = asInt(field(v, "date") ?? #Null) else return null;
    let ?concept = asText(field(v, "concept") ?? #Null) else return null;
    let ?categoryId = asNat(field(v, "categoryId") ?? #Null) else return null;
    let ?categoryName = asText(field(v, "categoryName") ?? #Null) else return null;
    let ?amount = asNat(field(v, "amount") ?? #Null) else return null;
    let ?tax = asNat(field(v, "tax") ?? #Null) else return null;
    let ?paymentMethod = asText(field(v, "paymentMethod") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{
      id; date; concept; categoryId; categoryName; amount; tax; paymentMethod; createdAt;
      supplierId = asOpt(field(v, "supplierId")).map(func (x) = asNat(x) ?? 0);
      supplierName = asOpt(field(v, "supplierName")).map(func (x) = asText(x) ?? "");
      receiptUrl = asOpt(field(v, "receiptUrl")).map(func (x) = asText(x) ?? "");
    };
  };

  func readExpenseCategory(v : Candid) : ?ExpenseCategoryTypes.ExpenseCategory {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?name = asText(field(v, "name") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{ id; name; description; createdAt };
  };

  func readPosSaleLine(v : Candid) : ?PosTypes.PosSaleLine {
    let ?partId = asNat(field(v, "partId") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?unitPrice = asNat(field(v, "unitPrice") ?? #Null) else return null;
    let ?discount = asNat(field(v, "discount") ?? #Null) else return null;
    let ?amount = asNat(field(v, "amount") ?? #Null) else return null;
    ?{ partId; description; quantity; unitPrice; discount; amount };
  };

  func readPosSale(v : Candid) : ?PosTypes.PosSale {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?saleNumber = asText(field(v, "saleNumber") ?? #Null) else return null;
    let ?lines = readList(field(v, "lines"), readPosSaleLine) else return null;
    let ?subtotal = asNat(field(v, "subtotal") ?? #Null) else return null;
    let ?discount = asNat(field(v, "discount") ?? #Null) else return null;
    let ?taxRate = asNat(field(v, "taxRate") ?? #Null) else return null;
    let ?tax = asNat(field(v, "tax") ?? #Null) else return null;
    let ?total = asNat(field(v, "total") ?? #Null) else return null;
    let ?paymentMethod = asText(field(v, "paymentMethod") ?? #Null) else return null;
    let ?paymentCondition = readPaymentCondition(field(v, "paymentCondition") ?? #Null) else return null;
    let ?amountReceived = asNat(field(v, "amountReceived") ?? #Null) else return null;
    let ?change = asNat(field(v, "change") ?? #Null) else return null;
    let ?invoiceId = asNat(field(v, "invoiceId") ?? #Null) else return null;
    let ?soldBy = asPrincipal(field(v, "soldBy") ?? #Null) else return null;
    let ?soldAt = asInt(field(v, "soldAt") ?? #Null) else return null;
    ?{
      id; saleNumber; lines; subtotal; discount; taxRate; tax; total; paymentMethod;
      paymentCondition; amountReceived; change; invoiceId; soldBy; soldAt;
      customerId = asOpt(field(v, "customerId")).map(func (x) = asNat(x) ?? 0);
      customerName = asOpt(field(v, "customerName")).map(func (x) = asText(x) ?? "");
    };
  };

  func readReceivablePayment(v : Candid) : ?ReceivableTypes.ReceivablePayment {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?invoiceId = asNat(field(v, "invoiceId") ?? #Null) else return null;
    let ?amount = asNat(field(v, "amount") ?? #Null) else return null;
    let ?method = asText(field(v, "method") ?? #Null) else return null;
    let ?performedBy = asPrincipal(field(v, "performedBy") ?? #Null) else return null;
    let ?at = asInt(field(v, "at") ?? #Null) else return null;
    ?{
      id; invoiceId; amount; method; performedBy; at;
      note = asOpt(field(v, "note")).map(func (x) = asText(x) ?? "");
    };
  };

  func readSupplierOrder(v : Candid) : ?SupplierOrderTypes.SupplierOrder {
    let ?id = asNat(field(v, "id") ?? #Null) else return null;
    let ?supplierId = asNat(field(v, "supplierId") ?? #Null) else return null;
    let ?quantity = asNat(field(v, "quantity") ?? #Null) else return null;
    let ?sku = asText(field(v, "sku") ?? #Null) else return null;
    let ?description = asText(field(v, "description") ?? #Null) else return null;
    let ?createdBy = asPrincipal(field(v, "createdBy") ?? #Null) else return null;
    let ?createdAt = asInt(field(v, "createdAt") ?? #Null) else return null;
    ?{ id; supplierId; quantity; sku; description; createdBy; createdAt };
  };

  func readDocumentType(v : Candid) : ?CompanyTypes.DocumentType {
    switch (asText(v)) {
      case (?"nit") { ?#nit };
      case (?"cedulaCiudadania") { ?#cedulaCiudadania };
      case (?"cedulaExtranjeria") { ?#cedulaExtranjeria };
      case _ { null };
    };
  };

  func readFiscalRegime(v : Candid) : ?CompanyTypes.FiscalRegime {
    switch (asText(v)) {
      case (?"responsableIva") { ?#responsableIva };
      case (?"noResponsableIva") { ?#noResponsableIva };
      case _ { null };
    };
  };

  func readTaxResponsibility(v : Candid) : ?CompanyTypes.TaxResponsibility {
    switch (asText(v)) {
      case (?"granContribuyente") { ?#granContribuyente };
      case (?"autorretenedor") { ?#autorretenedor };
      case (?"agenteRetencionIva") { ?#agenteRetencionIva };
      case (?"regimenSimple") { ?#regimenSimple };
      case (?"noAplica") { ?#noAplica };
      case _ { null };
    };
  };

  func readCompanyProfile(v : Candid) : ?CompanyTypes.CompanyProfile {
    let ?legalName = asText(field(v, "legalName") ?? #Null) else return null;
    let ?documentType = readDocumentType(field(v, "documentType") ?? #Null) else return null;
    let ?taxId = asText(field(v, "taxId") ?? #Null) else return null;
    let ?fiscalRegime = readFiscalRegime(field(v, "fiscalRegime") ?? #Null) else return null;
    let ?taxResponsibility = readTaxResponsibility(field(v, "taxResponsibility") ?? #Null) else return null;
    let ?address = asText(field(v, "address") ?? #Null) else return null;
    let ?city = asText(field(v, "city") ?? #Null) else return null;
    let ?phone = asText(field(v, "phone") ?? #Null) else return null;
    let ?taxRate = asNat(field(v, "taxRate") ?? #Null) else return null;
    let ?updatedAt = asInt(field(v, "updatedAt") ?? #Null) else return null;
    ?{
      legalName; documentType; taxId; fiscalRegime; taxResponsibility; address;
      city; phone; taxRate; updatedAt;
      tradeName = asOpt(field(v, "tradeName")).map(func (x) = asText(x) ?? "");
      checkDigit = asOpt(field(v, "checkDigit")).map(func (x) = asNat(x) ?? 0);
      email = asOpt(field(v, "email")).map(func (x) = asText(x) ?? "");
      website = asOpt(field(v, "website")).map(func (x) = asText(x) ?? "");
      logoUrl = asOpt(field(v, "logoUrl")).map(func (x) = asText(x) ?? "");
    };
  };

  // ── Lectores de listas ────────────────────────────────────────────────────

  // Lee un arreglo JSON aplicando un lector por elemento. Devuelve `null` si
  // el valor no es un arreglo o si algún elemento no tiene el formato esperado.
  func readList<T>(v : ?Candid, reader : Candid -> ?T) : ?[T] {
    switch (v) {
      case null { null };
      case (?value) {
        switch (asArray(value)) {
          case null { null };
          case (?items) {
            let out = List.empty<T>();
            for (item in items.values()) {
              switch (reader(item)) {
                case (?parsed) { out.add(parsed) };
                case null { return null };
              };
            };
            ?out.toArray();
          };
        };
      };
    };
  };

  func readNatList(v : ?Candid) : ?[Nat] {
    readList(v, func (item : Candid) : ?Nat = asNat(item));
  };

  // ── Validación del archivo ────────────────────────────────────────────────

  // Parsea el JSON raíz del archivo. Devuelve el valor Candid raíz o un error
  // de formato.
  func parseRoot(json : Text) : { #ok : Candid; #err : Text } {
    switch (JSON.toCandid(json)) {
      case (#ok(candid)) {
        switch (asRecord(candid)) {
          case (?_) { #ok(candid) };
          case null { #err("El archivo no tiene un objeto JSON en la raíz") };
        };
      };
      case (#err(message)) { #err("El archivo no es un JSON válido: " # message) };
    };
  };

  // Índice de una sección por su clave, o `null` si la clave no es conocida.
  func sectionIndex(key : Text) : ?Nat {
    var index = 0;
    for (known in SECTION_KEYS.values()) {
      if (known == key) { return ?index };
      index += 1;
    };
    null;
  };

  /// Valida un archivo de copia local y describe su fecha y sus secciones, sin
  /// alterar ningún dato. Es el paso previo a la restauración: el frontend
  /// muestra la vista previa y luego confirma sección por sección.
  public func validateRestoreFile(json : Text) : Types.RestorePreviewOutcome {
    let root = switch (parseRoot(json)) {
      case (#ok(candid)) { candid };
      case (#err(message)) { return #err(#invalidFormat(message)) };
    };
    // La versión es opcional en archivos antiguos; se asume la versión 1.
    let formatVersion = asNat(field(root, "formatVersion") ?? #Null) ?? 1;
    if (formatVersion > Types.RESTORE_FORMAT_VERSION) {
      return #err(#incompatibleVersion(formatVersion));
    };
    let generatedAt = asInt(field(root, "generatedAt") ?? #Null) ?? 0;
    let sections = List.empty<Types.RestoreSectionInfo>();
    var index = 0;
    for (key in SECTION_KEYS.values()) {
      switch (field(root, key)) {
        case (?value) {
          let count = switch (asArray(value)) {
            case (?items) { items.size() };
            case null { 1 };
          };
          sections.add({ key; index; count });
        };
        case null {};
      };
      index += 1;
    };
    let found = sections.toArray();
    if (found.size() == 0) {
      return #err(#noKnownSections);
    };
    #ok({
      generatedAt;
      formatVersion;
      sections = found;
      totalSections = found.size();
    });
  };

  // ── Aplicación de una sección ─────────────────────────────────────────────

  // Reemplaza el contenido de un mapa con los registros leídos. La sección se
  // construye primero en un mapa temporal; solo si todos los registros son
  // válidos se vuelca al mapa real, de modo que un archivo inválido no deja la
  // colección a medias.
  func replaceMap<K, V>(
    target : Map.Map<K, V>,
    parsed : [V],
    keyOf : V -> K,
    compare : (K, K) -> Order.Order,
  ) : Nat {
    let staged = Map.empty<K, V>();
    for (item in parsed.values()) {
      staged.add(keyOf(item), item);
    };
    target.clear();
    for ((key, value) in staged.entries()) {
      target.add(key, value);
    };
    parsed.size();
  };

  // Igual que `replaceMap`, pero para mapas cuyos registros ya vienen como
  // pares `(clave, valor)` (por ejemplo `userProfiles`, indexado por principal).
  func replaceMapEntries<K, V>(
    target : Map.Map<K, V>,
    parsed : [(K, V)],
    compare : (K, K) -> Order.Order,
  ) : Nat {
    let staged = Map.empty<K, V>();
    for ((key, value) in parsed.values()) {
      staged.add(key, value);
    };
    target.clear();
    for ((key, value) in staged.entries()) {
      target.add(key, value);
    };
    parsed.size();
  };

  // Aplica una sección del archivo al estado. `index` es la posición dentro de
  // `SECTION_KEYS`. Devuelve el resultado de la sección o un error de formato.
  public func restoreSection(
    state : State,
    json : Text,
    index : Nat,
  ) : Types.RestoreSectionOutcome {
    if (index >= SECTION_KEYS.size()) {
      return #err(#unknownSection(index.toText()));
    };
    let key = SECTION_KEYS[index];
    let root = switch (parseRoot(json)) {
      case (#ok(candid)) { candid };
      case (#err(message)) { return #err(#invalidFormat(message)) };
    };
    let formatVersion = asNat(field(root, "formatVersion") ?? #Null) ?? 1;
    if (formatVersion > Types.RESTORE_FORMAT_VERSION) {
      return #err(#incompatibleVersion(formatVersion));
    };
    let section = switch (field(root, key)) {
      case (?value) { value };
      case null { return #err(#unknownSection(key)) };
    };
    let restored = switch (index) {
      case (0) {
        let ?parsed = readList(?section, readPart) else return #err(#invalidSection(key));
        replaceMap(state.parts, parsed, func (p : InventoryTypes.Part) : Common.Id = p.id, Nat.compare);
      };
      case (1) {
        let ?parsed = readList(?section, readLot) else return #err(#invalidSection(key));
        replaceMap(state.lots, parsed, func (l : InventoryTypes.Lot) : Common.Id = l.id, Nat.compare);
      };
      case (2) {
        let ?parsed = readList(?section, readMovement) else return #err(#invalidSection(key));
        replaceMap(state.movements, parsed, func (m : InventoryTypes.Movement) : Common.Id = m.id, Nat.compare);
      };
      case (3) {
        let ?parsed = readList(?section, readCustomer) else return #err(#invalidSection(key));
        replaceMap(state.customers, parsed, func (c : CustomerTypes.Customer) : Common.Id = c.id, Nat.compare);
      };
      case (4) {
        let ?parsed = readList(?section, readMotorcycle) else return #err(#invalidSection(key));
        replaceMap(state.motorcycles, parsed, func (m : CustomerTypes.Motorcycle) : Common.Id = m.id, Nat.compare);
      };
      case (5) {
        let ?parsed = readList(?section, readOrder) else return #err(#invalidSection(key));
        replaceMap(state.orders, parsed, func (o : WorkshopTypes.WorkshopOrder) : Common.Id = o.id, Nat.compare);
      };
      case (6) {
        let ?parsed = readList(?section, readSupplier) else return #err(#invalidSection(key));
        replaceMap(state.suppliers, parsed, func (s : PurchasingTypes.Supplier) : Common.Id = s.id, Nat.compare);
      };
      case (7) {
        let ?parsed = readList(?section, readPurchase) else return #err(#invalidSection(key));
        replaceMap(state.purchases, parsed, func (p : PurchasingTypes.Purchase) : Common.Id = p.id, Nat.compare);
      };
      case (8) {
        let ?parsed = readList(?section, readPayment) else return #err(#invalidSection(key));
        replaceMap(state.payments, parsed, func (p : PurchasingTypes.Payment) : Common.Id = p.id, Nat.compare);
      };
      case (9) {
        let ?parsed = readList(?section, readInvoice) else return #err(#invalidSection(key));
        replaceMap(state.invoices, parsed, func (i : BillingTypes.Invoice) : Common.Id = i.id, Nat.compare);
      };
      case (10) {
        let ?parsed = readBusinessSettings(section) else return #err(#invalidSection(key));
        state.businessSettings.settings := parsed;
        1;
      };
      case (11) {
        let ?parsed = readList(?section, readUserProfileEntry) else return #err(#invalidSection(key));
        replaceMapEntries(state.userProfiles, parsed, Principal.compare);
      };
      case (12) {
        let ?parsed = readList(?section, readQuote) else return #err(#invalidSection(key));
        replaceMap(state.quotes, parsed, func (q : QuoteTypes.Quote) : Common.Id = q.id, Nat.compare);
      };
      case (13) {
        let ?parsed = readList(?section, readService) else return #err(#invalidSection(key));
        replaceMap(state.services, parsed, func (s : ServiceTypes.Service) : Common.Id = s.id, Nat.compare);
      };
      case (14) {
        let ?parsed = readList(?section, readServiceCategory) else return #err(#invalidSection(key));
        replaceMap(state.serviceCategories, parsed, func (c : ServiceCategoryTypes.ServiceCategory) : Common.Id = c.id, Nat.compare);
      };
      case (15) {
        let ?parsed = readList(?section, readTechnician) else return #err(#invalidSection(key));
        replaceMap(state.technicians, parsed, func (t : TechnicianTypes.Technician) : Common.Id = t.id, Nat.compare);
      };
      case (16) {
        let ?parsed = readList(?section, readAppointment) else return #err(#invalidSection(key));
        replaceMap(state.appointments, parsed, func (a : AppointmentTypes.Appointment) : Common.Id = a.id, Nat.compare);
      };
      case (17) {
        let ?parsed = readList(?section, readExpense) else return #err(#invalidSection(key));
        replaceMap(state.expenses, parsed, func (e : ExpenseTypes.Expense) : Common.Id = e.id, Nat.compare);
      };
      case (18) {
        let ?parsed = readList(?section, readExpenseCategory) else return #err(#invalidSection(key));
        replaceMap(state.expenseCategories, parsed, func (c : ExpenseCategoryTypes.ExpenseCategory) : Common.Id = c.id, Nat.compare);
      };
      case (19) {
        let ?parsed = readList(?section, readPosSale) else return #err(#invalidSection(key));
        replaceMap(state.posSales, parsed, func (s : PosTypes.PosSale) : Common.Id = s.id, Nat.compare);
      };
      case (20) {
        let ?parsed = readList(?section, readReceivablePayment) else return #err(#invalidSection(key));
        replaceMap(state.receivablePayments, parsed, func (p : ReceivableTypes.ReceivablePayment) : Common.Id = p.id, Nat.compare);
      };
      case (21) {
        let ?parsed = readList(?section, readSupplierOrder) else return #err(#invalidSection(key));
        replaceMap(state.supplierOrders, parsed, func (o : SupplierOrderTypes.SupplierOrder) : Common.Id = o.id, Nat.compare);
      };
      case (22) {
        let ?parsed = readCompanyProfile(section) else return #err(#invalidSection(key));
        state.company.profile := parsed;
        1;
      };
      case (_) {
        return #err(#unknownSection(key));
      };
    };
    #ok({
      key;
      index;
      status = #restored;
      restored;
    });
  };

  // Lee una entrada de perfil de usuario: `{ principal, name, role, createdAt }`.
  func readUserProfileEntry(v : Candid) : ?(Principal, UserTypes.UserProfile) {
    let ?principal = asPrincipal(field(v, "principal") ?? #Null) else return null;
    let ?profile = readUserProfile(v) else return null;
    ?(principal, profile);
  };
};
