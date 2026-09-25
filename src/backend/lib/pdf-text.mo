import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Char "mo:core/Char";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";

// Extractor de texto de PDF sin dependencias externas.
//
// Cubre el caso de una factura electrónica colombiana generada por software de
// facturación: localiza los objetos stream, resuelve el diccionario que los
// precede (/Filter y /Length, directos, en array o por referencia indirecta),
// aplica los filtros declarados en orden (FlateDecode, ASCII85Decode,
// LZWDecode) y recorre los operadores de contenido para recuperar las cadenas
// de texto (Tj, TJ, ' y "), respetando los escapes de cadena del PDF y
// decodificando UTF-16BE con BOM.
//
// No implementa OCR: un PDF sin capa de texto (por ejemplo un escaneo) no
// produce cadenas de texto y la función devuelve null.
module {
  // Tope de bytes descomprimidos por stream. Un stream FlateDecode mal formado
  // o un "zip bomb" no debe agotar la memoria del canister.
  let MAX_INFLATED_BYTES : Nat = 8_000_000;

  // Tope de streams procesados. Una factura real tiene pocos streams; un PDF
  // hostil con miles de objetos no debe consumir el presupuesto de cómputo.
  let MAX_STREAMS : Nat = 512;

  // Tope de caracteres de texto devueltos al modelo.
  let MAX_TEXT_CHARS : Nat = 200_000;

  // Tope de bytes iniciales donde se busca la cabecera `%PDF-`. Un BOM UTF-8
  // (3 bytes) o espacios en blanco no deben invalidar el documento.
  let MAX_HEADER_SCAN : Nat = 1024;

  // Tope de objetos indirectos indexados. Un PDF real tiene cientos; un
  // documento hostil no debe consumir el presupuesto de cómputo.
  let MAX_OBJECTS : Nat = 4096;

  // ── Búsqueda de bytes ───────────────────────────────────────────────────

  func indexOf(bytes : [Nat8], needle : [Nat8], from : Nat) : ?Nat {
    let n = bytes.size();
    let m = needle.size();
    if (m == 0 or m > n) { return null };
    var i = from;
    label search while (i + m <= n) {
      var j = 0;
      while (j < m and bytes[i + j] == needle[j]) { j += 1 };
      if (j == m) { return ?i };
      i += 1;
    };
    null;
  };

  func slice<T>(bytes : [T], start : Nat, end : Nat) : [T] {
    let n = bytes.size();
    let s = if (start > n) { n } else { start };
    let e = if (end > n) { n } else { end };
    if (e <= s) { return [] };
    Array.tabulate(e - s, func (i) = bytes[s + i]);
  };

  // ── Inflate (RFC 1951) ──────────────────────────────────────────────────

  // Descomprime un flujo zlib (cabecera de 2 bytes + deflate + Adler-32), que
  // es lo que produce FlateDecode. Devuelve null si el flujo es inválido o
  // excede el tope de bytes.
  func inflateZlib(data : [Nat8]) : ?[Nat8] {
    if (data.size() < 6) { return null };
    let cmf = data[0];
    let flg = data[1];
    // CM debe ser 8 (deflate) y la cabecera no debe declarar un diccionario.
    if (cmf & 0x0F != 8) { return null };
    if (flg & 0x20 != 0) { return null };
    inflate(data, 2, data.size() - 6);
  };

  // Descomprime un flujo deflate crudo (sin cabecera zlib). Se usa como
  // respaldo cuando el stream declara FlateDecode pero no lleva cabecera zlib.
  func inflateRaw(data : [Nat8]) : ?[Nat8] {
    inflate(data, 0, data.size());
  };

  func inflate(data : [Nat8], start : Nat, end : Nat) : ?[Nat8] {
    let out = List.empty<Nat8>();
    var pos = start;
    let limit = if (end > data.size()) { data.size() } else { end };
    var bitBuf : Nat32 = 0;
    var bitCount : Nat = 0;

    func readBits(count : Nat) : ?Nat {
      while (bitCount < count) {
        if (pos >= limit) { return null };
        bitBuf := bitBuf | (data[pos].toNat().toNat32() << bitCount.toNat32());
        bitCount += 8;
        pos += 1;
      };
      let mask : Nat32 = (1 : Nat32) << count.toNat32();
      let value = bitBuf & (mask - 1);
      bitBuf := bitBuf >> count.toNat32();
      bitCount -= count;
      ?value.toNat();
    };
    func readByte() : ?Nat8 {
      if (pos >= limit) { return null };
      let b = data[pos];
      pos += 1;
      ?b;
    };

    // Copia `length` bytes desde `distance` posiciones atrás. La distancia
    // puede solaparse con la salida recién escrita (caso normal de deflate).
    func copyBack(distance : Nat, length : Nat) : Bool {
      if (distance == 0) { return false };
      let current = out.size();
      if (distance > current) { return false };
      var i = 0;
      while (i < length) {
        if (out.size() >= MAX_INFLATED_BYTES) { return false };
        let source = out.size() - distance;
        out.add(out.at(source));
        i += 1;
      };
      true;
    };

    // Construye la tabla de códigos de Huffman a partir de las longitudes.
    // Devuelve pares (código, longitud) indexados por símbolo.
    func buildTable(lengths : [Nat]) : [(Nat, Nat)] {
      let maxBits = 15;
      let blCount = List.empty<Nat>();
      var k = 0;
      while (k <= maxBits) { blCount.add(0); k += 1 };
      for (l in lengths.values()) {
        if (l > 0) { blCount.put(l, blCount.at(l) + 1) };
      };
      let nextCode = List.empty<Nat>();
      k := 0;
      while (k <= maxBits) { nextCode.add(0); k += 1 };
      var code = 0;
      var bits = 1;
      while (bits <= maxBits) {
        code := (code + blCount.at(bits - 1)) * 2;
        nextCode.put(bits, code);
        bits += 1;
      };
      Array.tabulate(lengths.size(), func (symbol) {
        let l = lengths[symbol];
        if (l == 0) { (0, 0) } else {
          let c = nextCode.at(l);
          nextCode.put(l, c + 1);
          (c, l);
        };
      });
    };

    // Decodifica un símbolo leyendo bits hasta encontrar un código válido.
    func decodeSymbol(table : [(Nat, Nat)]) : ?Nat {
      var code = 0;
      var length = 0;
      while (length < 15) {
        let bit = switch (readBits(1)) { case (?v) v; case null { return null } };
        code := code * 2 + bit;
        length += 1;
        var symbol = 0;
        var found : ?Nat = null;
        while (symbol < table.size() and found == null) {
          let (c, l) = table[symbol];
          if (l == length and c == code) { found := ?symbol };
          symbol += 1;
        };
        switch (found) {
          case (?s) { return ?s };
          case null {};
        };
      };
      null;
    };

    let lengthBase : [Nat] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
    let lengthExtra : [Nat] = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    let distBase : [Nat] = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
    let distExtra : [Nat] = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

    // Decodifica los símbolos de un bloque hasta el fin de bloque (256).
    func decodeBlock(litTable : [(Nat, Nat)], distTable : [(Nat, Nat)]) : Bool {
      loop {
        let sym = switch (decodeSymbol(litTable)) { case (?v) v; case null { return false } };
        if (sym < 256) {
          if (out.size() >= MAX_INFLATED_BYTES) { return false };
          out.add(sym.toNat8());
        } else if (sym == 256) {
          return true;
        } else {
          let lengthIndex = sym - 257;
          if (lengthIndex >= lengthBase.size()) { return false };
          let extra = switch (readBits(lengthExtra[lengthIndex])) { case (?v) v; case null { return false } };
          let length = lengthBase[lengthIndex] + extra;
          let distSym = switch (decodeSymbol(distTable)) { case (?v) v; case null { return false } };
          if (distSym >= distBase.size()) { return false };
          let distExtraBits = switch (readBits(distExtra[distSym])) { case (?v) v; case null { return false } };
          let distance = distBase[distSym] + distExtraBits;
          if (not copyBack(distance, length)) { return false };
        };
      };
    };

    var final = false;
    while (not final) {
      let finalBit = switch (readBits(1)) { case (?v) v; case null { return null } };
      final := finalBit == 1;
      let btype = switch (readBits(2)) { case (?v) v; case null { return null } };
      if (btype == 0) {
        // Bloque sin comprimir: se alinea a byte y se copia LEN bytes.
        bitBuf := 0;
        bitCount := 0;
        let lenLo = switch (readByte()) { case (?b) b.toNat(); case null { return null } };
        let lenHi = switch (readByte()) { case (?b) b.toNat(); case null { return null } };
        let len = lenLo + lenHi * 256;
        ignore (readByte());
        ignore (readByte());
        var i = 0;
        while (i < len) {
          let b = switch (readByte()) { case (?v) v; case null { return null } };
          if (out.size() >= MAX_INFLATED_BYTES) { return null };
          out.add(b);
          i += 1;
        };
      } else if (btype == 1) {
        // Bloque con tablas fijas de Huffman.
        let litLengths = Array.tabulate(288, func (i) {
          if (i < 144) { 8 } else if (i < 256) { 9 } else if (i < 280) { 7 } else { 8 };
        });
        let distLengths = Array.tabulate(30, func (_) = 5);
        let litTable = buildTable(litLengths);
        let distTable = buildTable(distLengths);
        if (not (decodeBlock(litTable, distTable))) { return null };
      } else if (btype == 2) {
        // Bloque con tablas dinámicas de Huffman.
        let hlit = switch (readBits(5)) { case (?v) v + 257; case null { return null } };
        let hdist = switch (readBits(5)) { case (?v) v + 1; case null { return null } };
        let hclen = switch (readBits(4)) { case (?v) v + 4; case null { return null } };
        let order : [Nat] = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        let codeLengths = List.empty<Nat>();
        var ck = 0;
        while (ck < 19) { codeLengths.add(0); ck += 1 };
        var ci = 0;
        while (ci < hclen) {
          let sym = switch (readBits(3)) { case (?v) v; case null { return null } };
          codeLengths.put(order[ci], sym);
          ci += 1;
        };
        let codeTable = buildTable(codeLengths.toArray());
        let allLengths = List.empty<Nat>();
        while (allLengths.size() < hlit + hdist) {
          let sym = switch (decodeSymbol(codeTable)) { case (?v) v; case null { return null } };
          if (sym < 16) {
            allLengths.add(sym);
          } else if (sym == 16) {
            let prev = if (allLengths.size() == 0) { 0 } else { allLengths.at(allLengths.size() - 1) };
            let repeat = switch (readBits(2)) { case (?v) v + 3; case null { return null } };
            var i = 0;
            while (i < repeat) { allLengths.add(prev); i += 1 };
          } else if (sym == 17) {
            let repeat = switch (readBits(3)) { case (?v) v + 3; case null { return null } };
            var i = 0;
            while (i < repeat) { allLengths.add(0); i += 1 };
          } else {
            let repeat = switch (readBits(7)) { case (?v) v + 11; case null { return null } };
            var i = 0;
            while (i < repeat) { allLengths.add(0); i += 1 };
          };
        };
        let lengths = allLengths.toArray();
        let litLengths = slice(lengths, 0, hlit);
        let distLengths = slice(lengths, hlit, hlit + hdist);
        let litTable = buildTable(litLengths);
        let distTable = buildTable(distLengths);
        if (not (decodeBlock(litTable, distTable))) { return null };
      } else {
        return null;
      };
    };
    ?out.toArray();
  };

  // ── Filtros de stream ───────────────────────────────────────────────────

  // Decodifica ASCII85 (base 85) con el terminador `~>`. Se usa en PDFs
  // generados por algunas herramientas de facturación electrónica.
  func ascii85Decode(data : [Nat8]) : ?[Nat8] {
    let out = List.empty<Nat8>();
    var i = 0;
    let n = data.size();
    // Ignora el prefijo `<~` si está presente.
    if (n >= 2 and data[0] == 0x3C and data[1] == 0x7E) { i := 2 };
    var group = List.empty<Nat>();
    label decode while (i < n) {
      let b = data[i];
      i += 1;
      if (b == 0x7E) { break decode }; // `~` inicia el terminador `~>`
      if (isWhitespaceByte(b)) { continue decode };
      if (b == 0x7A and group.size() == 0) {
        // `z` representa cuatro bytes cero.
        var k = 0;
        while (k < 4) {
          if (out.size() >= MAX_INFLATED_BYTES) { return null };
          out.add(0 : Nat8);
          k += 1;
        };
        continue decode;
      };
      if (b < 0x21 or b > 0x75) { return null };
      group.add(b.toNat() - 0x21);
      if (group.size() == 5) {
        var value = 0;
        for (d in group.values()) { value := value * 85 + d };
        if (value > 0xFFFFFFFF) { return null };
        let word = value.toNat32();
        var k = 4;
        while (k > 0) {
          k -= 1;
          if (out.size() >= MAX_INFLATED_BYTES) { return null };
          out.add(((word >> (k * 8).toNat32()) & 0xFF).toNat8());
        };
        group.clear();
      };
    };
    // Grupo final parcial: se rellena con `u` (84) y se emiten n-1 bytes.
    let remaining = group.size();
    if (remaining == 1) { return null };
    if (remaining > 1) {
      var value = 0;
      var k = 0;
      while (k < 5) {
        let d = if (k < remaining) { group.at(k) } else { 84 };
        value := value * 85 + d;
        k += 1;
      };
      let word = value.toNat32();
      var emitted = 0;
      while (emitted < remaining - 1) {
        if (out.size() >= MAX_INFLATED_BYTES) { return null };
        let shift = (3 - emitted) * 8;
        out.add(((word >> shift.toNat32()) & 0xFF).toNat8());
        emitted += 1;
      };
    };
    ?out.toArray();
  };

  // Decodifica LZW con cambio de código variable (EarlyChange = 1), el modo
  // que usa LZWDecode en PDF.
  func lzwDecode(data : [Nat8]) : ?[Nat8] {
    let out = List.empty<Nat8>();
    // Tabla de prefijos: para cada código, el código previo y el byte final.
    let prefix = List.empty<Nat>();
    let suffix = List.empty<Nat8>();
    var k = 0;
    while (k < 256) {
      prefix.add(0);
      suffix.add(k.toNat8());
      k += 1;
    };
    prefix.add(0);
    suffix.add(0 : Nat8);
    prefix.add(0);
    suffix.add(0 : Nat8);

    var bitBuf : Nat32 = 0;
    var bitCount : Nat = 0;
    var pos = 0;
    let n = data.size();
    var codeSize = 9;
    var nextCode = 258;
    var prevCode : ?Nat = null;

    func readCode() : ?Nat {
      while (bitCount < codeSize) {
        if (pos >= n) { return null };
        bitBuf := bitBuf | (data[pos].toNat().toNat32() << bitCount.toNat32());
        bitCount += 8;
        pos += 1;
      };
      let mask : Nat32 = (1 : Nat32) << codeSize.toNat32();
      let value = bitBuf & (mask - 1);
      bitBuf := bitBuf >> codeSize.toNat32();
      bitCount -= codeSize;
      ?value.toNat();
    };

    // Reconstruye la cadena de un código recorriendo la tabla de prefijos.
    func expand(code : Nat) : ?[Nat8] {
      let stack = List.empty<Nat8>();
      var current = code;
      var guard = 0;
      while (current >= 256 and guard < 4096) {
        if (current >= prefix.size()) { return null };
        stack.add(suffix.at(current));
        current := prefix.at(current);
        guard += 1;
      };
      if (current >= 256) { return null };
      stack.add(current.toNat8());
      let bytes = stack.toArray();
      // La pila está en orden inverso.
      ?Array.tabulate(bytes.size(), func (i) = bytes[bytes.size() - 1 - i]);
    };

    label decode loop {
      let code = switch (readCode()) { case (?c) c; case null { break decode } };
      if (code == 256) {
        // Clear: reinicia la tabla.
        codeSize := 9;
        nextCode := 258;
        prevCode := null;
        continue decode;
      };
      if (code == 257) { break decode }; // EOD
      let entry = switch (prevCode) {
        case null {
          // El primer código debe ser un literal.
          if (code >= 256) { return null };
          ?[code.toNat8()];
        };
        case (?prev) {
          if (code < nextCode) {
            expand(code);
          } else if (code == nextCode) {
            // Caso KwKwK: la cadena previa más su primer byte.
            switch (expand(prev)) {
              case (?bytes) {
                if (bytes.size() == 0) { null } else {
                  ?Array.tabulate(bytes.size() + 1, func (i) =
                    if (i < bytes.size()) { bytes[i] } else { bytes[0] }
                  );
                };
              };
              case null { null };
            };
          } else {
            null;
          };
        };
      };
      let bytes = switch (entry) { case (?b) b; case null { return null } };
      for (b in bytes.values()) {
        if (out.size() >= MAX_INFLATED_BYTES) { return null };
        out.add(b);
      };
      // Añade la nueva entrada a la tabla.
      switch (prevCode) {
        case (?prev) {
          if (nextCode < 4096) {
            prefix.add(prev);
            suffix.add(bytes[0]);
            nextCode += 1;
            // EarlyChange = 1: el ancho crece un código antes.
            if (nextCode + 1 >= 512 and codeSize == 9) { codeSize := 10 }
            else if (nextCode + 1 >= 1024 and codeSize == 10) { codeSize := 11 }
            else if (nextCode + 1 >= 2048 and codeSize == 11) { codeSize := 12 };
          };
        };
        case null {};
      };
      prevCode := ?code;
    };
    ?out.toArray();
  };

  // ── Decodificación de cadenas PDF ───────────────────────────────────────

  // Decodifica una cadena PDF (bytes entre paréntesis) a texto UTF-8.
  // - Si empieza con BOM UTF-16BE (FE FF), se decodifica como UTF-16BE.
  // - En otro caso se interpreta como bytes simples (WinAnsi/Latin-1) y se
  //   convierte a UTF-8.
  // Los escapes de cadena del PDF ya se resolvieron antes de llamar aquí.
  func decodePdfString(bytes : [Nat8]) : Text {
    if (bytes.size() >= 2 and bytes[0] == 0xFE and bytes[1] == 0xFF) {
      return decodeUtf16Be(slice(bytes, 2, bytes.size()));
    };
    decodeLatin1(bytes);
  };

  // Decodifica una cadena hexadecimal. En fuentes Type0/CID los códigos son de
  // dos bytes (UTF-16BE sin BOM), así que una longitud par con bytes altos
  // nulos se interpreta como UTF-16BE; en otro caso se trata como Latin-1.
  func decodeHexString(bytes : [Nat8]) : Text {
    if (bytes.size() >= 2 and bytes.size() % 2 == 0) {
      var zeroHigh = 0;
      var i = 0;
      while (i + 1 < bytes.size()) {
        if (bytes[i] == 0x00) { zeroHigh += 1 };
        i += 2;
      };
      // Si la mayoría de los bytes altos son nulos, es texto ASCII codificado
      // como UTF-16BE (patrón típico de fuentes Type0/CID).
      if (zeroHigh * 2 >= bytes.size() / 2) {
        return decodeUtf16Be(bytes);
      };
    };
    decodeLatin1(bytes);
  };

  func decodeUtf16Be(bytes : [Nat8]) : Text {
    let out = List.empty<Char>();
    var i = 0;
    while (i + 1 < bytes.size()) {
      let code = bytes[i].toNat() * 256 + bytes[i + 1].toNat();
      if (code >= 0xD800 and code <= 0xDBFF and i + 3 < bytes.size()) {
        // Par suplente: combina con el siguiente code unit.
        let low = bytes[i + 2].toNat() * 256 + bytes[i + 3].toNat();
        if (low >= 0xDC00 and low <= 0xDFFF) {
          let scalar = 0x10000 + (code - 0xD800) * 1024 + (low - 0xDC00);
          out.add(scalar.toNat32().toChar());
          i += 4;
        } else {
          out.add(code.toNat32().toChar());
          i += 2;
        };
      } else {
        out.add(code.toNat32().toChar());
        i += 2;
      };
    };
    Text.fromIter(out.values());
  };

  func decodeLatin1(bytes : [Nat8]) : Text {
    let out = List.empty<Char>();
    for (b in bytes.values()) {
      out.add(b.toNat().toNat32().toChar());
    };
    Text.fromIter(out.values());
  };

  // ── Extracción de operadores de texto ───────────────────────────────────

  func isWhitespaceByte(b : Nat8) : Bool {
    b == 0x20 or b == 0x0A or b == 0x0D or b == 0x09 or b == 0x0C or b == 0x00;
  };

  func isDelimiterByte(b : Nat8) : Bool {
    b == 0x28 or b == 0x29 or b == 0x3C or b == 0x3E or b == 0x5B or b == 0x5D
      or b == 0x7B or b == 0x7D or b == 0x2F or b == 0x25;
  };

  func isRegularByte(b : Nat8) : Bool {
    not (isWhitespaceByte(b) or isDelimiterByte(b));
  };

  // Resuelve los escapes de una cadena PDF y devuelve los bytes resultantes.
  // `start` apunta al byte siguiente al paréntesis de apertura.
  func readLiteralString(content : [Nat8], start : Nat) : ([Nat8], Nat) {
    let out = List.empty<Nat8>();
    var i = start;
    let n = content.size();
    var depth = 1;
    while (i < n and depth > 0) {
      let b = content[i];
      if (b == 0x5C) {
        // Barra invertida: escape.
        if (i + 1 >= n) { i += 1 } else {
          let e = content[i + 1];
          if (e == 0x6E) { out.add(0x0A : Nat8); i += 2 }
          else if (e == 0x72) { out.add(0x0D : Nat8); i += 2 }
          else if (e == 0x74) { out.add(0x09 : Nat8); i += 2 }
          else if (e == 0x62) { out.add(0x08 : Nat8); i += 2 }
          else if (e == 0x66) { out.add(0x0C : Nat8); i += 2 }
          else if (e == 0x28) { out.add(0x28 : Nat8); i += 2 }
          else if (e == 0x29) { out.add(0x29 : Nat8); i += 2 }
          else if (e == 0x5C) { out.add(0x5C : Nat8); i += 2 }
          else if (e == 0x0A) { i += 2 }
          else if (e == 0x0D) {
            // Salto de línea escapado: puede ser CRLF.
            if (i + 2 < n and content[i + 2] == 0x0A) { i += 3 } else { i += 2 };
          }
          else if (e >= 0x30 and e <= 0x37) {
            // Escape octal de hasta 3 dígitos.
            var value = 0;
            var digits = 0;
            var j = i + 1;
            while (j < n and digits < 3 and content[j] >= 0x30 and content[j] <= 0x37) {
              value := value * 8 + (content[j].toNat() - 0x30);
              j += 1;
              digits += 1;
            };
            out.add((value % 256).toNat8());
            i := j;
          }
          else { out.add(e); i += 2 };
        };
      } else if (b == 0x28) {
        depth += 1;
        out.add(b);
        i += 1;
      } else if (b == 0x29) {
        depth -= 1;
        if (depth > 0) { out.add(b) };
        i += 1;
      } else {
        out.add(b);
        i += 1;
      };
    };
    (out.toArray(), i);
  };

  // Lee una cadena hexadecimal `<48656C6C6F>` y devuelve sus bytes.
  func readHexString(content : [Nat8], start : Nat) : ([Nat8], Nat) {
    let out = List.empty<Nat8>();
    var i = start;
    let n = content.size();
    var high : ?Nat = null;
    while (i < n and content[i] != 0x3E) {
      let b = content[i];
      let digit : ?Nat = if (b >= 0x30 and b <= 0x39) { ?(b.toNat() - 0x30) }
        else if (b >= 0x41 and b <= 0x46) { ?(b.toNat() - 0x37) }
        else if (b >= 0x61 and b <= 0x66) { ?(b.toNat() - 0x57) }
        else { null };
      switch (digit) {
        case (?d) {
          switch (high) {
            case (?h) { out.add((h * 16 + d).toNat8()); high := null };
            case null { high := ?d };
          };
        };
        case null {};
      };
      i += 1;
    };
    if (i < n) { i += 1 };
    (out.toArray(), i);
  };

  // Recorre el contenido de un stream y extrae el texto de los operadores
  // Tj, TJ, ' y ". Inserta saltos de línea en los operadores de posicionamiento
  // (Td, TD, T*, ET, BT) para conservar la estructura de líneas.
  func extractTextFromContent(content : [Nat8]) : Text {
    let out = List.empty<Char>();
    var i = 0;
    let n = content.size();
    var pendingNewline = false;

    func emitNewline() {
      if (out.size() > 0) {
        let last = out.at(out.size() - 1);
        if (last != '\n') { out.add('\n') };
      };
    };

    func emitText(t : Text) {
      if (pendingNewline) { emitNewline(); pendingNewline := false };
      for (c in t.chars()) { out.add(c) };
    };

    while (i < n) {
      let b = content[i];
      if (b == 0x28) {
        // Cadena literal: se emite como texto.
        let (bytes, next) = readLiteralString(content, i + 1);
        emitText(decodePdfString(bytes));
        i := next;
      } else if (b == 0x3C) {
        // Cadena hexadecimal o diccionario `<<`. Solo la cadena hex es texto.
        if (i + 1 < n and content[i + 1] == 0x3C) {
          i += 2;
        } else {
          let (bytes, next) = readHexString(content, i + 1);
          emitText(decodeHexString(bytes));
          i := next;
        };
      } else if (b == 0x25) {
        // Comentario: hasta el fin de línea.
        while (i < n and content[i] != 0x0A and content[i] != 0x0D) { i += 1 };
      } else if (isRegularByte(b)) {
        // Token: se lee completo para reconocer los operadores de texto.
        let start = i;
        while (i < n and isRegularByte(content[i])) { i += 1 };
        let token = Text.fromIter(
          Array.tabulate(i - start, func (k) = content[start + k].toNat().toNat32().toChar()).values()
        );
        if (token == "Td" or token == "TD" or token == "T*" or token == "ET" or token == "BT") {
          pendingNewline := true;
        };
      } else {
        i += 1;
      };
    };
    Text.fromIter(out.values());
  };

  // ── Índice de objetos indirectos ────────────────────────────────────────

  // Rango de bytes de un objeto indirecto `N G obj ... endobj`.
  type ObjectRange = { start : Nat; end : Nat };

  // Índice de objetos indirectos por número, para resolver referencias como
  // `/Filter 12 0 R` o `/Length 12 0 R`.
  type ObjectIndex = Map.Map<Nat, ObjectRange>;

  // Lee un entero decimal a partir de `start`. Devuelve el valor y la posición
  // siguiente al último dígito.
  func readNumber(bytes : [Nat8], start : Nat) : (?Nat, Nat) {
    var i = start;
    let n = bytes.size();
    while (i < n and isWhitespaceByte(bytes[i])) { i += 1 };
    var value = 0;
    var digits = 0;
    while (i < n and bytes[i] >= 0x30 and bytes[i] <= 0x39) {
      value := value * 10 + (bytes[i].toNat() - 0x30);
      i += 1;
      digits += 1;
    };
    if (digits == 0) { (null, i) } else { (?value, i) };
  };

  // Construye el índice de objetos indirectos del documento. Se recorre el
  // archivo buscando el patrón `N G obj`; el rango termina en `endobj`.
  func buildObjectIndex(data : [Nat8]) : ObjectIndex {
    let index = Map.empty<Nat, ObjectRange>();
    let objKeyword : [Nat8] = [0x6F, 0x62, 0x6A]; // "obj"
    let endobjKeyword : [Nat8] = [0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A]; // "endobj"
    var searchFrom = 0;
    var count = 0;
    label scan loop {
      if (count >= MAX_OBJECTS) { break scan };
      let objPos = switch (indexOf(data, objKeyword, searchFrom)) {
        case (?p) { p };
        case null { break scan };
      };
      // `obj` debe ser un token completo.
      let beforeOk = objPos == 0 or not isRegularByte(data[objPos - 1]);
      let afterPos = objPos + objKeyword.size();
      let afterOk = afterPos >= data.size() or not isRegularByte(data[afterPos]);
      if (not (beforeOk and afterOk)) {
        searchFrom := objPos + 1;
        continue scan;
      };
      // Retrocede para leer `N G` antes de `obj`.
      let (numOpt, _) = readNumberBackwards(data, objPos);
      switch (numOpt) {
        case (?num) {
          let endPos = switch (indexOf(data, endobjKeyword, afterPos)) {
            case (?e) { e };
            case null { data.size() };
          };
          // Solo se registra la primera aparición de cada número.
          if (index.get(num) == null) {
            index.add(num, { start = afterPos; end = endPos });
          };
          searchFrom := endPos + endobjKeyword.size();
          count += 1;
        };
        case null {
          searchFrom := objPos + 1;
        };
      };
    };
    index;
  };

  // Lee el número de objeto que precede a `obj` (el segundo entero hacia
  // atrás). Devuelve el número y la posición donde comienza.
  func readNumberBackwards(data : [Nat8], objPos : Nat) : (?Nat, Nat) {
    var i = objPos;
    // Salta espacios antes de `obj`.
    while (i > 0 and isWhitespaceByte(data[i - 1])) { i -= 1 };
    // Lee el segundo entero (generación) hacia atrás.
    var end = i;
    while (i > 0 and data[i - 1] >= 0x30 and data[i - 1] <= 0x39) { i -= 1 };
    if (i == end) { return (null, objPos) };
    // Salta espacios entre los dos enteros.
    while (i > 0 and isWhitespaceByte(data[i - 1])) { i -= 1 };
    // Lee el primer entero (número de objeto).
    var numEnd = i;
    while (i > 0 and data[i - 1] >= 0x30 and data[i - 1] <= 0x39) { i -= 1 };
    if (i == numEnd) { return (null, objPos) };
    var value = 0;
    var k = i;
    while (k < numEnd) {
      value := value * 10 + (data[k].toNat() - 0x30);
      k += 1;
    };
    (?value, i);
  };

  // ── Diccionario del stream ──────────────────────────────────────────────

  // Filtros de stream soportados.
  type StreamFilter = { #flate; #ascii85; #lzw; #unknown };

  // Información del diccionario que precede a `stream`.
  type StreamInfo = {
    filters : [StreamFilter];
    length : ?Nat;
  };

  // Resuelve una referencia indirecta `N G R` a partir de `start`. Devuelve el
  // número de objeto referenciado y la posición siguiente.
  func readIndirectRef(bytes : [Nat8], start : Nat) : (?Nat, Nat) {
    let (numOpt, afterNum) = readNumber(bytes, start);
    switch (numOpt) {
      case null { (null, afterNum) };
      case (?num) {
        let (genOpt, afterGen) = readNumber(bytes, afterNum);
        switch (genOpt) {
          case null { (null, afterGen) };
          case (?_) {
            var i = afterGen;
            while (i < bytes.size() and isWhitespaceByte(bytes[i])) { i += 1 };
            if (i < bytes.size() and bytes[i] == 0x52) { // 'R'
              (?num, i + 1);
            } else {
              (null, afterGen);
            };
          };
        };
      };
    };
  };

  // Convierte el nombre de un filtro a su variante.
  func filterFromName(name : Text) : StreamFilter {
    if (name == "FlateDecode" or name == "Fl") { #flate }
    else if (name == "ASCII85Decode" or name == "A85") { #ascii85 }
    else if (name == "LZWDecode" or name == "LZW") { #lzw }
    else { #unknown };
  };

  // Lee un nombre PDF (`/Name`) a partir de `start` (que apunta a `/`).
  func readName(bytes : [Nat8], start : Nat) : (Text, Nat) {
    var i = start + 1;
    let n = bytes.size();
    let nameStart = i;
    while (i < n and isRegularByte(bytes[i])) { i += 1 };
    let name = Text.fromIter(
      Array.tabulate(i - nameStart, func (k) = bytes[nameStart + k].toNat().toNat32().toChar()).values()
    );
    (name, i);
  };

  // Extrae los filtros declarados tras `/Filter`. Soporta un nombre directo,
  // un array de nombres y una referencia indirecta a un objeto que contiene
  // el nombre o el array.
  func readFilters(bytes : [Nat8], start : Nat, index : ObjectIndex) : ([StreamFilter], Nat) {
    var i = start;
    let n = bytes.size();
    while (i < n and isWhitespaceByte(bytes[i])) { i += 1 };
    if (i >= n) { return ([], i) };
    if (bytes[i] == 0x2F) {
      // Nombre directo: /FlateDecode
      let (name, next) = readName(bytes, i);
      ([filterFromName(name)], next);
    } else if (bytes[i] == 0x5B) {
      // Array: [/ASCII85Decode /FlateDecode]
      i += 1;
      let filters = List.empty<StreamFilter>();
      label arrayLoop loop {
        while (i < n and isWhitespaceByte(bytes[i])) { i += 1 };
        if (i >= n or bytes[i] == 0x5D) { break arrayLoop };
        if (bytes[i] == 0x2F) {
          let (name, next) = readName(bytes, i);
          filters.add(filterFromName(name));
          i := next;
        } else {
          // Referencia indirecta dentro del array.
          let (refOpt, next) = readIndirectRef(bytes, i);
          switch (refOpt) {
            case (?ref) {
              switch (resolveFilterObject(bytes, ref, index)) {
                case (?f) { filters.add(f) };
                case null {};
              };
              i := next;
            };
            case null { i += 1 };
          };
        };
      };
      (filters.toArray(), i);
    } else {
      // Referencia indirecta: /Filter 12 0 R
      let (refOpt, next) = readIndirectRef(bytes, i);
      switch (refOpt) {
        case (?ref) {
          switch (resolveFilterObject(bytes, ref, index)) {
            case (?f) { ([f], next) };
            case null { ([], next) };
          };
        };
        case null { ([], next) };
      };
    };
  };

  // Resuelve un objeto indirecto que contiene el nombre de un filtro.
  func resolveFilterObject(bytes : [Nat8], ref : Nat, index : ObjectIndex) : ?StreamFilter {
    switch (index.get(ref)) {
      case null { null };
      case (?range) {
        let body = slice(bytes, range.start, range.end);
        var i = 0;
        let n = body.size();
        while (i < n and isWhitespaceByte(body[i])) { i += 1 };
        if (i < n and body[i] == 0x2F) {
          let (name, _) = readName(body, i);
          ?filterFromName(name);
        } else {
          null;
        };
      };
    };
  };

  // Extrae `/Length` del diccionario. Soporta un entero directo y una
  // referencia indirecta a un objeto que contiene el entero.
  func readLength(bytes : [Nat8], start : Nat, index : ObjectIndex) : (?Nat, Nat) {
    var i = start;
    let n = bytes.size();
    while (i < n and isWhitespaceByte(bytes[i])) { i += 1 };
    if (i >= n) { return (null, i) };
    if (bytes[i] >= 0x30 and bytes[i] <= 0x39) {
      let (numOpt, next) = readNumber(bytes, i);
      switch (numOpt) {
        case (?num) {
          // Puede ser una referencia indirecta `N G R`.
          let (refOpt, afterRef) = readIndirectRef(bytes, i);
          switch (refOpt) {
            case (?ref) {
              switch (resolveLengthObject(bytes, ref, index)) {
                case (?len) { (?len, afterRef) };
                case null { (?num, next) };
              };
            };
            case null { (?num, next) };
          };
        };
        case null { (null, next) };
      };
    } else {
      (null, i);
    };
  };

  // Resuelve un objeto indirecto que contiene un entero de longitud.
  func resolveLengthObject(bytes : [Nat8], ref : Nat, index : ObjectIndex) : ?Nat {
    switch (index.get(ref)) {
      case null { null };
      case (?range) {
        let body = slice(bytes, range.start, range.end);
        let (numOpt, _) = readNumber(body, 0);
        numOpt;
      };
    };
  };

  // Analiza el diccionario que precede a `stream` para obtener los filtros y
  // la longitud declarada.
  func readStreamInfo(bytes : [Nat8], streamPos : Nat, index : ObjectIndex) : StreamInfo {
    // El diccionario está entre el `<<` más cercano y `stream`.
    let windowStart = if (streamPos > 4096) { streamPos - 4096 } else { 0 };
    let window = slice(bytes, windowStart, streamPos);
    let dictStart = switch (lastIndexOf(window, [0x3C, 0x3C])) { // "<<"
      case (?p) { p };
      case null { 0 };
    };
    let dict = slice(window, dictStart, window.size());
    let filterKeyword : [Nat8] = [0x2F, 0x46, 0x69, 0x6C, 0x74, 0x65, 0x72]; // "/Filter"
    let lengthKeyword : [Nat8] = [0x2F, 0x4C, 0x65, 0x6E, 0x67, 0x74, 0x68]; // "/Length"
    let filters = switch (indexOf(dict, filterKeyword, 0)) {
      case (?p) {
        let (fs, _) = readFilters(dict, p + filterKeyword.size(), index);
        fs;
      };
      case null { [] };
    };
    let length = switch (indexOf(dict, lengthKeyword, 0)) {
      case (?p) {
        let (len, _) = readLength(dict, p + lengthKeyword.size(), index);
        len;
      };
      case null { null };
    };
    { filters; length };
  };

  // Última aparición de `needle` en `bytes`.
  func lastIndexOf(bytes : [Nat8], needle : [Nat8]) : ?Nat {
    let n = bytes.size();
    let m = needle.size();
    if (m == 0 or m > n) { return null };
    var i = n - m;
    label search loop {
      var j = 0;
      while (j < m and bytes[i + j] == needle[j]) { j += 1 };
      if (j == m) { return ?i };
      if (i == 0) { break search };
      i -= 1;
    };
    null;
  };

  // ── Localización de streams ─────────────────────────────────────────────

  // Extrae los bytes de un stream a partir de la posición de la palabra
  // `stream`. Usa `/Length` cuando está disponible y cae a la búsqueda de
  // `endstream` como respaldo.
  func streamBytes(bytes : [Nat8], streamKeywordEnd : Nat, length : ?Nat) : ?[Nat8] {
    var start = streamKeywordEnd;
    // Salta el fin de línea que sigue a la palabra `stream`.
    if (start < bytes.size() and bytes[start] == 0x0D) { start += 1 };
    if (start < bytes.size() and bytes[start] == 0x0A) { start += 1 };
    switch (length) {
      case (?len) {
        // La longitud declarada debe caber en el archivo.
        if (start + len <= bytes.size()) {
          return ?slice(bytes, start, start + len);
        };
      };
      case null {};
    };
    // Respaldo: búsqueda literal de `endstream`.
    let endKeyword : [Nat8] = [0x65, 0x6E, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6D]; // "endstream"
    switch (indexOf(bytes, endKeyword, start)) {
      case (?endPos) {
        var stop = endPos;
        // Recorta el fin de línea previo a `endstream`.
        if (stop > start and bytes[stop - 1] == 0x0A) { stop -= 1 };
        if (stop > start and bytes[stop - 1] == 0x0D) { stop -= 1 };
        ?slice(bytes, start, stop);
      };
      case null { null };
    };
  };

  // Aplica los filtros declarados en orden. Si un filtro falla, se conserva el
  // resultado previo para no perder texto que sí era legible.
  func applyFilters(raw : [Nat8], filters : [StreamFilter]) : [Nat8] {
    var current = raw;
    for (filter in filters.values()) {
      let next : ?[Nat8] = switch (filter) {
        case (#flate) {
          switch (inflateZlib(current)) {
            case (?inflated) { ?inflated };
            case null { inflateRaw(current) };
          };
        };
        case (#ascii85) { ascii85Decode(current) };
        case (#lzw) { lzwDecode(current) };
        case (#unknown) { null };
      };
      switch (next) {
        case (?decoded) { current := decoded };
        case null {
          // Un filtro desconocido o fallido detiene la cadena: se devuelve lo
          // decodificado hasta ahora.
          return current;
        };
      };
    };
    current;
  };

  // ── API pública ─────────────────────────────────────────────────────────

  // Devuelve el texto visible del PDF, o null cuando el documento no tiene
  // capa de texto (por ejemplo un escaneo) o no es un PDF válido.
  public func extractText(bytes : Blob) : ?Text {
    let data = bytes.toArray();
    if (data.size() < 8) { return null };
    // Cabecera PDF: "%PDF-". Se toleran bytes iniciales (BOM UTF-8, espacios)
    // buscando la cabecera dentro de los primeros MAX_HEADER_SCAN bytes.
    let header : [Nat8] = [0x25, 0x50, 0x44, 0x46, 0x2D]; // "%PDF-"
    let scanEnd = if (data.size() < MAX_HEADER_SCAN) { data.size() } else { MAX_HEADER_SCAN };
    let headerPos = switch (indexOf(slice(data, 0, scanEnd), header, 0)) {
      case (?p) { p };
      case null { return null };
    };
    ignore headerPos;

    let index = buildObjectIndex(data);
    let streamKeyword : [Nat8] = [0x73, 0x74, 0x72, 0x65, 0x61, 0x6D]; // "stream"
    let out = List.empty<Char>();
    var searchFrom = 0;
    var processed = 0;

    label scan loop {
      if (processed >= MAX_STREAMS) { break scan };
      let streamPos = switch (indexOf(data, streamKeyword, searchFrom)) {
        case (?p) { p };
        case null { break scan };
      };
      // `stream` debe ser un token completo: el byte anterior no puede ser
      // parte de un identificador (evita coincidir con `endstream`).
      let previousOk = streamPos == 0 or not isRegularByte(data[streamPos - 1]);
      let afterPos = streamPos + streamKeyword.size();
      let afterOk = afterPos >= data.size() or not isRegularByte(data[afterPos]);
      if (not (previousOk and afterOk)) {
        searchFrom := streamPos + 1;
        continue scan;
      };
      processed += 1;
      let info = readStreamInfo(data, streamPos, index);
      let raw = switch (streamBytes(data, afterPos, info.length)) {
        case (?r) { r };
        case null { break scan };
      };
      searchFrom := afterPos + raw.size();
      let content = applyFilters(raw, info.filters);
      let text = extractTextFromContent(content);
      if (text.size() > 0) {
        if (out.size() > 0) { out.add('\n') };
        for (c in text.chars()) {
          if (out.size() >= MAX_TEXT_CHARS) { break scan };
          out.add(c);
        };
      };
    };

    let result = Text.fromIter(out.values());
    if (result.trim(#predicate (func (c : Char) : Bool = c == ' ' or c == '\n' or c == '\r' or c == '\t')) == "") {
      null;
    } else {
      ?result;
    };
  };
};
