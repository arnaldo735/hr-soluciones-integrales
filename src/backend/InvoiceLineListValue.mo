/// Implicit instance: `[InvoiceLine] -> Value`. Collection fields are not
/// exposed as OQL columns; the list renders as an empty-text sentinel so the
/// column stays queryable and the schema type never flips by row order.

import OQL "mo:caffeineai-oql";
import Types "types/billing";

module {
  public func _toRow(_self : [Types.InvoiceLine]) : OQL.Value = #text("");
};
