# Project Guidance

## User Preferences

- Interfaz completamente en español (Colombia)
- Montos en centavos enteros COP, sin decimales
- No romper funcionalidad ni datos existentes
- Diseño responsive: la app se usa desde celular
- Mantener la identidad visual 'Taller Nocturno' (tokens semánticos, sin colores crudos)
- El panel principal usa tarjetas de alerta clicables con conteo y mensaje en español
- Todo el contenido de las alertas del panel debe abrirse en modales dentro del mismo marco del panel, sin navegar a otra ruta

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- El backend calcula el saldo pendiente de una OT como balance = if (charged >= total) { 0 } else { total - charged } (charged = anticipo + abonos), acotado a 0; el frontend debe replicar ese acotamiento o muestra saldos negativos y mensajes de límite confusos.
- En OrderDetailPage el saldo pendiente se deriva de la orden (total − anticipo − abonos) y no de totals.balance, porque los fixtures de prueba fijan totals.balance al total sin descontar el anticipo.
- useAddOrderPayment debe invalidar ['order-payments', id] además de ['order', id]; el saldo pendiente del detalle de OT se deriva de esa consulta y no de order.payments.
- La queryKey de useOrderPayments usa id?.toString() ?? 'none'; la invalidación debe usar view.order.id.toString() para coincidir exactamente.
- addOrderPayment exime el tope de saldo pendiente solo cuando totals.total > 0, replicando la exención de total 0 de ensureAdvanceWithinTotal; la comparación estricta > conserva la aceptación de un abono igual al saldo.
- El frontend OrderDetailPage replica la exención de total 0 en handleSavePayment y el acotamiento del saldo a 0 para coincidir con computeTotals del backend.
- La suite completa pnpm test sigue con ~145 fallos preexistentes en el frontend y ~125 en la lane PocketIC (firmas de actor con token inicial obsoleto); no bloquean el despliegue pero conviene reconciliarlos.
- Los saldos de turnos abiertos se derivan en vivo desde cashMovements con withLiveBalances en listOpenShifts/getOpenShift/getShift/getDailyShiftReport; closeShift usa shiftTotals con la misma agregación, así que anticipos (#advance) y ventas POS (#pos) se reflejan sin cerrar el turno.
- invalidateCashData invalida la familia ['cash'] por prefijo, cubriendo useOpenShifts (['cash','open-shifts']) que alimenta CashBalancesPanel; úsalo en cualquier mutación que escriba un movimiento de caja en lugar de invalidar ['cash'] o ['cashMovements'] ad hoc.
- La clave ['cashMovements'] no coincide con ninguna query (la real es ['cash','movements',...]), por lo que invalidarla es un no-op silencioso.
- Una venta POS de contado nace con factura #paid y registra su movimiento #pos en createPosSale; markInvoicePaid la rechaza, evitando doble movimiento.
- La suite completa pnpm test sigue con ~144 fallos preexistentes en el frontend y ~125 en la lane PocketIC (firmas de actor con token inicial obsoleto); no bloquean el despliegue pero conviene reconciliarlos.
- La preflight local de este build verificó en navegador el panel de Caja y Bancos: el saldo de Caja subió de $100.000 a $150.000 tras registrar un ingreso sin cerrar el turno, y el cierre calculó el esperado correctamente (Diferencia $0).
- DocumentLine.unitPrice/amount se expresan en PESOS; DocumentPreview los reescala a centavos con formatMoney(BigInt(Math.round(line.unitPrice * 100))). Cualquier productor de DocumentLine (p. ej. ShiftReportDialog.reportDocument) debe convertir centavos del backend a pesos (÷100) antes de construir la línea, o el monto se muestra inflado ×100.
- El bloque de totales del informe de cierre usa formatMoney directamente sobre centavos del backend (una sola división /100), por eso la sumatoria era correcta aunque las líneas estuvieran infladas.
- Al buscar un ítem en OT, cotizaciones, POS y facturas se elige la cantidad antes de anexarlo y la línea nueva queda de primera: el backend de OT antepone con [line].concat(order.parts/labor), y cotizaciones/POS anteponen en su estado local.
- Las facturas son inmutables (el backend no expone operación para anexar/editar líneas); su buscador de ítems transporta addPartId/addServiceId/addQuantity por query params al documento de origen (OT /ordenes/$id, POS /pos, cotización vía /cotizaciones) donde la línea se anexa de primera.
- Las rutas /ordenes/$id, /cotizaciones/$id, /pos y /cotizaciones usan validateSearch con claves opcionales (addPartId?, addServiceId?, addQuantity?); declararlas opcionales evita exigir search={{}} en cada Link/navigate.
- LaborItem no tiene campo quantity: AddLaborDialog pliega la cantidad en price (precio unitario × cantidad) y la OT muestra la línea como quantity 1 con el total; los totales son correctos pero la cantidad no se muestra como factor.
- La preflight local de este build quedó inconclusa (tester_error, child_transport): no se pudo verificar en navegador el flujo de cantidad previa y línea de primera; el typecheck y el build sí pasan.
- persistInvoice es el punto único de creación de facturas (OT, cotización y POS): registrar el movimiento de una factura de contado ahí cubre los tres flujos sin duplicar lógica.
- convertQuoteToInvoice debe enrutar por BillingLib.persistInvoice (no construir la factura inline): persistInvoice registra el cobro de contado en Caja y Bancos como #income/#invoice y marca la factura #paid, evitando el doble cobro por markInvoicePaid.
- Para que un lib de dominio (quotes.mo) registre movimientos de caja, su State debe incluir cashRegisters/shifts/cashMovements y sus Counters nextCashMovementId/nextShiftId/nextCashRegisterId; el mixin y main.mo deben reenviar esos mapas y el mismo registro de counters.
- Cualquier mutación que escriba un movimiento de caja debe llamar invalidateCashData; useConvertQuoteToInvoice y la mutación createInvoiceFromOrder de InvoicesPage.tsx ahora lo hacen en onSuccess.
- La preflight local de este build quedó inconclusa (infra): la ruta de detalle de OT /ordenes/$id crasheó el navegador del tester, por lo que no se pudo verificar en navegador el registro de la venta de OT en Caja y Bancos; el typecheck, el build y la revisión de código sí pasan.
