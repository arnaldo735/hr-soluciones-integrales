import Common "common";

module {
  public type Id = Common.Id;

  // Origen de la notificación: desde qué módulo se disparó el envío.
  public type NotificationSource = {
    #service;
    #order;
    #quote;
    #invoice;
    #pos;
  };

  // Entrada de notificación al cliente. El destinatario se resuelve desde el
  // correo registrado del cliente; `subject` y `message` los indica el
  // llamador.
  public type CustomerNotificationInput = {
    customerId : Id;
    source : NotificationSource;
    referenceId : ?Id;
    subject : Text;
    message : Text;
  };

  public type CustomerNotificationResult = {
    customerId : Id;
    email : Text;
    sent : Bool;
  };

  public type NotificationError = {
    #customerNotFound : Id;
    #missingEmail : Id;
    #invalidSubject;
    #invalidMessage;
    #sendFailed : Text;
    #notAuthorized;
  };

  // ── Preparación de mensajes de WhatsApp ─────────────────────────────────
  //
  // El backend NO envía mensajes de WhatsApp: solo prepara el teléfono
  // normalizado y el texto sugerido para que el frontend abra WhatsApp en el
  // dispositivo del usuario con un enlace `https://wa.me/<telefono>?text=...`.
  // El mensaje es editable por el usuario.

  // Tipo de contacto destinatario: cliente o proveedor.
  public type WhatsAppContactKind = { #customer; #supplier };

  // Contexto de la notificación. Cada contexto produce un mensaje distinto con
  // datos reales del registro referenciado.
  public type WhatsAppContext = {
    #appointment; // recordatorio de cita
    #order; // estado de OT (orden de trabajo)
    #quote; // cotización
    #invoice; // factura
    #receivable; // cobro (cuenta por cobrar)
    #service; // servicio
  };

  // Entrada para preparar un mensaje de WhatsApp. `referenceId` es el id del
  // registro del contexto (cita, orden, cotización, factura o servicio). Para
  // `#receivable` es el id de la factura a crédito. Para `#service` es
  // opcional: sin él se prepara un mensaje genérico de servicio.
  public type WhatsAppMessageInput = {
    contactKind : WhatsAppContactKind;
    contactId : Id;
    context : WhatsAppContext;
    referenceId : ?Id;
  };

  // Resultado de preparar un mensaje. `phone` es el teléfono normalizado a
  // formato internacional (solo dígitos, con indicativo de país); `hasPhone`
  // indica si el contacto tiene un teléfono utilizable. `message` es el texto
  // sugerido en español, editable por el usuario.
  public type WhatsAppMessageResult = {
    contactKind : WhatsAppContactKind;
    contactId : Id;
    contactName : Text;
    hasPhone : Bool;
    phone : ?Text;
    message : Text;
  };

  public type WhatsAppMessageError = {
    #contactNotFound : Id;
    #referenceNotFound : Id;
    #notAuthorized;
  };
};
