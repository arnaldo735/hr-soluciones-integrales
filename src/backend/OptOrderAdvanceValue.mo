/// Implicit instance: `?OrderAdvance -> Value`. An absent advance renders as
/// the empty-text sentinel so the column stays queryable and the schema type
/// never flips by row order. A present advance renders as its amount in
/// centavos (text) for a compact, filterable column.

import OQL "mo:caffeineai-oql";
import Types "types/workshop";

module {
  public func _toRow(self : ?Types.OrderAdvance) : OQL.Value =
    switch self {
      case null { #text("") };
      case (?advance) { #text(advance.amount.toText()) };
    };
};
