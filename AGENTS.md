# Project Guidance

## User Preferences

- Interfaz completamente en español (Colombia)
- Montos en centavos enteros COP, sin decimales
- No romper funcionalidad ni datos existentes
- Diseño responsive: la app se usa desde celular
- Los buscadores ignoran mayúsculas y tildes (á=a, é=e, ñ=n, ü=u)
- Los selectores de servicios e inventario solo muestran resultados al escribir un término de búsqueda, no listan todo por defecto
- Mostrar un mensaje claro cuando una búsqueda no arroje resultados

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- El diálogo de recordatorios se monta en Layout.tsx (shell autenticado) y usa sessionStorage 'hr-reminders-dismissed' para no reaparecer tras cerrarlo; el listener de visibilitychange se registra dentro del efecto y se limpia en su return.
- getRemindersSummary(token) agrega pendientes reutilizando ReceivablesLib.listReceivables y PurchasingLib.listPayables; el gating por módulo se resuelve sección a sección con UsersLib.canAccessModule y las secciones no autorizadas se devuelven como null.
- El momento de finalización de una orden #ready se toma de la última transición a #ready en statusHistory y, si no existe, de updatedAt; los días transcurridos se calculan con Time.now() en nanosegundos dividido entre 24h.
- En un literal Text de Motoko que contiene Markdown, toda comilla doble interna debe escaparse como \" o el literal termina antes de tiempo y produce M0097/M0057 en el mixin.
- Una constante de módulo como 24 * 60 * 60 * 1_000_000_000 se infiere Nat y la multiplicación no es estática, lo que falla con M0014; hay que escribir el valor como literal Int (86_400_000_000_000).
- Los selectores tipo búsqueda (ServicePicker, AddPartDialog, QuoteDetailPage, PosPage) pasan enabled: term.length > 0 a useServices/useParts, de modo que el catálogo nunca se lista por defecto; useParts se usa solo en esos selectores, mientras useServices se comparte con páginas paginadas y necesita un flag enabled opt-in.
- El tipo generado RemindersSummary exige generatedAt y usa finishedOrders/daysInWorkshop, ReminderOrder.id y ReminderQuote.id.
- Las filas de citas y cotizaciones del diálogo de recordatorios muestran el estado crudo en inglés (scheduled/confirmed/draft/sent); conviene mapearlo a etiquetas en español como el resto de la app.
- El encabezado de documentos se comparte en tres rutas de PDF: drawHeader (comisiones), drawContactHeader rama A4 y rama tirilla; cualquier dato nuevo de empresa debe agregarse a las tres, además de PdfCompany/pdfCompanyFromProfile.
- ContactDocumentPreview arma su propia línea de contacto en lugar de reutilizar companyContactLine, por lo que cada campo nuevo de empresa debe agregarse también allí.
- En drawContactHeader el avance del cursor debe ser lineHeight × splitTextToSize(...).length por bloque; un incremento fijo subestima el texto que hace wrap y apila el bloque siguiente encima.
- En la tirilla 80mm el encabezado de pantalla necesita w-full + min-w-0 en el bloque de identidad y gap explícito; sin w-full el texto largo desborda los 74mm y se encima con el bloque de título.
- WarrantyDocument.tsx duplica el markup del encabezado de DocumentPreview, así que cualquier corrección de layout del encabezado debe aplicarse en ambos archivos.
- Existen 170 fallos de prueba preexistentes no relacionados (drift de firma de actor: argumento null inicial extra en llamadas de listado) en 47 archivos de páginas ajenas al encabezado; el subconjunto de encabezado/documentos está verde.
- Text.toLower() de Motoko NO convierte vocales acentuadas mayúsculas (Á, É, Í, Ó, Ú, Ü, Ñ); la normalización compartida en src/backend/lib/search.mo debe plegar tildes sobre el texto crudo (reconociendo mayúscula y minúscula) y aplicar toLower() al final, o esos caracteres sobreviven y rompen la búsqueda insensible a tildes.
- En React Query v5, isLoading es false durante el refetch de una query key nueva cuando ya hay datos en caché; para no mostrar resultados obsoletos ni un 'sin resultados' prematuro hay que gatear con isFetching y con la comparación término vivo vs término debounced.
- invalidateQueries({queryKey:['parts']}) hace prefix-match con ['parts','picker',term], así que el buscador del POS ya se refresca tras una venta o un cambio de inventario sin cambiar la clave.
- El prompt de término vacío del POS debe usar el valor vivo de search (no el debounced) para que al borrar el campo aparezca de inmediato sin esperar los 250ms.
- pnpm fix (biome check --write src) reformatea también archivos de prueba; si un dispatch prohíbe editar tests, hay que revertir ese churn con git checkout para no dejar cambios no autorizados.
- En el POS, el buscador de clientes debe seguir listando todo el directorio cuando el término está vacío (contrato protegido por PosPage.customer.test.tsx); a diferencia de productos/servicios, NO se gatea la consulta por término no vacío. El defecto real es mostrar resultados obsoletos o 'sin resultados' prematuro durante el debounce/refetch, corregido con un guard isCustomerSearchPending análogo a isPartSearchPending.
- El estado vacío del buscador de clientes del POS debe comparar contra el término debounced (no el vivo) para ser consistente con la consulta que realmente se ejecuta.
- PosPage.customer.test.tsx tiene mocks con firma desviada: listCustomersMock.mockImplementation((search) => ...) recibe el token como primer argumento, por lo que sus aserciones de búsqueda y de estado vacío no reflejan el contrato real (token, search).
- En PosPage.tsx el buscador de clientes importa useCustomers desde @/hooks/use-customers (firma correcta (token, search)); la copia duplicada en use-orders.ts no la usa el POS.
- El defecto del buscador de clientes del POS era el gating de render: el guard de carga y el estado vacío comparaban contra customerSearch (término vivo) mientras la consulta corre sobre debouncedCustomerSearch; ahora el estado vacío compara contra el término debounced y se suprime cuando customersQuery.isError.
- El backend de búsqueda de clientes ya era correcto: listCustomers normaliza el término una vez y matchesSearch compara nombre/teléfono/documento con Search.contains (normaliza ambos lados) y placas pre-normalizadas en platesByCustomer.
