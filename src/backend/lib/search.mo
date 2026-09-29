// Helper compartido de búsqueda insensible a mayúsculas y tildes.
//
// Este módulo define la ÚNICA normalización que todos los buscadores del
// backend deben usar. Los módulos de dominio aplican estas funciones en cada
// comparación de texto.
//
// Reglas de equivalencia que la implementación cumple:
//   - Mayúsculas y minúsculas son equivalentes: "MOTOR" == "motor".
//   - Vocales acentuadas equivalen a su vocal base: á=a, é=e, í=i, ó=o, ú=u.
//   - Diéresis equivalen a su vocal base: ü=u.
//   - La eñe equivale a la ene: ñ=n.
//   - La normalización es idempotente: normalize(normalize(t)) == normalize(t).
//   - La normalización NO altera dígitos, espacios internos ni signos
//     (@, ., -, +, etc.), de modo que teléfonos, correos, placas, documentos
//     y códigos siguen comparándose carácter a carácter.
//
// Uso previsto por los módulos de dominio:
//   let needle = Search.normalize(term);          // una vez por consulta
//   Search.contains(haystack, needle)             // por cada campo evaluado
// donde `needle` ya viene normalizado y `haystack` es el texto crudo del
// registro. `contains` normaliza el haystack internamente.
import Char "mo:core/Char";
import Text "mo:core/Text";

module {
  // Normaliza un texto para comparaciones: recorta espacios externos, pasa a
  // minúsculas y pliega tildes, diéresis y la ñ a su letra base.
  //
  // Contrato: `normalize` es idempotente y total (nunca atrapa). Un texto
  // vacío o solo con espacios devuelve "".
  public func normalize(value : Text) : Text {
    let trimmed = value.trim(#predicate(Char.isWhitespace));
    // Se pliegan las tildes ANTES de pasar a minúsculas: `Text.toLower()` no
    // convierte las vocales acentuadas mayúsculas (Á, É, Í, Ó, Ú, Ü, Ñ), así
    // que plegar después dejaría esos caracteres intactos y una búsqueda como
    // "acido" no encontraría "Ácido". `foldChar` reconoce ambas formas.
    let chars = trimmed.toArray();
    let folded = chars.map(foldChar);
    Text.fromArray(folded).toLower();
  };

  // Pliega un carácter a su letra base, reconociendo tanto la forma minúscula
  // como la mayúscula de vocales acentuadas, diéresis y eñe. Los caracteres que
  // no son vocales acentuadas, diéresis ni eñe se devuelven sin cambios.
  func foldChar(c : Char) : Char {
    switch (c) {
      case ('á') { 'a' };
      case ('à') { 'a' };
      case ('ä') { 'a' };
      case ('â') { 'a' };
      case ('ã') { 'a' };
      case ('é') { 'e' };
      case ('è') { 'e' };
      case ('ë') { 'e' };
      case ('ê') { 'e' };
      case ('í') { 'i' };
      case ('ì') { 'i' };
      case ('ï') { 'i' };
      case ('î') { 'i' };
      case ('ó') { 'o' };
      case ('ò') { 'o' };
      case ('ö') { 'o' };
      case ('ô') { 'o' };
      case ('õ') { 'o' };
      case ('ú') { 'u' };
      case ('ù') { 'u' };
      case ('ü') { 'u' };
      case ('û') { 'u' };
      case ('ñ') { 'n' };
      case ('Á') { 'a' };
      case ('À') { 'a' };
      case ('Ä') { 'a' };
      case ('Â') { 'a' };
      case ('Ã') { 'a' };
      case ('É') { 'e' };
      case ('È') { 'e' };
      case ('Ë') { 'e' };
      case ('Ê') { 'e' };
      case ('Í') { 'i' };
      case ('Ì') { 'i' };
      case ('Ï') { 'i' };
      case ('Î') { 'i' };
      case ('Ó') { 'o' };
      case ('Ò') { 'o' };
      case ('Ö') { 'o' };
      case ('Ô') { 'o' };
      case ('Õ') { 'o' };
      case ('Ú') { 'u' };
      case ('Ù') { 'u' };
      case ('Ü') { 'u' };
      case ('Û') { 'u' };
      case ('Ñ') { 'n' };
      case (_) { c };
    };
  };

  // ¿El texto `haystack` contiene la subcadena `needle`, ignorando mayúsculas
  // y tildes en AMBOS lados?
  //
  // Contrato: `needle` puede venir ya normalizado (recomendado) o crudo; la
  // función normaliza ambos operandos antes de comparar. Un `needle` vacío
  // devuelve `true` (sin filtro de texto).
  public func contains(haystack : Text, needle : Text) : Bool {
    let n = normalize(needle);
    if (n == "") { return true };
    normalize(haystack).contains(#text n);
  };

  // ¿Alguno de los textos de `haystacks` contiene `needle`? Atajo para los
  // buscadores que evalúan varios campos de un mismo registro.
  //
  // Contrato: equivale a `haystacks.any(func h = contains(h, needle))`.
  public func containsAny(haystacks : [Text], needle : Text) : Bool {
    haystacks.any(func h = contains(h, needle));
  };

  // ¿Dos textos son equivalentes bajo la normalización? Se usa para las
  // comparaciones de unicidad que hoy usan `.toLower()` (códigos de servicio,
  // nombres de categoría, SKU, etc.).
  //
  // Contrato: `equals(a, b)` == `normalize(a) == normalize(b)`.
  public func equals(a : Text, b : Text) : Bool {
    normalize(a) == normalize(b);
  };

  // Clave de ordenamiento insensible a mayúsculas y tildes. Los listados
  // mantienen su orden actual (por nombre/código); esta función solo hace que
  // ese orden no dependa de acentos ni mayúsculas.
  //
  // Contrato: `sortKey(t)` == `normalize(t)`.
  public func sortKey(value : Text) : Text {
    normalize(value);
  };
};
