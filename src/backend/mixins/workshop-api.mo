import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/workshop";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";
import Common "../types/common";
import UserTypes "../types/users";
import WorkshopLib "../lib/workshop";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
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
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func workshopState() : WorkshopLib.State = { orders; parts; lots; movements; customers; motorcycles; services; counters; businessSettings; company };

  func requireWorkshopModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "workshop")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de taller");
    };
  };

  public query ({ caller }) func listOrders(token : ?Text, filter : Types.OrderFilter, offset : Nat, limit : Nat) : async Types.OrderPage {
    requireWorkshopModule(caller, token);
    WorkshopLib.listOrders(workshopState(), filter, offset, limit);
  };

  public query ({ caller }) func getOrder(token : ?Text, id : Types.Id) : async ?Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.getOrder(workshopState(), id);
  };

  public shared ({ caller }) func createOrder(token : ?Text, input : Types.OrderInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.createOrder(workshopState(), input, caller);
  };

  public shared ({ caller }) func updateOrderStatus(token : ?Text, id : Types.Id, status : Types.OrderStatus) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.updateOrderStatus(workshopState(), id, status, caller);
  };

  // Cancela una orden con motivo obligatorio. La orden cancelada deja de ser
  // facturable y sale de los flujos activos.
  public shared ({ caller }) func cancelOrder(token : ?Text, id : Types.Id, reason : Text) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.cancelOrder(workshopState(), id, reason, caller);
  };

  // Elimina una orden de forma irreversible. La acción queda registrada en el
  // historial.
  public shared ({ caller }) func deleteOrder(token : ?Text, id : Types.Id) : async Bool {
    requireWorkshopModule(caller, token);
    WorkshopLib.deleteOrder(workshopState(), id, caller);
  };

  public shared ({ caller }) func addOrderPart(token : ?Text, id : Types.Id, input : Types.OrderPartInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.addOrderPart(workshopState(), id, input, caller);
  };

  public shared ({ caller }) func removeOrderPart(token : ?Text, id : Types.Id, orderPartId : Types.Id) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.removeOrderPart(workshopState(), id, orderPartId, caller);
  };

  public shared ({ caller }) func addLabor(token : ?Text, id : Types.Id, input : Types.LaborInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.addLabor(workshopState(), id, input, caller);
  };

  public shared ({ caller }) func removeLabor(token : ?Text, id : Types.Id, laborId : Types.Id) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.removeLabor(workshopState(), id, laborId, caller);
  };

  public shared ({ caller }) func updateLaborTechnician(token : ?Text, id : Types.Id, laborId : Types.Id, technicianId : ?Types.Id) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.updateLaborTechnician(workshopState(), id, laborId, technicianId, caller);
  };

  public shared ({ caller }) func assignTechnician(token : ?Text, id : Types.Id, technicianId : Types.Id) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.assignTechnician(workshopState(), id, technicianId, caller);
  };

  public shared ({ caller }) func unassignTechnician(token : ?Text, id : Types.Id, technicianId : Types.Id) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.unassignTechnician(workshopState(), id, technicianId, caller);
  };

  // Carga una foto de evidencia (máximo 6 por orden). Los bytes viven en el
  // almacenamiento de archivos de la plataforma; aquí solo se guarda la
  // referencia y sus metadatos.
  public shared ({ caller }) func addOrderPhoto(token : ?Text, id : Types.Id, input : Types.OrderPhotoInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.addOrderPhoto(workshopState(), id, input, caller);
  };

  // Elimina una foto de evidencia de la orden.
  public shared ({ caller }) func removeOrderPhoto(token : ?Text, id : Types.Id, photoId : Types.Id) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.removeOrderPhoto(workshopState(), id, photoId, caller);
  };
};
