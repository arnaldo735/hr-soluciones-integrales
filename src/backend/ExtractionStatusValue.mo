/// Implicit instance: `ExtractionStatus -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/purchase-invoice-intake";

module {
  public func _toRow(self : Types.ExtractionStatus) : OQL.Value =
    #text(switch self {
      case (#pending) { "pending" };
      case (#extracting) { "extracting" };
      case (#extracted) { "extracted" };
      case (#failed) { "failed" };
    });
};
