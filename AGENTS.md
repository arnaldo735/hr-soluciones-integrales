# Project Guidance

## User Preferences

- Toda la interfaz en español (Colombia)
- No afectar funcionalidad ya construida ni los datos ya cargados
- Los montos se manejan en centavos enteros
- Interfaz bonita y organizada profesionalmente, con colores relacionados con mecánica y repuestos
- Las notificaciones de WhatsApp abren WhatsApp con un mensaje prellenado editable
- Importación y exportación en Excel (no solo CSV)
- Todos los formatos generados imprimibles en A4 y tirilla pos 80mm
- La utilidad por servicio se calcula como valor cobrado menos la comisión del técnico
- Las facturas de compra se pueden cargar en PDF o foto para actualizar el inventario
- Prioridad absoluta a la velocidad de apertura de los listados con cientos de registros
- Paginación, filtros y ordenamiento resueltos en el backend
- Caché de datos compartidos y actualización solo tras crear, editar o eliminar
- Debounce en búsqueda y filtros
- Estados de carga, cancelación de solicitudes obsoletas y manejo de errores

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- listPartFacets() devuelve { categories, brands } distintos en un solo recorrido; el frontend debe filtrar los valores vacíos o solo-espacios (value.trim() !== '') antes de renderizar los SelectItem de Radix, porque un SelectItem con value='' lanza 'A <Select.Item /> must have a value prop that is not an empty string' y deja la página en blanco.
- invalidateQueries({queryKey:['parts']}) invalida por prefijo la clave ['parts','facets'], así que la invalidación de facets queda cubierta sin una llamada explícita.
- Los bindings del frontend (backend.did.js/.d.ts) se generan con `pnpm bindgen` a partir de src/backend/dist/backend.did, que solo existe tras `mops build`; por eso su regeneración corresponde a la fase de check.
- El preflight local de E2E puede devolver status inconclusive cuando un flujo de descarga (xlsx) no es observable en la evidencia del navegador; es un pass registrado, no un bug de la app, y no debe reintentarse ni repararse.
- Para que las librerías pesadas (jspdf, jspdf-autotable, exceljs, recharts) no entren en el chunk de arranque ni en el de una página, no basta con que lib/pdf.ts o lib/xlsx.ts usen import() dinámico: cada página que las importe como valores debe convertirse también a loadPdfLibs()/loadExcelJs() y a import type para los tipos.
- En App.tsx con TanStack Router, envolver cada página en React.lazy dentro de un helper que añade Suspense mantiene intactos los guards adminOnly y las rutas, y cada pantalla queda como chunk propio.
- Verificación de code-splitting: en dist/assets, jspdf.es.min y jspdf.plugin.autotable deben ser importados solo por el chunk pdf-*.js vía import() dinámico; index.es-*.js es un módulo interno de jspdf y no cuenta como violación; los imports type-only se borran en el build.
- El preflight local de E2E puede devolver status inconclusive cuando un flujo apunta a un método de backend sin superficie en la interfaz (p. ej. getApiDoc, que no tiene ruta ni enlace); es un pass registrado, no un bug de la app, y no debe reintentarse ni repararse.
- Los listados de clientes, motos e inventario usan consultas paginadas del backend (listCustomersPageDir, listMotorcyclesPageDir, listPartsDir) con clave de React Query como string estable que codifica filtro/orden/dirección/página; nunca reconstruir la clave como arreglo nuevo.
- La dirección de orden se resuelve en el backend invirtiendo el arreglo completo ordenado antes de cortar offset/limit; invertir solo los items de la página cargada da un orden incorrecto entre páginas.
- El conteo de motos por cliente, el propietario por moto y el stock por artículo vienen incluidos en la misma respuesta de página; no se hace ninguna llamada por fila.
- La exportación de clientes usa exportCustomersAggregated() en una sola llamada; el fan-out de listMotorcycles por cliente quedó eliminado.
- El listado de motos vive en /motos (MotorcyclesPage) y se registra en App.tsx con createRoute + adminOnly(lazyPage(...)) más una entrada en NAV_FLOWS del sidebar.
- Un Input de filtro de texto que llama a applySearch en onChange dispara una solicitud por tecla; debe compartir el debounce de 300 ms del buscador principal.
- getApiDoc debe documentar también las variantes *Dir (listCustomersPageDir, listMotorcyclesPageDir, listPartsDir) con su parámetro descending, no solo las versiones ascendentes.
- WhatsAppNotifyButton es un componente compartido usado por 13 páginas más ContactDocumentPreview; quitar el botón de una sola página se hace eliminando su inyección en DataTable rowExtraActions, no editando el componente.
- Al quitar un control de una página hay que eliminar también los imports que quedan huérfanos (Biome noUnusedVariables es error) y actualizar los tests de esa página que aún asertaban el control removido.
- El preflight local de E2E puede devolver status inconclusive con reason tester_error (reporte persistido inválido) cuando falla el formato del reporte del tester; es un pass registrado, no un bug de la app, y no debe reintentarse ni repararse.
- El botón de WhatsApp se ha quitado de los listados de Servicios, Clientes y Proveedores y de la ficha de detalle del cliente; sigue presente en órdenes, cotizaciones, facturas, POS, citas, cuentas por cobrar y la ficha de proveedor.
- En CustomersPage el botón de WhatsApp se renderiza inline dentro del componente memoizado CustomerRow (no vía rowExtraActions); al quitarlo hay que eliminar también el useMemo de attachment y los imports huérfanos.
- En CustomerDetailPage el import de @/hooks/use-whatsapp (customerContactDocument, motorcycleRow) alimenta la ficha imprimible 'Ver ficha', no el botón de envío; debe conservarse al remover solo el botón de WhatsApp.
- Al quitar un control de fila hay que actualizar TODOS los tests que hacen clic en su ocid, no solo el archivo de test de la página; los getByTestId obsoletos lanzan y fallan la suite. El patrón correcto es reemplazarlos por queryByTestId(...).toBeNull().
- El botón de WhatsApp se ha quitado de los listados de Servicios, Clientes y Proveedores y de las fichas de detalle de cliente y de proveedor; sigue presente en órdenes, cotizaciones, facturas, POS, citas, cuentas por cobrar y sus fichas de detalle.
- En SupplierDetailPage el import de @/hooks/use-whatsapp (supplierContactDocument) alimenta la ficha imprimible 'Ver ficha' vía ContactDocumentPreview, no el botón de envío; debe conservarse al remover solo el botón de WhatsApp.
- Al quitar un control de fila o de cabecera hay que actualizar TODOS los tests que hacen clic en su ocid; el patrón correcto es reemplazarlos por queryByTestId(...).toBeNull() para fijar la ausencia sin romper la suite.
