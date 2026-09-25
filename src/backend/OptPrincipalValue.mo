/// Implicit instance: `?Principal -> Value`. An absent option renders as the
/// empty-text sentinel so the column stays queryable (`eq ""` matches the
/// nulls) and the reported schema type never flips by row order.

import OQL "mo:caffeineai-oql";
import Principal "mo:core/Principal";

module {
  public func _toRow(self : ?Principal) : OQL.Value =
    switch self {
      case null { #text("") };
      case (?p) { #text(p.toText()) };
    };
};
