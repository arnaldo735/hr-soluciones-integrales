/// Implicit instance: `?InstallmentPlan -> Value`. The credit plan is not
/// exposed as an OQL column; the option renders as an empty-text sentinel so
/// the column stays queryable and the schema type never flips by row order.

import OQL "mo:caffeineai-oql";
import Types "types/billing";

module {
  public func _toRow(_self : ?Types.InstallmentPlan) : OQL.Value = #text("");
};
