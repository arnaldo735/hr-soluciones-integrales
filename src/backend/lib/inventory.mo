import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/inventory";

module {
  public type State = {
    parts : Map.Map<Types.Id, Types.Part>;
    lots : Map.Map<Types.Id, Types.Lot>;
    movements : Map.Map<Types.Id, Types.Movement>;
    counters : {
      var nextPartId : Nat;
      var nextLotId : Nat;
      var nextMovementId : Nat;
    };
  };

  func totalStock(state : State, partId : Types.Id) : Nat {
    var total = 0;
    for (lot in state.lots.values()) {
      if (lot.partId == partId) { total += lot.quantity };
    };
    total
  };

  // Existencia por repuesto en un solo recorrido de los lotes. Evita recorrer
  // todos los lotes una vez por repuesto evaluado.
  func stockByPart(state : State) : Map.Map<Types.Id, Nat> {
    let stock = Map.empty<Types.Id, Nat>();
    for (lot in state.lots.values()) {
      let current = stock.get(lot.partId) ?? 0;
      stock.add(lot.partId, current + lot.quantity);
    };
    stock
  };

  func toView(part : Types.Part, stock : Nat, includeCost : Bool) : Types.PartView {
    {
      id = part.id;
      sku = part.sku;
      name = part.name;
      category = part.category;
      brand = part.brand;
      unit = part.unit;
      salePrice = part.salePrice;
      costPrice = if (includeCost) { part.costPrice } else { 0 };
      lowStockThreshold = part.lowStockThreshold;
      totalStock = stock;
      lowStock = stock <= part.lowStockThreshold;
      createdAt = part.createdAt;
    }
  };

  func matches(part : Types.Part, filter : Types.PartFilter, stock : Nat, needle : ?Text) : Bool {
    let searchOk = switch (needle) {
      case null { true };
      case (?n) {
        if (n == "") { true } else {
          part.name.toLower().contains(#text n) or part.sku.toLower().contains(#text n);
        };
      };
    };
    let categoryOk = switch (filter.category) {
      case null { true };
      case (?c) { part.category == c };
    };
    let brandOk = switch (filter.brand) {
      case null { true };
      case (?b) { part.brand == b };
    };
    let lowStockOk = switch (filter.lowStockOnly) {
      case null { true };
      case (?only) { if (only) { stock <= part.lowStockThreshold } else { true } };
    };
    searchOk and categoryOk and brandOk and lowStockOk
  };

  func compareViews(a : Types.PartView, b : Types.PartView, sort : Types.PartSort) : Order.Order {
    switch (sort) {
      case (#name) { Text.compare(a.name.toLower(), b.name.toLower()) };
      case (#sku) { Text.compare(a.sku.toLower(), b.sku.toLower()) };
      case (#stock) { Nat.compare(a.totalStock, b.totalStock) };
      case (#createdAt) { Int.compare(a.createdAt, b.createdAt) };
    }
  };

  public func listParts(state : State, filter : Types.PartFilter, sort : Types.PartSort, offset : Nat, limit : Nat, includeCost : Bool) : Types.PartPage {
    listPartsDir(state, filter, sort, false, offset, limit, includeCost);
  };

  // Igual que listParts pero con dirección de orden resuelta en el backend: se
  // ordena ascendente y, si descending es true, se invierte el arreglo completo
  // ANTES de cortar offset/limit, de modo que la página contiene el verdadero
  // top-N en la dirección pedida y total no cambia.
  public func listPartsDir(state : State, filter : Types.PartFilter, sort : Types.PartSort, descending : Bool, offset : Nat, limit : Nat, includeCost : Bool) : Types.PartPage {
    let stock = stockByPart(state);
    let needle = switch (filter.search) {
      case null { null };
      case (?term) { ?term.toLower() };
    };
    let matched = List.empty<Types.PartView>();
    for (part in state.parts.values()) {
      let partStock = stock.get(part.id) ?? 0;
      if (matches(part, filter, partStock, needle)) {
        matched.add(toView(part, partStock, includeCost));
      };
    };
    let ascending = matched.toArray().sort(func (a, b) = compareViews(a, b, sort));
    let sorted = if (descending) { ascending.reverse() } else { ascending };
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    {
      items = sorted.sliceToArray(start, end);
      total;
      offset;
      limit;
    }
  };

  // Valores distintos de categoría y marca del catálogo, en un solo recorrido
  // de los repuestos. Evita descargar el catálogo entero solo para los filtros.
  public func listPartFacets(state : State) : Types.PartFacets {
    let categories = Set.empty<Text>();
    let brands = Set.empty<Text>();
    for (part in state.parts.values()) {
      categories.add(part.category);
      brands.add(part.brand);
    };
    {
      categories = categories.toArray().sort(func (a, b) = Text.compare(a.toLower(), b.toLower()));
      brands = brands.toArray().sort(func (a, b) = Text.compare(a.toLower(), b.toLower()));
    };
  };

  public func getPart(state : State, id : Types.Id, includeCost : Bool) : ?Types.PartView {
    switch (state.parts.get(id)) {
      case null { null };
      case (?part) { ?toView(part, totalStock(state, part.id), includeCost) };
    };
  };

  public func createPart(state : State, input : Types.PartInput) : Types.PartView {
    for (part in state.parts.values()) {
      if (part.sku == input.sku) {
        Runtime.trap("duplicateSku: " # input.sku);
      };
    };
    let id = state.counters.nextPartId;
    state.counters.nextPartId := id + 1;
    let part : Types.Part = {
      id;
      sku = input.sku;
      name = input.name;
      category = input.category;
      brand = input.brand;
      unit = input.unit;
      salePrice = input.salePrice;
      costPrice = input.costPrice;
      lowStockThreshold = input.lowStockThreshold;
      createdAt = Time.now();
    };
    state.parts.add(id, part);
    toView(part, 0, true)
  };

  public func updatePart(state : State, id : Types.Id, input : Types.PartInput) : Types.PartView {
    let existing = state.parts.get(id) ?? Runtime.trap("notFound: part " # id.toText());
    for (part in state.parts.values()) {
      if (part.id != id and part.sku == input.sku) {
        Runtime.trap("duplicateSku: " # input.sku);
      };
    };
    let updated : Types.Part = {
      id = existing.id;
      sku = input.sku;
      name = input.name;
      category = input.category;
      brand = input.brand;
      unit = input.unit;
      salePrice = input.salePrice;
      costPrice = input.costPrice;
      lowStockThreshold = input.lowStockThreshold;
      createdAt = existing.createdAt;
    };
    state.parts.add(id, updated);
    toView(updated, totalStock(state, id), true)
  };

  public func listLots(state : State, partId : Types.Id) : [Types.Lot] {
    let out = List.empty<Types.Lot>();
    for (lot in state.lots.values()) {
      if (lot.partId == partId) { out.add(lot) };
    };
    out.toArray().sort(func (a, b) = Int.compare(a.receivedAt, b.receivedAt))
  };

  public func listMovements(state : State, partId : Types.Id) : [Types.Movement] {
    let out = List.empty<Types.Movement>();
    for (movement in state.movements.values()) {
      if (movement.partId == partId) { out.add(movement) };
    };
    out.toArray().sort(func (a, b) = Int.compare(b.at, a.at))
  };

  public func adjustStock(state : State, input : Types.AdjustmentInput, performedBy : Principal) : Types.Movement {
    let part = state.parts.get(input.partId) ?? Runtime.trap("notFound: part " # input.partId.toText());
    if (input.quantity == 0) {
      Runtime.trap("invalidQuantity");
    };
    let movementId = state.counters.nextMovementId;
    state.counters.nextMovementId := movementId + 1;
    let at = Time.now();
    let lotId : ?Types.Id = switch (input.direction) {
      case (#in_) {
        let lot = switch (input.lotId) {
          case (?lid) {
            let existing = state.lots.get(lid) ?? Runtime.trap("notFound: lot " # lid.toText());
            if (existing.partId != part.id) {
              Runtime.trap("notFound: lot " # lid.toText());
            };
            { existing with quantity = existing.quantity + input.quantity };
          };
          case null {
            let newId = state.counters.nextLotId;
            state.counters.nextLotId := newId + 1;
            {
              id = newId;
              partId = part.id;
              lotNumber = "AJ-" # newId.toText();
              quantity = input.quantity;
              unitCost = part.costPrice;
              supplierId = null;
              purchaseId = null;
              receivedAt = at;
            };
          };
        };
        state.lots.add(lot.id, lot);
        ?lot.id;
      };
      case (#out) {
        let lot = switch (input.lotId) {
          case (?lid) {
            let existing = state.lots.get(lid) ?? Runtime.trap("notFound: lot " # lid.toText());
            if (existing.partId != part.id) {
              Runtime.trap("notFound: lot " # lid.toText());
            };
            existing;
          };
          case null {
            let candidates = listLots(state, part.id);
            let available = totalStock(state, part.id);
            if (available < input.quantity) {
              Runtime.trap("insufficientStock: available " # available.toText() # ", requested " # input.quantity.toText());
            };
            candidates[0];
          };
        };
        if (lot.quantity < input.quantity) {
          Runtime.trap("insufficientStock: available " # lot.quantity.toText() # ", requested " # input.quantity.toText());
        };
        state.lots.add(lot.id, { lot with quantity = lot.quantity - input.quantity });
        ?lot.id;
      };
    };
    let movement : Types.Movement = {
      id = movementId;
      partId = part.id;
      lotId;
      kind = #adjustment;
      quantity = input.quantity;
      unitCost = null;
      reason = ?input.reason;
      referenceId = null;
      performedBy;
      at;
    };
    state.movements.add(movementId, movement);
    movement
  };

  public func lowStockParts(state : State, includeCost : Bool) : [Types.PartView] {
    let stock = stockByPart(state);
    let out = List.empty<Types.PartView>();
    for (part in state.parts.values()) {
      let partStock = stock.get(part.id) ?? 0;
      if (partStock <= part.lowStockThreshold) {
        out.add(toView(part, partStock, includeCost));
      };
    };
    out.toArray().sort(func (a, b) = Text.compare(a.name.toLower(), b.name.toLower()))
  };

  public func bulkCreateParts(state : State, inputs : [Types.PartInput]) : Types.BulkResult {
    let rows = List.empty<Types.BulkRowResult>();
    var created = 0;
    var skipped = 0;
    let failed = 0;
    var index = 0;
    for (input in inputs.values()) {
      var duplicate = false;
      for (part in state.parts.values()) {
        if (part.sku == input.sku) { duplicate := true };
      };
      if (duplicate) {
        skipped += 1;
        rows.add({ index; ok = false; id = null; error = ?("duplicateSku: " # input.sku) });
      } else {
        let id = state.counters.nextPartId;
        state.counters.nextPartId := id + 1;
        let part : Types.Part = {
          id;
          sku = input.sku;
          name = input.name;
          category = input.category;
          brand = input.brand;
          unit = input.unit;
          salePrice = input.salePrice;
          costPrice = input.costPrice;
          lowStockThreshold = input.lowStockThreshold;
          createdAt = Time.now();
        };
        state.parts.add(id, part);
        created += 1;
        rows.add({ index; ok = true; id = ?id; error = null });
      };
      index += 1;
    };
    { created; updated = 0; skipped; failed; rows = rows.toArray() };
  };

  public func bulkUpdateParts(state : State, updates : [(Types.Id, Types.PartInput)]) : Types.BulkResult {
    let rows = List.empty<Types.BulkRowResult>();
    var updated = 0;
    var skipped = 0;
    var failed = 0;
    var index = 0;
    for ((id, input) in updates.values()) {
      switch (state.parts.get(id)) {
        case null {
          failed += 1;
          rows.add({ index; ok = false; id = ?id; error = ?("notFound: part " # id.toText()) });
        };
        case (?existing) {
          var duplicate = false;
          for (part in state.parts.values()) {
            if (part.id != id and part.sku == input.sku) { duplicate := true };
          };
          if (duplicate) {
            skipped += 1;
            rows.add({ index; ok = false; id = ?id; error = ?("duplicateSku: " # input.sku) });
          } else {
            let part : Types.Part = {
              id = existing.id;
              sku = input.sku;
              name = input.name;
              category = input.category;
              brand = input.brand;
              unit = input.unit;
              salePrice = input.salePrice;
              costPrice = input.costPrice;
              lowStockThreshold = input.lowStockThreshold;
              createdAt = existing.createdAt;
            };
            state.parts.add(id, part);
            updated += 1;
            rows.add({ index; ok = true; id = ?id; error = null });
          };
        };
      };
      index += 1;
    };
    { created = 0; updated; skipped; failed; rows = rows.toArray() };
  };

  public func exportInventoryCsv(state : State) : [Types.InventoryCsvRow] {
    let out = List.empty<Types.InventoryCsvRow>();
    for (part in state.parts.values()) {
      out.add({
        sku = part.sku;
        name = part.name;
        category = part.category;
        brand = part.brand;
        unit = part.unit;
        salePrice = part.salePrice;
        costPrice = part.costPrice;
        lowStockThreshold = part.lowStockThreshold;
        quantity = totalStock(state, part.id);
      });
    };
    out.toArray().sort(func (a, b) = Text.compare(a.sku.toLower(), b.sku.toLower()))
  };

  // Fija la existencia de un repuesto al valor exacto indicado. La existencia
  // se representa con un único lote de importación por repuesto, de modo que
  // reimportar el mismo archivo deja la cantidad en el valor del archivo en
  // lugar de sumarla a la importación anterior.
  func setStock(state : State, part : Types.Part, quantity : Nat, at : Types.Timestamp) {
    var importLot : ?Types.Lot = null;
    for (lot in state.lots.values()) {
      if (lot.partId == part.id and lot.lotNumber == "IMP") {
        importLot := ?lot;
      };
    };
    switch (importLot) {
      case (?lot) {
        state.lots.add(lot.id, { lot with quantity; unitCost = part.costPrice });
      };
      case null {
        let lotId = state.counters.nextLotId;
        state.counters.nextLotId := lotId + 1;
        let lot : Types.Lot = {
          id = lotId;
          partId = part.id;
          lotNumber = "IMP";
          quantity;
          unitCost = part.costPrice;
          supplierId = null;
          purchaseId = null;
          receivedAt = at;
        };
        state.lots.add(lotId, lot);
      };
    };
  };

  public func importInventoryCsv(state : State, rows : [Types.InventoryImportRow]) : Types.InventoryImportResult {
    let results = List.empty<Types.InventoryImportRowResult>();
    var created = 0;
    var updated = 0;
    var failed = 0;
    for (row in rows.values()) {
      let sku = row.sku.trim(#predicate(func (c : Char) : Bool = c == ' '));
      let name = row.name.trim(#predicate(func (c : Char) : Bool = c == ' '));
      if (sku == "") {
        failed += 1;
        results.add({
          rowNumber = row.rowNumber;
          sku = row.sku;
          status = #error;
          id = null;
          error = ?"El SKU es obligatorio";
        });
      } else if (name == "") {
        failed += 1;
        results.add({
          rowNumber = row.rowNumber;
          sku = row.sku;
          status = #error;
          id = null;
          error = ?"El nombre es obligatorio";
        });
      } else {
        let key = sku.toLower();
        var existing : ?Types.Part = null;
        for (part in state.parts.values()) {
          if (part.sku.trim(#predicate(func (c : Char) : Bool = c == ' ')).toLower() == key) {
            existing := ?part;
          };
        };
        let at = Time.now();
        switch (existing) {
          case (?part) {
            let updatedPart : Types.Part = {
              id = part.id;
              sku;
              name;
              category = row.category;
              brand = row.brand;
              unit = row.unit;
              salePrice = row.salePrice;
              costPrice = row.costPrice;
              lowStockThreshold = row.lowStockThreshold;
              createdAt = part.createdAt;
            };
            state.parts.add(part.id, updatedPart);
            setStock(state, updatedPart, row.quantity, at);
            updated += 1;
            results.add({
              rowNumber = row.rowNumber;
              sku;
              status = #updated;
              id = ?part.id;
              error = null;
            });
          };
          case null {
            let id = state.counters.nextPartId;
            state.counters.nextPartId := id + 1;
            let part : Types.Part = {
              id;
              sku;
              name;
              category = row.category;
              brand = row.brand;
              unit = row.unit;
              salePrice = row.salePrice;
              costPrice = row.costPrice;
              lowStockThreshold = row.lowStockThreshold;
              createdAt = at;
            };
            state.parts.add(id, part);
            setStock(state, part, row.quantity, at);
            created += 1;
            results.add({
              rowNumber = row.rowNumber;
              sku;
              status = #created;
              id = ?id;
              error = null;
            });
          };
        };
      };
    };
    { created; updated; failed; rows = results.toArray() };
  };

  // Deja en cero la existencia de todos los repuestos en una sola operación.
  // La existencia de un repuesto es la suma de TODOS sus lotes (importación,
  // ajustes `AJ-<id>` y compras), así que se pone en cero cada lote del
  // repuesto, no solo el lote de importación. Registra un movimiento de ajuste
  // por cada repuesto cuya existencia cambió y devuelve cuántos repuestos
  // fueron afectados.
  public func zeroInventory(state : State, performedBy : Principal) : Types.ZeroInventoryResult {
    let at = Time.now();
    var affected = 0;
    for (part in state.parts.values()) {
      let stock = totalStock(state, part.id);
      if (stock > 0) {
        for (lot in state.lots.values()) {
          if (lot.partId == part.id and lot.quantity > 0) {
            state.lots.add(lot.id, { lot with quantity = 0 });
          };
        };
        let movementId = state.counters.nextMovementId;
        state.counters.nextMovementId := movementId + 1;
        let movement : Types.Movement = {
          id = movementId;
          partId = part.id;
          lotId = null;
          kind = #adjustment;
          quantity = stock;
          unitCost = null;
          reason = ?"Puesta en ceros del inventario";
          referenceId = null;
          performedBy;
          at;
        };
        state.movements.add(movementId, movement);
        affected += 1;
      };
    };
    { affected };
  };
};
