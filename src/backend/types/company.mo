import Common "common";

module {
  public type Timestamp = Common.Timestamp;
  public type TaxRate = Common.TaxRate;

  // Tipo de documento de identificación tributaria (norma colombiana / DIAN).
  public type DocumentType = {
    #nit; // NIT — persona jurídica
    #cedulaCiudadania; // Cédula de ciudadanía — persona natural
    #cedulaExtranjeria; // Cédula de extranjería
  };

  // Régimen fiscal ante la DIAN.
  public type FiscalRegime = {
    #responsableIva; // Responsable de IVA
    #noResponsableIva; // No responsable de IVA
  };

  // Responsabilidad tributaria declarada por el contribuyente.
  public type TaxResponsibility = {
    #granContribuyente;
    #autorretenedor;
    #agenteRetencionIva;
    #regimenSimple;
    #noAplica;
  };

  public type CompanyProfile = {
    legalName : Text; // Razón social
    tradeName : ?Text; // Nombre comercial
    documentType : DocumentType;
    taxId : Text; // Número de documento (NIT sin dígito de verificación)
    checkDigit : ?Nat; // Dígito de verificación del NIT (0-9)
    fiscalRegime : FiscalRegime;
    taxResponsibility : TaxResponsibility;
    address : Text;
    city : Text; // Ciudad / departamento
    phone : Text;
    email : ?Text;
    website : ?Text;
    logoUrl : ?Text;
    taxRate : TaxRate;
    updatedAt : Timestamp;
  };

  public type CompanyProfileInput = {
    legalName : Text;
    tradeName : ?Text;
    documentType : DocumentType;
    taxId : Text;
    checkDigit : ?Nat;
    fiscalRegime : FiscalRegime;
    taxResponsibility : TaxResponsibility;
    address : Text;
    city : Text;
    phone : Text;
    email : ?Text;
    website : ?Text;
    logoUrl : ?Text;
    taxRate : TaxRate;
  };

  // Entrada tolerante al borde Candid. El frontend puede enviar los campos de
  // variante como cadena vacía (por ejemplo `fiscalRegime = ""`), y Candid
  // rechaza esa cadena antes de que el backend se ejecute. Este tipo acepta
  // texto libre en esos campos para que la normalización ocurra en el backend
  // y no en el decodificador. `normalizeProfileInput` lo convierte al tipo
  // estricto `CompanyProfileInput` antes de validar y persistir.
  public type CompanyProfileRawInput = {
    legalName : Text;
    tradeName : ?Text;
    documentType : Text;
    taxId : Text;
    checkDigit : ?Nat;
    fiscalRegime : Text;
    taxResponsibility : Text;
    address : Text;
    city : Text;
    phone : Text;
    email : ?Text;
    website : ?Text;
    logoUrl : ?Text;
    taxRate : TaxRate;
  };

  public type CompanyError = {
    #notAuthorized;
    #invalidInput : Text;
  };

  // IVA Colombia por defecto cuando no hay una tasa configurada.
  public let defaultTaxRate : TaxRate = 19;

  // El régimen fiscal de la empresa es la única fuente de verdad para decidir
  // si se aplica IVA. Con `#noResponsableIva` la tasa efectiva es siempre 0 %,
  // sin importar la tarifa configurada; con `#responsableIva` se usa la tarifa
  // configurada y, si está vacía (0), el 19 % por defecto.
  public func effectiveTaxRate(profile : CompanyProfile, configuredRate : TaxRate) : TaxRate {
    switch (profile.fiscalRegime) {
      case (#noResponsableIva) { 0 };
      case (#responsableIva) {
        if (configuredRate == 0) { defaultTaxRate } else { configuredRate };
      };
    };
  };
};
