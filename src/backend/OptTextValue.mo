/// Implicit instance: `?Text -> Value`. An absent option renders as the
/// empty-text sentinel so the column stays queryable (`eq ""` matches the
/// nulls) and the reported schema type never flips by row order.

import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : ?Text) : OQL.Value =
    switch self {
      case null { #text("") };
      case (?t) { #text(t) };
    };
};
