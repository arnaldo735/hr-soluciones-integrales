import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

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
import NotificationsLib "../lib/notifications";

mixin (
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  quotes : Map.Map<Common.Id, QuoteTypes.Quote>,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  company : { var profile : CompanyTypes.CompanyProfile },
  hope : { var settings : HopeTypes.HopeSettings },
) {
  func notificationsState() : NotificationsLib.State = {
    customers;
    suppliers;
    orders;
    quotes;
    invoices;
    appointments;
    services;
    company;
    hope;
  };

  // Envía un correo de notificación al cliente. El destinatario se toma del
  // correo registrado del cliente; si no tiene correo, el envío se rechaza.
  //
  // Un fallo del cliente de correo (por ejemplo, el gateway de integraciones
  // no alcanzable) NO se propaga como trap: se devuelve `sent = false` para
  // que el llamador reciba un resultado tipado y controlado. Los errores de
  // entrada del llamador (cliente inexistente, sin correo, asunto o mensaje
  // vacíos) sí se rechazan con un mensaje claro, porque son corregibles.
  public shared func notifyCustomer(input : Types.CustomerNotificationInput) : async Types.CustomerNotificationResult {
    let result = await NotificationsLib.notifyCustomer(notificationsState(), input);
    switch (result) {
      case (#ok(value)) { value };
      case (#err(error)) {
        switch (error) {
          case (#customerNotFound(id)) { Runtime.trap("Cliente no encontrado: " # id.toText()) };
          case (#missingEmail(id)) { Runtime.trap("El cliente " # id.toText() # " no tiene correo registrado") };
          case (#invalidSubject) { Runtime.trap("El asunto de la notificación no puede estar vacío") };
          case (#invalidMessage) { Runtime.trap("El mensaje de la notificación no puede estar vacío") };
          case (#notAuthorized) { Runtime.trap("No autorizado para notificar al cliente") };
          case (#sendFailed(_)) {
            {
              customerId = input.customerId;
              email = "";
              sent = false;
            };
          };
        };
      };
    };
  };

  // Prepara el teléfono normalizado y el mensaje sugerido de WhatsApp para un
  // contacto (cliente o proveedor) y un contexto. Es de **solo lectura**: no
  // envía ningún mensaje. El frontend abre WhatsApp en el dispositivo del
  // usuario con el enlace `https://wa.me/<telefono>?text=<mensaje>` y el
  // usuario puede editar el texto antes de enviarlo.
  //
  // Si el contacto no tiene teléfono utilizable, la respuesta lo indica con
  // `hasPhone = false` y `phone = null` en lugar de devolver un valor
  // inválido. Un contacto o registro de referencia inexistente se rechaza con
  // un mensaje claro, porque es corregible por el llamador.
  public query func prepareWhatsAppMessage(input : Types.WhatsAppMessageInput) : async Types.WhatsAppMessageResult {
    let result = NotificationsLib.prepareWhatsAppMessage(notificationsState(), input);
    switch (result) {
      case (#ok(value)) { value };
      case (#err(error)) {
        switch (error) {
          case (#contactNotFound(id)) { Runtime.trap("Contacto no encontrado: " # id.toText()) };
          case (#referenceNotFound(id)) { Runtime.trap("Registro de referencia no encontrado: " # id.toText()) };
          case (#notAuthorized) { Runtime.trap("No autorizado para preparar la notificación") };
        };
      };
    };
  };
};
