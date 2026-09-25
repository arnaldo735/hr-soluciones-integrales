import Time "mo:core/Time";

import Types "../types/company";

module {
  public type State = {
    company : { var profile : Types.CompanyProfile };
  };

  // Dígito de verificación del NIT según el algoritmo módulo 11 de la DIAN.
  // Los pesos se aplican de derecha a izquierda sobre los dígitos del número
  // de documento, empezando en 2 y reiniciando en 2 tras llegar a 7.
  func nitCheckDigit(taxId : Text) : ?Nat {
    let chars = taxId.toArray();
    var sum = 0;
    var weight = 2;
    var index = chars.size();
    while (index > 0) {
      index -= 1;
      let digit = switch (chars[index]) {
        case ('0') { 0 };
        case ('1') { 1 };
        case ('2') { 2 };
        case ('3') { 3 };
        case ('4') { 4 };
        case ('5') { 5 };
        case ('6') { 6 };
        case ('7') { 7 };
        case ('8') { 8 };
        case ('9') { 9 };
        case (_) { return null };
      };
      sum += digit * weight;
      weight += 1;
      if (weight > 7) { weight := 2 };
    };
    let remainder = sum % 11;
    if (remainder < 2) { ?remainder } else { ?(11 - remainder) };
  };

  // Normaliza un campo de variante que llega como texto desde el borde
  // Candid. Un valor vacío o desconocido cae en `fallback` en lugar de
  // rechazar la llamada. La comparación ignora mayúsculas y espacios externos.
  func normalizeVariant(raw : Text, fallback : Text) : Text {
    let value = raw.trim(#char ' ').toLower();
    if (value == "") { fallback } else { value };
  };

  // Convierte la entrada tolerante del borde Candid al tipo estricto que se
  // valida y persiste. Un `fiscalRegime` vacío o desconocido se normaliza a
  // `#noResponsableIva` (la empresa no es responsable de IVA); un
  // `taxResponsibility` vacío o desconocido a `#noAplica`; un `documentType`
  // vacío o desconocido a `#nit`. Un `logoUrl` vacío se guarda como ausente
  // (`null`), nunca como cadena vacía.
  public func normalizeProfileInput(raw : Types.CompanyProfileRawInput) : Types.CompanyProfileInput {
    let documentType : Types.DocumentType = switch (normalizeVariant(raw.documentType, "nit")) {
      case ("cedulaciudadania") { #cedulaCiudadania };
      case ("cedulaextranjeria") { #cedulaExtranjeria };
      case (_) { #nit };
    };
    let fiscalRegime : Types.FiscalRegime = switch (normalizeVariant(raw.fiscalRegime, "noresponsableiva")) {
      case ("responsableiva") { #responsableIva };
      case (_) { #noResponsableIva };
    };
    let taxResponsibility : Types.TaxResponsibility = switch (normalizeVariant(raw.taxResponsibility, "noaplica")) {
      case ("grancontribuyente") { #granContribuyente };
      case ("autorretenedor") { #autorretenedor };
      case ("agenteretencioniva") { #agenteRetencionIva };
      case ("regimensimple") { #regimenSimple };
      case (_) { #noAplica };
    };
    let logoUrl : ?Text = switch (raw.logoUrl) {
      case (?url) {
        if (url.trim(#char ' ').size() == 0) { null } else { ?url };
      };
      case null { null };
    };
    {
      legalName = raw.legalName;
      tradeName = raw.tradeName;
      documentType;
      taxId = raw.taxId;
      checkDigit = raw.checkDigit;
      fiscalRegime;
      taxResponsibility;
      address = raw.address;
      city = raw.city;
      phone = raw.phone;
      email = raw.email;
      website = raw.website;
      logoUrl;
      taxRate = raw.taxRate;
    };
  };

  // Valida los campos fiscales obligatorios y el dígito de verificación del
  // NIT (módulo 11 DIAN). Devuelve `null` si la entrada es válida, o el
  // mensaje de error en español.
  public func validateProfileInput(input : Types.CompanyProfileInput) : ?Text {
    if (input.legalName.trim(#char ' ').size() == 0) {
      return ?"La razón social es obligatoria";
    };
    if (input.taxId.trim(#char ' ').size() == 0) {
      return ?"El número de documento es obligatorio";
    };
    if (input.address.trim(#char ' ').size() == 0) {
      return ?"La dirección es obligatoria";
    };
    if (input.city.trim(#char ' ').size() == 0) {
      return ?"La ciudad o departamento es obligatorio";
    };
    if (input.phone.trim(#char ' ').size() == 0) {
      return ?"El teléfono es obligatorio";
    };
    switch (input.email) {
      case (?email) {
        if (email.trim(#char ' ').size() == 0) {
          return ?"El correo electrónico es obligatorio";
        };
      };
      case null { return ?"El correo electrónico es obligatorio" };
    };
    switch (input.documentType) {
      case (#nit) {
        let expected = switch (nitCheckDigit(input.taxId)) {
          case (?digit) { digit };
          case null { return ?"El número de NIT debe contener solo dígitos" };
        };
        switch (input.checkDigit) {
          case (?digit) {
            if (digit != expected) {
              return ?"El dígito de verificación del NIT no coincide con el número de documento";
            };
          };
          case null { return ?"El dígito de verificación del NIT es obligatorio" };
        };
      };
      case (_) {};
    };
    null;
  };

  public func getCompanyProfile(state : State) : Types.CompanyProfile {
    state.company.profile;
  };

  public func updateCompanyProfile(state : State, input : Types.CompanyProfileInput) : Types.CompanyProfile {
    let profile : Types.CompanyProfile = {
      legalName = input.legalName;
      tradeName = input.tradeName;
      documentType = input.documentType;
      taxId = input.taxId;
      checkDigit = input.checkDigit;
      fiscalRegime = input.fiscalRegime;
      taxResponsibility = input.taxResponsibility;
      address = input.address;
      city = input.city;
      phone = input.phone;
      email = input.email;
      website = input.website;
      logoUrl = input.logoUrl;
      taxRate = input.taxRate;
      updatedAt = Time.now();
    };
    state.company.profile := profile;
    profile;
  };
};
