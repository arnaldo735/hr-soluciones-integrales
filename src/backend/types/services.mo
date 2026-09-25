import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  public type Service = {
    id : Id;
    code : Text;
    name : Text;
    description : Text;
    category : Text;
    laborRate : Money;
    estimatedMinutes : Nat;
    active : Bool;
    createdAt : Timestamp;
  };

  public type ServiceInput = {
    code : Text;
    name : Text;
    description : Text;
    category : Text;
    laborRate : Money;
    estimatedMinutes : Nat;
    active : Bool;
  };

  public type ServiceFilter = {
    search : ?Text;
    category : ?Text;
    activeOnly : ?Bool;
  };

  public type ServiceSort = { #name; #code; #category; #laborRate };

  public type ServicePage = {
    items : [Service];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type ServiceError = {
    #notFound : Id;
    #duplicateCode : Text;
    #notAuthorized;
  };

  // Resultado de poner el catálogo de servicios de taller en cero.
  // `deleted` es la cantidad de servicios eliminados.
  public type ZeroServicesResult = {
    deleted : Nat;
  };
};
