import Array "mo:core/Array";
import Base64 "mo:core/Base64";
import Blob "mo:core/Blob";
import Char "mo:core/Char";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Prim "mo:prim";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Inference "../lib/inference";
import PdfText "../lib/pdf-text";
import Types "../types/purchase-invoice-intake";
import InventoryTypes "../types/inventory";
import PurchasingTypes "../types/purchasing";
import Search "../lib/search";

module {
  public type State = {
    invoices : Map.Map<Types.Id, Types.PurchaseInvoice>;
    parts : Map.Map<InventoryTypes.Id, InventoryTypes.Part>;
    lots : Map.Map<InventoryTypes.Id, InventoryTypes.Lot>;
    movements : Map.Map<InventoryTypes.Id, InventoryTypes.Movement>;
    suppliers : Map.Map<PurchasingTypes.Id, PurchasingTypes.Supplier>;
    counters : {
      var nextPurchaseInvoiceId : Nat;
      var nextPurchaseInvoiceLineId : Nat;
      var nextPartId : Nat;
      var nextLotId : Nat;
      var nextMovementId : Nat;
    };
  };

  // Prefijo que el cliente de almacenamiento antepone al hash del blob al
  // cruzar la frontera Candid. `objectId` llega como "!caf!sha256:<hex>".
  let DEDUP_SENTINEL : Text = "!caf!";
  let GATEWAY_URL_VAR : Text = "CAFFEINE_STORAGE_GATEWAY_URL";
  let PROJECT_ID_VAR : Text = "CAFFEINE_PROJECT_ID";
  let DEFAULT_GATEWAY_URL : Text = "https://blob.caffeine.ai";
  let DEFAULT_PROJECT_ID : Text = "0000000-0000-0000-0000-00000000000";

  // ── Utilidades de texto ─────────────────────────────────────────────────

  func isSpace(c : Char) : Bool {
    c == ' ' or c == '\t' or c == '\n' or c == '\r';
  };

  func trim(t : Text) : Text {
    t.trim(#predicate isSpace);
  };

  func isBlank(t : Text) : Bool {
    trim(t) == "";
  };

  func contains(haystack : Text, needle : Text) : Bool {
    Search.contains(haystack, needle);
  };

  // ── Normalización de números y fechas ───────────────────────────────────

  // Convierte un monto escrito por el modelo ("1.234,56", "$ 12,5", "1234.56")
  // a centavos enteros. Acepta coma o punto como separador decimal y descarta
  // separadores de miles. Devuelve 0 cuando no hay dígitos.
  public func parseMoneyToCents(raw : Text) : Nat {
    let cleaned = raw.trim(#predicate (func (c : Char) : Bool = not (isDigit c or c == ',' or c == '.')));
    if (cleaned == "") { return 0 };
    // El último separador es el decimal; los anteriores son de miles.
    var lastSep : ?Nat = null;
    var index = 0;
    for (c in cleaned.chars()) {
      if (c == ',' or c == '.') { lastSep := ?index };
      index += 1;
    };
    let digits = cleaned.trim(#predicate (func (c : Char) : Bool = c == ',' or c == '.'));
    let wholeText = switch (lastSep) {
      case null { digits };
      case (?sep) {
        let chars = cleaned.toArray();
        let whole = Array.tabulate(sep, func (i) = chars[i]);
        let frac = Array.tabulate(chars.size() - sep - 1, func (i) = chars[sep + 1 + i]);
        let wholeDigits = Text.fromIter(whole.values()).trim(#predicate (func (c : Char) : Bool = c == ',' or c == '.'));
        let fracDigits = Text.fromIter(frac.values()).trim(#predicate (func (c : Char) : Bool = c == ',' or c == '.'));
        if (fracDigits == "") { wholeDigits } else {
          let cents = if (fracDigits.size() >= 2) {
            Text.fromIter(fracDigits.chars().take(2));
          } else {
            fracDigits # "0";
          };
          wholeDigits # "." # cents;
        };
      };
    };
    let parts = wholeText.split(#char '.');
    let wholePart = switch (parts.next()) { case (?w) w; case null "0" };
    let fracPart = switch (parts.next()) { case (?f) f; case null "00" };
    let wholeNat = switch (wholePart.toNat()) { case (?n) n; case null 0 };
    let fracNat = switch (fracPart.toNat()) { case (?n) n; case null 0 };
    wholeNat * 100 + fracNat;
  };

  func isDigit(c : Char) : Bool {
    c >= '0' and c <= '9';
  };

  // Convierte una cantidad ("3", "2,5") a entero. Las fracciones se redondean
  // hacia abajo porque el inventario se maneja en unidades enteras.
  public func parseQuantity(raw : Text) : Nat {
    let cleaned = raw.trim(#predicate (func (c : Char) : Bool = not (isDigit c or c == ',' or c == '.')));
    if (cleaned == "") { return 0 };
    let whole = switch (cleaned.split(#char ',').next()) {
      case (?w) w;
      case null cleaned;
    };
    let wholeOnly = switch (whole.split(#char '.').next()) {
      case (?w) w;
      case null whole;
    };
    switch (wholeOnly.toNat()) { case (?n) n; case null 0 };
  };

  // Convierte un porcentaje ("19", "19.00", "10,0000") a entero. Acepta coma o
  // punto decimal y trunca la parte fraccionaria, porque los porcentajes se
  // manejan como enteros. Devuelve 0 cuando no hay dígitos.
  public func parsePercent(raw : Text) : Nat {
    let cleaned = raw.trim(#predicate (func (c : Char) : Bool = not (isDigit c or c == ',' or c == '.')));
    if (cleaned == "") { return 0 };
    let whole = switch (cleaned.split(#char ',').next()) {
      case (?w) w;
      case null cleaned;
    };
    let wholeOnly = switch (whole.split(#char '.').next()) {
      case (?w) w;
      case null whole;
    };
    switch (wholeOnly.toNat()) { case (?n) n; case null 0 };
  };

  // Convierte una fecha ISO ("2026-09-23", "2026-09-23T10:30:00") a la
  // medianoche local de Colombia (UTC-5) expresada en nanosegundos. Devuelve
  // null cuando el texto no contiene una fecha válida.
  public func parseDateToTimestamp(raw : Text) : ?Types.Timestamp {
    let trimmed = trim(raw);
    if (trimmed == "") { return null };
    let datePart = switch (trimmed.split(#char 'T').next()) {
      case (?d) d;
      case null trimmed;
    };
    let segments = datePart.split(#char '-').toArray();
    if (segments.size() < 3) { return null };
    let year = switch (segments[0].toInt()) { case (?y) y; case null return null };
    let month = switch (segments[1].toInt()) { case (?m) m; case null return null };
    let day = switch (segments[2].toInt()) { case (?d) d; case null return null };
    if (month < 1 or month > 12 or day < 1 or day > 31) { return null };
    let days = daysFromCivil(year, month, day);
    // Medianoche local Colombia = 05:00 UTC del mismo día.
    let seconds = days * 86_400 + 5 * 3_600;
    ?(seconds * 1_000_000_000);
  };

  // Días desde 1970-01-01 (algoritmo de Howard Hinnant).
  func daysFromCivil(year : Int, month : Int, day : Int) : Int {
    let y = if (month <= 2) { year - 1 } else { year };
    let era = (if (y >= 0) { y } else { y - 399 }) / 400;
    let yoe = y - era * 400;
    let mp = (month + 9) % 12;
    let doy = (153 * mp + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468;
  };

  // ── Lectura del documento desde el almacenamiento de archivos ───────────

  func gatewayUrl<system>() : Text {
    switch (Runtime.envVar<system>(GATEWAY_URL_VAR)) {
      case (?url) { if (isBlank(url)) { DEFAULT_GATEWAY_URL } else { url } };
      case null { DEFAULT_GATEWAY_URL };
    };
  };

  func projectId<system>() : Text {
    switch (Runtime.envVar<system>(PROJECT_ID_VAR)) {
      case (?id) { if (isBlank(id)) { DEFAULT_PROJECT_ID } else { id } };
      case null { DEFAULT_PROJECT_ID };
    };
  };

  // Callback de transformación exigido por el outcall: descarta las cabeceras
  // variables para que la respuesta sea determinista entre réplicas. Se recibe
  // como parámetro porque una función `shared` solo puede declararse en el
  // actor (el mixin la aporta).

  func blobHash(objectId : Text) : Text {
    if (objectId.startsWith(#text DEDUP_SENTINEL)) {
      objectId.trimStart(#text DEDUP_SENTINEL);
    } else {
      objectId;
    };
  };

  // Tope de bytes que un outcall puede descargar. El cliente
  // `caffeineai-http-outcalls` acota toda petición a su `defaultMaxResponseBytes`
  // (1 MB) y el propio IC limita la respuesta de un outcall a 2 MB, así que
  // pedir más no sirve: el valor se recorta silenciosamente. Se declara aquí
  // para que el límite real sea explícito y coincida con el mensaje de error.
  let MAX_DOCUMENT_BYTES : Nat64 = 1_000_000;

  // Descarga los bytes del archivo subido desde el gateway de almacenamiento.
  // La URL queda acotada por `blob_hash` (un único objeto), `owner_id` (este
  // canister) y `project_id`.
  //
  // El gateway exige el encabezado `X-Caffeine-Project-ID` y un `project_id`
  // real: sin ellos responde 403. El canister no puede leer `env.json`, así que
  // usa los valores que el frontend guardó al crear el borrador y solo cae a las
  // variables de entorno como respaldo.
  func fetchDocumentBytes<system>(file : Types.InvoiceFileRef, transform : OutCall.Transform) : async* Blob {
    let hash = blobHash(file.objectId);
    let project = switch (file.projectId) {
      case (?id) { if (isBlank(id)) { projectId<system>() } else { id } };
      case null { projectId<system>() };
    };
    let base = switch (file.gatewayUrl) {
      case (?url) { if (isBlank(url)) { gatewayUrl<system>() } else { url } };
      case null { gatewayUrl<system>() };
    };
    let url = base # "/v1/blob/?blob_hash=" # encodeComponent(hash)
      # "&owner_id=" # encodeComponent(Prim.getSelfPrincipal<system>().toText())
      # "&project_id=" # encodeComponent(project);
    let response = await OutCall.httpRequest({
      url;
      method = #get;
      headers = [{ name = "X-Caffeine-Project-ID"; value = project }];
      body = null;
      maxResponseBytes = MAX_DOCUMENT_BYTES;
      transform;
    });
    if (response.status < 200 or response.status >= 300) {
      Runtime.trap("No se pudo leer el archivo de la factura (HTTP " # response.status.toText() # ")");
    };
    response.body;
  };

  func encodeComponent(s : Text) : Text {
    var needs = false;
    label scan for (c in s.chars()) {
      if (not (isUnreserved c)) { needs := true; break scan };
    };
    if (not needs) { return s };
    let out = List.empty<Nat8>();
    for (b in (s.encodeUtf8 ()).values()) {
      if (isUnreservedByte b) {
        out.add(b);
      } else {
        out.add(0x25 : Nat8);
        out.add(hexDigit(b >> 4));
        out.add(hexDigit(b & 0x0F));
      };
    };
    switch (out.toArray().toBlob().decodeUtf8()) {
      case (?t) t;
      case null s;
    };
  };

  func isUnreserved(c : Char) : Bool {
    (c >= 'A' and c <= 'Z') or (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9')
      or c == '-' or c == '_' or c == '.' or c == '~';
  };

  func isUnreservedByte(b : Nat8) : Bool {
    (b >= 0x41 and b <= 0x5A) or (b >= 0x61 and b <= 0x7A) or (b >= 0x30 and b <= 0x39)
      or b == 0x2D or b == 0x5F or b == 0x2E or b == 0x7E;
  };

  func hexDigit(n : Nat8) : Nat8 {
    if (n < 10) { 0x30 + n } else { 0x37 + n };
  };

  // ── Extracción con el servicio de análisis de documentos ────────────────

  func extractionPrompt(fileName : Text, mimeType : Text, kind : Types.InvoiceFileKind, content : Text) : Text {
    let kindLabel = switch (kind) {
      case (#pdf) "PDF";
      case (#image) "imagen";
    };
    "Eres un asistente que extrae datos de facturas de compra de un taller de motos en Colombia. "
      # "Analiza el contenido del archivo \"" # fileName # "\" (" # kindLabel # ", " # mimeType # ") y devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional ni bloques de código, con esta forma exacta:\n"
      # "{\"supplierName\":\"...\",\"supplierTaxId\":\"...\",\"invoiceNumber\":\"...\",\"invoiceDate\":\"YYYY-MM-DD\",\"paymentMethod\":\"...\",\"paymentMeans\":\"...\",\"items\":[{\"code\":\"...\",\"description\":\"...\",\"quantity\":1,\"taxRate\":0,\"unitCost\":0,\"discount\":0,\"total\":0}]}\n"
      # "Reglas: los montos van en pesos colombianos sin separador de miles y con punto decimal (por ejemplo 12500.50); "
      # "interpreta los montos en formato colombiano (punto de miles y coma decimal, por ejemplo \"1.234.567,89\" es 1234567.89); "
      # "la fecha en formato YYYY-MM-DD; la cantidad como número entero; "
      # "el IVA (taxRate) y el descuento (discount) como porcentaje entero cuando la factura los exprese así (por ejemplo 19 para 19 %); "
      # "el descuento (discount) como monto en pesos cuando la factura lo exprese como valor; "
      # "el valor total de la línea (total) como monto en pesos; "
      # "supplierTaxId es el NIT del proveedor; paymentMethod es la forma de pago (contado o crédito) y paymentMeans es el medio de pago (efectivo, transferencia, tarjeta, etc.); "
      # "si un dato no aparece, usa cadena vacía o 0. "
      # "No inventes ítems. Contenido del archivo:\n" # content;
  };

  // Extrae el primer objeto JSON del texto devuelto por el modelo.
  func extractJsonObject(raw : Text) : ?Text {
    let chars = raw.toArray();
    var start : ?Nat = null;
    var end : ?Nat = null;
    var i = 0;
    for (c in chars.values()) {
      if (c == '{' and start == null) { start := ?i };
      if (c == '}') { end := ?i };
      i += 1;
    };
    switch (start, end) {
      case (?s, ?e) {
        if (e <= s) { return null };
        ?Text.fromIter(chars.sliceToArray(s, e + 1).values());
      };
      case _ { null };
    };
  };

  // ── Parseo del JSON de extracción ───────────────────────────────────────
  // El modelo devuelve un objeto plano; se parsea con un lector mínimo que
  // tolera espacios y comillas escapadas.

  type JsonValue = {
    #str : Text;
    #num : Text;
    #obj : [(Text, JsonValue)];
    #arr : [JsonValue];
    #other;
  };

  func parseJson(raw : Text) : ?JsonValue {
    let chars = raw.toArray();
    var pos = 0;
    let n = chars.size();

    func skipWs() {
      while (pos < n and isSpace(chars[pos])) { pos += 1 };
    };

    func parseValue() : ?JsonValue {
      skipWs();
      if (pos >= n) { return null };
      let c = chars[pos];
      if (c == '{') { return parseObject() };
      if (c == '[') { return parseArray() };
      if (c == '\"') { return parseString() };
      return parseNumberOrLiteral();
    };

    func parseString() : ?JsonValue {
      if (pos >= n or chars[pos] != '\"') { return null };
      pos += 1;
      let buf = List.empty<Char>();
      while (pos < n and chars[pos] != '\"') {
        if (chars[pos] == '\\' and pos + 1 < n) {
          pos += 1;
          let esc = chars[pos];
          let decoded = switch (esc) {
            case 'n' { '\n' };
            case 't' { '\t' };
            case 'r' { '\r' };
            case _ { esc };
          };
          buf.add(decoded);
        } else {
          buf.add(chars[pos]);
        };
        pos += 1;
      };
      if (pos >= n) { return null };
      pos += 1;
      ?#str(Text.fromIter(buf.values()));
    };

    func parseNumberOrLiteral() : ?JsonValue {
      let start = pos;
      while (pos < n and not isDelimiter(chars[pos])) { pos += 1 };
      if (pos == start) { return null };
      let token = Text.fromIter(chars.sliceToArray(start, pos).values());
      if (token == "null" or token == "true" or token == "false") {
        return ?#other;
      };
      ?#num(token);
    };

    func isDelimiter(c : Char) : Bool {
      isSpace(c) or c == ',' or c == '}' or c == ']' or c == ':';
    };

    func parseObject() : ?JsonValue {
      pos += 1;
      let fields = List.empty<(Text, JsonValue)>();
      skipWs();
      if (pos < n and chars[pos] == '}') { pos += 1; return ?#obj(fields.toArray()) };
      loop {
        skipWs();
        let key = switch (parseString()) {
          case (?#str(k)) k;
          case _ { return null };
        };
        skipWs();
        if (pos >= n or chars[pos] != ':') { return null };
        pos += 1;
        let value = switch (parseValue()) {
          case (?v) v;
          case null { return null };
        };
        fields.add((key, value));
        skipWs();
        if (pos >= n) { return null };
        if (chars[pos] == ',') { pos += 1; continue };
        if (chars[pos] == '}') { pos += 1; return ?#obj(fields.toArray()) };
        return null;
      };
    };

    func parseArray() : ?JsonValue {
      pos += 1;
      let items = List.empty<JsonValue>();
      skipWs();
      if (pos < n and chars[pos] == ']') { pos += 1; return ?#arr(items.toArray()) };
      loop {
        let value = switch (parseValue()) {
          case (?v) v;
          case null { return null };
        };
        items.add(value);
        skipWs();
        if (pos >= n) { return null };
        if (chars[pos] == ',') { pos += 1; continue };
        if (chars[pos] == ']') { pos += 1; return ?#arr(items.toArray()) };
        return null;
      };
    };

    let value = parseValue();
    value;
  };

  func field(obj : JsonValue, name : Text) : ?JsonValue {
    switch (obj) {
      case (#obj(fields)) {
        switch (fields.find(func ((k, _)) = k == name)) {
          case (?(_, v)) { ?v };
          case null { null };
        };
      };
      case _ { null };
    };
  };

  func asText(value : ?JsonValue) : Text {
    switch (value) {
      case (?#str(s)) { s };
      case (?#num(s)) { s };
      case _ { "" };
    };
  };

  func asArray(value : ?JsonValue) : [JsonValue] {
    switch (value) {
      case (?#arr(items)) { items };
      case _ { [] };
    };
  };

  // ── Búsqueda de repuestos ───────────────────────────────────────────────

  func findPartByCode(state : State, code : Text) : ?InventoryTypes.Part {
    let needle = Search.normalize(code);
    if (needle == "") { return null };
    for (part in state.parts.values()) {
      if (Search.equals(part.sku, needle)) { return ?part };
    };
    null;
  };

  func nextLineId(state : State) : Types.Id {
    let id = state.counters.nextPurchaseInvoiceLineId;
    state.counters.nextPurchaseInvoiceLineId := id + 1;
    id;
  };

  func buildLine(state : State, lineNumber : Nat, code : Text, description : Text, quantity : Nat, unitCost : Types.Money, taxRate : Nat, discountRate : Nat, total : Types.Money) : Types.PurchaseInvoiceLine {
    let matched = findPartByCode(state, code);
    {
      id = nextLineId(state);
      lineNumber;
      code;
      description;
      quantity;
      unitCost;
      matchStatus = switch (matched) { case (?_) #existing; case null #new };
      matchedPartId = switch (matched) { case (?p) ?p.id; case null null };
      applyStatus = #pending;
      applyError = null;
      lotId = null;
      movementId = null;
      taxRate;
      discountRate;
      total;
    };
  };

  // ── API del dominio ─────────────────────────────────────────────────────

  public func createDraft(state : State, input : Types.CreateInvoiceInput) : Types.PurchaseInvoice {
    if (isBlank(input.objectId) or isBlank(input.fileName)) {
      Runtime.trap("invalidFile: el archivo de la factura es obligatorio");
    };
    let id = state.counters.nextPurchaseInvoiceId;
    state.counters.nextPurchaseInvoiceId := id + 1;
    let now = Time.now();
    let invoice : Types.PurchaseInvoice = {
      id;
      file = {
        objectId = input.objectId;
        fileName = input.fileName;
        mimeType = input.mimeType;
        sizeBytes = input.sizeBytes;
        kind = input.kind;
        uploadedAt = now;
        gatewayUrl = input.gatewayUrl;
        projectId = input.projectId;
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
      createdAt = now;
      updatedAt = now;
      confirmedAt = null;
      confirmedBy = null;
    };
    state.invoices.add(id, invoice);
    invoice;
  };

  public func runExtraction<system>(state : State, invoiceId : Types.Id, transform : OutCall.Transform) : async* Types.PurchaseInvoice {
    let invoice = state.invoices.get(invoiceId) ?? Runtime.trap("notFound: factura " # invoiceId.toText());
    if (invoice.status == #confirmed) {
      Runtime.trap("invalidState: la factura ya fue confirmada");
    };
    let extracting : Types.PurchaseInvoice = {
      invoice with
      extractionStatus = #extracting;
      extractionError = null;
      updatedAt = Time.now();
    };
    state.invoices.add(invoiceId, extracting);

    let bytes = try {
      await* fetchDocumentBytes<system>(invoice.file, transform);
    } catch (_) {
      let failed : Types.PurchaseInvoice = {
        extracting with
        extractionStatus = #failed;
        extractionError = ?"No se pudo leer el archivo de la factura. Verifica que el archivo siga disponible e inténtalo de nuevo.";
        updatedAt = Time.now();
      };
      state.invoices.add(invoiceId, failed);
      return failed;
    };

    // Un PDF binario (no texto UTF-8) no puede enviarse al modelo de solo
    // texto: se devuelve un resultado consistente sin llamar al servicio.
    let content = switch (documentContent(bytes, invoice.file.kind)) {
      case (?text) { text };
      case null {
        let failed : Types.PurchaseInvoice = {
          extracting with
          extractionStatus = #failed;
          extractionError = ?"El PDF no contiene texto legible, así que no se pudo analizar automáticamente. Completa los datos manualmente o sube una foto de la factura.";
          updatedAt = Time.now();
        };
        state.invoices.add(invoiceId, failed);
        return failed;
      };
    };
    let prompt = extractionPrompt(invoice.file.fileName, invoice.file.mimeType, invoice.file.kind, content);
    let raw = try {
      await* Inference.runChat<system>(prompt);
    } catch (_) {
      let failed : Types.PurchaseInvoice = {
        extracting with
        extractionStatus = #failed;
        extractionError = ?"El servicio de análisis no pudo procesar el documento. Puedes reintentar o completar los datos manualmente.";
        updatedAt = Time.now();
      };
      state.invoices.add(invoiceId, failed);
      return failed;
    };

    let parsed = switch (extractJsonObject(raw)) {
      case (?json) { parseJson(json) };
      case null { null };
    };
    switch (parsed) {
      case null {
        let failed : Types.PurchaseInvoice = {
          extracting with
          extractionStatus = #failed;
          extractionError = ?"No se pudieron interpretar los datos de la factura. Puedes reintentar o completar los datos manualmente.";
          updatedAt = Time.now();
        };
        state.invoices.add(invoiceId, failed);
        failed;
      };
      case (?json) {
        let supplierName = asText(field(json, "supplierName"));
        let supplierTaxId = asText(field(json, "supplierTaxId"));
        let invoiceNumber = asText(field(json, "invoiceNumber"));
        let invoiceDate = parseDateToTimestamp(asText(field(json, "invoiceDate")));
        let paymentMethod = asText(field(json, "paymentMethod"));
        let paymentMeans = asText(field(json, "paymentMeans"));
        let items = asArray(field(json, "items"));
        let lines = List.empty<Types.PurchaseInvoiceLine>();
        var lineNumber = 1;
        for (item in items.values()) {
          let code = asText(field(item, "code"));
          let description = asText(field(item, "description"));
          let quantity = parseQuantity(asText(field(item, "quantity")));
          let unitCost = parseMoneyToCents(asText(field(item, "unitCost")));
          let taxRate = parsePercent(asText(field(item, "taxRate")));
          // El modelo puede devolver el descuento como porcentaje o como monto;
          // el contrato lo expone como porcentaje entero.
          let discountRate = parsePercent(asText(field(item, "discount")));
          let total = parseMoneyToCents(asText(field(item, "total")));
          if (not (isBlank(code) and isBlank(description))) {
            lines.add(buildLine(state, lineNumber, code, description, quantity, unitCost, taxRate, discountRate, total));
            lineNumber += 1;
          };
        };
        let extracted : Types.PurchaseInvoice = {
          extracting with
          extractionStatus = #extracted;
          extractionError = null;
          supplierName = if (isBlank(supplierName)) { null } else { ?supplierName };
          invoiceNumber = if (isBlank(invoiceNumber)) { null } else { ?invoiceNumber };
          invoiceDate;
          supplierTaxId;
          paymentMethod;
          paymentMeans;
          lines = lines.toArray();
          updatedAt = Time.now();
        };
        // Sin líneas no hay nada que revisar: se devuelve un estado consistente
        // con un mensaje claro, conservando el encabezado detectado y las líneas
        // vacías para que el frontend abra la revisión manual.
        if (extracted.lines.size() == 0) {
          let failed : Types.PurchaseInvoice = {
            extracted with
            extractionStatus = #failed;
            extractionError = ?"No se detectaron ítems en la factura. Completa los datos manualmente o sube una imagen más nítida.";
          };
          state.invoices.add(invoiceId, failed);
          return failed;
        };
        state.invoices.add(invoiceId, extracted);
        extracted;
      };
    };
  };

  // Convierte los bytes del archivo en texto para el modelo. Las imágenes se
  // envían en base64 (el modelo de solo texto no las interpreta, pero el
  // contrato de la extracción se mantiene). Un PDF se procesa con el extractor
  // de texto: se localizan sus streams, se aplica FlateDecode cuando está
  // declarado y se recuperan las cadenas de los operadores de texto. Un PDF sin
  // capa de texto (por ejemplo un escaneo) devuelve null para que la extracción
  // falle de forma consistente sin enviar bytes binarios al modelo.
  func documentContent(bytes : Blob, kind : Types.InvoiceFileKind) : ?Text {
    switch (kind) {
      case (#image) { ?Base64.encode(bytes) };
      case (#pdf) {
        switch (PdfText.extractText(bytes)) {
          case (?text) { if (isBlank(text)) { null } else { ?text } };
          case null { null };
        };
      };
    };
  };

  // Una línea ya aplicada al inventario no debe volver a aplicarse: conserva su
  // resultado guardado (repuesto, lote y movimiento) para que un reintento de la
  // confirmación no duplique stock.
  func isApplied(line : Types.PurchaseInvoiceLine) : Bool {
    switch (line.applyStatus) {
      case (#created) { true };
      case (#updated) { true };
      case (#pending) { false };
      case (#error) { false };
    };
  };

  // Conserva el resultado de una línea ya aplicada al reconstruir la revisión.
  func preserveApplied(previous : Types.PurchaseInvoiceLine, edited : Types.PurchaseInvoiceLine) : Types.PurchaseInvoiceLine {
    {
      edited with
      matchStatus = previous.matchStatus;
      matchedPartId = previous.matchedPartId;
      applyStatus = previous.applyStatus;
      applyError = previous.applyError;
      lotId = previous.lotId;
      movementId = previous.movementId;
    };
  };

  public func updateReview(state : State, invoiceId : Types.Id, input : Types.InvoiceReviewInput) : Types.PurchaseInvoice {
    let invoice = state.invoices.get(invoiceId) ?? Runtime.trap("notFound: factura " # invoiceId.toText());
    if (invoice.status == #confirmed) {
      Runtime.trap("invalidState: la factura ya fue confirmada");
    };
    let lines = List.empty<Types.PurchaseInvoiceLine>();
    var lineNumber = 1;
    for (line in input.lines.values()) {
      let edited = buildLine(state, lineNumber, line.code, line.description, line.quantity, line.unitCost, line.taxRate, line.discountRate, line.total);
      // Si la línea editada corresponde a una línea ya aplicada, se conserva su
      // resultado en lugar de reiniciarla a #pending: así la ruta de recuperación
      // de una factura #withErrors no vuelve a mover inventario.
      let previous = switch (line.id) {
        case (?id) { invoice.lines.find(func (l) = l.id == id) };
        case null { null };
      };
      let rebuilt = switch (previous) {
        case (?prev) { if (isApplied(prev)) { preserveApplied(prev, edited) } else { edited } };
        case null { edited };
      };
      lines.add(rebuilt);
      lineNumber += 1;
    };
    let supplierName = switch (input.header.supplierName) {
      case (?name) { if (isBlank(name)) { null } else { ?name } };
      case null { null };
    };
    let updated : Types.PurchaseInvoice = {
      invoice with
      supplierId = input.header.supplierId;
      supplierName;
      invoiceNumber = input.header.invoiceNumber;
      invoiceDate = input.header.invoiceDate;
      supplierTaxId = input.header.supplierTaxId;
      paymentMethod = input.header.paymentMethod;
      paymentMeans = input.header.paymentMeans;
      lines = lines.toArray();
      updatedAt = Time.now();
    };
    state.invoices.add(invoiceId, updated);
    updated;
  };

  public func confirmInvoice(state : State, invoiceId : Types.Id, performedBy : Principal) : Types.InvoiceApplyResult {
    let invoice = state.invoices.get(invoiceId) ?? Runtime.trap("notFound: factura " # invoiceId.toText());
    // Idempotencia: una factura ya confirmada devuelve el resultado guardado sin
    // volver a tocar el inventario.
    if (invoice.status == #confirmed) {
      return storedResult(invoice);
    };
    if (invoice.lines.size() == 0) {
      Runtime.trap("invalidState: la factura no tiene ítems para confirmar");
    };

    let now = Time.now();
    let results = List.empty<Types.InvoiceApplyLineResult>();
    let appliedLines = List.empty<Types.PurchaseInvoiceLine>();
    var created = 0;
    var updated = 0;
    var failed = 0;

    for (line in invoice.lines.values()) {
      let code = trim(line.code);
      if (isApplied(line)) {
        // Idempotencia por línea: una línea ya aplicada conserva su lote y su
        // movimiento; no se vuelve a tocar el inventario. Esto cubre una factura
        // #withErrors corregida y reenviada, incluso tras recargar la página.
        switch (line.applyStatus) {
          case (#created) { created += 1 };
          case (#updated) { updated += 1 };
          case (#pending) {};
          case (#error) {};
        };
        results.add({
          lineId = line.id;
          lineNumber = line.lineNumber;
          code = line.code;
          status = line.applyStatus;
          partId = line.matchedPartId;
          lotId = line.lotId;
          movementId = line.movementId;
          error = line.applyError;
        });
        appliedLines.add(line);
      } else if (isBlank(code)) {
        failed += 1;
        let error = "El código del repuesto es obligatorio";
        results.add({
          lineId = line.id;
          lineNumber = line.lineNumber;
          code = line.code;
          status = #error;
          partId = null;
          lotId = null;
          movementId = null;
          error = ?error;
        });
        appliedLines.add({ line with applyStatus = #error; applyError = ?error });
      } else if (line.quantity == 0) {
        failed += 1;
        let error = "La cantidad debe ser mayor que cero";
        results.add({
          lineId = line.id;
          lineNumber = line.lineNumber;
          code = line.code;
          status = #error;
          partId = null;
          lotId = null;
          movementId = null;
          error = ?error;
        });
        appliedLines.add({ line with applyStatus = #error; applyError = ?error });
      } else {
        let existing = findPartByCode(state, code);
        let (partId, wasCreated) = switch (existing) {
          case (?part) {
            // Actualiza el costo del repuesto existente al costo de la factura.
            let updatedPart : InventoryTypes.Part = { part with costPrice = line.unitCost };
            state.parts.add(part.id, updatedPart);
            (part.id, false);
          };
          case null {
            let id = state.counters.nextPartId;
            state.counters.nextPartId := id + 1;
            let part : InventoryTypes.Part = {
              id;
              sku = code;
              barcode = "";
              name = if (isBlank(line.description)) { code } else { line.description };
              category = "";
              brand = "";
              unit = "Unidad";
              salePrice = line.unitCost;
              costPrice = line.unitCost;
              lowStockThreshold = 0;
              createdAt = now;
            };
            state.parts.add(id, part);
            (id, true);
          };
        };

        // Entrada de stock: un lote y un movimiento de compra por línea, el
        // mismo mecanismo que usa createPurchase.
        let lotId = state.counters.nextLotId;
        state.counters.nextLotId := lotId + 1;
        let lot : InventoryTypes.Lot = {
          id = lotId;
          partId;
          lotNumber = "FC-" # invoiceId.toText() # "-" # line.lineNumber.toText();
          quantity = line.quantity;
          unitCost = line.unitCost;
          supplierId = invoice.supplierId;
          purchaseId = null;
          receivedAt = now;
        };
        state.lots.add(lotId, lot);

        let movementId = state.counters.nextMovementId;
        state.counters.nextMovementId := movementId + 1;
        let movement : InventoryTypes.Movement = {
          id = movementId;
          partId;
          lotId = ?lotId;
          kind = #purchase;
          quantity = line.quantity;
          unitCost = ?line.unitCost;
          reason = ?("Factura de compra " # (invoice.invoiceNumber ?? invoiceId.toText()));
          referenceId = ?invoiceId;
          performedBy;
          at = now;
        };
        state.movements.add(movementId, movement);

        let status : Types.LineApplyStatus = if (wasCreated) { #created } else { #updated };
        if (wasCreated) { created += 1 } else { updated += 1 };
        results.add({
          lineId = line.id;
          lineNumber = line.lineNumber;
          code = line.code;
          status;
          partId = ?partId;
          lotId = ?lotId;
          movementId = ?movementId;
          error = null;
        });
        appliedLines.add({
          line with
          matchStatus = #existing;
          matchedPartId = ?partId;
          applyStatus = status;
          applyError = null;
          lotId = ?lotId;
          movementId = ?movementId;
        });
      };
    };

    let finalStatus : Types.PurchaseInvoiceStatus = if (failed > 0) { #withErrors } else { #confirmed };
    let confirmed : Types.PurchaseInvoice = {
      invoice with
      lines = appliedLines.toArray();
      status = finalStatus;
      updatedAt = now;
      confirmedAt = ?now;
      confirmedBy = ?performedBy;
    };
    state.invoices.add(invoiceId, confirmed);
    {
      invoiceId;
      status = finalStatus;
      created;
      updated;
      failed;
      lines = results.toArray();
    };
  };

  // Reconstruye el resultado de una factura ya confirmada a partir de sus
  // líneas, sin volver a aplicar nada al inventario.
  func storedResult(invoice : Types.PurchaseInvoice) : Types.InvoiceApplyResult {
    let results = List.empty<Types.InvoiceApplyLineResult>();
    var created = 0;
    var updated = 0;
    var failed = 0;
    for (line in invoice.lines.values()) {
      switch (line.applyStatus) {
        case (#created) { created += 1 };
        case (#updated) { updated += 1 };
        case (#error) { failed += 1 };
        case (#pending) {};
      };
      results.add({
        lineId = line.id;
        lineNumber = line.lineNumber;
        code = line.code;
        status = line.applyStatus;
        partId = line.matchedPartId;
        lotId = line.lotId;
        movementId = line.movementId;
        error = line.applyError;
      });
    };
    {
      invoiceId = invoice.id;
      status = invoice.status;
      created;
      updated;
      failed;
      lines = results.toArray();
    };
  };

  func invoiceMatches(invoice : Types.PurchaseInvoice, filter : Types.InvoiceFilter) : Bool {
    let statusOk = switch (filter.status) {
      case null { true };
      case (?s) { invoice.status == s };
    };
    let supplierOk = switch (filter.supplierId) {
      case null { true };
      case (?sid) { invoice.supplierId == ?sid };
    };
    let searchOk = switch (filter.search) {
      case null { true };
      case (?term) {
        let needle = trim(term);
        if (needle == "") { true } else {
          contains(invoice.file.fileName, needle)
            or (switch (invoice.invoiceNumber) { case (?n) contains(n, needle); case null false })
            or (switch (invoice.supplierName) { case (?n) contains(n, needle); case null false });
        };
      };
    };
    statusOk and supplierOk and searchOk;
  };

  func compareInvoices(a : Types.PurchaseInvoice, b : Types.PurchaseInvoice, sort : Types.InvoiceSort) : Order.Order {
    switch (sort) {
      case (#createdAt) { Int.compare(b.createdAt, a.createdAt) };
      case (#invoiceDate) {
        let da = a.invoiceDate ?? 0;
        let db = b.invoiceDate ?? 0;
        Int.compare(db, da);
      };
      case (#invoiceNumber) {
        let na = a.invoiceNumber ?? "";
        let nb = b.invoiceNumber ?? "";
        Text.compare(Search.sortKey(na), Search.sortKey(nb));
      };
    };
  };

  public func listInvoices(state : State, filter : Types.InvoiceFilter, sort : Types.InvoiceSort, offset : Nat, limit : Nat) : Types.InvoicePage {
    let matched = List.empty<Types.PurchaseInvoice>();
    for (invoice in state.invoices.values()) {
      if (invoiceMatches(invoice, filter)) { matched.add(invoice) };
    };
    let sorted = matched.toArray().sort(func (a, b) = compareInvoices(a, b, sort));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    {
      items = sorted.sliceToArray(start, end);
      total;
      offset;
      limit;
    };
  };

  public func getInvoice(state : State, invoiceId : Types.Id) : ?Types.PurchaseInvoice {
    state.invoices.get(invoiceId);
  };
};
