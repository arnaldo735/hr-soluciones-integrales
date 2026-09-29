# Design Brief

## Direction

Taller Nocturno — an industrial-precision operations console for a motorcycle parts warehouse and repair workshop, dark-first and built for dense scanning; now refreshed around an explicit mechanic / spare-parts identity (taller green, tool amber, graphite-steel neutrals) and extended with the operation panel's company nameplate and flow shortcuts.

## Tone

Industrial/utilitarian tooling — precision instruments and engineer's logbooks, not a friendly consumer dashboard; the interface should feel calibrated, not decorated.

## Differentiation

Monospaced "data rails": every SKU, barcode, lot/serial number, plate, quote number, and consecutive invoice number is set in tabular JetBrains Mono, so the app reads like a machine-shop ledger rather than a generic SaaS table.

## Color Palette

| Token       | OKLCH          | Role                                                          |
| ----------- | -------------- | ------------------------------------------------------------- |
| background  | 0.165 0.012 85 | warm graphite-steel base (dark-first)                         |
| foreground  | 0.94 0.008 85  | warm off-white text                                           |
| card        | 0.205 0.013 85 | elevated panel surface                                        |
| primary     | 0.78 0.16 152  | taller green — active nav, primary actions, company rail      |
| accent      | 0.8 0.15 72    | tool amber — warnings, attention states, Catálogo flow        |
| muted       | 0.25 0.014 85  | inert surface / secondary rows                                |
| destructive | 0.62 0.19 27   | errors, deletions, overdue balances                           |
| success     | 0.72 0.16 148  | paid, delivered, in-stock                                     |
| status-*    | per family     | 10 state families for cotización, cita y gasto (see below)    |
| sheet       | 0.995 0.002 85 | printable document paper — always light, both modes           |
| counter     | 0.19 0.012 85  | POS counter surface, distinct from generic card               |

Status families (each has a `-foreground` pair; both modes stay AA+): `draft` neutral grey, `sent`/`scheduled` blue 240, `accepted`/`confirmed` green 148, `pending` amber 78, `rejected` red 27, `expired` orange 42, `cancelled` desaturated grey 30, `attended` teal 190, `noshow` magenta 330.

## Typography

- Display: Space Grotesk — wordmark, page titles, section headings, KPI numbers
- Body: DM Sans — labels, table cells, forms, body copy
- Mono: JetBrains Mono — SKU, código de barras, lote/serie, placa, N° cotización/factura, currency (`.data-rail`)
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-sm`, counter total `.counter-total` (`text-3xl font-mono font-bold tabular-nums`)

## Elevation & Depth

Depth comes from layered surfaces and hairline borders, not shadows: `bg-background` → `bg-card` → `bg-muted/40`, separated by 1px `border-border`; shadows (`shadow-elevated`, `shadow-sheet`) are reserved for popovers, dialogs, dropdowns, and the floating document preview only.

## Structural Zones

| Zone            | Background            | Border           | Notes                                                          |
| --------------- | --------------------- | ---------------- | -------------------------------------------------------------- |
| Sidebar         | `bg-sidebar`          | `border-r`       | 6 collapsible flow groups; active child: green left rail + `bg-sidebar-accent` + green text |
| Header          | `bg-card/95` backdrop | `border-b`       | Wordmark, global search, role badge, user menu                  |
| Content         | `bg-background`       | —                | Alternate `bg-muted/30` section bands; 24px hairline grid optional |
| Panels          | `bg-card`             | `border`         | Tables, forms, order detail; 6px radius                         |
| POS counter     | `bg-counter`          | `counter-border` | Two-column: product search/results left, cart + totals right    |
| Document sheet  | `bg-sheet`            | `sheet-border`   | Always light paper; A4 210×297mm or tirilla 80mm                |
| Calendar cell   | `bg-card`             | `calendar-grid`  | Weekend `calendar-weekend`, today inset `calendar-today` ring   |
| Footer          | `bg-muted/40`         | `border-t`       | Build/version + session info, low emphasis                      |

## Spacing & Rhythm

Dense and deliberate: 16px page gutters, 24px section gaps, 12px panel padding, 8px control gaps; table rows at 40px with 12px horizontal cell padding for scanning density; POS results rows at 36px and cart lines at 48px.

## Component Patterns

- Buttons: 6px radius, `bg-primary` lime with dark text for primary; `variant="outline"` with hairline border for secondary; destructive red only for delete/void actions
- Cards: 6px radius, `bg-card`, 1px `border-border`, no shadow; KPI cards use a 2px left accent rail
- Badges: pill, `text-xs font-medium`; use `.badge-status` + one variant class (`.badge-draft`, `.badge-sent`, `.badge-accepted`, `.badge-pending`, `.badge-rejected`, `.badge-expired`, `.badge-cancelled`, `.badge-scheduled`, `.badge-confirmed`, `.badge-attended`, `.badge-noshow`)
- Tables: sticky header row in `bg-muted/50`, uppercase 11px labels, zebra `bg-muted/20`, mono for codes and amounts; row actions cluster `.row-actions` reveals on row hover/focus
- Row actions: `.row-action` icon buttons in order editar, guardar, cancelar, eliminar; eliminar uses `data-variant="destructive"` and always confirms first
- Navigation: `.nav-group-header` with `.nav-group-chevron` (rotates 90° when open); `.nav-child` with `data-active="true"` for the lime rail; expansion state persists for the session
- POS: `.counter-panel` for cart/totals, `.counter-scan` for the barcode input, `.counter-total` for the live total; cart lines enter with `animate-cart-line-in`
- Document preview: `.doc-preview` plus `.doc-preview-a4` or `.doc-preview-80mm`; `.doc-rule` dashed separators, `.doc-meta` for muted header/footer fields; chrome marked `.no-print`
- Calendar: `.calendar-grid` 7-column, `.calendar-cell` with `data-today` / `data-weekend`, `.calendar-event` chips tinted by the cita status family
- Status stepper: 4-step horizontal stepper (Recibida → En Reparación → Lista → Entregada) with lime filled current step

## Motion

- Entrance: `animate-fade-in` 250ms on page/panel mount; staggered 40ms for list rows; `animate-sheet-in` for the document preview
- Hover: `transition-smooth` 300ms on buttons, rows, and nav items; row hover shifts to `bg-muted/40` and reveals `.row-actions`
- POS: `animate-cart-line-in` / `animate-cart-line-out` on cart mutations; `animate-scan-flash` on a successful barcode read
- Decorative: `animate-pulse-low` only on low-stock indicators; no ambient or looping motion elsewhere

## Constraints

- Spanish-language UI copy throughout; all user-facing strings in Spanish
- Dark mode is the primary designed experience; light mode is a warm paper variant — both must stay AA+
- The sidebar has exactly 6 flows (Panel, Taller, Catálogo, Ventas, Compras, Administración); no seventh group
- Never expose cost prices, purchases, accounts payable, or reports to the mechanic role — those surfaces must not be visually implied on mechanic views
- Print surfaces (`.invoice-sheet`, `.doc-preview`) are always light paper regardless of theme; app chrome carries `.no-print`
- No email/reminder affordances anywhere in the UI — documents are printed or downloaded only
- Semantic tokens only — no raw hex, `rgb()`, or arbitrary color classes in components

## Signature Detail

The monospaced data rail (`.data-rail`) — tabular-mono codes and amounts aligned in columns, with a lime left-edge rail marking the active navigation item, giving the whole system the feel of a calibrated instrument panel.

---

# Addendum — Valoración de inventario (Contabilidad)

## Scope

New section rendered INSIDE `/contabilidad`, directly below the existing period report. It is a **snapshot of current inventory** — no date filter, no period presets. No new route, no new nav entry, no new tokens.

## Direction

An "inventory valuation statement" — the same calibrated ledger voice as the rest of Contabilidad, but read as a stocktake sheet: what the bodega is worth right now, at cost and at sale, and the margin still unrealized on the shelf.

## Section Header

- `h2` `text-xl font-semibold tracking-tight` + the label pattern `text-xs font-semibold tracking-widest uppercase text-muted-foreground` above it.
- Snapshot note sits inline next to the title in `text-xs text-muted-foreground`: "Foto del inventario actual — sin filtro de fechas". Optionally a `Badge` `variant="outline"` reading "Al día de hoy".
- Header row also carries the primary action `Exportar valoración CSV` (`variant="outline"`, `Download` icon) right-aligned — mirrors the existing ledger CSV export.

## Summary Cards (4)

Reuse the **existing KpiCard** pattern: `bg-card`, 1px `border-border`, 6px radius, no shadow, **2px left accent rail**. Values use `font-display` + `.tabular`; monetary values use `.data-rail`.

| Card | Value | Rail / accent | Notes |
| --- | --- | --- | --- |
| Valor de costo | `formatMoney(costoTotal)` | `primary` (lime) | Sum of `cantidad × costo unitario del lote` |
| Valor de venta | `formatMoney(ventaTotal)` | `chart-3` (blue 240) | Projected sale value of stock on hand |
| Margen de utilidad | `formatMoney(margen)` + `%` | `success` (148) when ≥ 0, `destructive` (27) when < 0 | Show `$` on the value line, `%` as a small `text-xs text-muted-foreground` suffix |
| Repuestos valorados | `formatNumber(unidades)` | `accent` (amber 75) | Secondary line: `N repuestos` (distinct SKUs) |

- Grid: `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`.
- Margin card must never rely on color alone: pair the rail color with a `+`/`−` sign and a `TrendingUp`/`TrendingDown` icon.

## Category Breakdown Panel

Reuse the **existing BreakdownPanel** pattern (same shell as the expense-category and payment-method panels).

- One row per categoría, sorted by **valor de venta descending**.
- Row: categoría name (`text-sm`), then three mono amounts — costo, venta, margen — in `.data-rail`, right-aligned, `tabular`.
- Below each row a **share bar**: track `bg-muted`, fill `bg-primary` at the category's share of total valor de venta; height 4px, `rounded-full`. Share `%` printed at the row end in `.data-rail text-xs text-muted-foreground`.
- Category swatch dot may cycle `chart-1`…`chart-5` for visual separation; do not introduce new hues.
- Empty state: "Sin categorías con inventario valorado."

## Per-Part Table

Reuse the **existing DataTable** pattern: sticky header `bg-muted/50`, uppercase 11px labels, zebra `bg-muted/20`, 40px rows, 12px cell padding.

| Column | Treatment |
| --- | --- |
| SKU | `.data-rail` mono |
| Nombre | `text-sm`, truncate with title tooltip |
| Categoría | `text-xs text-muted-foreground` |
| Existencia | `.data-rail tabular` right-aligned |
| Costo unitario promedio | `.data-rail` right-aligned |
| Valor de costo | `.data-rail` right-aligned |
| Valor de venta | `.data-rail` right-aligned |
| Margen $ | `.data-rail` right-aligned; `text-success` ≥ 0, `text-destructive` < 0, always signed |
| Margen % | `.data-rail` right-aligned; same signed color rule |

- Controls above the table: search input (nombre o SKU) + categoría `Select`; both reflected in the URL query string, and a "Limpiar filtros" text button when either is active.
- Numeric columns sortable; sort indicator uses the existing `ChevronUp`/`ChevronDown` muted pair.
- States: loading = `Skeleton` rows matching the column count; error = `bg-destructive/10 text-destructive` panel with a `Reintentar` button; empty = centered `text-sm text-muted-foreground` with the active filters echoed.
- Footer row: totals across the **filtered** set, `bg-muted/50`, `font-semibold`, mono amounts.

## Structural Zones (addendum)

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Valuation section | `bg-background` | — | Sits below the period report inside the same Contabilidad content column |
| Summary cards | `bg-card` | `border` | 2px left rail per card, exactly like existing KPI cards |
| Category panel | `bg-card` | `border` | Same BreakdownPanel shell; optional `.surface-grid` at low opacity |
| Parts table | `bg-card` | `border` | Sticky header `bg-muted/50`, zebra `bg-muted/20`, totals footer `bg-muted/50` |

## Constraints (addendum)

- Snapshot semantics: **no** date picker, period preset, or comparison control may appear in this section
- Do NOT build PDF export or historical valuation comparison — CSV export only
- Semantic tokens only; no new OKLCH values, no raw hex, no arbitrary color classes
- Margin color is always paired with a sign and an icon, never color alone
- Spanish copy throughout; all amounts `formatMoney` in COP
- Section must degrade to a single column on mobile with the table horizontally scrollable (`.scroll-slim`)

## Signature Detail (addendum)

The **share bar** under each category row — a 4px lime fill against a muted track, read as a calibrated gauge of where the bodega's value is concentrated; combined with signed mono margin columns, the section reads as an instrument readout rather than a report.

---

# Addendum — Cuentas por cobrar / Cuentas por pagar

## Scope

Two new financial list modules (cobrar, pagar) plus the **notify-customer dialog** and the **supplier-order modal**. No redesign: same "Taller Nocturno" tokens, typography, and components. New tokens are limited to three financial status families and their badge/summary utilities.

## New Tokens (extend, do not replace)

| Token family | Light | Dark | Role |
| --- | --- | --- | --- |
| `status-open` | 0.66 0.15 78 | 0.78 0.16 75 | Saldo pendiente / por vencer (amber) |
| `status-overdue` | 0.58 0.22 25 | 0.66 0.21 25 | **Vencida** — overdue/danger emphasis, hotter than `rejected` |
| `status-settled` | 0.55 0.14 148 | 0.72 0.16 148 | Pagada / saldada (green) |

- Utilities added in `@layer utilities`: `.badge-open`, `.badge-overdue`, `.badge-settled`, `.accounts-summary`, `.accounts-card[data-emphasis]`, `.accounts-card-label/-value/-meta`, `.filter-chips`, `.filter-chip[data-active]`, `.filter-chip-count`, `.due-overdue`, `.due-overdue-days`.
- `--destructive` is unchanged; `status-overdue` is the financial danger emphasis and must not be swapped for `destructive` inside badges.

## Financial List Pattern (cobrar / pagar)

Shared layout, mirrored between the two modules (cliente/factura vs proveedor/referencia).

1. **Page header** — reuse `PageHeader`: label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, `h1` `text-xl font-semibold tracking-tight`, plus the primary action right-aligned (`variant="outline"`, `RefreshCw`/`FileText` icon).
2. **Summary cards row** — `.accounts-summary` grid (`sm:grid-cols-2 xl:grid-cols-4`), `.accounts-card` with a 2px left rail:
   - Total por cobrar / pagar → `data-emphasis="primary"` (lime), value `.data-rail`.
   - Total vencido → `data-emphasis="overdue"`, value colored `status-overdue`, always paired with a `TriangleAlert` icon and the count of vencidas (never color alone).
   - Total saldado → `data-emphasis="settled"`.
   - Cuentas abiertas → neutral rail, value `.accounts-card-value`, meta line `N vencidas`.
3. **Controls row** — `.filter-chips` segmented control (Todas / Pendientes / Vencidas / Pagadas) each with `.filter-chip-count`, plus a debounced (250ms) search field (`Search` icon, placeholder "Buscar por cliente o N° de factura" / "…proveedor o referencia"). **Both filter and search live in the URL query string** and survive reload.
4. **Table** — reuse `DataTable`: sticky header `bg-muted/50`, uppercase 11px labels, zebra `bg-muted/20`, 40px rows, 12px cell padding, `.scroll-slim` horizontal scroll on mobile.
   - Columns: contraparte (`text-sm`, truncate), documento/referencia (`.data-rail` mono), monto total (`.data-rail` right), saldo pendiente (`.data-rail` right, `font-semibold`), vencimiento (`.due-overdue` + `.due-overdue-days` "hace N días" when overdue), estado (`.badge-status` + variant), acciones.
   - Actions: `Registrar abono` / `Registrar pago` (primary, `Banknote` icon), `Notificar al cliente` (outline, `MessageCircle` icon), `Ver detalle` (ghost).
   - Footer totals row across the **filtered** set: `bg-muted/50`, `font-semibold`, mono amounts.
   - States: loading `Skeleton` rows matching column count; error `bg-destructive/10 text-destructive` panel + `Reintentar`; empty centered `text-sm text-muted-foreground` echoing active filters + "Limpiar filtros".

## Notify-Customer Dialog

Reusable across servicios, órdenes, cotizaciones, facturas y POS mostrador.

- `Dialog` with `shadow-elevated`, 6px radius; title `Notificar al cliente`, description `text-sm text-muted-foreground`.
- Read-only recipient row: cliente name + teléfono/email in `.data-rail`; a `Badge variant="outline"` shows the current estado del servicio.
- Message body: `Textarea` **prefilled and editable** with the Spanish status template (e.g. "Hola {cliente}, le informamos que su {documento} {número} se encuentra {estado}."). Character counter in `.data-rail text-xs text-muted-foreground`.
- Footer: `Cancelar` (outline) + `Enviar notificación` (primary, `Send` icon). Success surfaces as a `toast`; no real WhatsApp delivery is wired.

## Supplier-Order Modal (pedido a proveedor)

- `Dialog` with exactly three fields — **Cantidad** (number, `.data-rail`), **SKU** (`.data-rail`, debounced search against the catalog), **Descripción** (textarea, auto-filled from the selected SKU and editable).
- Compact 2-column grid on `sm:` (cantidad + SKU), descripción full-width; `FormMessage` in `text-xs text-destructive`.
- Footer: `Cancelar` + `Crear pedido` (primary). No price, no totals, no additional fields.

## Structural Zones (addendum)

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Module content | `bg-background` | — | Same Contabilidad/Ventas content column |
| Summary cards | `bg-card` | `border` + 2px left rail | Overdue card tints `status-overdue/5` |
| Filter/controls row | `bg-background` | — | Chips `bg-card`, active chip `bg-primary/10` |
| Financial table | `bg-card` | `border` | Sticky `bg-muted/50` header, zebra `bg-muted/20`, totals footer |
| Notify dialog | `bg-popover` | `border` | `shadow-elevated`, 6px radius |

## Constraints (addendum)

- Reuse existing tokens and components; the only new OKLCH values are the three financial status families above
- Overdue emphasis is always paired with an icon and/or a day count, never color alone
- Spanish (Colombia) copy throughout; amounts `formatMoney` in COP, stored as integer centavos
- No real WhatsApp Business sending, no automatic overdue reminders, no CSV/PDF export in these modules
- Filter and search state persist in the URL; table degrades to horizontal scroll on mobile

## Signature Detail (addendum)

The **vencido rail** — a 2px `status-overdue` left edge on the overdue summary card, echoed by `.due-overdue` mono day counts in the table, so debt age reads as a calibrated warning gauge rather than a red number.

---

# Addendum — Formatos de impresión: A4 y tirilla 80mm

## Scope

Refinement of the existing print/document system (no redesign, no new palette). Covers `.doc-preview-a4`, `.doc-preview-80mm`, `.report-sheet`, `.invoice-sheet`, the print `@page` rules, and the shared tokens used by the new import/export dialogs. Applies to every generated document: fichas de cliente/proveedor, reportes, comprobantes, cotizaciones y facturas.

## Print Geometry (single source of truth)

| Token | Value | Role |
| --- | --- | --- |
| `--doc-a4-width` | `210mm` | A4 page width |
| `--doc-a4-height` | `297mm` | A4 page height (screen `min-height`) |
| `--doc-a4-margin` | `14mm` | A4 content margin — shared by preview padding and `@page` |
| `--doc-80mm-width` | `80mm` | Tirilla roll width |
| `--doc-80mm-margin` | `3mm` | Tirilla side margin — shared by preview padding and `@page` |

- The preview box and the `@page` rule read the **same** custom properties, so on-screen size equals printed size ("lo que se ve es lo que se imprime").
- `.doc-preview-a4` = `width: 210mm; min-height: 297mm; padding: var(--doc-a4-margin)`.
- `.doc-preview-80mm` = `width/max-width: 80mm; padding: 4mm var(--doc-80mm-margin); overflow-x: hidden`.

## @page Rules

| Selector | `size` | `margin` |
| --- | --- | --- |
| `@page` (default) | `A4 portrait` | `var(--doc-a4-margin)` |
| `@page a4` (named) | `A4 portrait` | `var(--doc-a4-margin)` |
| `@page tirilla` (named) | `80mm auto` | `4mm var(--doc-80mm-margin)` |

- Format selection uses **CSS named pages** (`@page` cannot be nested in a style rule): `.doc-preview-a4` / `.report-sheet` / `.invoice-sheet` → `page: a4`; `.doc-preview-80mm` → `page: tirilla`.
- A dialog that prints a roll without `.doc-preview-80mm` can put `.print-80mm` on its print root (`.print-a4` for the A4 case).
- `size: 80mm auto` gives a **continuous roll** — no fixed page height, so long receipts never clip.

## Chrome Hiding (print)

- Chrome is removed with `display: none` — **not** `visibility: hidden` (the old `body * { visibility: hidden }` approach clipped multi-page A4 and forced absolute positioning).
- Hidden: `.no-print`, `[data-print="hide"]`, and the shell zones `nav`, `aside`, `header`, `footer`, `button`.
- The printable root may be marked `[data-print="root"]` (forced `display: block`).
- Sheets are promoted to `position: static`, full width, zero padding, no border/shadow, `background: #ffffff` — natural page flow.

## Pagination & Overflow

- `thead` → `display: table-header-group`; `tfoot` → `display: table-footer-group` (headers/footers repeat per page).
- `tr` and `.doc-keep` / `.report-keep` use `page-break-inside: avoid`.
- 80mm: `.data-rail`/`.tabular` drop letter-spacing; `.doc-value`/`.doc-nowrap-safe` use `overflow-wrap: anywhere` so long SKUs wrap instead of scrolling.
- Under `@media print and (max-width: 90mm)` the roll body is pinned to `74mm` (80mm − 2×3mm).

## Document Format Toggle

- `.doc-format-toggle` — segmented control (`A4` / `Tirilla 80mm`) above the preview; active button `bg-primary/10 text-primary`, inactive `text-muted-foreground`.
- Changing format re-renders the sheet class and updates the print mode on `<html>`.

## Import/Export Dialog Tokens

- `.io-dialog` — `bg-popover`, `border-border`, 6px radius, `shadow-elevated` (same shell as the notify dialog).
- `.io-dialog-dropzone` — dashed `border-input`, `bg-muted/30`; hover/drag → `border-primary/50 bg-primary/5 text-primary`.
- `.io-dialog-hint` `text-xs text-muted-foreground`; `.io-dialog-error` `border-destructive/30 bg-destructive/10 text-destructive`; `.io-dialog-success` `border-success/30 bg-success/10 text-success`.
- `.io-dialog-field` — `dt` muted, `dd` `.data-rail` mono tabular (row counts, filas importadas/exportadas).
- All import/export formats (clientes, proveedores) render through the same `.doc-preview` sheet and honor both A4 and tirilla.

## Structural Zones (addendum)

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Preview canvas | `bg-background` | — | Dark shell; sheets float with `shadow-elevated` |
| A4 sheet | `bg-sheet` | `sheet-border` | Always light paper; 210×297mm, 14mm margin |
| Tirilla sheet | `bg-sheet` | `sheet-border` | Always light paper; 80mm roll, 3mm side margin |
| Format toggle | `bg-card` | `border` | Segmented control, active `bg-primary/10` |
| IO dialog | `bg-popover` | `border` | `shadow-elevated`, 6px radius |

## Constraints (addendum)

- Paper is always light (`--sheet`) in both themes; print forces `#ffffff` background and `#111111` text.
- Semantic tokens only for the UI shell; print CSS may use literal paper black/white/grey because it must not depend on theme.
- No `body * { visibility: hidden }` — chrome hiding is `display: none` only.
- Preview geometry and `@page` geometry must read the same `--doc-*` custom properties; never hard-code a second margin value.
- Spanish (Colombia) copy; amounts `formatMoney` in COP with `.` thousands separator.
- The tirilla must never produce horizontal overflow at 80mm.

## Signature Detail (addendum)

The **format toggle driving the page box** — one segmented control flips both the on-screen sheet and the physical `@page` size, so the A4 ledger and the 80mm roll are the same document rendered at two calibrated scales.

---

# Addendum — Panel de operación: nameplate de empresa y accesos directos por flujo

## Scope

Refresh of the operation panel (`/`, `DashboardPage`): a **centered company information header** at the top and **grouped flow shortcut cards** below it. No new route, no new nav entry. The low-stock list and indicator are removed from the panel (see Constraints). Tokens are refined in place; no token is renamed or removed.

## Company Header (nameplate)

- `.company-header` — `bg-card`, 1px `border-border`, 6px radius, `shadow-company`, 2px `primary` left rail, `.surface-grid` at very low opacity, centered content.
- `.company-header-logo` — 56px mark, `bg-gradient-primary`, `primary-foreground` glyph, 6px radius.
- `.company-header-name` — `font-display text-xl sm:text-2xl font-bold tracking-tight` (razón social).
- `.company-header-legal` — `text-xs uppercase tracking-widest text-muted-foreground`.
- `.company-header-rail` — `flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border pt-4`; each `.company-header-field` shows a muted icon + label and a `.data-rail` value (NIT con dígito de verificación, teléfono, correo, dirección).
- States: loading → `Skeleton` blocks in the same geometry; empty → centered `text-sm text-muted-foreground` "Aún no hay información de la empresa configurada." with a link to Configuración.

## Flow Shortcut Groups

Each flow is a `.flow-group` band: `.flow-group-head` (`.flow-group-icon` + `.flow-group-label` + right-aligned `.flow-group-count`), then a `.flow-shortcuts` grid (`sm:grid-cols-2 xl:grid-cols-3`).

| Flow | Tone | Example shortcuts (name → live metric) |
| --- | --- | --- |
| Taller | `primary` | Órdenes de servicio → órdenes activas; Cotizaciones → cotizaciones abiertas; Reparaciones → en reparación |
| Catálogo | `accent` | Repuestos → total de repuestos; Categorías → categorías activas |
| Ventas | `primary` | Cotizaciones → cotizaciones de hoy; Pedidos → pedidos pendientes |
| Compras | `accent` | Pedidos → pedidos pendientes; Proveedores → proveedores activos |
| Administración | `info` | Cuentas por pagar → saldo pendiente (solo admin); Cuentas por cobrar → saldo pendiente (solo admin) |

- `.flow-shortcut` — `bg-card`, 1px `border-border`, 6px radius, `shadow-shortcut`, 2px tone-colored left rail via `data-tone`; hover `border-primary/40 bg-muted/40` + 1px lift; `focus-visible` ring.
- `.flow-shortcut-icon` tinted by tone (`primary/10`, `accent/15`, `info/10`); `.flow-shortcut-name` `text-sm font-semibold`; `.flow-shortcut-metric` `font-mono text-2xl font-semibold tabular-nums` colored by tone; `.flow-shortcut-caption` `text-xs text-muted-foreground`.
- Role gating: Administración shortcuts render only for admin; mechanic views never imply cost, purchases, or payable surfaces.

## Structural Zones (addendum)

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Company nameplate | `bg-card` | `border` + 2px primary rail | `shadow-company`, centered, `.surface-grid` low opacity |
| Flow group band | `bg-card/60` | `border` | Groups the shortcuts of one business flow |
| Shortcut card | `bg-card` | `border` + 2px tone rail | `shadow-shortcut`; hover lift + `border-primary/40` |
| Panel content | `bg-background` | — | 24px section gaps between nameplate and flow groups |

## Constraints (addendum)

- The low-stock list and low-stock indicator are **removed** from the operation panel — no zone, no placeholder, no nav entry reserved for them
- No accent-color customization control on the panel or in Configuración
- Company header is fed by the configured company profile; never hard-code company data in components
- Amounts are integer centavos rendered with `formatMoney` in COP; `.data-rail` for all codes and amounts
- Spanish (Colombia) copy throughout; responsive single-column on mobile, grid on desktop
- Semantic tokens only — no raw hex, `rgb()`, or arbitrary color classes

## Signature Detail (addendum)

The **centered nameplate** — a green-railed company header whose `.data-rail` fiscal fields (NIT, teléfono, correo, dirección) sit on a hairline grid, turning the panel's first impression into the workshop's engraved machine plate, echoed below by tone-railed flow shortcut cards that read as a switchboard of the business.

---

# Addendum — Acceso con contraseña y gestión de usuarios y roles

## Scope

Two new surfaces: the **password sign-in screen** (replacing the Internet Identity gate as the primary door, II kept as an alternative admin entry) and the **admin user/role management** screens inside `/configuracion`. No redesign and no route churn — same "Taller Nocturno" tokens, typography, and components. New tokens are limited to the auth, role, account-status and temp-password families below.

## New Tokens (extend, do not replace)

| Token family | Light | Dark | Role |
| --- | --- | --- | --- |
| `auth-backdrop` | 0.205 0.02 150 | 0.14 0.022 150 | Branded login backdrop — graphite steel with a taller-green cast |
| `auth-panel` | 0.995 0.003 85 | 0.205 0.013 85 | Centered login card surface (one step off the backdrop) |
| `auth-panel-border` | 0.9 0.006 85 | 0.3 0.014 85 | Login card hairline border |
| `auth-grid` | 0.32 0.02 150 | 0.3 0.02 150 | Hairline grid + top glow on the backdrop |
| `role-admin` | 0.5 0.13 152 | 0.78 0.16 152 | Administrador badge — taller green |
| `role-mechanic` | 0.68 0.15 70 | 0.8 0.15 72 | Mecánico badge — tool amber |
| `role-guest` | 0.55 0.012 82 | 0.62 0.012 82 | Invitado badge — steel grey |
| `role-custom` | 0.55 0.12 240 | 0.7 0.13 240 | Custom role badge — blue 240 |
| `account-active` | 0.55 0.14 148 | 0.72 0.16 148 | Active account pill |
| `account-inactive` | 0.6 0.03 30 | 0.6 0.02 30 | Deactivated account pill |
| `temp-password` | 0.66 0.15 78 | 0.78 0.16 75 | One-time temporary-password reveal panel |

- Utilities added in `@layer utilities`: `.auth-backdrop`, `.auth-card`, `.auth-card-mark/-title/-subtitle/-form/-footer`, `.field-label`, `.field[data-invalid]`, `.field-error`, `.field-hint`, `.auth-alert[data-tone]`, `.badge-role[data-role]`, `.badge-account[data-status]`, `.temp-password-panel/-label/-value/-note`, `.users-toolbar`, `.users-toolbar-search`, `.users-username`, `.users-count`, `.password-meter`.
- Tailwind theme keys added: `auth.*`, `role.*`, `account.*`, `temp-password.*`; keyframes `auth-card-in`, `reveal-in`.
- No existing token is renamed or removed; `--destructive` stays the error color.

## Sign-In Screen (ingreso con contraseña)

- **Backdrop** — `.auth-backdrop` fills the viewport: graphite-steel-green base, 28px hairline grid, and a soft `primary/18` radial glow from the top. The app shell (sidebar/header) must not render on this screen.
- **Card** — `.auth-card` centered (max-w-md, `rounded-lg`), `bg-auth-panel`, 1px `auth-panel-border`, 2px `primary` **top rail**, `shadow-elevated`, `animate-auth-card-in`.
- **Mark** — `.auth-card-mark` (56px, `bg-gradient-primary`) is the same green mark as the company nameplate, reinforcing that this is the workshop's front door.
- **Copy** — title `Iniciar sesión` (`.auth-card-title`), subtitle `Ingrese con su usuario y contraseña` (`.auth-card-subtitle`).
- **Fields** — `Usuario de acceso` and `Contraseña`, both `.field-label`; password field carries a show/hide toggle (`Eye`/`EyeOff`, `aria-label` in Spanish). Submit is full-width primary `Ingresar`; while pending, disabled with a `Loader2` spinner and `Ingresando…`.
- **Errors** — `.auth-alert[data-tone="error"]` for `Usuario o contraseña incorrectos.`; `.auth-alert[data-tone="warning"]` with a `Ban`/`TriangleAlert` icon for deactivated accounts (`Su cuenta está desactivada. Contacte al administrador.`). Never reveal which of the two credentials failed.
- **Alternative entry** — a quiet `.auth-card-footer` link `Ingresar como administrador con Internet Identity` keeps the existing II flow reachable without competing with the password form.
- **Motion** — one `animate-auth-card-in` on mount; no ambient motion.

## User Management (gestión de usuarios)

- **Toolbar** — `.users-toolbar`: `.users-toolbar-search` (Search icon, placeholder `Buscar por nombre o usuario`, 300ms debounce) on the left; `.users-toolbar-actions` on the right with a role `Select` filter and the primary `Crear usuario` (`UserPlus`). A `.users-count` shows `N usuarios`.
- **Table** — reuse `DataTable`: sticky header `bg-muted/50`, uppercase 11px labels, zebra `bg-muted/20`, 40px rows, 12px cell padding, `.scroll-slim` on mobile.

| Column | Treatment |
| --- | --- |
| Nombre | `text-sm font-medium`, truncate with title tooltip |
| Usuario de acceso | `.users-username` (`.data-rail` mono) |
| Rol | `.badge-role` + `data-role` (`admin`/`mechanic`/`guest`/`custom`) |
| Estado | `.badge-account` + `data-status` (`active`/`inactive`) |
| Acciones | `.row-actions` cluster: editar rol, restablecer contraseña, activar/desactivar, eliminar |

- **Row actions** — `Pencil` (edit role), `KeyRound` (reset password), `UserCheck`/`UserX` (toggle active), `Trash2` with `data-variant="destructive"` (delete). Delete always opens a confirmation dialog and is disabled on the caller's own admin row.
- **Create/edit dialog** — `Dialog` with `shadow-elevated`: `Nombre`, `Usuario de acceso` (validates uniqueness with `.field-error`), rol `Select`, and `Contraseña temporal`. Footer `Cancelar` (outline) + `Guardar` (primary).
- **States** — loading `Skeleton` rows matching column count; error `bg-destructive/10 text-destructive` panel + `Reintentar`; empty centered `text-sm text-muted-foreground` echoing active filters + `Limpiar filtros`.

## Role Badges & Custom Roles

- Four badge tones only: `admin` green 152, `mechanic` amber 70, `guest` steel grey, `custom` blue 240. Custom roles always render as `custom` — the role **name** carries the identity, the badge color stays within the four-tone system.
- Role editor: name field + a module checklist (`Checkbox` per módulo permitido) grouped by the six existing flows; renaming/editing is inline, deletion is blocked while any user holds the role (`.auth-alert[data-tone="info"]` explains why).

## Temporary-Password Reveal Panel

- `.temp-password-panel` — `temp-password/8` tint, `temp-password/35` border, 6px radius, `animate-reveal-in`.
- `.temp-password-label` with a `KeyRound` icon: `Contraseña temporal`; `.temp-password-value` renders the password in `.data-rail` mono `text-lg tracking-widest` on a `bg-background` inset.
- Copy button (`Copy` icon) + `.temp-password-note`: `Esta contraseña se muestra una sola vez. Entréguela al usuario y pídale cambiarla al ingresar.`
- The panel appears only immediately after create or reset; it is never re-openable from the table.

## Structural Zones (addendum)

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Login backdrop | `auth-backdrop` | — | 28px hairline grid + top `primary` glow; no app shell |
| Login card | `auth-panel` | `auth-panel-border` + 2px primary top rail | `shadow-elevated`, max-w-md, centered |
| Users toolbar | `bg-background` | — | Search left, role filter + primary action right |
| Users table | `bg-card` | `border` | Sticky `bg-muted/50` header, zebra `bg-muted/20` |
| Role/status badges | tinted `role-*` / `account-*` | — | Pill, `text-xs font-medium` |
| Temp-password panel | `temp-password/8` | `temp-password/35` | One-time reveal, `animate-reveal-in` |

## Constraints (addendum)

- Passwords are never rendered in plain text outside the one-time reveal panel; no password is ever returned by the backend in cleartext
- Deactivated accounts cannot sign in; the message must not disclose whether the username exists
- The admin's own account can never be deleted; role and status changes on self are disabled
- Role gating must be enforced in the backend, not only hidden in the UI
- Spanish (Colombia) copy throughout; no email affordances — temporary passwords are handed over in person
- No access/audit log surface, no password-recovery-by-email surface
- Semantic tokens only — no raw hex, `rgb()`, or arbitrary color classes

## Signature Detail (addendum)

The **green-railed login card on the hairline-grid backdrop** — the same 2px primary rail and engraved-grid texture as the company nameplate, so signing in feels like walking up to the workshop's own machine plate rather than a generic auth form; echoed in the table by four-tone role badges and one-time amber temp-password panels.

---

# Addendum — Mensaje de esperanza bíblica en documentos imprimibles

## Scope

Visual treatment of the "mensaje de esperanza bíblica" block in the footer of printable documents: screen preview (`.doc-preview`), PDF A4, and 80mm POS receipt. **Tokens and CSS only** — no component or PDF code changes. The existing hope-message logic (Automático/Manual, daily rotation) is untouched. The block renders nothing and leaves no space when there is no active message.

## Direction

A quiet **estampa devocional** at the foot of the ledger: a soft green-tinted card with a 2px green left rail (the system's signature rail), the promise in italic and one step larger than the surrounding `.doc-meta` footer, and the citation in tool-amber bold — a reverent pause in an otherwise industrial document.

## New Tokens (extend, do not replace)

| Token family | Light | Dark | Role |
| --- | --- | --- | --- |
| `hope-surface` | 0.965 0.02 152 | 0.965 0.02 152 | Soft green box background (paper is always light) |
| `hope-border` | 0.82 0.05 152 | 0.82 0.05 152 | Box hairline border |
| `hope-rule` | 0.5 0.13 152 | 0.5 0.13 152 | 2px left rail (taller green) |
| `hope-promise` | 0.28 0.03 152 | 0.28 0.03 152 | Promise text — deep green ink |
| `hope-citation` | 0.46 0.11 70 | 0.46 0.11 70 | Citation — tool amber, bold |
| `hope-quote` | 0.7 0.1 152 | 0.7 0.1 152 | Decorative opening quote mark |

- Utilities in `@layer utilities`: `.doc-hope`, `.doc-hope::before` (decorative `“`), `.doc-hope-text`, `.doc-hope-citation`, plus `.doc-preview-a4` / `.doc-preview-80mm` size overrides.
- Tailwind theme key added: `hope.*` (surface, border, rule, promise, citation, quote).
- Paper literals in `@media print` (must not depend on theme): surface `#eef7f0`, border `#b7ddc4`, rail `#1f7a45`, quote `#6aa87f`, promise `#1c3a28`, citation `#8a5a12`.
- No existing token is renamed or removed.

## Block Spec (A4)

| Property | Value |
| --- | --- |
| Box | `.doc-hope` — `border-radius: 3px`, 1px `hope-border`, 2px `hope-rule` left rail, `hope-surface` fill |
| Padding | `4mm 4.5mm 4mm 6mm` (extra left for the quote mark) |
| Promise | `.doc-hope-text` — `italic`, `12px` (A4) vs 10px `.doc-meta`, `line-height: 1.5`, `hope-promise` |
| Citation | `.doc-hope-citation` — `bold`, `10px`, `letter-spacing: 0.02em`, `hope-citation`, `margin-top: 1.5mm` |
| Quote mark | `.doc-hope::before` — `“` in `font-display`, `34px`, `hope-quote/45%`, top-left corner |
| Pagination | `page-break-inside: avoid` / `break-inside: avoid` |

## Block Spec (Tirilla 80mm)

| Property | Value |
| --- | --- |
| Box | `.doc-preview-80mm .doc-hope` — padding `2.5mm 2.5mm 2.5mm 4mm`, never wider than the roll |
| Promise | `10px` italic (vs 10px roll base, one step above `.doc-meta`) |
| Citation | `9px` bold amber |
| Quote mark | `22px`, `left: 1mm` |

## Structural Zones (addendum)

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Hope block (screen) | `hope-surface` | `hope-border` + 2px `hope-rule` rail | Inside `.doc-preview`; always light paper |
| Hope block (print) | `#eef7f0` | `#b7ddc4` + 2px `#1f7a45` rail | Literal paper colors; survives print neutralization |
| Document footer | `bg-sheet` | — | `.doc-meta` muted fields sit around the block |

## Constraints (addendum)

- Tokens/CSS only — do **not** change DocumentPreview, lib/pdf.ts, or the hope-message data logic
- No space and no placeholder reserved when the message is inactive (null)
- Block appears in every document that already includes it: orden de taller, cotización, factura, factura de compra, comprobante POS, informe de turno y ficha de cliente/proveedor
- Must not overflow the 80mm roll; box adapts to the roll width
- Paper is always light; the block keeps its tint in both themes and in print
- Semantic tokens only in components — no raw hex, `rgb()`, or arbitrary color classes
- Spanish (Colombia) copy throughout

## Signature Detail (addendum)

The **green-railed estampa** — a soft-tinted devotional card whose 2px taller-green left rail echoes the system's signature rail, with a large faded `“` in the corner and an amber bold citation, turning the document footer into a calm, deliberate benediction rather than a line of grey legal text.
