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
import CashTypes "../types/cash";
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
  counters : WorkshopLib.Counters,
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
  cashRegisters : Map.Map<Types.Id, CashTypes.CashRegister>,
  shifts : Map.Map<Types.Id, CashTypes.Shift>,
  cashMovements : Map.Map<Types.Id, CashTypes.CashMovement>,
  invoices : Map.Map<Types.Id, BillingTypes.Invoice>,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func workshopState() : WorkshopLib.State = {
    orders;
    parts;
    lots;
    movements;
    customers;
    motorcycles;
    services;
    counters;
    businessSettings;
    company;
    cashRegisters;
    shifts;
    cashMovements;
    invoices;
  };

  func requireWorkshopModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "workshop")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de órdenes de trabajo");
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

  // Fija o borra el anticipo de una orden ya creada. `amount = null` borra el
  // anticipo; con valor, `method` debe ser efectivo o transferencia. El monto
  // no puede superar el total de la orden ni registrarse sobre una orden ya
  // facturada. Ajusta el movimiento de Caja/Bancos correspondiente.
  public shared ({ caller }) func setOrderAdvance(token : ?Text, id : Types.Id, input : Types.SetOrderAdvanceInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.setOrderAdvance(workshopState(), id, input, caller);
  };

  // Edita el intervalo de km del próximo cambio de aceite de una orden ya
  // creada. El próximo cambio se deriva como `intakeMileage + oilChangeInterval`.
  public shared ({ caller }) func updateOilChangeInterval(token : ?Text, id : Types.Id, input : Types.OilChangeIntervalInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.updateOilChangeInterval(workshopState(), id, input, caller);
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

  // Registra un abono sobre una orden de taller antes de facturarla. El monto
  // debe ser mayor que cero y no puede superar el saldo pendiente. La orden no
  // admite abonos si está cancelada, entregada o ya facturada. Cada abono crea
  // un movimiento de ingreso en Caja/Bancos asociado a la OT.
  public shared ({ caller }) func addOrderPayment(token : ?Text, id : Types.Id, input : Types.OrderPaymentInput) : async Types.OrderView {
    requireWorkshopModule(caller, token);
    WorkshopLib.addOrderPayment(workshopState(), id, input, caller);
  };

  // Lista los abonos registrados sobre una orden, ordenados por id ascendente.
  public query ({ caller }) func listOrderPayments(token : ?Text, id : Types.Id) : async [Types.OrderPayment] {
    requireWorkshopModule(caller, token);
    WorkshopLib.listOrderPayments(workshopState(), id);
  };

  // Recibo de anticipo imprimible de una orden: cliente, documento, moto y
  // placa, anticipo, total, total abonado y saldo pendiente.
  public query ({ caller }) func getOrderAdvanceReceipt(token : ?Text, id : Types.Id) : async Types.OrderAdvanceReceipt {
    requireWorkshopModule(caller, token);
    WorkshopLib.buildAdvanceReceipt(workshopState(), id);
  };
};
