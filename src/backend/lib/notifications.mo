import Map "mo:core/Map";
import Result "mo:core/Result";
import Text "mo:core/Text";
import Time "mo:core/Time";

import EmailClient "mo:caffeineai-email/emailClient";

import Common "../types/common";
import Types "../types/notifications";
import CustomerTypes "../types/customers";
import PurchasingTypes "../types/purchasing";
import WorkshopTypes "../types/workshop";
import QuoteTypes "../types/quotes";
import BillingTypes "../types/billing";
import AppointmentTypes "../types/appointments";
import ServiceTypes "../types/services";
import CompanyTypes "../types/company";
import HopeTypes "../types/hope";
import HopeLib "./hope";

module {
  public type State = {
    customers : Map.Map<Common.Id, CustomerTypes.Customer>;
    suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    quotes : Map.Map<Common.Id, QuoteTypes.Quote>;
    invoices : Map.Map<Common.Id, BillingTypes.Invoice>;
    appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>;
    services : Map.Map<Common.Id, ServiceTypes.Service>;
    company : { var profile : CompanyTypes.CompanyProfile };
    hope : { var settings : HopeTypes.HopeSettings };
  };

  // Envía un correo de notificación al cliente con el asunto y el mensaje
  // indicados. El destinatario se toma del correo registrado del cliente; si
  // el cliente no tiene correo, el envío se rechaza.
  public func notifyCustomer(state : State, input : Types.CustomerNotificationInput) : async Result.Result<Types.CustomerNotificationResult, Types.NotificationError> {
    let customer = switch (state.customers.get(input.customerId)) {
      case (?c) { c };
      case null { return #err(#customerNotFound(input.customerId)) };
    };

    let email = switch (customer.email) {
      case (?e) { e };
      case null { return #err(#missingEmail(input.customerId)) };
    };

    if (email.trim(#predicate(func c = c == ' ')) == "") {
      return #err(#missingEmail(input.customerId));
    };

    if (input.subject.trim(#predicate(func c = c == ' ')) == "") {
      return #err(#invalidSubject);
    };

    if (input.message.trim(#predicate(func c = c == ' ')) == "") {
      return #err(#invalidMessage);
    };

    // El cliente de correo devuelve `#err` en lugar de atrapar, pero un fallo
    // inesperado del propio cliente (por ejemplo, una variable de entorno
    // ausente) sí podría propagarse como trap. Se captura aquí para que todo
    // fallo de envío llegue al llamador como `#sendFailed` tipado.
    let body = HopeLib.appendHope({ hope = state.hope }, input.message, Time.now());

    let sendResult = try {
      await EmailClient.sendServiceEmail(
        "no-reply",
        [email],
        input.subject,
        body,
      );
    } catch (error) {
      return #err(#sendFailed(error.message()));
    };

    switch (sendResult) {
      case (#ok) {
        #ok({
          customerId = input.customerId;
          email;
          sent = true;
        });
      };
      case (#err(error)) { #err(#sendFailed(error)) };
    };
  };

  // ── Preparación de mensajes de WhatsApp ─────────────────────────────────
  //
  // Estas funciones son de solo lectura: no envían nada. Resuelven el teléfono
  // del contacto, lo normalizan a formato internacional y construyen el texto
  // sugerido en español con datos reales del registro referenciado. El
  // frontend abre WhatsApp con ese texto y el usuario puede editarlo.

  // Indicativo de país por defecto (Colombia) para números locales.
  let defaultCountryCode : Text = "57";

  // Deja solo los dígitos de un texto (quita espacios, guiones, paréntesis,
  // signos y el prefijo internacional `+`).
  func digitsOnly(raw : Text) : Text {
    var out = "";
    for (c in raw.toIter()) {
      if (c >= '0' and c <= '9') { out := out # Text.fromArray([c]) };
    };
    out;
  };

  // Normaliza un teléfono a formato internacional (solo dígitos, con
  // indicativo de país). Un número local colombiano de 10 dígitos recibe el
  // indicativo `57`. Un número que ya empieza por `57` y tiene 12 dígitos se
  // conserva. Un número con otro indicativo (11+ dígitos que no empieza por
  // `57`) se conserva tal cual. Devuelve `null` si no hay dígitos suficientes.
  func normalizePhone(raw : Text) : ?Text {
    let digits = digitsOnly(raw);
    if (digits.size() == 0) { return null };
    if (digits.size() == 10) { return ?(defaultCountryCode # digits) };
    if (digits.size() >= 11) { return ?digits };
    // Menos de 10 dígitos: no es un número utilizable.
    null;
  };

  // Formatea un monto en centavos enteros como pesos colombianos con
  // separador de miles y dos decimales: `123456` → `1.234,56`.
  func formatMoney(cents : Common.Money) : Text {
    let whole = cents / 100;
    let fraction = cents % 100;
    let wholeChars = whole.toText().toArray();
    var grouped = "";
    var count = 0;
    var i = wholeChars.size();
    while (i > 0) {
      i -= 1;
      grouped := Text.fromArray([wholeChars[i]]) # grouped;
      count += 1;
      if (count % 3 == 0 and i > 0) { grouped := "." # grouped };
    };
    let fracText = if (fraction < 10) { "0" # fraction.toText() } else { fraction.toText() };
    grouped # "," # fracText;
  };

  // Formatea una fecha (nanosegundos desde la época Unix) como
  // `DD/MM/AAAA` en UTC. Algoritmo civil-from-days (Howard Hinnant).
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

  func pad2(n : Nat) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  func formatDate(nanos : Common.Timestamp) : Text {
    let seconds = nanos / 1_000_000_000;
    let days = if (seconds >= 0) { seconds / 86400 } else { (seconds - 86399) / 86400 };
    let (y, m, d) = civilFromDays(days);
    pad2(Int.abs(d)) # "/" # pad2(Int.abs(m)) # "/" # y.toText();
  };

  func orderStatusText(status : WorkshopTypes.OrderStatus) : Text {
    switch (status) {
      case (#received) { "recibida" };
      case (#inRepair) { "en reparación" };
      case (#ready) { "lista para entrega" };
      case (#delivered) { "entregada" };
      case (#cancelled) { "cancelada" };
    };
  };

  func quoteStatusText(status : QuoteTypes.QuoteStatus) : Text {
    switch (status) {
      case (#draft) { "borrador" };
      case (#sent) { "enviada" };
      case (#accepted) { "aceptada" };
      case (#rejected) { "rechazada" };
      case (#expired) { "vencida" };
    };
  };

  func invoicePaymentStatusText(status : BillingTypes.PaymentStatus) : Text {
    switch (status) {
      case (#pending) { "pendiente de pago" };
      case (#paid) { "pagada" };
    };
  };

  func appointmentStatusText(status : AppointmentTypes.AppointmentStatus) : Text {
    switch (status) {
      case (#scheduled) { "programada" };
      case (#confirmed) { "confirmada" };
      case (#attended) { "atendida" };
      case (#cancelled) { "cancelada" };
      case (#noShow) { "no asistió" };
    };
  };

  // Nombre del negocio para firmar los mensajes.
  func businessName(state : State) : Text {
    switch (state.company.profile.tradeName) {
      case (?name) { if (name == "") { state.company.profile.legalName } else { name } };
      case null { state.company.profile.legalName };
    };
  };

  // Totales de una cotización (misma fórmula que el módulo de cotizaciones).
  func quoteTotal(state : State, quote : QuoteTypes.Quote) : Common.Money {
    var subtotal = 0;
    for (line in quote.partLines.values()) { subtotal += line.quantity * line.unitPrice };
    for (line in quote.serviceLines.values()) { subtotal += line.quantity * line.unitPrice };
    let taxableBase = if (quote.discount >= subtotal) { 0 } else { subtotal - quote.discount };
    let taxRate = CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
    taxableBase + (taxableBase * taxRate) / 100;
  };

  // Totales de una orden de taller (misma fórmula que el módulo de taller).
  func orderTotal(state : State, order : WorkshopTypes.WorkshopOrder) : Common.Money {
    var subtotal = 0;
    for (part in order.parts.values()) { subtotal += part.quantity * part.unitPrice };
    for (item in order.labor.values()) { subtotal += item.price };
    let taxRate = CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
    subtotal + (subtotal * taxRate) / 100;
  };

  // Saldo pendiente de una factura a crédito: la suma de las cuotas aún no
  // pagadas del plan. Una factura de contado sin plan usa su total.
  func receivableBalance(invoice : BillingTypes.Invoice) : Common.Money {
    switch (invoice.installments) {
      case (?plan) {
        var pending = 0;
        for (installment in plan.installments.values()) {
          if (not installment.paid) { pending += installment.amount };
        };
        pending;
      };
      case null { invoice.total };
    };
  };

  // Construye el mensaje sugerido para un contexto, con datos reales del
  // registro referenciado. `contactName` es el nombre del contacto.
  func buildMessage(state : State, contactName : Text, context : Types.WhatsAppContext, referenceId : ?Common.Id) : Result.Result<Text, Types.WhatsAppMessageError> {
    let business = businessName(state);
    switch (context) {
      case (#appointment) {
        let id = switch (referenceId) {
          case (?id) { id };
          case null { return #err(#referenceNotFound(0)) };
        };
        let appointment = switch (state.appointments.get(id)) {
          case (?appointment) { appointment };
          case null { return #err(#referenceNotFound(id)) };
        };
        let message = "Hola " # contactName # ", le recordamos su cita en " # business
          # " el " # formatDate(appointment.scheduledAt)
          # " (" # appointment.durationMinutes.toText() # " min). Motivo: " # appointment.reason
          # ". Estado: " # appointmentStatusText(appointment.status) # ".";
        #ok(message);
      };
      case (#order) {
        let id = switch (referenceId) {
          case (?id) { id };
          case null { return #err(#referenceNotFound(0)) };
        };
        let order = switch (state.orders.get(id)) {
          case (?order) { order };
          case null { return #err(#referenceNotFound(id)) };
        };
        let message = "Hola " # contactName # ", su orden de trabajo " # order.orderNumber
          # " en " # business # " está " # orderStatusText(order.status)
          # ". Total: $" # formatMoney(orderTotal(state, order)) # ".";
        #ok(message);
      };
      case (#quote) {
        let id = switch (referenceId) {
          case (?id) { id };
          case null { return #err(#referenceNotFound(0)) };
        };
        let quote = switch (state.quotes.get(id)) {
          case (?quote) { quote };
          case null { return #err(#referenceNotFound(id)) };
        };
        let message = "Hola " # contactName # ", le compartimos la cotización " # quote.quoteNumber
          # " de " # business # " por $" # formatMoney(quoteTotal(state, quote))
          # ". Estado: " # quoteStatusText(quote.status) # ".";
        #ok(message);
      };
      case (#invoice) {
        let id = switch (referenceId) {
          case (?id) { id };
          case null { return #err(#referenceNotFound(0)) };
        };
        let invoice = switch (state.invoices.get(id)) {
          case (?invoice) { invoice };
          case null { return #err(#referenceNotFound(id)) };
        };
        let message = "Hola " # contactName # ", le compartimos la factura " # invoice.number
          # " de " # business # " por $" # formatMoney(invoice.total)
          # ". Estado: " # invoicePaymentStatusText(invoice.paymentStatus) # ".";
        #ok(message);
      };
      case (#receivable) {
        let id = switch (referenceId) {
          case (?id) { id };
          case null { return #err(#referenceNotFound(0)) };
        };
        let invoice = switch (state.invoices.get(id)) {
          case (?invoice) { invoice };
          case null { return #err(#referenceNotFound(id)) };
        };
        let message = "Hola " # contactName # ", le recordamos el saldo pendiente de la factura "
          # invoice.number # " de " # business # " por $" # formatMoney(receivableBalance(invoice))
          # ". ¡Gracias por su pago!";
        #ok(message);
      };
      case (#service) {
        switch (referenceId) {
          case (?id) {
            let service = switch (state.services.get(id)) {
              case (?service) { service };
              case null { return #err(#referenceNotFound(id)) };
            };
            let message = "Hola " # contactName # ", en " # business
              # " ofrecemos el servicio " # service.name # " (" # service.category # ")."
              # " Valor: $" # formatMoney(service.laborRate) # ".";
            #ok(message);
          };
          case null {
            let message = "Hola " # contactName # ", le escribimos de " # business
              # " para ofrecerle nuestros servicios de taller. ¿En qué podemos ayudarle?";
            #ok(message);
          };
        };
      };
    };
  };

  // Prepara el teléfono normalizado y el mensaje sugerido para un contacto.
  // No envía nada: el frontend abre WhatsApp con el enlace correspondiente.
  public func prepareWhatsAppMessage(state : State, input : Types.WhatsAppMessageInput) : Result.Result<Types.WhatsAppMessageResult, Types.WhatsAppMessageError> {
    let (contactName, rawPhone) = switch (input.contactKind) {
      case (#customer) {
        let customer = switch (state.customers.get(input.contactId)) {
          case (?customer) { customer };
          case null { return #err(#contactNotFound(input.contactId)) };
        };
        (customer.name, customer.phone);
      };
      case (#supplier) {
        let supplier = switch (state.suppliers.get(input.contactId)) {
          case (?supplier) { supplier };
          case null { return #err(#contactNotFound(input.contactId)) };
        };
        (supplier.name, supplier.phone);
      };
    };

    let phone = normalizePhone(rawPhone);
    let message = switch (buildMessage(state, contactName, input.context, input.referenceId)) {
      case (#ok(text)) { text };
      case (#err(error)) { return #err(error) };
    };
    let messageWithHope = HopeLib.appendHope({ hope = state.hope }, message, Time.now());

    #ok({
      contactKind = input.contactKind;
      contactId = input.contactId;
      contactName;
      hasPhone = phone != null;
      phone;
      message = messageWithHope;
    });
  };
};
