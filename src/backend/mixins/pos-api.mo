import Map "mo:core/Map";

import Common "../types/common";
import Types "../types/pos";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import PosLib "../lib/pos";

mixin (
  posSales : Map.Map<Common.Id, Types.PosSale>,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  movements : Map.Map<Common.Id, InventoryTypes.Movement>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
  counters : PosLib.Counters,
) {
  func posState() : PosLib.State = { posSales; parts; lots; movements; customers; invoices; businessSettings; company; counters };

  public query func listPosSales(filter : Types.PosSaleFilter, offset : Nat, limit : Nat) : async Types.PosSalePage {
    PosLib.listPosSales(posState(), filter, offset, limit);
  };

  public query func getPosSale(id : Types.Id) : async ?Types.PosSale {
    PosLib.getPosSale(posState(), id);
  };

  // Registra una venta de mostrador. De contado cobra en el acto; a crédito
  // exige un cliente registrado y genera su factura pendiente con el plan de
  // cuotas.
  public shared ({ caller }) func createPosSale(input : Types.PosSaleInput) : async Types.PosSale {
    PosLib.createPosSale(posState(), input, caller);
  };
};
