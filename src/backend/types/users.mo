import Common "common";
import Principal "mo:core/Principal";

module {
  public type Principal = Principal.Principal;
  public type Timestamp = Common.Timestamp;
  public type UserRole = Common.UserRole;

  public type UserProfile = {
    name : Text;
    role : UserRole;
    createdAt : Timestamp;
  };

  public type UserView = {
    principal : Principal;
    name : Text;
    role : UserRole;
    createdAt : Timestamp;
  };

  public type UsersError = {
    #notFound : Principal;
    #notAuthorized;
  };
};
