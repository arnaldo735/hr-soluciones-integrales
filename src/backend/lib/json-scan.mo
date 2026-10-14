/// Escáner JSON iterativo (sin recursión) para la ruta de restauración.
///
/// El parser JSON de `serde-core` es recursivo: `C.many` construye una cadena
/// de llamadas proporcional al número de elementos de un arreglo u objeto y
/// `jsonToCandid` recurre una vez por elemento. Con un archivo de copia grande
/// esa recursión desborda la pila del canister (IC0502) antes de que corra
/// cualquier lógica de sección.
///
/// Este módulo recorre el texto con un índice explícito y una pila explícita,
/// de modo que el consumo de pila es constante sin importar el tamaño del
/// archivo. No materializa el árbol Candid completo: solo localiza los tramos
/// de texto (`span`) que la restauración necesita, y cada elemento se decodifica
/// por separado con `JSON.toCandid` (recursión acotada a un elemento).
///
/// El texto se convierte una sola vez a un arreglo de caracteres (`Doc`); todas
/// las operaciones posteriores indexan ese arreglo, de modo que el escaneo es
/// lineal y no vuelve a copiar el texto.

import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";

module {
  /// Documento listo para escanear: el texto original y su arreglo de
  /// caracteres, convertido una sola vez.
  public type Doc = {
    text : Text;
    chars : [Char];
  };

  /// Tramo de caracteres `[start, end)` dentro del documento original.
  public type Span = { start : Nat; end : Nat };

  /// Profundidad máxima de anidamiento aceptada. Un archivo patológico que la
  /// exceda se rechaza con un error de formato en vez de desbordar la pila.
  public let MAX_DEPTH : Nat = 64;

  /// Resultado de un escaneo: el valor o un mensaje de error de formato.
  public type ScanResult<T> = { #ok : T; #err : Text };

  // Estado de la máquina de escaneo de un valor JSON.
  type ScanState = {
    #value;
    #keyOrClose;
    #colon;
    #commaOrClose;
  };

  /// Prepara un documento para escanear.
  public func doc(text : Text) : Doc {
    { text; chars = text.toArray() };
  };

  /// Texto crudo de un tramo.
  public func slice(d : Doc, span : Span) : Text {
    Text.fromArray(d.chars.sliceToArray(span.start.toInt(), span.end.toInt()));
  };

  // ── Navegación sobre el arreglo de caracteres ─────────────────────────────

  func isWs(c : Char) : Bool {
    c == ' ' or c == '\t' or c == '\n' or c == '\r';
  };

  func skipWs(chars : [Char], i : Nat) : Nat {
    var j = i;
    let n = chars.size();
    label scan while (j < n) {
      if (isWs(chars[j])) { j += 1 } else { break scan };
    };
    j;
  };

  // Avanza sobre una cadena JSON a partir de la comilla inicial y devuelve el
  // índice justo después de la comilla de cierre. Devuelve `null` si la cadena
  // no termina.
  func skipString(chars : [Char], i : Nat) : ?Nat {
    let n = chars.size();
    if (i >= n or chars[i] != '\"') { return null };
    var j = i + 1;
    label scan while (j < n) {
      let c = chars[j];
      if (c == '\\') {
        j += 2;
      } else if (c == '\"') {
        return ?(j + 1);
      } else {
        j += 1;
      };
    };
    null;
  };

  // Avanza sobre un literal JSON (`true`, `false`, `null` o un número) y
  // devuelve el índice donde termina. Los números se consumen carácter a
  // carácter; el valor no se interpreta aquí.
  func skipLiteral(chars : [Char], i : Nat) : Nat {
    let n = chars.size();
    var j = i;
    label scan while (j < n) {
      let c = chars[j];
      if (c == ',' or c == '}' or c == ']' or isWs(c)) { break scan };
      j += 1;
    };
    j;
  };

  // Avanza sobre un valor JSON completo (objeto, arreglo, cadena, literal o
  // número) usando una pila explícita de cierres pendientes. Devuelve el índice
  // justo después del valor, o `null` si el texto está mal formado o excede
  // `MAX_DEPTH`.
  //
  // La máquina de estados distingue lo que se espera en cada punto:
  //   #value        — un valor (inicio de un elemento o de un valor de objeto)
  //   #keyOrClose   — una clave de objeto o el cierre `}`
  //   #colon        — el separador `:` tras una clave
  //   #commaOrClose — una coma o el cierre del contenedor actual
  func skipValue(chars : [Char], start : Nat) : ?Nat {
    let n = chars.size();
    let i = skipWs(chars, start);
    if (i >= n) { return null };
    // Pila de cierres pendientes: `true` = objeto (`}`), `false` = arreglo (`]`).
    let stack = List.empty<Bool>();
    // Pila paralela con el tipo del contenedor padre, para restaurarlo al
    // cerrar un contenedor anidado.
    let parents = List.empty<Bool>();
    var j = i;
    var state : ScanState = #value;
    // Tipo del contenedor actual (el tope de la pila), para decidir qué sigue
    // tras una coma sin indexar la pila.
    var currentIsObject = false;
    label scan loop {
      let k = skipWs(chars, j);
      if (k >= n) { return null };
      let c = chars[k];
      switch (state) {
        case (#value) {
          if (c == '{') {
            if (stack.size() >= MAX_DEPTH) { return null };
            stack.add(true);
            parents.add(currentIsObject);
            currentIsObject := true;
            j := k + 1;
            state := #keyOrClose;
          } else if (c == '[') {
            if (stack.size() >= MAX_DEPTH) { return null };
            stack.add(false);
            parents.add(currentIsObject);
            currentIsObject := false;
            j := k + 1;
            state := #value;
          } else if (c == '\"') {
            switch (skipString(chars, k)) {
              case (?after) { j := after; state := #commaOrClose };
              case null { return null };
            };
          } else {
            j := skipLiteral(chars, k);
            state := #commaOrClose;
          };
          // Un valor escalar en el nivel superior termina el valor.
          if (stack.size() == 0) { return ?j };
        };
        case (#keyOrClose) {
          if (c == '}') {
            ignore stack.removeLast();
            currentIsObject := switch (parents.removeLast()) { case (?v) { v }; case null { false } };
            j := k + 1;
            if (stack.size() == 0) { return ?j };
            state := #commaOrClose;
          } else if (c == '\"') {
            switch (skipString(chars, k)) {
              case (?after) { j := after; state := #colon };
              case null { return null };
            };
          } else {
            return null;
          };
        };
        case (#colon) {
          if (c != ':') { return null };
          j := k + 1;
          state := #value;
        };
        case (#commaOrClose) {
          if (c == ',') {
            // Dentro de un objeto, tras una coma viene una clave; dentro de un
            // arreglo, un valor.
            j := k + 1;
            state := if (currentIsObject) { #keyOrClose } else { #value };
          } else if (c == '}' or c == ']') {
            switch (stack.removeLast()) {
              case (?isObject) {
                if ((c == '}') != isObject) { return null };
              };
              case null { return null };
            };
            currentIsObject := switch (parents.removeLast()) { case (?v) { v }; case null { false } };
            j := k + 1;
            if (stack.size() == 0) { return ?j };
            state := #commaOrClose;
          } else {
            return null;
          };
        };
      };
    };
    null;
  };

  // ── Objeto raíz ───────────────────────────────────────────────────────────

  /// Escanea el objeto raíz del documento y devuelve, para cada clave de primer
  /// nivel, el tramo de caracteres de su valor. No interpreta los valores: solo
  /// localiza dónde empiezan y terminan.
  public func rootFields(d : Doc) : ScanResult<[(Text, Span)]> {
    let chars = d.chars;
    let n = chars.size();
    let i = skipWs(chars, 0);
    if (i >= n or chars[i] != '{') {
      return #err("la raíz debe ser un objeto JSON con las secciones del respaldo");
    };
    let out = List.empty<(Text, Span)>();
    var j = skipWs(chars, i + 1);
    if (j < n and chars[j] == '}') { return #ok(out.toArray()) };
    label scan loop {
      // Clave.
      let keyStart = skipWs(chars, j);
      if (keyStart >= n or chars[keyStart] != '\"') {
        return #err("clave de objeto inválida");
      };
      let keyEnd = switch (skipString(chars, keyStart)) {
        case (?e) { e };
        case null { return #err("cadena de clave sin cerrar") };
      };
      let key = Text.fromArray(chars.sliceToArray(keyStart.toInt() + 1, keyEnd.toInt() - 1));
      // Dos puntos.
      let colon = skipWs(chars, keyEnd);
      if (colon >= n or chars[colon] != ':') {
        return #err("falta ':' tras la clave '" # key # "'");
      };
      // Valor.
      let valueStart = skipWs(chars, colon + 1);
      let valueEnd = switch (skipValue(chars, valueStart)) {
        case (?e) { e };
        case null { return #err("valor inválido en la clave '" # key # "'") };
      };
      out.add((key, { start = valueStart; end = valueEnd }));
      // Separador.
      let sep = skipWs(chars, valueEnd);
      if (sep >= n) { return #err("objeto raíz sin cerrar") };
      let c = chars[sep];
      if (c == ',') {
        j := sep + 1;
      } else if (c == '}') {
        return #ok(out.toArray());
      } else {
        return #err("separador inválido en el objeto raíz");
      };
    };
    #err("objeto raíz sin cerrar");
  };

  /// Busca el tramo del valor de una clave de primer nivel.
  public func findField(fields : [(Text, Span)], key : Text) : ?Span {
    for ((k, span) in fields.values()) {
      if (k == key) { return ?span };
    };
    null;
  };

  // ── Arreglos ──────────────────────────────────────────────────────────────

  /// Cuenta los elementos de un arreglo JSON a partir del tramo de su valor.
  /// Devuelve `null` si el valor no es un arreglo o está mal formado.
  public func countArray(d : Doc, span : Span) : ?Nat {
    let chars = d.chars;
    let n = chars.size();
    let i = skipWs(chars, span.start);
    if (i >= span.end or chars[i] != '[') { return null };
    var j = skipWs(chars, i + 1);
    if (j < span.end and chars[j] == ']') { return ?0 };
    var count = 0;
    label scan loop {
      let valueStart = skipWs(chars, j);
      let valueEnd = switch (skipValue(chars, valueStart)) {
        case (?e) { e };
        case null { return null };
      };
      count += 1;
      let sep = skipWs(chars, valueEnd);
      if (sep >= n) { return null };
      let c = chars[sep];
      if (c == ',') {
        j := sep + 1;
      } else if (c == ']') {
        return ?count;
      } else {
        return null;
      };
    };
    null;
  };

  /// Devuelve el tramo de caracteres de cada elemento de un arreglo JSON. Cada
  /// elemento se decodifica después por separado, de modo que ninguna pasada
  /// recursiva abarca el archivo completo.
  public func arrayElements(d : Doc, span : Span) : ScanResult<[Span]> {
    let chars = d.chars;
    let n = chars.size();
    let i = skipWs(chars, span.start);
    if (i >= span.end or chars[i] != '[') {
      return #err("la sección no es un arreglo JSON");
    };
    let out = List.empty<Span>();
    var j = skipWs(chars, i + 1);
    if (j < span.end and chars[j] == ']') { return #ok(out.toArray()) };
    label scan loop {
      let valueStart = skipWs(chars, j);
      let valueEnd = switch (skipValue(chars, valueStart)) {
        case (?e) { e };
        case null { return #err("elemento de arreglo inválido") };
      };
      out.add({ start = valueStart; end = valueEnd });
      let sep = skipWs(chars, valueEnd);
      if (sep >= n) { return #err("arreglo sin cerrar") };
      let c = chars[sep];
      if (c == ',') {
        j := sep + 1;
      } else if (c == ']') {
        return #ok(out.toArray());
      } else {
        return #err("separador inválido en el arreglo");
      };
    };
    #err("arreglo sin cerrar");
  };
};
