/// Implicit instance: `CommissionPeriod -> Value`. The period is a nested
/// record, not an OQL column; it renders as an empty-text sentinel so the
/// column stays queryable and the schema type never flips by row order.

import OQL "mo:caffeineai-oql";
import Types "types/commissions";

module {
  public func _toRow(_self : Types.CommissionPeriod) : OQL.Value = #text("");
};
