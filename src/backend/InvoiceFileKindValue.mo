/// Implicit instance: `InvoiceFileKind -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/purchase-invoice-intake";

module {
  public func _toRow(self : Types.InvoiceFileKind) : OQL.Value =
    #text(switch self {
      case (#pdf) { "pdf" };
      case (#image) { "image" };
    });
};
