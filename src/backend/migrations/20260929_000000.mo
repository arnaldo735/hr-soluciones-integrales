import Map "mo:core/Map";

module {
  type Id = Nat;
  type Timestamp = Int;

  // ── Tipos nuevos (inlined; las migraciones no importan módulos del proyecto) ──

  type ModuleKey = Text;
  type RoleKind = { #builtin; #custom };

  type Role = {
    id : Id;
    name : Text;
    kind : RoleKind;
    modules : [ModuleKey];
    createdAt : Timestamp;
  };

  type Credential = {
    id : Id;
    username : Text;
    name : Text;
    roleId : Id;
    active : Bool;
    salt : Blob;
    passwordHash : Blob;
    iterations : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Session = {
    token : Text;
    credentialId : Id;
    createdAt : Timestamp;
    expiresAt : Timestamp;
  };

  // ── Estado nuevo ────────────────────────────────────────────────────────
  // Solo se declaran los campos nuevos: los campos no listados (todo el
  // estado existente, incluido `userProfiles`) se heredan automáticamente.
  type NewActor = {
    credentials : Map.Map<Id, Credential>;
    sessions : Map.Map<Text, Session>;
    roles : Map.Map<Id, Role>;
    userCounters : {
      var nextUserId : Nat;
      var nextRoleId : Nat;
    };
  };

  // Roles integrados: Administrador, Mecánico e Invitado.
  let builtinRoles : [Role] = [
    {
      id = 0;
      name = "Administrador";
      kind = #builtin;
      modules = [
        "dashboard",
        "inventory",
        "customers",
        "motorcycles",
        "workshop",
        "quotes",
        "services",
        "serviceCategories",
        "technicians",
        "commissions",
        "appointments",
        "suppliers",
        "purchases",
        "payables",
        "supplierOrders",
        "purchaseInvoices",
        "expenses",
        "expenseCategories",
        "accounting",
        "pos",
        "billing",
        "receivables",
        "company",
        "users",
        "roles",
        "settings",
      ];
      createdAt = 0;
    },
    {
      id = 1;
      name = "Mecánico";
      kind = #builtin;
      modules = [
        "dashboard",
        "inventory",
        "customers",
        "motorcycles",
        "workshop",
        "quotes",
        "services",
        "technicians",
        "appointments",
        "expenses",
        "pos",
      ];
      createdAt = 0;
    },
    {
      id = 2;
      name = "Invitado";
      kind = #builtin;
      modules = [];
      createdAt = 0;
    },
  ];

  public func migration(_old : {}) : NewActor {
    let roles = Map.empty<Id, Role>();
    for (role in builtinRoles.values()) {
      roles.add(role.id, role);
    };
    {
      credentials = Map.empty();
      sessions = Map.empty();
      roles;
      userCounters = { var nextUserId = 0; var nextRoleId = 3 };
    };
  };
};
