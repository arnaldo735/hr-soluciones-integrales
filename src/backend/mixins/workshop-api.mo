import Map "mo:core/Map";
import Types "../types/workshop";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";
import WorkshopLib "../lib/workshop";

mixin (
  orders : Map.Map<Types.Id, Types.WorkshopOrder>,
  parts : Map.Map<Types.Id, InventoryTypes.Part>,
  lots : Map.Map<Types.Id, InventoryTypes.Lot>,
  movements : Map.Map<Types.Id, InventoryTypes.Movement>,
  customers : Map.Map<Types.Id, CustomerTypes.Customer>,
  motorcycles : Map.Map<Types.Id, CustomerTypes.Motorcycle>,
  services : Map.Map<Types.Id, ServiceTypes.Service>,
  counters : {
    var nextOrderId : Nat;
    var nextOrderPartId : Nat;
    var nextLaborId : Nat;
    var nextMovementId : Nat;
    var nextOrderPhotoId : Nat;
  },
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
) {
  func workshopState() : WorkshopLib.State = { orders; parts; lots; movements; customers; motorcycles; services; counters; businessSettings; company };

  public query func listOrders(filter : Types.OrderFilter, offset : Nat, limit : Nat) : async Types.OrderPage {
    WorkshopLib.listOrders(workshopState(), filter, offset, limit);
  };

  public query func getOrder(id : Types.Id) : async ?Types.OrderView {
    WorkshopLib.getOrder(workshopState(), id);
  };

  public shared ({ caller }) func createOrder(input : Types.OrderInput) : async Types.OrderView {
    WorkshopLib.createOrder(workshopState(), input, caller);
  };

  public shared ({ caller }) func updateOrderStatus(id : Types.Id, status : Types.OrderStatus) : async Types.OrderView {
    WorkshopLib.updateOrderStatus(workshopState(), id, status, caller);
  };

  // Cancela una orden con motivo obligatorio. La orden cancelada deja de ser
  // facturable y sale de los flujos activos.
  public shared ({ caller }) func cancelOrder(id : Types.Id, reason : Text) : async Types.OrderView {
    WorkshopLib.cancelOrder(workshopState(), id, reason, caller);
  };

  // Elimina una orden de forma irreversible. La acción queda registrada en el
  // historial.
  public shared ({ caller }) func deleteOrder(id : Types.Id) : async Bool {
    WorkshopLib.deleteOrder(workshopState(), id, caller);
  };

  public shared ({ caller }) func addOrderPart(id : Types.Id, input : Types.OrderPartInput) : async Types.OrderView {
    WorkshopLib.addOrderPart(workshopState(), id, input, caller);
  };

  public shared ({ caller }) func removeOrderPart(id : Types.Id, orderPartId : Types.Id) : async Types.OrderView {
    WorkshopLib.removeOrderPart(workshopState(), id, orderPartId, caller);
  };

  public shared ({ caller }) func addLabor(id : Types.Id, input : Types.LaborInput) : async Types.OrderView {
    WorkshopLib.addLabor(workshopState(), id, input, caller);
  };

  public shared ({ caller }) func removeLabor(id : Types.Id, laborId : Types.Id) : async Types.OrderView {
    WorkshopLib.removeLabor(workshopState(), id, laborId, caller);
  };

  public shared ({ caller }) func updateLaborTechnician(id : Types.Id, laborId : Types.Id, technicianId : ?Types.Id) : async Types.OrderView {
    WorkshopLib.updateLaborTechnician(workshopState(), id, laborId, technicianId, caller);
  };

  public shared ({ caller }) func assignTechnician(id : Types.Id, technicianId : Types.Id) : async Types.OrderView {
    WorkshopLib.assignTechnician(workshopState(), id, technicianId, caller);
  };

  public shared ({ caller }) func unassignTechnician(id : Types.Id, technicianId : Types.Id) : async Types.OrderView {
    WorkshopLib.unassignTechnician(workshopState(), id, technicianId, caller);
  };

  // Carga una foto de evidencia (máximo 6 por orden). Los bytes viven en el
  // almacenamiento de archivos de la plataforma; aquí solo se guarda la
  // referencia y sus metadatos.
  public shared ({ caller }) func addOrderPhoto(id : Types.Id, input : Types.OrderPhotoInput) : async Types.OrderView {
    WorkshopLib.addOrderPhoto(workshopState(), id, input, caller);
  };

  // Elimina una foto de evidencia de la orden.
  public shared ({ caller }) func removeOrderPhoto(id : Types.Id, photoId : Types.Id) : async Types.OrderView {
    WorkshopLib.removeOrderPhoto(workshopState(), id, photoId, caller);
  };
};
