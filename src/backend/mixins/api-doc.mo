/// Static behavioral API documentation for the workshop & parts store
/// backend. The document is a compile-time literal — it reads no actor
/// state — so the mixin takes no parameters and declares nothing else.

mixin () {
  public query func getApiDoc() : async Text {
    let doc : Text = "# API — Taller y Almacén de Repuestos de Motos

Backend Motoko para la gestión de un taller de motos y su almacén de
repuestos: inventario por lote/serie, clientes y motos, órdenes de taller,
cotizaciones, catálogo de servicios, técnicos, citas, proveedores y compras
con cuentas por pagar, gastos, contabilidad, punto de venta (POS),
facturación con datos fiscales y **respaldo manual en Google Drive**, además
de la **copia de seguridad local** descargable en el equipo del usuario.

Todos los importes (`Money`) son `Nat` en **centavos/unidad mínima entera**;
no hay decimales. Los `Timestamp` son `Int` en **nanosegundos** desde la época
Unix (`Time.now()`). Los identificadores (`Id`) son `Nat` y empiezan en `0`.
Los porcentajes de impuesto (`TaxRate`) son enteros en puntos porcentuales
(por ejemplo `16` = 16 %). Los porcentajes de margen (`BasisPoints`) son
enteros en **puntos base** (por ejemplo `2500` = 25 %); el frontend los
formatea dividiendo entre `100`.

## Autenticación e identidad

Los métodos de escritura y los métodos de lectura administrativos exigen un
llamador **firmado (no anónimo)**. El frontend fija un *derivation origin* de
Internet Identity, publicado en `/.well-known/ii-derivation-origin` cuando
está disponible; un agente que ya tiene la autorización de Internet Identity
del usuario deriva el principal correcto por aplicación contra ese origen
(por ejemplo `icp identity link web <nombre> --app <host>`). Esa delegación
actúa con la autoridad completa del usuario en esta aplicación hasta que
expira.

### Registro previo (obligatorio)

La autorización se resuelve contra un registro de roles. Un llamador directo
por API debe registrarse **una sola vez** llamando a
`_initialize_access_control()` como llamador firmado, antes de cualquier
llamada protegida (incluidas las consultas protegidas). El **primer**
llamador registrado recibe el rol `#admin`; los siguientes reciben `#user`.
Un llamador anónimo no se registra (la llamada no hace nada).

Un llamador no registrado que invoque un endpoint protegido recibe un trap
con el mensaje `User is not registered` (producido por
`AccessControl.getUserRole`). Un llamador anónimo recibe el rol `#guest`, que
no es administrador, por lo que los endpoints de administrador fallan con
`Unauthorized: Only admins can perform this action` (o el mensaje específico
del dominio indicado más abajo).

Un llamador puede estar sin registrar aunque la aplicación ya lo conozca:
el registro ocurre solo cuando el llamador inicia sesión a través del
frontend de la aplicación. Un principal que nunca lo hizo está sin registrar
aunque pertenezca al propietario de la aplicación, y un llamador firmado
derivado contra un origen distinto es un principal diferente del que el
frontend registró.

### Roles

- `#admin` — acceso completo: inventario, clientes, taller, cotizaciones,
  servicios, técnicos, citas, proveedores, compras, cuentas por pagar,
  gastos, contabilidad, POS, facturación, configuración fiscal y de empresa,
  usuarios y panel de resumen.
- `#user` (mecánico) — acceso limitado: puede crear y gestionar órdenes de
  taller y descontar repuestos, gestionar cotizaciones, servicios, técnicos,
  citas, gastos y el POS, y consultar el catálogo. **No** puede ver precios
  de costo, ni gestionar proveedores/compras/pagos, ni facturar, ni ver
  contabilidad, configuración de empresa o el panel de resumen.
- `#guest` — llamador anónimo; sin acceso a endpoints protegidos.

### Visibilidad del precio de costo

`listParts`, `getPart` y `lowStockParts` devuelven `costPrice` **solo** si el
llamador es administrador; para el resto devuelve `0`. El resto de campos
no cambia.

## Métodos públicos

### Inventario de repuestos

- `listParts(filter : PartFilter, sort : PartSort, offset : Nat, limit : Nat) : PartPage`
  — consulta. **Listado paginado de inventario, resuelto en el backend**:
  filtros, ordenamiento y paginación se aplican en el canister y la respuesta
  trae solo la página pedida, sin cargar el catálogo entero. `filter.search`
  busca en nombre y SKU (sin distinguir mayúsculas); `filter.category` y
  `filter.brand` son igualdad exacta; `filter.lowStockOnly = ?true` limita a
  repuestos con stock total menor o igual al umbral. `sort` es
  `#name | #sku | #stock | #createdAt`. `PartPage` devuelve `items`, `total`
  (coincidencias antes de paginar), `offset` y `limit`. Es la vía recomendada
  para listados grandes.
- `getPart(id : Id) : ?PartView` — consulta. `null` si no existe.
- `listPartFacets() : PartFacets` — consulta. Devuelve únicamente los valores
  **distintos** de categoría y marca del catálogo (`categories` y `brands`,
  cada uno ordenado alfabéticamente sin distinguir mayúsculas), para poblar los
  filtros sin descargar el catálogo entero. No incluye repuestos ni precios.
- `createPart(input : PartInput) : PartView` — actualización. Falla con
  `duplicateSku: <sku>` si el SKU ya existe.
- `updatePart(id : Id, input : PartInput) : PartView` — actualización. Falla
  con `notFound: part <id>` o `duplicateSku: <sku>`.
- `listLots(partId : Id) : [Lot]` — consulta. Lotes del repuesto, ordenados
  por `receivedAt` ascendente.
- `listMovements(partId : Id) : [Movement]` — consulta. Movimientos del
  repuesto, ordenados por `at` descendente (más reciente primero).
- `adjustStock(input : AdjustmentInput) : Movement` — actualización. Ajusta
  stock en la dirección `#in_` o `#out`. Si `lotId` es `null` y la dirección
  es `#in_`, crea un lote nuevo con número `AJ-<id>`. Falla con
  `invalidQuantity` si la cantidad es `0`, `notFound: part <id>` /
  `notFound: lot <id>`, o `insufficientStock: available <n>, requested <m>`.
- `lowStockParts() : [PartView]` — consulta. Repuestos con stock total menor
  o igual al umbral, ordenados por nombre.
- `bulkCreateParts(inputs : [PartInput]) : BulkResult` — actualización.
  Importación masiva (CSV). Las filas con SKU duplicado se omiten; el
  resultado detalla `created`, `updated`, `skipped`, `failed` y el detalle
  por fila (`rows`).
- `bulkUpdateParts(updates : [(Id, PartInput)]) : BulkResult` —
  actualización. Actualización masiva; las filas inexistentes o con SKU
  duplicado se omiten.
- `exportInventoryCsv() : [InventoryCsvRow]` — consulta. Devuelve todas las
  filas del inventario con las columnas de exportación (SKU, nombre,
  categoría, marca, unidad, precio de venta, precio de costo, umbral de
  stock bajo y existencia actual) para que el frontend genere el archivo CSV
  real. `quantity` es la existencia total del repuesto (suma de sus lotes).
- `importInventoryCsv(rows : [InventoryImportRow]) : InventoryImportResult`
  — actualización. Importa filas ya parseadas del CSV. Crea repuestos nuevos
  y actualiza los existentes **por SKU** sin duplicar. Cada fila incluye
  `quantity` (la columna `existencia` del archivo): la existencia del
  repuesto queda **fijada al valor del archivo**, no se suma a la anterior,
  de modo que reimportar el mismo archivo no duplica stock. Devuelve el
  resumen con `created`, `updated`, `failed` y el detalle por fila
  (`InventoryImportRowResult`), donde cada fila con error incluye el motivo
  en `error` para poder corregir y reintentar.
- `zeroInventory() : ZeroInventoryResult` — actualización. **Solo
  administradores**; en caso contrario falla con
  `Unauthorized: Only admins can perform this action`. Deja en cero la
  existencia de **todos** los repuestos: pone en cero cada lote del repuesto
  (lotes de importación `IMP`, lotes de ajuste `AJ-<id>` y lotes de compra),
  de modo que la existencia total (suma de sus lotes) queda exactamente en
  `0`. Registra **un** movimiento de ajuste por cada repuesto cuya existencia
  cambió, con `quantity` igual a la existencia que tenía antes de la puesta
  en ceros y `reason = 'Puesta en ceros del inventario'`; los repuestos que ya
  estaban en cero no generan movimiento. Devuelve `affected`, el número de
  repuestos cuya existencia realmente cambió. La operación es **destructiva**
  y **no es idempotente en el conteo**: una segunda llamada devuelve
  `affected = 0` y no registra movimientos, pero la primera no se puede
  deshacer (no hay restauración de existencias).

### Clientes y motos

- `listCustomersPage(filter : CustomerFilter, sort : CustomerSort, offset : Nat, limit : Nat) : CustomerPage`
  — consulta. **Listado paginado de clientes, resuelto en el backend**: una
  sola llamada devuelve la página de clientes con su conteo de motos ya
  incluido (`CustomerListItem.motorcycleCount`), sin una llamada por fila.
  `filter.search` busca en nombre, teléfono, documento y placa de alguna moto
  del cliente (sin distinguir mayúsculas); `filter.hasMotorcycles = ?true`
  limita a clientes con al menos una moto y `?false` a los que no tienen
  ninguna. `sort` es `#name | #createdAt | #motorcycleCount`. `CustomerPage`
  devuelve `items`, `total` (coincidencias antes de paginar), `offset` y
  `limit`. Es la vía recomendada para listados grandes; `listCustomers` se
  mantiene por compatibilidad.
- `listMotorcyclesPage(filter : MotorcycleFilter, sort : MotorcycleSort, offset : Nat, limit : Nat) : MotorcyclePage`
  — consulta. **Listado paginado de motocicletas, resuelto en el backend**:
  cada fila (`MotorcycleListItem`) ya incluye el nombre y el teléfono del
  cliente (`customerName`, `customerPhone`), sin una llamada por fila.
  `filter.search` busca en placa, marca, modelo y nombre del cliente (sin
  distinguir mayúsculas); `filter.brand` es igualdad exacta. `sort` es
  `#plate | #brand | #year | #customerName`. `MotorcyclePage` devuelve
  `items`, `total`, `offset` y `limit`. Es la vía recomendada para listados
  grandes; `listMotorcycles` se mantiene por compatibilidad.
- `exportCustomersAggregated() : [CustomerExportRow]` — consulta. Devuelve
  **todos** los clientes con sus motos anidadas (`customer` y `motorcycles`)
  en **una sola llamada**, para exportar sin recorrer cliente por cliente.
  Cada fila trae el cliente completo y el arreglo de sus motos; un cliente sin
  motos aparece con `motorcycles = []`. No pagina: es una exportación completa
  y su costo crece con el número de clientes, así que úsala solo para exportar.
- `listCustomers(search : ?Text) : [Customer]` — consulta. **Compatibilidad**:
  devuelve todos los clientes que coinciden, sin paginar. `search` filtra por
  nombre, teléfono o placa de alguna moto del cliente (sin distinguir
  mayúsculas); `null` o cadena vacía devuelve todos. Ordenado por nombre. Para
  listados grandes usa `listCustomersPage`.
- `getCustomer(id : Id) : ?Customer` — consulta.
- `getCustomerDetail(id : Id) : ?CustomerDetail` — consulta. Incluye el
  cliente, sus motos y un resumen de sus órdenes. Es la vía para cargar el
  detalle individual **solo cuando el usuario abre un registro**.
- `createCustomer(input : CustomerInput) : Customer` — actualización.
- `updateCustomer(id : Id, input : CustomerInput) : Customer` —
  actualización. Falla con `Cliente no encontrado`.
- `listMotorcycles(customerId : Id) : [Motorcycle]` — consulta.
  **Compatibilidad**: motos de un cliente, sin paginar. Para listados grandes
  usa `listMotorcyclesPage`.
- `listMotorcycleCountsByCustomers(ids : [Id]) : [(Id, Nat)]` — consulta.
  Devuelve, en **una sola llamada**, el conteo de motos por cliente para el
  conjunto de ids indicado, en un solo recorrido de las motos (no un escaneo
  por cliente). El resultado conserva el orden de `ids` y cada id ausente o sin
  motos aparece con conteo `0`.
- `createMotorcycle(input : MotorcycleInput) : Motorcycle` — actualización.
  Falla con `Cliente no encontrado` si el cliente no existe.
- `updateMotorcycle(id : Id, input : MotorcycleInput) : Motorcycle` —
  actualización. Falla con `Moto no encontrada` / `Cliente no encontrado`.
- `bulkCreateCustomers(inputs : [CustomerInput]) : BulkResult` —
  actualización. Importación masiva (CSV) de clientes.
- `bulkUpdateCustomers(updates : [(Id, CustomerInput)]) : BulkResult` —
  actualización. Actualización masiva de clientes.

### Órdenes de taller

- `listOrders(filter : OrderFilter, offset : Nat, limit : Nat) : OrderPage`
  — consulta. `filter.status` filtra por estado; `filter.search` busca en
  número de orden, nombre del cliente, placa, marca y modelo de la moto.
  Ordenado por id descendente.
- `getOrder(id : Id) : ?OrderView` — consulta. Incluye los totales
  calculados (`OrderTotals`).
- `createOrder(input : OrderInput) : OrderView` — actualización. Crea la
  orden en estado `#received` con número `OT-<6 dígitos>`.
- `updateOrderStatus(id : Id, status : OrderStatus) : OrderView` —
  actualización. **Solo se permiten las transiciones**
  `#received → #inRepair → #ready → #delivered`. Cualquier otra falla con
  `Transición de estado inválida: <from> -> <to>`. Una orden `#cancelled` es
  terminal y no admite más transiciones.
- `cancelOrder(id : Id, reason : Text) : OrderView` — actualización. Cancela
  la orden con **motivo obligatorio** (no vacío); en caso contrario falla con
  `El motivo de cancelación es obligatorio`. La orden pasa a `#cancelled`,
  guarda `cancelReason` y `cancelledAt`, y añade la transición al historial.
  Una orden ya cancelada falla con `La orden ya está cancelada`; una orden
  entregada falla con `Una orden entregada no se puede cancelar`. La orden
  cancelada deja de ser facturable y sale de los flujos activos.
- `deleteOrder(id : Id) : Bool` — actualización. Elimina la orden de forma
  **irreversible**; devuelve `false` si no existía. No hay confirmación en el
  backend: el frontend debe pedirla explícitamente.
- `addOrderPart(id : Id, input : OrderPartInput) : OrderView` —
  actualización. Añade una línea de repuesto y **no descuenta stock ni
  registra movimiento de salida**: la línea solo conserva el costo unitario de
  referencia (`unitCost`, el costo del lote indicado o el precio de costo del
  repuesto) para el cálculo del margen. Falla con `Repuesto no encontrado` si
  el repuesto no existe.
- `removeOrderPart(id : Id, orderPartId : Id) : OrderView` — actualización.
  Quita la línea y **no devuelve stock** (agregarla nunca lo descontó). Falla
  con `Línea de repuesto no encontrada` si la línea no existe.
- `addOrderPhoto(id : Id, input : OrderPhotoInput) : OrderView` —
  actualización. Registra una foto de evidencia del proceso (máximo **6** por
  orden). Los bytes viven en el almacenamiento de archivos de la plataforma;
  el backend solo guarda la referencia (`blob`) y sus metadatos (`filename`,
  `mimeType`, `uploadedBy`, `uploadedAt`). Al llegar a 6 fotos falla con
  `La orden ya tiene el máximo de 6 fotos`.
- `removeOrderPhoto(id : Id, photoId : Id) : OrderView` — actualización.
  Elimina una foto de evidencia. Falla con `Foto no encontrada` si no existe.
- `addLabor(id : Id, input : LaborInput) : OrderView` — actualización. Añade
  una línea de mano de obra; `input.technicianId` asigna el técnico
  responsable de esa línea (opcional) y es la base del cálculo de comisiones.
  `input.serviceId` vincula la línea con un servicio del catálogo (opcional);
  si se indica, el servicio debe existir o la llamada falla con
  `Servicio no encontrado`. Un servicio inactivo sigue siendo referenciable.
  `input.description` y `input.price` son libres: el frontend los
  autocompleta desde el servicio elegido, pero el precio queda editable. La
  línea libre (sin servicio) se envía con `serviceId = null`.
- `updateLaborTechnician(id : Id, laborId : Id, technicianId : ?Id) : OrderView`
  — actualización. Cambia o quita (`null`) el técnico responsable de una línea
  de mano de obra existente. Falla con `Línea de mano de obra no encontrada`
  si la línea no existe.
- `removeLabor(id : Id, laborId : Id) : OrderView` — actualización.
- `assignTechnician(id : Id, technicianId : Id) : OrderView` —
  actualización. Añade el técnico a la orden; si ya estaba asignado devuelve
  la orden sin cambios (idempotente en efecto).
- `unassignTechnician(id : Id, technicianId : Id) : OrderView` —
  actualización. Quita el técnico de la orden; si no estaba, no cambia nada.

### Cotizaciones

- `listQuotes(filter : QuoteFilter, sort : QuoteSort, offset : Nat, limit : Nat) : QuotePage`
  — consulta. `filter.status` filtra por estado; `filter.search` busca en
  número de cotización y nombre del cliente. `sort` es
  `#number | #customer | #createdAt | #total`. Cada elemento incluye los
  totales calculados (`QuoteTotals`).
- `getQuote(id : Id) : ?QuoteView` — consulta. `null` si no existe.
- `createQuote(input : QuoteInput) : QuoteView` — actualización. Crea la
  cotización en estado `#draft` con número `COT-<6 dígitos>`. Falla con
  `Cliente no encontrado` / `Moto no encontrada`. El `taxRate` guardado se
  siembra con la **tasa efectiva vigente** según el régimen fiscal de la
  empresa (ver «IVA y régimen fiscal»).
- `updateQuote(id : Id, input : QuoteInput) : QuoteView` — actualización.
  Reemplaza las líneas y recalcula. Falla con `Cotización no encontrada` /
  `Cliente no encontrado` / `Moto no encontrada`.
- `deleteQuote(id : Id) : Bool` — actualización. `false` si no existía.
- `updateQuoteStatus(id : Id, status : QuoteStatus) : QuoteView` —
  actualización. **Solo se permiten las transiciones**
  `#draft → #sent | #accepted | #rejected | #expired` y
  `#sent → #accepted | #rejected | #expired`. Cualquier otra falla con
  `Transición de estado inválida: <from> -> <to>`.
- `convertQuoteToOrder(id : Id) : OrderView` — actualización. Solo una
  cotización `#accepted`; en otro caso falla con
  `Solo se puede convertir una cotización aceptada`. Crea una orden en
  `#received` con las líneas de repuestos y de servicios (como mano de obra).
- `convertQuoteToInvoice(id : Id, paymentMethod : PaymentMethod) : Invoice`
  — actualización. Solo una cotización `#accepted`; en otro caso falla con
  `Solo se puede convertir una cotización aceptada`. Emite una factura con
  origen `#quote` y `paymentStatus = #pending`.

### Catálogo de servicios

- `listServices(filter : ServiceFilter, sort : ServiceSort, offset : Nat, limit : Nat) : ServicePage`
  — consulta. `filter.search` busca en nombre y código; `filter.category` es
  igualdad exacta contra el nombre de la categoría; `filter.activeOnly = ?true`
  limita a servicios activos. `sort` es `#name | #code | #category | #laborRate`.
- `getService(id : Id) : ?Service` — consulta.
- `createService(input : ServiceInput) : Service` — actualización. Falla con
  `duplicateCode: <code>` si el código ya existe.
- `updateService(id : Id, input : ServiceInput) : Service` — actualización.
  Falla con `Servicio no encontrado` / `duplicateCode: <code>`.
- `deleteService(id : Id) : Bool` — actualización. `false` si no existía.
- `bulkCreateServices(inputs : [ServiceInput]) : [Service]` —
  actualización. Importación masiva; las filas con código duplicado se
  omiten silenciosamente y no aparecen en el resultado.
- `bulkUpdateServices(updates : [(Id, ServiceInput)]) : [Service]` —
  actualización. Actualización masiva; las filas inexistentes o con código
  duplicado se omiten.
- `zeroServices() : ZeroServicesResult` — actualización. **Solo
  administradores**; en caso contrario falla con `notAuthorized`. Elimina
  **todos** los servicios del catálogo de taller y devuelve `deleted`, la
  cantidad de servicios eliminados. La operación es **destructiva** e
  **irreversible**: no hay restauración del catálogo. Las referencias
  (`serviceId`) que guardan las líneas de mano de obra de órdenes y las líneas
  de servicio de cotizaciones **no se modifican**: quedan huérfanas pero los
  documentos existentes no se corrompen. Una segunda llamada devuelve
  `deleted = 0`.

### Categorías de servicios

- `listServiceCategories(filter : ServiceCategoryFilter) : [ServiceCategoryUsage]`
  — consulta. `filter.search` busca en nombre (sin distinguir mayúsculas).
  Cada elemento incluye la categoría, el número total de servicios que la
  usan (`serviceCount`) y cuántos de ellos están activos
  (`activeServiceCount`). Ordenado por nombre.
- `getServiceCategory(id : Id) : ?ServiceCategory` — consulta. `null` si no
  existe.
- `createServiceCategory(input : ServiceCategoryInput) : ServiceCategory` —
  actualización. Falla con `duplicateName: <nombre>` si ya existe una
  categoría con ese nombre.
- `updateServiceCategory(id : Id, input : ServiceCategoryInput) : ServiceCategory`
  — actualización. Falla con `Categoría no encontrada` /
  `duplicateName: <nombre>`.
- `deleteServiceCategory(id : Id) : Bool` — actualización. Falla con
  `Categoría en uso: <n> servicios activos` si algún servicio activo usa la
  categoría; en caso contrario la elimina y devuelve `true`. `false` si no
  existía.

### Técnicos

- `listTechnicians(filter : TechnicianFilter) : [Technician]` — consulta.
  `filter.search` busca en nombre y código; `filter.specialty` es igualdad
  exacta; `filter.activeOnly = ?true` limita a técnicos activos. Ordenado por
  nombre.
- `getTechnician(id : Id) : ?Technician` — consulta.
- `findTechnicianByCode(code : Text) : ?Technician` — consulta. `null` si
  ningún técnico tiene ese código. La comparación ignora mayúsculas y espacios
  externos.
- `createTechnician(input : TechnicianInput) : Technician` — actualización.
  Falla con `Ya existe un técnico con el código <code>` si el código ya existe
  (comparación sin distinguir mayúsculas ni espacios externos), con
  `El código del técnico es obligatorio` si el código queda vacío, con
  `El nombre del técnico es obligatorio` si el nombre queda vacío, y con
  `El porcentaje de comisión debe estar entre 0 y 100` si
  `commissionRate > 100`.
- `updateTechnician(id : Id, input : TechnicianInput) : Technician` —
  actualización. Falla con `Técnico no encontrado` y con las mismas
  validaciones que `createTechnician`; el propio técnico queda excluido de la
  comprobación de código duplicado.
- `deleteTechnician(id : Id) : Bool` — actualización. `false` si no existía.
- `listTechnicianWorkload() : [TechnicianWorkload]` — consulta. Carga de
  cada técnico: órdenes activas (todas menos `#delivered`) y sus ids.
- `getTechnicianWorkload(technicianId : Id) : ?TechnicianWorkload` —
  consulta. `null` si el técnico no existe.

Cada técnico tiene un `code` de identificación único y un `commissionRate`
(porcentaje entero en puntos porcentuales, por ejemplo `10` = 10 %) que se
aplica sobre el importe de cada línea de mano de obra que tenga asignado a
ese técnico.

### Préstamos a técnicos

- `listTechnicianLoans(filter : TechnicianLoanFilter) : [TechnicianLoan]` —
  consulta. `filter.technicianId` filtra por técnico;
  `filter.pendingOnly = ?true` limita a préstamos aún no deducidos. Ordenado
  por fecha descendente.
- `getTechnicianLoan(id : Id) : ?TechnicianLoan` — consulta.
- `createTechnicianLoan(input : TechnicianLoanInput) : TechnicianLoan` —
  actualización. Registra un préstamo/anticipo con monto, fecha y nota
  opcional. Falla con `Técnico no encontrado` / `invalidAmount` si el monto
  es `0`.
- `deleteTechnicianLoan(id : Id) : Bool` — actualización. `false` si no
  existía. Un préstamo ya deducido no se puede eliminar.

### Comisiones

- `listCommissionLines(technicianId : ?Id, period : CommissionPeriod) : [CommissionLine]`
  — consulta. Líneas de mano de obra atribuidas a un técnico (o a todos si
  `technicianId` es `null`) dentro del periodo. `period.from` / `period.to`
  son opcionales e inclusivos sobre `updatedAt` de la orden. **Solo las
  órdenes entregadas (`#delivered`) generan comisión**, y dentro de ellas solo
  las líneas de mano de obra vinculadas a un servicio del catálogo de taller;
  las órdenes en proceso, listas o canceladas no comisionan, y las líneas
  libres (sin `serviceId`) y cualquier otro trabajo tampoco. Los servicios de
  categoría **`Servicio de terceros`** no generan línea de comisión en ningún
  cálculo ni reporte. Cada línea incluye
  el servicio realizado (`serviceId`,
  `serviceName`), la moto (`motorcycleBrand`, `motorcycleModel`,
  `motorcyclePlate`), la fecha del servicio (`serviceDate`), el importe base
  (`baseAmount`), el porcentaje aplicado (`commissionRate`) y la comisión
  generada (`commissionAmount`). Los repuestos no generan comisión.
- `getCommissionReport(period : CommissionPeriod) : CommissionReport` —
  consulta. Reporte general de todos los técnicos con totales por técnico
  (`baseAmount`, `commissionAmount`, préstamos pendientes y `netPayable`) y
  totales generales.
- `getTechnicianCommissionSummary(technicianId : Id, period : CommissionPeriod) : ?TechnicianCommissionSummary`
  — consulta. Resumen de un técnico; `null` si el técnico no existe.

### Pago de comisiones

- `listCommissionPayments(filter : CommissionPaymentFilter) : [CommissionPayment]`
  — consulta. `filter.technicianId` filtra por técnico; `filter.from` /
  `filter.to` acotan por `paidAt` (inclusive). Ordenado por `paidAt`
  descendente.
- `getCommissionPayment(id : Id) : ?CommissionPayment` — consulta.
- `payTechnicianCommission(input : CommissionPaymentInput) : CommissionPayment`
  — actualización. Consolida las comisiones pendientes del técnico en el
  periodo indicado y aplica **todos** los préstamos pendientes de ese técnico
  (el préstamo se descuenta completo, no en abonos parciales). Devuelve el
  comprobante con `commissionAmount`, `loansDeducted` y `netPaid`; el
  comprobante conserva en `lines` el **mismo desglose por servicio y moto**
  que el reporte. Los préstamos aplicados quedan marcados como deducidos y no
  se vuelven a descontar. Una línea de mano de obra ya pagada no se paga dos
  veces. Falla con `Técnico no encontrado` y con
  `No hay comisiones pendientes para pagar` si no hay líneas de comisión
  pendientes en el periodo.

### Citas

- `listAppointments(filter : AppointmentFilter) : [Appointment]` — consulta.
  `filter.from` / `filter.to` acotan por `scheduledAt` (inclusive);
  `filter.status` filtra por estado; `filter.technicianId` filtra por
  técnico asignado. Ordenado por `scheduledAt` ascendente.
- `getAppointment(id : Id) : ?Appointment` — consulta.
- `createAppointment(input : AppointmentInput) : Appointment` —
  actualización. Crea la cita en estado `#scheduled`. Falla con
  `Cliente no encontrado` / `Moto no encontrada` / `Técnico no encontrado`.
- `updateAppointment(id : Id, input : AppointmentInput) : Appointment` —
  actualización. Conserva el estado y `createdAt`. Falla con
  `Cita no encontrada` y los mismos errores de referencia.
- `updateAppointmentStatus(id : Id, status : AppointmentStatus) : Appointment`
  — actualización. **Solo se permiten las transiciones**
  `#scheduled → #confirmed | #cancelled | #noShow` y
  `#confirmed → #attended | #cancelled | #noShow`. Cualquier otra falla con
  `Transición de estado inválida: <from> -> <to>`.
- `deleteAppointment(id : Id) : Bool` — actualización. `false` si no existía.
- `convertAppointmentToOrder(id : Id) : OrderView` — actualización. Solo una
  cita `#attended`; en otro caso falla con
  `Solo se puede convertir una cita atendida`. Crea una orden en `#received`
  con el técnico asignado (si lo hay) y el motivo como problema.

### Proveedores, compras y cuentas por pagar

Todos estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can manage suppliers and purchases`.

- `listSuppliers(search : ?Text) : [Supplier]` — consulta.
- `getSupplier(id : Id) : ?Supplier` — consulta.
- `createSupplier(input : SupplierInput) : Supplier` — actualización.
- `updateSupplier(id : Id, input : SupplierInput) : Supplier` —
  actualización. Falla con `Supplier not found`.
- `listPurchases(supplierId : ?Id) : [Purchase]` — consulta.
- `createPurchase(input : PurchaseInput) : Purchase` — actualización. Crea
  un lote por cada línea y un movimiento de tipo `#purchase`, aumentando el
  stock automáticamente. Falla con `Supplier not found`.
- `listPayments(supplierId : ?Id) : [Payment]` — consulta.
- `registerPayment(input : PaymentInput) : Payment` — actualización. Falla
  con `Supplier not found`, `Payment amount must be greater than zero` o
  `Purchase not found` / `Purchase does not belong to the supplier`.
- `listPayables() : [Payable]` — consulta. Saldo pendiente por proveedor.
  Cada `Payable` incluye `dueDate` (vencimiento) y `status`
  (`#pending` / `#overdue` / `#paid`). El vencimiento se deriva de la compra
  pendiente más antigua más 30 días de plazo; `#overdue` cuando el saldo es
  mayor que cero y el vencimiento ya pasó.
- `getPayable(supplierId : Id) : ?Payable` — consulta.

### Gastos

- `listExpenses(filter : ExpenseFilter, offset : Nat, limit : Nat) : ExpensePage`
  — consulta. `filter.search` busca en concepto y nombre del proveedor;
  `filter.categoryId` filtra por id de categoría administrable; `filter.from` /
  `filter.to` acotan por `date` (inclusive); `filter.paymentMethod` es igualdad
  exacta. Ordenado por id descendente. `ExpensePage.summary` resume el total, el
  conteo y el desglose por categoría de las filas que coinciden con el
  filtro (no solo de la página).
- `getExpense(id : Id) : ?Expense` — consulta.
- `createExpense(input : ExpenseInput) : Expense` — actualización. Falla con
  `invalidAmount` si `amount` es `0`. `input.categoryId` debe referenciar una
  categoría administrable existente; el nombre de la categoría se copia a
  `categoryName` al crear o editar el gasto.
- `updateExpense(id : Id, input : ExpenseInput) : Expense` — actualización.
  Falla con `Gasto no encontrado` / `invalidAmount`.
- `deleteExpense(id : Id) : Bool` — actualización. `false` si no existía.
- `getExpenseSummary(filter : ExpenseFilter) : ExpenseSummary` — consulta.
  Total, conteo y desglose por categoría (`byCategory`, con `categoryId`,
  `categoryName` y `total`).

### Categorías de gastos (administrables)

Las categorías de gasto son entidades administrables (ya no una lista fija de
variantes): el usuario puede crear, renombrar y eliminar categorías. Un gasto
guarda `categoryId` (referencia autoritativa) y `categoryName` (copia
desnormalizada del nombre al momento de crear/editar el gasto), de modo que los
gastos existentes conservan su categoría aunque la entidad se renombre o se
elimine.

- `listExpenseCategories(filter : ExpenseCategoryFilter) : [ExpenseCategoryUsage]`
  — consulta. `filter.search` busca en nombre y descripción (sin distinguir
  mayúsculas). Cada elemento incluye la categoría y el número de gastos que la
  referencian (`expenseCount`). Ordenado por nombre.
- `getExpenseCategory(id : Id) : ?ExpenseCategory` — consulta. `null` si no
  existe.
- `createExpenseCategory(input : ExpenseCategoryInput) : ExpenseCategory` —
  actualización. Falla con `duplicateName: <nombre>` si ya existe una categoría
  con ese nombre (comparación sin distinguir mayúsculas ni espacios externos).
- `updateExpenseCategory(id : Id, input : ExpenseCategoryInput) : ExpenseCategory`
  — actualización. Falla con `Categoría de gasto no encontrada` /
  `duplicateName: <nombre>`. Renombrar una categoría **no** reescribe el
  `categoryName` de los gastos ya registrados.
- `deleteExpenseCategory(id : Id) : Bool` — actualización. Falla con
  `inUse: <id> (<n> gastos)` si algún gasto referencia la categoría; en caso
  contrario la elimina y devuelve `true`. `false` si no existía.

### Punto de venta (POS)

- `listPosSales(filter : PosSaleFilter, offset : Nat, limit : Nat) : PosSalePage`
  — consulta. `filter.search` busca en número de venta y nombre del cliente;
  `filter.from` / `filter.to` acotan por `soldAt` (inclusive). Ordenado por
  id descendente.
- `getPosSale(id : Id) : ?PosSale` — consulta.
- `createPosSale(input : PosSaleInput) : PosSale` — actualización. **Venta
  atómica**: valida todo el carrito antes de mutar nada, descuenta stock de
  los lotes disponibles (orden de id ascendente), registra los movimientos
  de tipo `#sale` y emite una factura directa con origen `#pos`. El precio
  unitario se toma de `salePrice` del repuesto; el `taxRate` se toma de la
  **tasa efectiva vigente** según el régimen fiscal de la empresa (ver «IVA y
  régimen fiscal»). `paymentCondition` elige **contado** (`#cash`) o
  **crédito** (`#credit`): de contado la factura nace `#paid`; a crédito la
  factura nace `#pending` con su plan de cuotas (`installments`) y exige un
  cliente registrado (`customerId` no nulo y existente) y `creditPlan`
  obligatorio. Falla con `emptyCart` si no hay líneas, con
  `insufficientStock: part <id>, available <n>, requested <m>` si alguna
  línea supera el stock disponible, con
  `Una venta a crédito requiere un cliente registrado` / `Cliente no
  encontrado` en crédito sin cliente válido, y con
  `insufficientPayment: total <n>, received <m>` si es de contado, el método
  es `cash` y lo recibido no cubre el total. `paymentMethod` es texto libre:
  `card` y `transfer` se mapean a sus variantes; cualquier otro valor se trata
  como efectivo.

### Contabilidad

Todos estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can perform this action`.

- `getAccountingSummary(period : AccountingPeriod) : AccountingSummary` —
  consulta. Ingresos (facturas `#paid`), gastos, beneficio (`Int`, puede ser
  negativo), y conteos. `period.from` / `period.to` son opcionales e
  inclusivos.
- `getAccountingReport(period : AccountingPeriod) : AccountingReport` —
  consulta. Resumen, desglose de gastos por categoría y por método de pago,
  el libro mayor ordenado por fecha descendente y el desglose de utilidad
  `profit` (ver más abajo).
- `listLedgerEntries(period : AccountingPeriod) : [LedgerEntry]` — consulta.
  Asientos de ingreso (`#income`, facturas pagadas) y de gasto (`#expense`),
  ordenados por fecha descendente.
- `getInventoryValuation() : InventoryValuation` — consulta. Informe del
  valor del inventario **actual**, sin periodo: una foto del estado en el
  momento de la llamada. Devuelve `rows` (una fila por repuesto existente),
  `byCategory` (desglose agregado por categoría) y `totals` (totales
  generales). El **costo real** de cada repuesto es el `costPrice` del
  repuesto multiplicado por su existencia actual (`costValue`); el **valor de
  venta proyectado** es `existencia × salePrice` vigente (`saleValue`); el
  **margen** es `saleValue − costValue` (`Int`, puede ser negativo si el costo
  real supera el precio de venta). `marginBps` es el margen en **puntos base**
  sobre `saleValue` (`10000` = 100 %), redondeado hacia abajo, y vale `0`
  cuando `saleValue = 0` o el margen no es positivo. Los repuestos sin
  existencia aparecen con `units = 0`, `costValue = 0` y `saleValue = 0`. `byCategory`
  está ordenado por `saleValue` descendente y `totals` suma exactamente las
  filas. Solo administradores; en caso contrario falla con
  `Unauthorized: Only admins can perform this action`.

### Utilidad de repuestos vs servicios

`getAccountingReport(period).profit` es un `ProfitBreakdown` que separa, para
el **rango de fechas elegido**, la utilidad generada por **repuestos** de la
generada por **servicios**:

- `parts` — bloque de repuestos.
- `services` — bloque de servicios.
- `total` — consolidado de ambos bloques.
- `serviceLines` — desglose por línea de servicio (ver abajo).

Cada bloque (`ProfitBlock`) muestra `income` (ingreso), `cost` (costo),
`commission` (comisión agregada del bloque), `margin` (`Int`, puede ser
negativo) y `marginBps` (margen en puntos base sobre el ingreso, `10000` =
100 %, `0` si el ingreso es `0` o el margen no es positivo). El cálculo
recorre las **líneas de las facturas pagadas** (`paymentStatus = #paid`)
emitidas dentro del periodo y clasifica cada línea por su `kind`: `#part`
suma al bloque de repuestos y `#service` al de servicios. El ingreso de una
línea es su `amount`.

El costo de una línea de **repuesto** es `unitCost × quantity`. El costo de
una línea de **servicio** es la **comisión del técnico** por esa línea de
mano de obra, de modo que la utilidad del servicio es
**valor cobrado − comisión del técnico**. La comisión se obtiene emparejando,
en orden de aparición, cada línea de servicio de la factura con las líneas de
mano de obra de la orden de taller referenciada por `invoice.orderId`; la
comisión de una línea de mano de obra es
`price × commissionRate / 100` del técnico asignado. Una línea de servicio
**no genera comisión** (costo `0`, utilidad = valor cobrado) cuando la factura
no proviene de una orden de taller, cuando no hay línea de mano de obra
disponible para emparejar, cuando la línea de mano de obra no tiene técnico
asignado o el técnico no existe, cuando la línea no está vinculada a un
servicio del catálogo, o cuando ese servicio es de categoría
**`Servicio de terceros`**. En el bloque de servicios `commission` es igual a
`cost`; en el de repuestos es `0`. El desglose respeta el rango de fechas y se
puede exportar a Excel junto con el resumen.

`serviceLines` es un arreglo de `ServiceProfitLine`, una entrada por cada
línea de servicio de las facturas pagadas del periodo, con `invoiceId`,
`invoiceNumber`, `orderId` (orden de taller asociada, `?Id`), `description`,
`serviceId` (`?Id`), `technicianId` (`?Id`), `technicianName` (vacío si no
aplica), `charged` (valor cobrado), `commission` (comisión del técnico, `0` si
la línea no genera comisión) y `profit` (`Int`, `charged − commission`, puede
ser negativo).

### Facturación

Todos estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can perform this action`.

- `getBusinessSettings() : BusinessSettings` — consulta.
- `updateBusinessSettings(settings : BusinessSettings) : BusinessSettings`
  — actualización.
- `createInvoiceFromOrder(orderId : Id, paymentMethod : PaymentMethod, paymentCondition : PaymentCondition, creditPlan : ?CreditPlanInput) : Invoice`
  — actualización. **Solo se puede facturar una orden en estado `#delivered`**;
  una orden `#ready` ya no es facturable. En otro caso falla con
  `Solo se puede facturar una orden entregada` (o
  `La orden está cancelada y no se puede facturar` si está cancelada). El
  número de factura es **consecutivo automático** (`F-<6 dígitos>`). Las
  líneas de repuesto se marcan `kind = #part` con su `unitCost` de referencia
  y las de mano de obra `kind = #service`. La factura nace con
  `paymentStatus = #pending`. Con `paymentCondition = #cash` no lleva plan de
  cuotas; con `#credit` exige `creditPlan` (número de cuotas y fecha de la
  primera cuota) y guarda el plan en `installments`.
- `createInvoiceFromQuote(quoteId : Id, customerId : Id, lines : [InvoiceLine], discount : Money, paymentMethod : PaymentMethod, paymentCondition : PaymentCondition, creditPlan : ?CreditPlanInput) : Invoice`
  — actualización. Emite una factura con origen `#quote` a partir de las
  líneas y el descuento indicados. `quoteId` se acepta pero no se valida
  contra la cotización. Acepta condición de pago y plan de cuotas igual que
  `createInvoiceFromOrder`.
- `createInvoiceFromPosSale(posSaleId : Id, customerId : ?Id, customerName : ?Text, lines : [InvoiceLine], discount : Money, paymentMethod : PaymentMethod, paymentCondition : PaymentCondition, creditPlan : ?CreditPlanInput) : Invoice`
  — actualización. Emite una factura con origen `#pos`; si no hay nombre de
  cliente usa `Cliente de mostrador`. Acepta condición de pago y plan de
  cuotas igual que `createInvoiceFromOrder`.
- `listInvoices(filter : InvoiceFilter, offset : Nat, limit : Nat) : InvoicePage`
  — consulta. `filter.search` busca en número y nombre del cliente;
  `filter.from` / `filter.to` acotan por `issuedAt` (inclusive). Ordenado por
  id descendente. Cada factura expone `paymentCondition` (`#cash | #credit`),
  `paymentStatus` (`#pending | #paid`) y, en crédito, su plan de cuotas
  (`installments`), de modo que la lista distingue contado, crédito y saldo
  pendiente.
- `getInvoice(id : Id) : ?Invoice` — consulta.
- `markInvoicePaid(id : Id, paymentMethod : PaymentMethod) : Invoice` —
  actualización. Falla con `Invoice not found`.
- `registerInstallmentPayment(id : Id, installmentNumber : Nat) : Invoice` —
  actualización. Registra el pago de **una cuota individual** de una factura a
  crédito: marca la cuota como pagada y guarda `paidAt`. La factura pasa a
  `#paid` **solo cuando todas las cuotas están pagadas**; mientras falte
  alguna permanece `#pending`. Falla con `Factura no encontrada`, con
  `La factura no tiene plan de cuotas` si la factura es de contado, con
  `Cuota no encontrada` si el número no existe y con `La cuota ya fue pagada`
  si esa cuota ya se había registrado.

### Plan de cuotas

Un plan de cuotas (`InstallmentPlan`) se construye al emitir una factura a
crédito a partir de `CreditPlanInput` (`installmentCount` y `firstDueDate`):

- Las cuotas son de **igual valor** y suman **exactamente** el total de la
  factura; el residuo de la división entera se reparte en las primeras cuotas.
- Los vencimientos van **mes a mes** desde `firstDueDate` (se usa un mes de 30
  días para que el cálculo sea determinista).
- Cada cuota (`Installment`) tiene `number` (1..n), `amount`, `dueDate`,
  `paid` y `paidAt`.
- `installmentCount = 0` falla con
  `El número de cuotas debe ser mayor que cero`; una factura a crédito sin
  `creditPlan` falla con
  `El plan de cuotas es obligatorio para una factura a crédito`.

### Cuentas por cobrar

Derivadas de las **facturas a crédito** (`paymentCondition = #credit`). Todos
estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can manage receivables`.

- `listReceivables(filter : ReceivableFilter) : [Receivable]` — consulta.
  `filter.status` filtra por `#pending` / `#overdue` / `#paid`; `filter.search`
  busca por nombre del cliente o número de factura. Ordenado por id de factura
  descendente. Cada fila trae `total`, `paidAmount` (suma de abonos),
  `balance`, `dueDate` (primera cuota del plan) y `status` calculado contra la
  hora actual: `#paid` si el saldo es 0, `#overdue` si el vencimiento ya pasó,
  `#pending` en otro caso.
- `getReceivableSummary() : ReceivableSummary` — consulta. `totalOutstanding`
  (suma de saldos abiertos), `totalOverdue` (solo los vencidos) y `openCount`
  (facturas con saldo mayor que cero).
- `registerReceivablePayment(input : ReceivablePaymentInput) : ReceivablePayment`
  — actualización. Registra un abono sobre una factura a crédito y recalcula
  el saldo y el estado de la factura. Falla con `Factura no encontrada`,
  `La factura no es una cuenta por cobrar a crédito`,
  `El monto del abono debe ser mayor que cero` o
  `El abono supera el saldo pendiente`. El abono marca como pagadas las cuotas
  cubiertas, en orden de vencimiento, y deja la factura en `#paid` cuando el
  saldo llega a cero. El abono queda registrado en la entidad OQL
  `receivablePayment` con el llamador (`performedBy`) y la fecha (`at`).

### Pedidos a proveedor

Todos estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can manage supplier orders`.

- `listSupplierOrders(filter : SupplierOrderFilter) : [SupplierOrder]` —
  consulta. `filter.supplierId` filtra por proveedor; `filter.search` busca en
  SKU y descripción (sin distinguir mayúsculas). Ordenado por id ascendente.
  Cada pedido trae `quantity`, `sku`, `description`, `createdBy` y `createdAt`.
- `createSupplierOrder(input : SupplierOrderInput) : SupplierOrder` —
  actualización. Crea un pedido a proveedor con **únicamente** cantidad, SKU y
  descripción. Falla con `La cantidad debe ser mayor que cero` si `quantity`
  es `0` y con `Proveedor no encontrado` si el proveedor no existe. El pedido
  **no mueve inventario ni genera cuentas por pagar**: es una solicitud de
  compra en borrador que queda listada en el detalle del proveedor.

### Facturas de compra (carga de PDF o foto)

Todos estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can manage purchase invoices`. El flujo es:
**borrador → extracción → revisión → confirmación**.

#### Campos de la factura y de sus líneas

La cabecera (`PurchaseInvoice`) conserva, además de `supplierId`,
`supplierName`, `invoiceNumber` e `invoiceDate`:

- `supplierTaxId : Text` — NIT del proveedor detectado en la factura. Cadena
  vacía cuando no aparece.
- `paymentMethod : Text` — forma de pago (por ejemplo «contado» o «crédito»).
  Cadena vacía cuando no aparece.
- `paymentMeans : Text` — medio de pago (efectivo, transferencia, tarjeta,
  etc.). Cadena vacía cuando no aparece.

Cada línea (`PurchaseInvoiceLine`) conserva, además de `code`, `description`,
`quantity` y `unitCost`:

- `taxRate : Nat` — IVA de la línea como **porcentaje entero** (por ejemplo
  `19` = 19 %). `0` cuando no aparece.
- `discountRate : Nat` — descuento de la línea como **porcentaje entero** (por
  ejemplo `10` = 10 %). `0` cuando no aparece.
- `total : Money` — valor total de la línea en **centavos enteros**. `0`
  cuando no aparece.

Los mismos campos viajan en `InvoiceHeaderInput` (`supplierTaxId`,
`paymentMethod`, `paymentMeans`) y en `InvoiceLineInput` (`taxRate`,
`discountRate`, `total`) para que la pantalla de revisión pueda editarlos y
guardarlos. `confirmPurchaseInvoice` sigue aplicando **solo** `quantity` y
`unitCost` al inventario: el IVA, el descuento y el total son informativos y no
alteran el stock ni el costo del repuesto.

- `createPurchaseInvoiceDraft(input : CreateInvoiceInput) : PurchaseInvoice` —
  actualización. Registra el archivo ya subido al almacenamiento de la
  plataforma. `input.objectId` es la clave del objeto (llega con el prefijo
  `!caf!`), `fileName`, `mimeType`, `sizeBytes` y `kind` (`#pdf` o `#image`).
  Falla con `invalidFile: el archivo de la factura es obligatorio` si
  `objectId` o `fileName` están vacíos. La factura nace con
  `extractionStatus = #pending`, `status = #pending` y sin líneas.
- `runPurchaseInvoiceExtraction(invoiceId : Id) : PurchaseInvoice` —
  actualización. Descarga el archivo del almacenamiento y lo analiza con el
  servicio de inferencia (el cliente es **solo texto**: las imágenes viajan en
  base64 y un PDF se procesa con un extractor de texto propio que localiza sus
  streams, aplica FlateDecode cuando está declarado y recupera las cadenas de
  los operadores de contenido `Tj`, `TJ`, `'` y `\"`, respetando los escapes de
  cadena del PDF y decodificando UTF-16BE con BOM). Un PDF de factura
  electrónica **con texto seleccionable** se lee y analiza automáticamente,
  aunque su contenido esté comprimido o codificado. Normaliza montos a
  centavos enteros y fechas a la medianoche local de Colombia (UTC-5). Los
  porcentajes de IVA y descuento se normalizan a enteros (por ejemplo `19.00`
  → `19`) y los montos se interpretan en formato colombiano (punto de miles,
  coma decimal). Además de las líneas, precarga el NIT del proveedor
  (`supplierTaxId`), la forma de pago (`paymentMethod`) y el medio de pago
  (`paymentMeans`), y por línea el IVA (`taxRate`), el descuento
  (`discountRate`) y el valor total (`total`); los campos que el modelo no
  detecte quedan en cadena vacía o `0`. Al
  terminar deja `extractionStatus = #extracted` con las líneas y la cabecera
  detectadas, o `#failed` con `extractionError` (mensaje en español) cuando el
  archivo no es legible o el servicio falla; en ese caso se puede reintentar o
  completar los datos manualmente. Un PDF **sin capa de texto** (por ejemplo un
  escaneo) cae en `#failed` con el mensaje `El PDF no contiene texto legible,
  así que no se pudo analizar automáticamente. Completa los datos manualmente o
  sube una foto de la factura.`, sin llamar al servicio de análisis, y queda
  disponible la revisión manual. Falla con `notFound: factura <id>` si la
  factura no existe
  y con `invalidState: la factura ya fue confirmada` si la factura ya se
  confirmó. **No es idempotente**: cada llamada correcta vuelve a descargar el
  archivo, consume una llamada al servicio de análisis y **reemplaza** las
  líneas extraídas (con ids de línea nuevos); un reintento tras un error de red
  puede duplicar el trabajo y descartar ediciones previas de la revisión.
- `updatePurchaseInvoiceReview(invoiceId : Id, input : InvoiceReviewInput) :
  PurchaseInvoice` — actualización. Reemplaza la cabecera
  (`supplierId`, `supplierName`, `invoiceNumber`, `invoiceDate`,
  `supplierTaxId`, `paymentMethod`, `paymentMeans`) y todas las
  líneas con lo editado en la pantalla de revisión. Cada línea recibe
  `matchStatus = #existing` con `matchedPartId` cuando su `code` coincide con
  el SKU de un repuesto existente, o `#new` cuando se creará. Falla con
  `notFound: factura <id>` si la factura no existe y con
  `invalidState: la factura ya fue confirmada` si ya se confirmó. **No es
  idempotente**: cada llamada reemplaza todas las líneas y les asigna ids
  nuevos; un reintento descarta las líneas anteriores.
- `confirmPurchaseInvoice(invoiceId : Id) : InvoiceApplyResult` —
  actualización. Aplica las líneas al inventario: crea los repuestos nuevos
  (o actualiza el costo de los existentes) y registra por cada línea un lote y
  un movimiento `#purchase` que sube el stock, el mismo mecanismo de
  `createPurchase`. Devuelve el resumen por línea (`created`, `updated`,
  `failed` y el detalle con `status`, `partId`, `lotId`, `movementId` y
  `error`). Falla con `notFound: factura <id>` si la factura no existe y con
  `invalidState: la factura no tiene ítems para confirmar` si no hay líneas.
  **Es idempotente por línea**: una línea que ya quedó `#created` o `#updated`
  conserva su repuesto, su lote y su movimiento y **no** se vuelve a aplicar en
  un reintento; solo se aplican las líneas que siguen en `#pending` o `#error`.
  Reenviar una factura ya confirmada devuelve el resultado guardado sin volver a
  tocar el inventario, y una factura en `#withErrors` corregida y reenviada
  tampoco duplica stock: las líneas que ya habían tenido éxito se omiten. Las
  líneas con `code` vacío o `quantity = 0` se marcan `#error` con su motivo y no
  tocan el inventario.
- `listPurchaseInvoices(filter : InvoiceFilter, sort : InvoiceSort, offset :
  Nat, limit : Nat) : InvoicePage` — consulta. `filter.status` filtra por
  estado (`#pending`, `#confirmed`, `#withErrors`), `filter.supplierId` por
  proveedor y `filter.search` busca en nombre de archivo, número de factura y
  nombre de proveedor. `sort` admite `#createdAt` (por defecto, descendente),
  `#invoiceDate` y `#invoiceNumber`. Devuelve `items`, `total`, `offset` y
  `limit`.
- `getPurchaseInvoice(invoiceId : Id) : ?PurchaseInvoice` — consulta. Detalle
  de una factura procesada con sus líneas extraídas y el resultado de su
  aplicación al inventario (`applyStatus`, `lotId`, `movementId`). Devuelve
  `null` si no existe.
- `transform(input : TransformationInput) : TransformationOutput` — consulta.
  Callback de transformación del outcall que descarga el archivo de la factura
  desde el almacenamiento de la plataforma; descarta las cabeceras variables
  para que la respuesta sea determinista entre réplicas. Es un detalle de
  implementación del canister, no un endpoint de negocio.

### Respaldo en Google Drive

Todos estos métodos exigen rol administrador; en caso contrario fallan con
`Unauthorized: Only admins can perform this action`. El respaldo es una
operación **manual** del administrador: no hay respaldo programado ni
restauración.

- `getDriveConnectionStatus() : DriveConnectionStatus` — **actualización** (no
  consulta, porque lee las variables de entorno del canister). Devuelve
  `connected` (`true` solo si hay un `refreshToken` guardado),
  `accountEmail` (correo de la cuenta de Google autorizada, `?Text`),
  `connectedAt` (`?Int`, nanosegundos) y `configuration`
  (`DriveConfigStatus`). Sin conexión devuelve
  `{ connected = false; accountEmail = null; connectedAt = null; configuration }`.
  **Nunca falla por configuración faltante**: `configuration.configured` es
  `false` y `configuration.missingVariables` nombra exactamente las variables
  de entorno ausentes (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
  `GOOGLE_OAUTH_REDIRECT_URI`), de modo que la pantalla de Configuración puede
  distinguir «no configurado» de «desconectado» e indicar cómo completarlas.
  Una variable ausente o en blanco cuenta como no configurada.
- `startDriveAuthorization() : DriveAuthStart` — actualización. Inicia el flujo
  OAuth 2.0 con PKCE y devuelve `authorizationUrl` (la URL a la que el
  navegador debe redirigir al administrador) y `state` (el verificador PKCE,
  que debe devolverse **intacto** en `completeDriveAuthorization`). El `state`
  no se persiste en el backend: el frontend debe conservarlo entre el inicio y
  la vuelta de Google. Falla con
  `Google Drive no está configurado: falta GOOGLE_OAUTH_CLIENT_ID` (o
  `..._CLIENT_SECRET` / `..._REDIRECT_URI`) si el canister no tiene
  configuradas las variables de entorno del cliente OAuth.
- `completeDriveAuthorization(code : Text, state : Text) : DriveAuthResult` —
  actualización. Intercambia el `code` devuelto por Google por tokens, usando
  el `state` como verificador PKCE. Persiste el `refreshToken` (no rota: se
  guarda el primero recibido), el `accessToken` y su expiración, y el correo
  de la cuenta. Devuelve `{ connected = true; accountEmail }`. Falla con
  `No se pudo autorizar Google Drive: <detalle>` si el intercambio falla y con
  `Google Drive no devolvió un refresh token; vuelve a autorizar la cuenta` si
  Google no devuelve `refresh_token` (por ejemplo, si la cuenta ya había
  autorizado la aplicación y no se forzó el consentimiento).
- `disconnectDrive() : ()` — actualización. Revoca el token en Google y borra
  las credenciales guardadas. Es **idempotente en efecto**: sin conexión no
  hace nada y no falla. Tras desconectar, `createBackup` y `listBackups`
  devuelven `#err(#notConnected)`.
- `createBackup() : BackupOutcome` — actualización. Serializa las colecciones
  del taller a un JSON y lo sube al Drive **propio del administrador**,
  creando la carpeta `HR SOLUCIONES INTEGRALES — Respaldos` si no existe. El
  nombre del archivo es `respaldo-hr-AAAA-MM-DD-HHmm.json` (UTC). Devuelve
  `#ok(BackupResult)` con `fileId`, `name`, `size` (bytes), `createdAt`
  (nanosegundos) y `webViewLink`; o `#err(BackupError)` con `#notConnected`
  (sin conexión o autorización expirada) o `#driveFailed(<detalle>)` (falló la
  preparación de la carpeta o la subida). Si falta configuración OAuth,
  devuelve `#err(#driveFailed(\"Google Drive no está configurado: falta
  <VARIABLE>\"))` en lugar de fallar con un trap. **No es idempotente**: cada
  llamada correcta sube un archivo nuevo.
- `listBackups() : BackupListOutcome` — **actualización** (no consulta, porque
  espera a Google Drive). Lista hasta **50** archivos de la carpeta de
  respaldos, ordenados por `createdTime` descendente (más reciente primero).
  Devuelve `#ok([BackupFile])` con `fileId`, `name`, `size` (bytes),
  `createdAt` (nanosegundos) y `webViewLink`; o `#err(BackupError)`. Si la
  carpeta aún no existe devuelve `#ok([])` (lista vacía), no un error. Si falta
  configuración OAuth, devuelve `#err(#driveFailed(\"Google Drive no está
  configurado: falta <VARIABLE>\"))` en lugar de fallar con un trap.
- `downloadLocalBackup() : LocalBackup` — **consulta** (solo lectura, no
  espera a ningún canister). Devuelve la **copia de seguridad local** para que
  el frontend la descargue en el equipo del usuario, sin subir nada a la nube.
  El campo `json` contiene **exactamente los mismos datos** que el respaldo a
  Drive (`createBackup`): las mismas colecciones y el mismo formato JSON.
  `fileName` es el nombre sugerido del archivo, con fecha y hora de generación
  en UTC: `copia-local-hr-AAAA-MM-DD-HHmm.json`. `generatedAt` es el momento de
  generación en nanosegundos. No muta estado y se puede reintentar sin efectos
  secundarios; cada llamada refleja el estado del momento de la llamada.

El respaldo **no** incluye los bytes de las fotos de evidencia (viven en el
almacenamiento de archivos de la plataforma): solo se serializan sus metadatos
(`filename`, `mimeType`, `uploadedBy`, `uploadedAt`). Tampoco incluye las
credenciales de Drive ni los contadores internos de numeración.

### Notificación al cliente

- `notifyCustomer(input : CustomerNotificationInput) : CustomerNotificationResult`
  — actualización. Envía un **correo** de notificación al cliente con el
  asunto (`subject`) y el mensaje (`message`) indicados. El destinatario se
  resuelve desde el correo registrado del cliente (`customer.email`); el
  llamador no puede elegir otro destinatario. `source` indica el módulo de
  origen (`#service | #order | #quote | #invoice | #pos`) y `referenceId` es
  una referencia opcional al documento. Devuelve `customerId`, `email` y
  `sent = true` cuando el envío se acepta. Falla con
  `Cliente no encontrado: <id>` si el cliente no existe, con
  `El cliente <id> no tiene correo registrado` si el cliente no tiene correo
  (o es solo espacios), y con
  `El asunto de la notificación no puede estar vacío` / `El mensaje de la
  notificación no puede estar vacío` si el asunto o el mensaje quedan vacíos.
  Si el proveedor de correo rechaza el envío o no es alcanzable, la llamada
  **no falla**: devuelve `sent = false` con `email = ''` como resultado
  controlado, para que el llamador distinga un fallo de envío de un error de
  entrada. **Requiere que el cliente tenga correo registrado**: sin él no hay
  forma de notificar. No envía mensajes por WhatsApp.

### Preparación de mensajes de WhatsApp

- `prepareWhatsAppMessage(input : WhatsAppMessageInput) : WhatsAppMessageResult`
  — **consulta** (solo lectura). Prepara el teléfono normalizado y el texto
  sugerido para abrir WhatsApp en el dispositivo del usuario. **No envía
  ningún mensaje**: el backend solo provee el texto, que el usuario puede
  editar antes de enviarlo. `input.contactKind` elige el tipo de contacto
  (`#customer | #supplier`) y `input.contactId` su id; `input.context` elige el
  contexto (`#appointment | #order | #quote | #invoice | #receivable |
  #service`) y `input.referenceId` es el id del registro de referencia (cita,
  orden, cotización, factura o servicio). Para `#receivable` es el id de la
  factura a crédito; para `#service` es opcional (sin él se prepara un mensaje
  genérico de servicio).

  Devuelve `contactKind`, `contactId`, `contactName`, `hasPhone`, `phone`
  (`?Text`) y `message`. El teléfono se normaliza a formato internacional
  (solo dígitos, con indicativo de país): un número local colombiano de **10
  dígitos** recibe el indicativo `57`; un número de 11 dígitos o más se
  conserva tal cual. Si el contacto **no tiene teléfono** utilizable, la
  respuesta lo indica explícitamente con `hasPhone = false` y `phone = null`
  (nunca devuelve un valor inválido). El `message` incluye datos reales del
  registro: nombre del contacto, folio/número, fecha, monto o estado según el
  caso, y va firmado con el nombre del negocio.

  Falla con `Contacto no encontrado: <id>` si el contacto no existe y con
  `Registro de referencia no encontrado: <id>` si el registro del contexto no
  existe o falta el `referenceId` requerido.

### IVA y régimen fiscal

El **régimen fiscal de la empresa** (`company.profile.fiscalRegime`) es la
única fuente de verdad para decidir si se aplica IVA en toda la aplicación:

- `#noResponsableIva` — la tasa efectiva es **0 %** en todas partes, sin
  importar la tarifa configurada. Los totales de órdenes, cotizaciones,
  facturas y ventas de mostrador no llevan impuesto: `tax = 0` y
  `total = subtotal` (o `subtotal − descuento`). La línea de impuesto no debe
  mostrarse.
- `#responsableIva` — se aplica la tarifa configurada
  (`businessSettings.taxRate`); si está vacía (`0`), se usa el **19 %** por
  defecto.

La tarifa configurada se **conserva guardada** aunque la empresa sea no
responsable, de modo que al volver a `#responsableIva` se reutiliza. El
cambio de régimen aplica de inmediato a los documentos nuevos y a los totales
calculados al leer; **no** recalcula ni migra documentos ya emitidos.

### Empresa y usuarios

- `getCompanyProfile() : CompanyProfile` — consulta. Perfil fiscal de la
  empresa (fila única), legible por cualquier llamador. Incluye los datos
  conforme a la norma colombiana y la resolución DIAN: `documentType`
  (`#nit | #cedulaCiudadania | #cedulaExtranjeria`), `taxId` (número de
  documento), `checkDigit` (dígito de verificación del NIT, `?Nat`),
  `legalName` (razón social), `tradeName` (nombre comercial, `?Text`),
  `fiscalRegime` (`#responsableIva | #noResponsableIva`),
  `taxResponsibility`
  (`#granContribuyente | #autorretenedor | #agenteRetencionIva | #regimenSimple | #noAplica`),
  `address`, `city` (ciudad/departamento), `phone`, `email`, `website`,
  `logoUrl`, `taxRate` y `updatedAt`.
- `updateCompanyProfile(input : CompanyProfileRawInput) : CompanyProfile` —
  actualización. Solo administradores; en caso contrario falla con
  `Unauthorized: Only admins can perform this action`. La entrada es tolerante
  al borde Candid: `documentType`, `fiscalRegime` y `taxResponsibility` viajan
  como `Text` (el nombre de la variante, por ejemplo `responsableIva`), de
  modo que una cadena vacía o un valor desconocido **no** produce un error de
  decodificación. El backend normaliza antes de validar y persistir: un
  `fiscalRegime` vacío o desconocido se guarda como `#noResponsableIva` (la
  empresa no es responsable de IVA), un `taxResponsibility` vacío o
  desconocido como `#noAplica`, un `documentType` vacío o desconocido como
  `#nit`, y un `logoUrl` vacío o ausente como `null` (nunca cadena vacía). La
  comparación ignora mayúsculas y espacios externos. Después valida los campos
  obligatorios (`legalName`, `taxId`, `address`, `city`, `phone`, `email`) y,
  cuando `documentType = #nit`, el dígito de verificación contra el número de
  documento con el algoritmo **módulo 11 de la DIAN**. Los errores de
  validación son traps con mensaje en español, por ejemplo
  `La razón social es obligatoria`, `La dirección es obligatoria`,
  `El correo electrónico es obligatorio`,
  `El número de NIT debe contener solo dígitos`,
  `El dígito de verificación del NIT es obligatorio` o
  `El dígito de verificación del NIT no coincide con el número de documento`.
  Al guardar se reemplaza el perfil de fila única y se actualiza `updatedAt`;
  los cambios son persistentes y se reflejan de inmediato en la vista previa
  de documentos (orden de taller, cotización, factura).
- `listUsers() : [UserView]` — consulta. Solo administradores.
- `setUserRole(user : Principal, role : UserRole) : UserView` —
  actualización. Solo administradores. Falla con `User not found`.
- `getCallerUserProfile() : ?UserProfile` — consulta. Perfil del llamador;
  `null` si nunca lo guardó.
- `saveCallerUserProfile(name : Text) : UserProfile` — actualización. Crea el
  perfil con rol `#user` si no existe, o actualiza el nombre.
- `getDashboardSummary() : DashboardSummary` — consulta. Solo
  administradores. Resumen de stock bajo, órdenes activas y cuentas por pagar
  pendientes.

### Autorización (mixin de plataforma)

- `_initialize_access_control()` — actualización. Registra al llamador
  firmado (ver «Registro previo»).
- `_internet_identity_sign_in_start()` / `_internet_identity_sign_in_finish()`
  — flujo de inicio de sesión con Internet Identity.
- `getCallerUserRole() : UserRole` — consulta. Falla con
  `User is not registered` si el llamador no está registrado.
- `assignCallerUserRole(user : Principal, role : UserRole)` — actualización.
  Solo administradores.
- `isCallerAdmin() : Bool` — consulta.

### Consultas OQL

- `schema() : Text` — consulta. Documento JSON con las entidades visibles
  para el llamador.
- `execute(qJson : Text) : Result` — consulta. Ejecuta una consulta JSON
  sobre las entidades expuestas. Falla con `OQL: invalid query — <detalle>`
  si el JSON es inválido, y con `OQL: caller not allowed to read '<entidad>'`
  si el llamador no puede leer la entidad de inicio.

### Documentación

- `getApiDoc() : Text` — consulta. Este documento.

## Entidades OQL y autorización por tabla

Las entidades se exponen con autorización **por entidad**:

- `#controllerOnly` (predeterminado) — solo los controladores del canister
  leen todas las filas. Es el nivel de los datos operativos y financieros:
  `part`, `lot`, `movement`, `customer`, `motorcycle`, `workshopOrder`,
  `supplier`, `purchase`, `payment`, `invoice`, `businessSetting`, `quote`,
  `service`, `serviceCategory`, `technician`, `technicianLoan`,
  `commissionPayment`, `paidCommissionLine`, `appointment`, `expense`,
  `expenseCategory`, `posSale`, `receivablePayment`, `supplierOrder`,
  `purchaseInvoice`, `companyProfile` y `driveCredential`.
- `#scopedPerUser` — cada llamador firmado lee solo sus propias filas. Es el
  nivel de `userProfile`, con columna propietaria `principal`.

Un llamador anónimo no puede leer ninguna entidad. Un llamador firmado no
controlador solo puede leer `userProfile` (sus propias filas).

La entidad `driveCredential` expone la conexión OAuth del administrador con
Google Drive como **fila única** (o ninguna fila si no hay conexión). Por
seguridad **no** expone los tokens: solo `accountEmail` (`?Text`, centinela de
cadena vacía), `connectedAt` (`Int`, nanosegundos) y `hasRefreshToken`
(`Bool`). Es `#controllerOnly` porque las credenciales nunca deben ser
legibles por usuarios no administradores.

Las entidades `lot`, `movement`, `motorcycle`, `workshopOrder`, `purchase`,
`payment`, `invoice`, `quote`, `technicianLoan`, `commissionPayment`,
`appointment`, `expense`, `posSale`, `receivablePayment`, `supplierOrder` y
`purchaseInvoice`
declaran claves foráneas (`part`, `customer`, `supplier`, `workshopOrder`,
`motorcycle`, `technician`, `invoice`) que permiten rutas con punto, por
ejemplo `part.name` o `customer.name`. En particular, `receivablePayment`
apunta a `invoice` (`invoiceId`), `supplierOrder` apunta a `supplier`
(`supplierId`) y `purchaseInvoice` apunta a `supplier` (`supplierId`).

## Unidades, codificación y valores opcionales

- Los campos opcionales se aplanan a un **centinela** en OQL: `?Text` ausente
  se convierte en la cadena vacía (comillas dobles vacías); `?Nat` ausente se
  convierte en `0`. Filtra con `eq` sobre la cadena vacía o `eq 0` para
  encontrar los nulos.
- Los variantes se codifican como su etiqueta en texto: `MovementKind` →
  `sale | purchase | adjustment`; `OrderStatus` →
  `received | inRepair | ready | delivered | cancelled`; `PaymentMethod` →
  `cash | card | transfer | mixed`; `PaymentStatus` →
  `pending | paid`; `PaymentCondition` → `cash | credit`; `UserRole` →
  `admin | user | guest`;
  `QuoteStatus` → `draft | sent | accepted | rejected | expired`;
  `AppointmentStatus` →
  `scheduled | confirmed | attended | cancelled | noShow`;
  `InvoiceOrigin` → `workshopOrder | pos | quote`;
  `ReceivableStatus` → `pending | overdue | paid`;
  `ExtractionStatus` → `pending | extracting | extracted | failed`;
  `PurchaseInvoiceStatus` → `pending | confirmed | withErrors`;
  `InvoiceFileKind` → `pdf | image`.
  La categoría de un gasto **ya no es un variante**: `expense.categoryId` es un
  `Nat` y `expense.categoryName` es texto libre; consulta la entidad
  `expenseCategory` para el catálogo administrable.
- Los `Principal` se codifican como su forma textual canónica.
- Los campos de colección (`lines`, `items`, `parts`, `labor`,
  `statusHistory`, `partLines`, `serviceLines`) **no** se exponen como
  columnas OQL; consulta las entidades relacionadas (`invoice` no tiene
  líneas; usa `workshopOrder`, `purchase`, `quote` o `posSale` para el
  detalle de líneas).
- `paymentMethod` en `expense` y `posSale` es **texto libre**, no un
  variante; en `invoice` sí es el variante `PaymentMethod`.
- Campos nuevos consultables por OQL: `workshopOrder.cancelReason` (`?Text`,
  centinela de cadena vacía) y `workshopOrder.cancelledAt` (`?Timestamp`,
  centinela `0`); `invoice.paymentCondition` y `posSale.paymentCondition`
  (`cash | credit`); `invoice.installments` es un registro anidado
  (`installmentCount`, `firstDueDate`, `installments`) y se expone como
  columna, no como colección. `workshopOrder.photos` y
  `commissionPayment.lines` son colecciones y **no** se exponen como columnas;
  el desglose de líneas pagadas de un comprobante se lee desde
  `commissionPayment` solo por sus campos escalares.
- `receivablePayment.note` es `?Text` (centinela de cadena vacía) y
  `receivablePayment.at` es un `Timestamp` en nanosegundos. `supplierOrder`
  expone `quantity` (`Nat`), `sku` y `description` (`Text`), `createdBy`
  (`Principal`) y `createdAt` (`Timestamp`); no tiene campos opcionales.
- `driveCredential` es una fila única sin tokens: `accountEmail` (`?Text`,
  centinela de cadena vacía), `connectedAt` (`Int`, nanosegundos) y
  `hasRefreshToken` (`Bool`). Sin conexión la entidad no tiene filas.
- `purchaseInvoice` expone la cabecera y el archivo de cada factura de compra
  como columnas planas: `id` (`Nat`), `extractionStatus`
  (`pending | extracting | extracted | failed`), `extractionError` (`?Text`,
  centinela de cadena vacía), `supplierId` (`?Nat`, centinela `0`),
  `supplierName` (`?Text`), `invoiceNumber` (`?Text`), `invoiceDate`
  (`?Timestamp`, centinela `0`), `status` (`pending | confirmed | withErrors`),
  `createdAt` y `updatedAt` (`Timestamp`), `confirmedAt` (`?Timestamp`,
  centinela `0`) y `confirmedBy` (`?Principal`, centinela de cadena vacía).
  El sub-registro `file` se aplana en las columnas `objectId`, `fileName`,
  `mimeType`, `sizeBytes` (`Nat`), `kind` (`pdf | image`) y `uploadedAt`
  (`Timestamp`). Las **líneas** (`lines`) son una colección y **no** se exponen
  como columna: para el detalle de ítems extraídos y su aplicación al
  inventario usa `getPurchaseInvoice`.

## Ciclo de vida y sondeo

- Una orden de taller recorre `#received → #inRepair → #ready → #delivered`.
  No hay retroceso ni salto de estados. Una orden puede cancelarse con
  `cancelOrder` (motivo obligatorio) y pasa a `#cancelled`, que es terminal:
  deja de ser facturable y sale de los flujos activos. `deleteOrder` la
  elimina de forma irreversible.
- Una cotización nace `#draft` y avanza a `#sent`, `#accepted`, `#rejected`
  o `#expired`; solo una cotización `#accepted` se puede convertir en orden o
  factura.
- Una cita nace `#scheduled` y avanza a `#confirmed`, `#attended`,
  `#cancelled` o `#noShow`; solo una cita `#attended` se puede convertir en
  orden.
- Una factura nace `#pending` y pasa a `#paid` con `markInvoicePaid`. Las
  facturas de POS **de contado** nacen directamente `#paid`; las de POS **a
  crédito** nacen `#pending` con su plan de cuotas y pasan a `#paid` cuando
  todas las cuotas se registran con `registerInstallmentPayment`.
- Una compra nace con `paidAmount = 0`; los pagos parciales la incrementan.
  El estado de la cuenta por pagar es `#paid` cuando el saldo llega a `0`.
- Una cuenta por cobrar se **deriva** de una factura a crédito
  (`paymentCondition = #credit`); no es una entidad propia. Su estado se
  calcula contra la hora actual en cada lectura: `#paid` si el saldo es `0`,
  `#overdue` si el vencimiento ya pasó, `#pending` en otro caso. El
  vencimiento es la fecha de la **primera cuota** del plan (`firstDueDate`);
  sin plan se usa la fecha de emisión. Un abono con
  `registerReceivablePayment` recalcula el saldo y deja la factura en `#paid`
  cuando el saldo llega a cero.
- Un pedido a proveedor (`createSupplierOrder`) es una solicitud en borrador:
  **no** mueve inventario, **no** genera cuentas por pagar y **no** cambia de
  estado. Permanece listado en el detalle del proveedor.
- Una factura de compra recorre **borrador → extracción → revisión →
  confirmación**. Nace `#pending` con `extractionStatus = #pending`; la
  extracción la deja `#extracted` (o `#failed` con `extractionError`, y se
  puede reintentar o completar a mano); la revisión reemplaza cabecera y
  líneas; la confirmación la deja `#confirmed` si todas las líneas se
  aplicaron, o `#withErrors` si alguna falló. `#confirmed` y `#withErrors` son
  terminales para la extracción y la revisión (ambas fallan con
  `invalidState: la factura ya fue confirmada`). No hay trabajos en segundo
  plano: la extracción es una llamada de actualización que espera al servicio
  de análisis, así que el frontend debe sondear `getPurchaseInvoice` o
  `listPurchaseInvoices` para ver el resultado.
- No hay trabajos en segundo plano ni eventos: para observar cambios hay que
  volver a consultar (`listOrders`, `getOrder`, `listInvoices`,
  `listQuotes`, `listAppointments`, …). Las consultas son `query` (rápidas,
  no replicadas) y pueden ir por detrás de la última actualización; para leer
  el estado recién escrito usa una llamada de actualización o vuelve a
  consultar.
- `getInventoryValuation` es una **foto del inventario actual**, no un
  histórico: refleja los lotes y precios vigentes en el momento de la
  llamada. No acepta periodo ni fecha de comparación. Para observar cambios
  hay que volver a llamarlo.
- La conexión con Google Drive es un flujo OAuth de dos pasos: el frontend
  llama a `startDriveAuthorization`, redirige al administrador a
  `authorizationUrl` y, al volver de Google, llama a
  `completeDriveAuthorization` con el `code` y el `state` recibidos. Hasta que
  ese segundo paso no termina, `getDriveConnectionStatus` sigue devolviendo
  `connected = false`. El `accessToken` se renueva automáticamente al usarlo
  (con 60 s de margen); si la renovación falla, `createBackup` y `listBackups`
  devuelven `#err(#notConnected)` y hay que volver a autorizar.
- `listBackups` es una **llamada de actualización**, no una consulta: espera a
  Google Drive y por eso no puede ir por el camino rápido de `query`. No hay
  trabajos en segundo plano: para ver un respaldo recién creado hay que volver
  a llamar a `listBackups`.

## Reintentos e idempotencia

- **Ningún método de escritura es idempotente.** Reintentar una llamada que
  ya se aplicó duplica el efecto: `createPart`, `createCustomer`,
  `createMotorcycle`, `createOrder`, `createSupplier`, `createPurchase`,
  `registerPayment`, `createInvoiceFromOrder`, `createInvoiceFromQuote`,
  `createInvoiceFromPosSale`, `addOrderPart`, `addLabor`, `adjustStock`,
  `createQuote`, `createService`, `createTechnician`, `createAppointment`,
  `createExpense`, `createPosSale`, `createServiceCategory`,
  `createExpenseCategory`, `createTechnicianLoan`, `registerReceivablePayment`,
  `createSupplierOrder` y `saveCallerUserProfile` crean o
  incrementan datos cada vez.
- `createPosSale` es **especialmente sensible**: cada llamada correcta
  descuenta stock, registra movimientos y emite una factura con número
  consecutivo. Un reintento duplica la venta, el descuento de stock y la
  factura.
- `createInvoiceFromOrder`, `createInvoiceFromQuote`,
  `createInvoiceFromPosSale`, `convertQuoteToInvoice` y
  `convertQuoteToOrder` **consumen un número consecutivo** en cada llamada
  correcta; un reintento emite otro documento con el siguiente número.
- `addOrderPart` **no** descuenta stock y `removeOrderPart` **no** lo
  devuelve; repetir cualquiera de las dos llamadas solo añade o quita otra
  línea.
- `cancelOrder` es idempotente en efecto negativo: repetirla falla con
  `La orden ya está cancelada` en lugar de duplicar el efecto.
- `deleteOrder` es **irreversible**: un reintento devuelve `false` porque la
  orden ya no existe.
- `zeroServices` es **destructivo e irreversible**: elimina todo el catálogo de
  servicios. Un reintento devuelve `deleted = 0` porque ya no queda ningún
  servicio, pero la primera llamada no se puede deshacer.
- `addOrderPhoto` respeta el máximo de 6 fotos: un reintento tras un error de
  red puede duplicar la foto si aún queda cupo; vuelve a consultar la orden
  antes de repetir. `removeOrderPhoto` falla con `Foto no encontrada` si la
  foto ya se eliminó.
- `registerInstallmentPayment` es idempotente en efecto negativo: repetir el
  pago de la misma cuota falla con `La cuota ya fue pagada` en lugar de
  duplicarlo.
- `updateOrderStatus`, `updateQuoteStatus` y `updateAppointmentStatus` son
  la excepción parcial: repetir la misma transición falla con
  `Transición de estado inválida` en lugar de duplicar, porque el estado ya
  avanzó.
- `assignTechnician` es idempotente en efecto (si el técnico ya está
  asignado devuelve la orden sin cambios); `unassignTechnician` también.
- `markInvoicePaid` es idempotente en efecto (vuelve a dejar la factura
  `#paid`), pero actualiza el método de pago.
- `bulkCreateParts`, `bulkUpdateParts`, `bulkCreateCustomers`,
  `bulkUpdateCustomers`, `bulkCreateServices` y `bulkUpdateServices` omiten
  las filas que no se pueden aplicar (duplicados o inexistentes) en lugar de
  fallar; un reintento puede volver a crear las filas que sí se aplicaron.
- `importInventoryCsv` es **idempotente en la existencia**: un reintento de
  las mismas filas vuelve a actualizar los repuestos existentes por SKU (no
  los duplica) y deja la existencia en el valor del archivo, sin sumarla a la
  importación anterior. El resumen reportará `updated` en lugar de `created`
  para los repuestos que ya existían.
- `payTechnicianCommission` **no es idempotente**: cada llamada correcta
  consume un número de comprobante, marca los préstamos pendientes como
  deducidos y emite un nuevo pago. Un reintento tras un error de red puede
  duplicar el pago; vuelve a consultar `listCommissionPayments` antes de
  repetir.
- `registerReceivablePayment` **no es idempotente**: cada llamada correcta
  consume un id de abono y suma al saldo pagado. Un reintento duplica el abono
  (y puede fallar con `El abono supera el saldo pendiente` si ya no queda
  saldo); vuelve a consultar `listReceivables` antes de repetir.
- `createSupplierOrder` **no es idempotente**: cada llamada correcta consume
  un id y crea un pedido nuevo. Un reintento duplica el pedido.
- `createPurchaseInvoiceDraft` **no es idempotente**: cada llamada correcta
  consume un id y crea una factura nueva. Un reintento duplica el borrador.
- `runPurchaseInvoiceExtraction` y `updatePurchaseInvoiceReview` **no son
  idempotentes**: cada llamada correcta reemplaza las líneas de la factura con
  ids nuevos. Un reintento descarta las líneas anteriores (y, en la extracción,
  vuelve a llamar al servicio de análisis).
- `confirmPurchaseInvoice` es **idempotente por línea**: reenviarla no vuelve a
  aplicar las líneas que ya quedaron `#created` o `#updated` (conservan su lote
  y su movimiento), así que una factura `#withErrors` corregida y reenviada no
  duplica stock. Solo se aplican las líneas en `#pending` o `#error`.
- `notifyCustomer` **no es idempotente**: cada llamada correcta envía un
  correo. Un reintento tras un error de red puede enviar el correo dos veces;
  no hay deduplicación en el backend. Un resultado con `sent = false` indica
  que el envío no se completó y puede reintentarse, pero un `sent = true`
  confirma que el proveedor aceptó el correo.
- Ante un error de red, **no reintentes a ciegas**: vuelve a consultar el
  estado antes de repetir una escritura.
- `getInventoryValuation` es una **consulta de solo lectura**: no muta estado
  y se puede reintentar sin efectos secundarios. Su resultado puede variar
  entre llamadas si el inventario cambió en el intervalo.
- `createBackup` **no es idempotente**: cada llamada correcta sube un archivo
  nuevo al Drive del administrador. Un reintento tras un error de red puede
  dejar dos respaldos con el mismo contenido; vuelve a consultar
  `listBackups` antes de repetir.
- `startDriveAuthorization` y `completeDriveAuthorization` **no son
  idempotentes**: cada `startDriveAuthorization` genera un `state` (verificador
  PKCE) nuevo, y un `code` de Google solo se puede canjear una vez. Si el
  intercambio falla, vuelve a iniciar el flujo desde `startDriveAuthorization`
  en lugar de reintentar el mismo `code`.
- `disconnectDrive` es **idempotente en efecto**: repetirla sin conexión no
  hace nada y no falla. Es **destructiva** para la conexión: borra las
  credenciales guardadas y hay que volver a autorizar para respaldar de nuevo.
- `getDriveConnectionStatus` y `listBackups` se pueden reintentar sin efectos
  secundarios; `listBackups` solo lee el Drive del administrador.
- `downloadLocalBackup` es una **consulta de solo lectura**: no muta estado y
  se puede reintentar sin efectos secundarios. Su resultado puede variar entre
  llamadas si los datos cambiaron en el intervalo.

## Errores y traps

Los errores de dominio se señalan con `Runtime.trap`, por lo que llegan al
frontend como un *reject* opaco con el mensaje indicado. Los mensajes
relevantes son: `User is not registered`,
`Unauthorized: Only admins can perform this action`,
`Unauthorized: Only admins can manage suppliers and purchases`,
`duplicateSku: <sku>`, `notFound: part <id>`, `notFound: lot <id>`,
`invalidQuantity`, `insufficientStock: available <n>, requested <m>`,
`Cliente no encontrado`, `Moto no encontrada`, `Orden no encontrada`,
`Transición de estado inválida: <from> -> <to>`,
`El motivo de cancelación es obligatorio`, `La orden ya está cancelada`,
`Una orden entregada no se puede cancelar`,
`La orden está cancelada y no admite cambios`,
`La orden ya fue entregada y no admite cambios`,
`Repuesto no encontrado`, `Línea de repuesto no encontrada`,
`Foto no encontrada`, `La orden ya tiene el máximo de 6 fotos`,
`Solo se puede facturar una orden entregada`,
`La orden está cancelada y no se puede facturar`,
`Factura no encontrada`, `La factura no tiene plan de cuotas`,
`Cuota no encontrada`, `La cuota ya fue pagada`,
`El plan de cuotas es obligatorio para una factura a crédito`,
`El número de cuotas debe ser mayor que cero`,
`Una venta a crédito requiere un cliente registrado`,
`Supplier not found`,
`Purchase not found`, `Purchase does not belong to the supplier`,
`Payment amount must be greater than zero`, `Invoice not found`,
`User not found`, `Cotización no encontrada`,
`Solo se puede convertir una cotización aceptada`, `Servicio no encontrado`,
`duplicateCode: <code>`, `Técnico no encontrado`, `Cita no encontrada`,
`Solo se puede convertir una cita atendida`, `Gasto no encontrado`,
`invalidAmount`, `emptyCart`,
`insufficientStock: part <id>, available <n>, requested <m>`,
`insufficientPayment: total <n>, received <m>`,
`Categoría no encontrada`, `duplicateName: <nombre>`,
`Categoría en uso: <n> servicios activos`, `duplicateCode: <code>`,
`Categoría de gasto no encontrada`, `inUse: <id> (<n> gastos)`,
`notAuthorized`, `nothingToPay`, `Servicio no encontrado`,
`La razón social es obligatoria`, `El número de documento es obligatorio`,
`La dirección es obligatoria`, `La ciudad o departamento es obligatorio`,
`El teléfono es obligatorio`, `El correo electrónico es obligatorio`,
`El número de NIT debe contener solo dígitos`,
`El dígito de verificación del NIT es obligatorio`,
`El dígito de verificación del NIT no coincide con el número de documento`,
`Unauthorized: Only admins can manage receivables`,
`Unauthorized: Only admins can manage supplier orders`,
`La factura no es una cuenta por cobrar a crédito`,
`El monto del abono debe ser mayor que cero`,
`El abono supera el saldo pendiente`,
`La cantidad debe ser mayor que cero`, `Proveedor no encontrado`,
`Unauthorized: Only admins can manage purchase invoices`,
`invalidFile: el archivo de la factura es obligatorio`,
`notFound: factura <id>`,
`invalidState: la factura ya fue confirmada`,
`invalidState: la factura no tiene ítems para confirmar`,
`El código del repuesto es obligatorio`,
`No se pudo leer el archivo de la factura (HTTP <status>)`,
`Cliente no encontrado: <id>`,
`El cliente <id> no tiene correo registrado`,
`El asunto de la notificación no puede estar vacío`,
`El mensaje de la notificación no puede estar vacío`,
`No se pudo enviar la notificación: <detalle>`,
`Google Drive no está configurado: falta GOOGLE_OAUTH_CLIENT_ID`,
`Google Drive no está configurado: falta GOOGLE_OAUTH_CLIENT_SECRET`,
`Google Drive no está configurado: falta GOOGLE_OAUTH_REDIRECT_URI`,
`No se pudo autorizar Google Drive: <detalle>`,
`Google Drive no devolvió un refresh token; vuelve a autorizar la cuenta`,
`No se pudo preparar la carpeta de respaldos en Google Drive`,
`No se pudo subir el respaldo a Google Drive`.

## Notas de integración

- **Listados grandes: usa las consultas paginadas.** Para clientes,
  motocicletas e inventario, el backend resuelve paginación, filtros y
  ordenamiento en una sola llamada por página
  (`listCustomersPage`, `listMotorcyclesPage`, `listParts`) y devuelve los
  datos relacionados ya combinados (conteo de motos por cliente, nombre y
  teléfono del cliente por moto). No hagas una llamada por fila: evita el
  patrón N+1. Carga el detalle individual (`getCustomerDetail`, `getPart`,
  `getOrder`, …) solo cuando el usuario abra un registro.
- `listCustomers`, `listMotorcycles` y `listMotorcycleCountsByCustomers` se
  mantienen por compatibilidad; para listados con cientos de registros prefiere
  las variantes paginadas.
- `exportCustomersAggregated` devuelve todos los clientes con sus motos en una
  sola llamada; es una exportación completa, no un listado de pantalla.
- El precio de costo nunca se expone a un llamador no administrador: llega
  como `0` en `PartView` y la entidad OQL `part` solo es legible por
  controladores.
- `createPurchase` es la única vía que aumenta stock automáticamente además
  de `adjustStock` con dirección `#in_`.
- `createInvoiceFromOrder` copia los datos fiscales del cliente
  (`document` → `customerTaxId`) y la **tasa efectiva vigente** según el
  régimen fiscal de la empresa en el momento de emitir. Solo factura órdenes
  `#delivered`.
- `createPosSale` es **atómico**: valida todo el carrito antes de tocar el
  stock, de modo que una línea inválida no deja descuentos parciales. El
  `taxRate` de la venta y de su factura sale de la **tasa efectiva vigente**
  según el régimen fiscal de la empresa. En crédito la factura nace
  `#pending` con su plan de cuotas; en contado nace `#paid`.
- Las líneas de repuesto de una orden **no descuentan stock**: el inventario
  solo cambia por compras, ajustes y ventas de mostrador. El `unitCost` de la
  línea es un costo de referencia para el margen, no un movimiento.
- Las **cuentas por cobrar** se derivan de las facturas a crédito: no hay una
  tabla propia de cuentas, solo la de abonos (`receivablePayment`). El saldo es
  `invoice.total − suma de abonos`; el vencimiento es la primera cuota del plan
  y el estado se recalcula contra la hora actual en cada lectura. Un abono
  marca como pagadas las cuotas cubiertas en orden de vencimiento, de modo que
  el plan de cuotas de la factura queda consistente con el saldo.
- Las **cuentas por pagar** (`listPayables`) se derivan de las compras
  pendientes: el vencimiento es la fecha de la compra pendiente más antigua más
  **30 días** de plazo, y el estado es `#overdue` cuando el saldo es mayor que
  cero y el vencimiento ya pasó. No hay una tabla propia de cuentas por pagar.
- Los **servicios de categoría `Servicio de terceros`** no generan línea de
  comisión en ningún cálculo ni reporte (comparación sin distinguir mayúsculas
  ni espacios externos). El comprobante de pago de comisiones conserva en
  `lines` el desglose por servicio, moto (marca, modelo, placa) y fecha del
  servicio.
- `notifyCustomer` envía **correo electrónico**, no WhatsApp: el destinatario
  es el correo registrado del cliente y el backend no admite otro. Un cliente
  sin correo no puede ser notificado.
- El desglose de utilidad `profit` de `getAccountingReport` clasifica las
  líneas de las facturas pagadas por `kind` (`#part` / `#service`); las
  facturas emitidas antes de este cambio se migraron con `kind = #part` y
  `unitCost = 0`, por lo que su costo no aparece en el desglose.
- Los totales de una orden y de una cotización se calculan al leer
  (`OrderTotals`, `QuoteTotals`), no se almacenan; por eso un cambio de
  régimen se refleja de inmediato en ellos. Las facturas y las ventas de
  mostrador **sí** guardan su `taxRate` y `tax` en el momento de emitirse y no
  se recalculan después.
- `getInventoryValuation` calcula el costo con el **precio de costo del
  repuesto** (`part.costPrice × existencia`), no con el costo unitario de cada
  lote; la existencia sigue siendo la suma de las cantidades de los lotes en
  bodega. El valor de venta usa el `salePrice` **vigente** del repuesto, no el
  precio al que se compró. La importación de CSV fija la existencia de cada
  repuesto importado, por lo que el informe refleja el inventario real
  completo, incluidos los repuestos sin existencia (`units = 0`).
- `getCompanyProfile` es legible por cualquier llamador; solo
  `updateCompanyProfile` exige administrador.
- El perfil de empresa es de **fila única**: `updateCompanyProfile` reemplaza
  el perfil completo, no hace actualización parcial. Envía siempre todos los
  campos fiscales y de contacto.
- El dígito de verificación del NIT se valida solo cuando
  `documentType = #nit`; para cédula de ciudadanía o de extranjería
  `checkDigit` puede ser `null`.
- Una línea de mano de obra vinculada a un servicio conserva `serviceId` para
  trazabilidad; el precio de la línea es independiente de la tarifa del
  servicio y puede editarse tras seleccionarlo.
- El respaldo sube el JSON al Drive **del propio administrador** (alcance
  `drive.file`): el backend no guarda copia de los bytes, solo las credenciales
  OAuth. La carpeta destino se busca por nombre y se crea si no existe. El
  respaldo es **manual**: no hay respaldo programado ni restauración desde un
  archivo de Drive.
- `downloadLocalBackup` es la alternativa **local** al respaldo en la nube: no
  requiere conexión con Google Drive ni configuración OAuth, y devuelve el
  mismo JSON que `createBackup` para que el usuario lo guarde en su equipo. El
  backend no conserva el archivo: la descarga la realiza el frontend con el
  texto devuelto. No hay restauración desde el archivo descargado.
- `createBackup` y `listBackups` devuelven `#err(#notConnected)` cuando no hay
  conexión o la autorización expiró, y `#err(#driveFailed(<detalle>)` cuando
  Google Drive falla; el frontend debe distinguir «volver a conectar» de
  «reintentar».
- Las credenciales OAuth del administrador se guardan en el estado estable y
  **no** se exponen por la API ni por OQL: la entidad `driveCredential` solo
  publica el correo, la fecha de conexión y si hay `refreshToken`.
";
    doc
  };
};
