import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Debug "mo:core/Debug";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Text "mo:core/Text";

import PdfText "../lib/pdf-text";

// Pruebas unitarias del extractor de texto de PDF.
//
// Fijan el contrato de `PdfText.extractText`:
//   - PDF sin comprimir con texto.
//   - PDF con FlateDecode.
//   - PDF con /Filter indirecto (`/Filter 12 0 R`).
//   - PDF con /Filter en array (`/Filter [/FlateDecode]`).
//   - PDF con ASCII85Decode.
//   - PDF con LZWDecode.
//   - PDF con BOM UTF-8 inicial.
//   - PDF sin capa de texto (devuelve null).
//
// Se ejecutan con `mops test` (modo intérprete): cada `assert` fallido aborta
// el archivo y mops lo reporta como FAIL.

// ── Utilidades de construcción de bytes ───────────────────────────────────

func bytesOf(text : Text) : [Nat8] {
  Array.fromIter(text.chars().map(func (c) = c.toNat32().toNat8()));
};

func concat(parts : [[Nat8]]) : [Nat8] {
  let out = List.empty<Nat8>();
  for (p in parts.values()) {
    for (b in p.values()) { out.add(b) };
  };
  out.toArray();
};

func blobOf(parts : [[Nat8]]) : Blob {
  Blob.fromArray(concat(parts));
};

// ── Codificadores para construir los streams de prueba ────────────────────

// Codifica ASCII85 (sin el prefijo `<~`, con terminador `~>`).
func ascii85Encode(data : [Nat8]) : [Nat8] {
  let out = List.empty<Nat8>();
  var i = 0;
  let n = data.size();
  while (i < n) {
    let remaining = n - i;
    let take = if (remaining >= 4) { 4 } else { remaining };
    var value = 0;
    var k = 0;
    while (k < 4) {
      let b = if (k < take) { data[i + k].toNat() } else { 0 };
      value := value * 256 + b;
      k += 1;
    };
    i += take;
    if (take == 4 and value == 0) {
      out.add(0x7A : Nat8); // 'z'
    } else {
      let digits = List.empty<Nat8>();
      var v = value;
      var d = 5;
      while (d > 0) {
        d -= 1;
        digits.add((v % 85 + 0x21).toNat8());
        v := v / 85;
      };
      let count = if (take == 4) { 5 } else { take + 1 };
      var j = count;
      while (j > 0) {
        j -= 1;
        out.add(digits.at(j));
      };
    };
  };
  for (b in bytesOf("~>").values()) { out.add(b) };
  out.toArray();
};

// Codifica LZW con EarlyChange = 1 (el modo de PDF).
func lzwEncode(data : [Nat8]) : [Nat8] {
  // Diccionario: clave = prefijo (código) * 256 + byte, valor = código.
  let dict = Map.empty<Nat, Nat>();
  var nextCode = 258;
  var codeSize = 9;
  let bits = List.empty<Bool>();

  func emitCode(code : Nat) {
    var i = 0;
    while (i < codeSize) {
      bits.add((code / pow2(i)) % 2 == 1);
      i += 1;
    };
  };

  // Emite el código de clear al inicio.
  emitCode(256);

  var current : ?Nat = null;
  for (b in data.values()) {
    let byte = b.toNat();
    switch (current) {
      case null { current := ?byte };
      case (?prefix) {
        let key = prefix * 256 + byte;
        switch (dict.get(key)) {
          case (?code) { current := ?code };
          case null {
            emitCode(prefix);
            if (nextCode < 4096) {
              dict.add(key, nextCode);
              nextCode += 1;
              if (nextCode + 1 >= 512 and codeSize == 9) { codeSize := 10 }
              else if (nextCode + 1 >= 1024 and codeSize == 10) { codeSize := 11 }
              else if (nextCode + 1 >= 2048 and codeSize == 11) { codeSize := 12 };
            };
            current := ?byte;
          };
        };
      };
    };
  };
  switch (current) {
    case (?code) { emitCode(code) };
    case null {};
  };
  emitCode(257); // EOD

  // Empaqueta los bits en bytes (LSB primero).
  let bitArray = bits.toArray();
  let byteCount = (bitArray.size() + 7) / 8;
  Array.tabulate<Nat8>(byteCount, func (i) {
    var value = 0;
    var k = 0;
    while (k < 8) {
      let index = i * 8 + k;
      if (index < bitArray.size() and bitArray[index]) {
        value += pow2(k);
      };
      k += 1;
    };
    value.toNat8();
  });
};

func pow2(n : Nat) : Nat {
  var result = 1;
  var i = 0;
  while (i < n) { result *= 2; i += 1 };
  result;
};

// ── Documentos PDF de prueba ──────────────────────────────────────────────

// PDF mínimo sin comprimir con una línea de texto.
func pdfUncompressed() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (Factura Electronica 123) Tj ET");
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Type /Catalog >>\nendobj\n"),
    bytesOf("2 0 obj\n<< /Length "),
    bytesOf(content.size().toText()),
    bytesOf(" >>\nstream\n"),
    content,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF con FlateDecode directo. El stream se comprime con deflate almacenado
// (bloques sin comprimir), que el inflate del extractor soporta.
func pdfFlate() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (Proveedor Ferreteria SAS) Tj ET");
  let compressed = zlibStored(content);
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Filter /FlateDecode /Length "),
    bytesOf(compressed.size().toText()),
    bytesOf(" >>\nstream\n"),
    compressed,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF con /Filter indirecto: el diccionario apunta a `12 0 R`, y el objeto 12
// contiene el nombre del filtro.
func pdfIndirectFilter() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (NIT 900123456-7) Tj ET");
  let compressed = zlibStored(content);
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Filter 12 0 R /Length "),
    bytesOf(compressed.size().toText()),
    bytesOf(" >>\nstream\n"),
    compressed,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("12 0 obj\n/FlateDecode\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF con /Filter en array: `[/FlateDecode]`.
func pdfArrayFilter() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (Total 125000) Tj ET");
  let compressed = zlibStored(content);
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Filter [/FlateDecode] /Length "),
    bytesOf(compressed.size().toText()),
    bytesOf(" >>\nstream\n"),
    compressed,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF con ASCII85Decode.
func pdfAscii85() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (Fecha 2026-09-23) Tj ET");
  let encoded = ascii85Encode(content);
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Filter /ASCII85Decode /Length "),
    bytesOf(encoded.size().toText()),
    bytesOf(" >>\nstream\n"),
    encoded,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF con LZWDecode.
func pdfLzw() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (Item Tornillo 3/8) Tj ET");
  let encoded = lzwEncode(content);
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Filter /LZWDecode /Length "),
    bytesOf(encoded.size().toText()),
    bytesOf(" >>\nstream\n"),
    encoded,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF con BOM UTF-8 antes de la cabecera.
func pdfWithBom() : Blob {
  let content = bytesOf("BT /F1 12 Tf 72 720 Td (Con BOM inicial) Tj ET");
  blobOf([
    [0xEF, 0xBB, 0xBF],
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Length "),
    bytesOf(content.size().toText()),
    bytesOf(" >>\nstream\n"),
    content,
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// PDF sin capa de texto: solo un stream de imagen binaria.
func pdfWithoutText() : Blob {
  blobOf([
    bytesOf("%PDF-1.4\n"),
    bytesOf("1 0 obj\n<< /Length 8 >>\nstream\n"),
    [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07],
    bytesOf("\nendstream\nendobj\n"),
    bytesOf("%%EOF\n"),
  ]);
};

// Comprime con zlib usando bloques deflate almacenados (sin compresión), que
// el inflate del extractor decodifica sin depender de Huffman.
func zlibStored(data : [Nat8]) : [Nat8] {
  let out = List.empty<Nat8>();
  // Cabecera zlib: CMF=0x78, FLG=0x01 (sin diccionario, check válido).
  out.add(0x78 : Nat8);
  out.add(0x01 : Nat8);
  var offset = 0;
  let n = data.size();
  loop {
    let remaining = n - offset;
    let take = if (remaining > 65535) { 65535 } else { remaining };
    let final = offset + take >= n;
    out.add(if (final) { 0x01 : Nat8 } else { 0x00 : Nat8 });
    out.add((take % 256).toNat8());
    out.add((take / 256).toNat8());
    out.add(((65535 - take) % 256).toNat8());
    out.add(((65535 - take) / 256).toNat8());
    var i = 0;
    while (i < take) {
      out.add(data[offset + i]);
      i += 1;
    };
    offset += take;
    if (final) { break };
  };
  // Adler-32.
  var a = 1;
  var b = 0;
  for (byte in data.values()) {
    a := (a + byte.toNat()) % 65521;
    b := (b + a) % 65521;
  };
  let adler = b * 65536 + a;
  out.add(((adler / 16777216) % 256).toNat8());
  out.add(((adler / 65536) % 256).toNat8());
  out.add(((adler / 256) % 256).toNat8());
  out.add((adler % 256).toNat8());
  out.toArray();
};

// ── Aserciones ────────────────────────────────────────────────────────────

func contains(haystack : Text, needle : Text) : Bool {
  haystack.contains(#text needle);
};

func expectText(blob : Blob, needle : Text, caseName : Text) {
  switch (PdfText.extractText(blob)) {
    case (?text) {
      assert contains(text, needle);
    };
    case null {
      Debug.print("FALLO: " # caseName # " devolvió null");
      assert false;
    };
  };
};

// ── Casos ─────────────────────────────────────────────────────────────────

// 1. PDF sin comprimir con texto.
expectText(pdfUncompressed(), "Factura Electronica 123", "pdf sin comprimir");

// 2. PDF con FlateDecode.
expectText(pdfFlate(), "Proveedor Ferreteria SAS", "pdf con FlateDecode");

// 3. PDF con /Filter indirecto.
expectText(pdfIndirectFilter(), "NIT 900123456-7", "pdf con /Filter indirecto");

// 4. PDF con /Filter en array.
expectText(pdfArrayFilter(), "Total 125000", "pdf con /Filter en array");

// 5. PDF con ASCII85Decode.
expectText(pdfAscii85(), "Fecha 2026-09-23", "pdf con ASCII85Decode");

// 6. PDF con LZWDecode.
expectText(pdfLzw(), "Item Tornillo 3/8", "pdf con LZWDecode");

// 7. PDF con BOM UTF-8 inicial.
expectText(pdfWithBom(), "Con BOM inicial", "pdf con BOM inicial");

// 8. PDF sin capa de texto: devuelve null.
switch (PdfText.extractText(pdfWithoutText())) {
  case null {};
  case (?text) {
    Debug.print("FALLO: pdf sin capa de texto devolvió: " # text);
    assert false;
  };
};

// 9. Un blob que no es PDF devuelve null.
switch (PdfText.extractText(Blob.fromArray(bytesOf("no soy un pdf")))) {
  case null {};
  case (?_) { assert false };
};

Debug.print("pdf-text: todas las pruebas pasaron");
