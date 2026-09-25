import Common "common";
import Principal "mo:core/Principal";
import BillingTypes "billing";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;
  public type TaxRate = Common.TaxRate;

  public type PosSaleLine = {
    partId : Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    discount : Money;
    amount : Money;
  };

  public type PosSale = {
    id : Id;
    saleNumber : Text;
    customerId : ?Id;
    customerName : ?Text;
    lines : [PosSaleLine];
    subtotal : Money;
    discount : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
    paymentMethod : Text;
    paymentCondition : BillingTypes.PaymentCondition;
    amountReceived : Money;
    change : Money;
    invoiceId : Id;
    soldBy : Principal;
    soldAt : Timestamp;
  };

  public type PosSaleLineInput = {
    partId : Id;
    quantity : Nat;
    discount : Money;
  };

  public type PosSaleInput = {
    customerId : ?Id;
    lines : [PosSaleLineInput];
    paymentMethod : Text;
    amountReceived : Money;
    // Condición de pago: de contado o a crédito. En crédito se exige un
    // cliente registrado y se genera la factura pendiente con su plan de
    // cuotas; `creditPlan` es obligatorio en ese caso.
    paymentCondition : BillingTypes.PaymentCondition;
    creditPlan : ?BillingTypes.CreditPlanInput;
  };

  public type PosSaleFilter = {
    search : ?Text;
    from : ?Timestamp;
    to : ?Timestamp;
  };

  public type PosSalePage = {
    items : [PosSale];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type PosError = {
    #notFound : Id;
    #emptyCart;
    #insufficientStock : { partId : Id; available : Nat; requested : Nat };
    #insufficientPayment : { total : Money; received : Money };
    #notAuthorized;
  };
};
