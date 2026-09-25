import { K as createLucideIcon, b7 as useDriveConnection, b8 as useStartDriveAuthorization, b9 as useDisconnectDrive, ba as useCreateBackup, s as reactExports, j as jsxRuntimeExports, aS as CloudUpload, w as Badge, T as TriangleAlert, B as Button, ag as formatDateTime, ah as LoaderCircle, aw as CircleCheck, ar as ue, bb as backupErrorMessage, bc as describeBackupError, n as formatNumber, bd as useListBackups, be as useDownloadLocalBackup, k as useBackend, ak as useQueryClient, l as useQuery, al as useMutation, f as Building2, v as Input, J as Save, E as UserRound, U as Users, ay as formatPrincipal, y as formatDate, bf as UserRole } from "./index-CzQEXdHP.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardDescription, c as CardContent } from "./card-D8aqbagN.js";
import { S as Separator } from "./separator-BScobYQZ.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { R as RefreshCw } from "./refresh-cw-DNkHwTxf.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { D as Download } from "./download-6xWfJWG2.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { C as Check } from "./check-DrBSQP0y.js";
import "./chevron-up-B1sEs4Rc.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$5);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["path", { d: "M12 2v8", key: "1q4o3n" }],
  ["path", { d: "m16 6-4 4-4-4", key: "6wukr" }],
  ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", key: "w68u3i" }],
  ["path", { d: "M6 18h.01", key: "uhywen" }],
  ["path", { d: "M10 18h.01", key: "h775k" }]
];
const HardDriveDownload = createLucideIcon("hard-drive-download", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M12 22v-5", key: "1ega77" }],
  ["path", { d: "M9 8V2", key: "14iosj" }],
  ["path", { d: "M15 8V2", key: "18g5xt" }],
  ["path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z", key: "osxo6l" }]
];
const Plug = createLucideIcon("plug", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const ShieldCheck = createLucideIcon("shield-check", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m19 5 3-3", key: "yk6iyv" }],
  ["path", { d: "m2 22 3-3", key: "19mgm9" }],
  [
    "path",
    { d: "M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z", key: "goz73y" }
  ],
  ["path", { d: "M7.5 13.5 10 11", key: "7xgeeb" }],
  ["path", { d: "M10.5 16.5 13 14", key: "10btkg" }],
  [
    "path",
    { d: "m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z", key: "1snsnr" }
  ]
];
const Unplug = createLucideIcon("unplug", __iconNode);
const REDIRECT_URI = `${window.location.origin}/connect/drive`;
function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 1024) return `${formatNumber(bytes)} B`;
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1).replace(".", ",")} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
function CopyField({
  label,
  value,
  ocid
}) {
  const [copied, setCopied] = reactExports.useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2e3);
    } catch {
      ue.error("No se pudo copiar. Selecciona el texto manualmente.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "code",
        {
          "data-ocid": `${ocid}.value`,
          className: "min-w-0 flex-1 truncate rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground",
          children: value
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          onClick: () => void handleCopy(),
          "data-ocid": `${ocid}.copy_button`,
          className: "shrink-0 gap-1.5",
          children: [
            copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              CircleCheck,
              {
                className: "size-3.5 text-success",
                "aria-hidden": "true"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-3.5", "aria-hidden": "true" }),
            copied ? "Copiado" : "Copiar"
          ]
        }
      )
    ] })
  ] });
}
function GoogleCloudSetupPanel({
  missingVariables
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "settings.drive.setup_panel",
      className: "rounded-md border border-border bg-secondary/40 p-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Plug,
            {
              className: "mt-0.5 size-4 shrink-0 text-primary",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-medium", children: "Configuración de Google Cloud (solo una vez)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "El respaldo usa la cuenta de Google del administrador. Antes de conectar, crea un cliente OAuth 2.0 de tipo",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Aplicación web" }),
              " ",
              "en Google Cloud Console y registra el URI de redirección exacto."
            ] })
          ] })
        ] }),
        missingVariables.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "settings.drive.missing_variables_state",
            className: "mb-3 flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Faltan credenciales de Google OAuth en el canister" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  "Configura",
                  " ",
                  missingVariables.length === 1 ? "esta variable" : "estas variables",
                  " ",
                  "de entorno antes de conectar:"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-0.5", children: missingVariables.map((name) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "font-mono", children: name }, name)) })
              ] })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CopyField,
            {
              label: "URI de redirección autorizado",
              value: REDIRECT_URI,
              ocid: "settings.drive.redirect_uri"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Client ID" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                "Cópialo desde Google Cloud Console y guárdalo en la configuración del canister (variable",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: "GOOGLE_OAUTH_CLIENT_ID" }),
                ")."
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Client Secret" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                "Guárdalo como variable secreta del canister (",
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: "GOOGLE_OAUTH_CLIENT_SECRET" }),
                "). Nunca lo compartas ni lo subas al repositorio."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "URI de redirección" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Guarda el mismo URI de arriba en la configuración del canister (variable",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: "GOOGLE_OAUTH_REDIRECT_URI" }),
              "). Debe coincidir exactamente con el registrado en Google Cloud Console."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Alcance solicitado: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: "drive.file" }),
            " — la app solo puede ver y administrar los archivos que ella misma crea."
          ] })
        ] })
      ]
    }
  );
}
function BackupHistory() {
  const backupsQuery = useListBackups();
  const outcome = backupsQuery.data;
  const backups = (outcome == null ? void 0 : outcome.__kind__) === "ok" ? outcome.ok : [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          HardDriveDownload,
          {
            className: "size-4 text-muted-foreground",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-medium", children: "Historial de respaldos" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => void backupsQuery.refetch(),
          disabled: backupsQuery.isFetching,
          "data-ocid": "settings.drive.history_refresh_button",
          className: "gap-1.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              RefreshCw,
              {
                className: `size-3.5 ${backupsQuery.isFetching ? "animate-spin" : ""}`,
                "aria-hidden": "true"
              }
            ),
            "Actualizar"
          ]
        }
      )
    ] }),
    backupsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": "settings.drive.history.loading_state",
        className: "space-y-2",
        children: Array.from({ length: 3 }, (_, i) => `backup-skeleton-${i}`).map(
          (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, id)
        )
      }
    ) : backupsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "settings.drive.history.error_state",
        className: "flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
            "No se pudo leer el historial desde Google Drive."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => void backupsQuery.refetch(),
              "data-ocid": "settings.drive.history.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    ) : (outcome == null ? void 0 : outcome.__kind__) === "err" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "settings.drive.history.error_state",
        className: "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-4 shrink-0",
              "aria-hidden": "true"
            }
          ),
          describeBackupError(outcome.err)
        ]
      }
    ) : backups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "settings.drive.history.empty_state",
        className: "flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-8 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            HardDriveDownload,
            {
              className: "size-6 text-muted-foreground",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-medium", children: "Aún no hay respaldos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Cuando generes el primer respaldo aparecerá aquí con su fecha, tamaño y enlace a Google Drive." })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ul",
      {
        "data-ocid": "settings.drive.history.list",
        className: "divide-y divide-border overflow-hidden rounded-md border border-border",
        children: backups.map((backup, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            "data-ocid": `settings.drive.history.item.${index + 1}`,
            className: "flex flex-wrap items-center justify-between gap-3 px-3 py-2.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-xs text-foreground", children: backup.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  formatDateTime(backup.createdAt),
                  " ·",
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular", children: formatFileSize(backup.size) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: backup.webViewLink,
                  target: "_blank",
                  rel: "noreferrer",
                  "data-ocid": `settings.drive.history.link.${index + 1}`,
                  className: "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3.5", "aria-hidden": "true" }),
                    "Abrir en Drive"
                  ]
                }
              )
            ]
          },
          backup.fileId
        ))
      }
    )
  ] });
}
function DriveBackupCard() {
  const connection = useDriveConnection();
  const startAuthorization = useStartDriveAuthorization();
  const disconnect = useDisconnectDrive();
  const createBackup = useCreateBackup();
  const [lastBackup, setLastBackup] = reactExports.useState(null);
  const [backupError, setBackupError] = reactExports.useState(null);
  function handleConnect() {
    startAuthorization.mutate(void 0, {
      onSuccess: (result) => {
        window.location.assign(result.authorizationUrl);
      },
      onError: (error) => {
        ue.error("No se pudo iniciar la conexión con Google Drive", {
          description: backupErrorMessage(error)
        });
      }
    });
  }
  function handleDisconnect() {
    disconnect.mutate(void 0, {
      onSuccess: () => {
        setLastBackup(null);
        setBackupError(null);
        ue.success("Google Drive desconectado");
      },
      onError: (error) => {
        ue.error("No se pudo desconectar Google Drive", {
          description: backupErrorMessage(error)
        });
      }
    });
  }
  function handleBackup() {
    setBackupError(null);
    createBackup.mutate(void 0, {
      onSuccess: (outcome) => {
        if (outcome.__kind__ === "ok") {
          setLastBackup(outcome.ok);
          ue.success("Respaldo completado");
        } else {
          setLastBackup(null);
          setBackupError(describeBackupError(outcome.err));
        }
      },
      onError: (error) => {
        setLastBackup(null);
        setBackupError(backupErrorMessage(error));
      }
    });
  }
  const isConnected = connection.isDriveConfigured;
  const isBusy = createBackup.isPending;
  const missingVariables = connection.configuration.missingVariables;
  const isConfigured = connection.configuration.configured;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.drive.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "size-4", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: "Respaldo en Google Drive" }),
          connection.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-24" }) : isConnected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              "data-ocid": "settings.drive.status_badge",
              className: "border-success/40 bg-success/10 text-success",
              children: "Conectado"
            }
          ) : !isConfigured ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              "data-ocid": "settings.drive.status_badge",
              className: "border-status-overdue/40 bg-status-overdue/10 text-status-overdue",
              children: "No configurado"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              "data-ocid": "settings.drive.status_badge",
              className: "border-border bg-muted text-muted-foreground",
              children: "Desconectado"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Genera un archivo JSON con los datos del taller y guárdalo en la carpeta «HR SOLUCIONES INTEGRALES — Respaldos» de tu Google Drive." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5 pt-6", children: [
      connection.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "settings.drive.connection.error_state",
          className: "flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
              "No se pudo consultar el estado de la conexión con Google Drive."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: connection.refetch,
                "data-ocid": "settings.drive.connection.retry_button",
                children: "Reintentar"
              }
            )
          ]
        }
      ) : connection.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "settings.drive.connection.loading_state",
          className: "space-y-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-56" })
          ]
        }
      ) : isConnected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Cuenta conectada" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "settings.drive.account_email",
                className: "truncate text-sm font-medium text-foreground",
                children: connection.accountEmail ?? "Cuenta de Google autorizada"
              }
            ),
            connection.connectedAt !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Conectada el ",
              formatDateTime(connection.connectedAt)
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: handleDisconnect,
              disabled: disconnect.isPending,
              "data-ocid": "settings.drive.disconnect_button",
              className: "shrink-0 gap-1.5",
              children: [
                disconnect.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  LoaderCircle,
                  {
                    className: "size-3.5 animate-spin",
                    "aria-hidden": "true"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Unplug, { className: "size-3.5", "aria-hidden": "true" }),
                disconnect.isPending ? "Desconectando…" : "Desconectar"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              onClick: handleBackup,
              disabled: isBusy,
              "data-ocid": "settings.drive.backup_button",
              className: "gap-2",
              children: [
                isBusy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "size-4", "aria-hidden": "true" }),
                isBusy ? "Generando y subiendo…" : "Respaldar ahora"
              ]
            }
          ),
          isBusy ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "settings.drive.backup.loading_state",
              className: "text-xs text-muted-foreground",
              children: "Estamos generando el archivo JSON y subiéndolo a tu Drive. No cierres esta ventana."
            }
          ) : null
        ] }),
        lastBackup ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "settings.drive.backup.success_state",
            className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/40 bg-success/5 px-3 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CircleCheck,
                  {
                    className: "mt-0.5 size-4 shrink-0 text-success",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Respaldo completado" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-xs text-muted-foreground", children: lastBackup.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    formatDateTime(lastBackup.createdAt),
                    " ·",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular", children: formatFileSize(lastBackup.size) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: lastBackup.webViewLink,
                  target: "_blank",
                  rel: "noreferrer",
                  "data-ocid": "settings.drive.backup.open_link",
                  className: "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3.5", "aria-hidden": "true" }),
                    "Abrir en Google Drive"
                  ]
                }
              )
            ]
          }
        ) : null,
        backupError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "settings.drive.backup.error_state",
            className: "flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 text-sm text-destructive", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-4 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: backupError })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: handleBackup,
                  disabled: isBusy,
                  "data-ocid": "settings.drive.backup.retry_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "size-3.5", "aria-hidden": "true" }),
                    "Reintentar respaldo"
                  ]
                }
              )
            ]
          }
        ) : null
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Estado de la conexión" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground", children: isConfigured ? "Google Drive no está conectado. Conecta la cuenta del administrador para poder respaldar." : "Google Drive no está configurado. Faltan credenciales OAuth en el canister; revisa la configuración de Google Cloud más abajo." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              onClick: handleConnect,
              disabled: startAuthorization.isPending || !isConfigured,
              "aria-describedby": !isConfigured ? "drive-connect-help" : void 0,
              "data-ocid": "settings.drive.connect_button",
              className: "shrink-0 gap-2",
              children: [
                startAuthorization.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plug, { className: "size-4", "aria-hidden": "true" }),
                startAuthorization.isPending ? "Abriendo Google…" : "Conectar con Google Drive"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            id: "drive-connect-help",
            className: "text-xs text-muted-foreground",
            children: isConfigured ? "Se abrirá la pantalla de autorización de Google. Al terminar volverás automáticamente a Configuración." : "Configura las variables de entorno indicadas abajo y vuelve a intentarlo."
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleCloudSetupPanel, { missingVariables }),
      isConnected ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(BackupHistory, {})
      ] }) : null
    ] })
  ] });
}
async function downloadJsonFile(fileName, json) {
  await downloadFile({
    filename: fileName,
    mimeType: "application/json",
    data: json
  });
}
function LocalBackupCard() {
  const downloadBackup = useDownloadLocalBackup();
  const [lastBackup, setLastBackup] = reactExports.useState(null);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  function handleDownload() {
    setDownloadError(null);
    downloadBackup.mutate(void 0, {
      onSuccess: (backup) => {
        void downloadJsonFile(backup.fileName, backup.json).then(() => {
          setLastBackup(backup);
          ue.success("Copia local descargada");
        }).catch((error) => {
          setLastBackup(null);
          setDownloadError(backupErrorMessage(error));
        });
      },
      onError: (error) => {
        setLastBackup(null);
        setDownloadError(backupErrorMessage(error));
      }
    });
  }
  const isBusy = downloadBackup.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "settings.local_backup.card",
      className: "rounded-lg shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HardDriveDownload, { className: "size-4", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: "Copia de seguridad local" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Descarga en tu equipo un archivo JSON con toda la información del taller: clientes, motos, pedidos, ventas, inventario, compras, proveedores, facturas, pagos, presupuestos, servicios, técnicos, citas, gastos, cuentas por cobrar, configuración del negocio y perfiles de usuario." })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: handleDownload,
                disabled: isBusy,
                "data-ocid": "settings.local_backup.download_button",
                className: "gap-2",
                children: [
                  isBusy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
                  isBusy ? "Generando copia…" : "Descargar copia local"
                ]
              }
            ),
            isBusy ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "settings.local_backup.loading_state",
                className: "text-xs text-muted-foreground",
                children: "Estamos generando el archivo JSON. No cierres esta ventana."
              }
            ) : null
          ] }),
          lastBackup ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "settings.local_backup.success_state",
              className: "flex items-start gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CircleCheck,
                  {
                    className: "mt-0.5 size-4 shrink-0 text-success",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Copia local descargada" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-xs text-muted-foreground", children: lastBackup.fileName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    "Generada el ",
                    formatDateTime(lastBackup.generatedAt)
                  ] })
                ] })
              ]
            }
          ) : null,
          downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "settings.local_backup.error_state",
              className: "flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 text-sm text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "mt-0.5 size-4 shrink-0",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: downloadError })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: handleDownload,
                    disabled: isBusy,
                    "data-ocid": "settings.local_backup.retry_button",
                    className: "gap-1.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "size-3.5", "aria-hidden": "true" }),
                      "Reintentar descarga"
                    ]
                  }
                )
              ]
            }
          ) : null
        ] })
      ]
    }
  );
}
const ROLE_LABELS = {
  [UserRole.admin]: "Administrador",
  [UserRole.user]: "Mecánico",
  [UserRole.guest]: "Invitado"
};
const ROLE_ORDER = [UserRole.admin, UserRole.user, UserRole.guest];
function roleBadgeClass(role) {
  switch (role) {
    case UserRole.admin:
      return "border-primary/40 bg-primary/10 text-primary";
    case UserRole.user:
      return "border-info/40 bg-info/10 text-info";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
function errorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
function SectionHeading({
  icon,
  title,
  description
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: description })
    ] })
  ] }) });
}
function BusinessSettingsForm() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings();
    },
    enabled: !!actor && !isFetching
  });
  const [name, setName] = reactExports.useState("");
  const [taxId, setTaxId] = reactExports.useState("");
  const [address, setAddress] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [taxRatePercent, setTaxRatePercent] = reactExports.useState("");
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setName(data.name);
    setTaxId(data.taxId);
    setAddress(data.address);
    setPhone(data.phone);
    setTaxRatePercent(Number(data.taxRate).toString());
    setInitialized(true);
  }, [settingsQuery.data, initialized]);
  const saveMutation = useMutation({
    mutationFn: async (settings) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateBusinessSettings(settings);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      ue.success("Datos del negocio guardados");
    },
    onError: (error) => {
      ue.error("No se pudieron guardar los datos", {
        description: errorMessage(error)
      });
    }
  });
  const taxRateNumber = Number(taxRatePercent.replace(",", "."));
  const taxRateValid = taxRatePercent.trim() !== "" && Number.isFinite(taxRateNumber) && taxRateNumber >= 0 && taxRateNumber <= 100;
  const canSubmit = name.trim() !== "" && taxRateValid && !saveMutation.isPending;
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate({
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim(),
      phone: phone.trim(),
      taxRate: BigInt(Math.round(taxRateNumber))
    });
  }
  if (settingsQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        "data-ocid": "settings.business.card",
        className: "rounded-lg shadow-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeading,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-4", "aria-hidden": "true" }),
              title: "Datos del negocio y facturación",
              description: "Información fiscal que aparece en las facturas emitidas."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CardContent,
            {
              "data-ocid": "settings.business.loading_state",
              className: "grid gap-4 pt-6 sm:grid-cols-2",
              children: Array.from({ length: 5 }, (_, i) => `business-skeleton-${i}`).map(
                (id) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
                ] }, id)
              )
            }
          )
        ]
      }
    );
  }
  if (settingsQuery.isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        "data-ocid": "settings.business.card",
        className: "rounded-lg shadow-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeading,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-4", "aria-hidden": "true" }),
              title: "Datos del negocio y facturación",
              description: "Información fiscal que aparece en las facturas emitidas."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            CardContent,
            {
              "data-ocid": "settings.business.error_state",
              className: "flex flex-col items-start gap-3 pt-6",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
                  "No se pudieron cargar los datos del negocio."
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void settingsQuery.refetch(),
                    "data-ocid": "settings.business.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.business.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeading,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-4", "aria-hidden": "true" }),
        title: "Datos del negocio y facturación",
        description: "Información fiscal que aparece en las facturas emitidas."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        onSubmit: handleSubmit,
        className: "grid gap-4 sm:grid-cols-2",
        "data-ocid": "settings.business.form",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "business-name", children: "Nombre del negocio" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "business-name",
                value: name,
                onChange: (event) => setName(event.target.value),
                placeholder: "HR SOLUCIONES INTEGRALES",
                autoComplete: "organization",
                "data-ocid": "settings.business.name_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "business-tax-id", children: "NIT / RUC" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "business-tax-id",
                value: taxId,
                onChange: (event) => setTaxId(event.target.value),
                placeholder: "900.123.456-7",
                className: "data-rail",
                "data-ocid": "settings.business.tax_id_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "business-phone", children: "Teléfono" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "business-phone",
                value: phone,
                onChange: (event) => setPhone(event.target.value),
                placeholder: "+57 300 000 0000",
                inputMode: "tel",
                className: "data-rail",
                "data-ocid": "settings.business.phone_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "business-address", children: "Dirección" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "business-address",
                value: address,
                onChange: (event) => setAddress(event.target.value),
                placeholder: "Calle 45 #12-30, Bogotá",
                autoComplete: "street-address",
                "data-ocid": "settings.business.address_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "business-tax-rate", children: "Tasa de impuesto (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "business-tax-rate",
                value: taxRatePercent,
                onChange: (event) => setTaxRatePercent(event.target.value),
                placeholder: "19",
                inputMode: "decimal",
                "aria-invalid": !taxRateValid,
                "aria-describedby": "business-tax-rate-help",
                className: "data-rail",
                "data-ocid": "settings.business.tax_rate_input"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                id: "business-tax-rate-help",
                className: "text-xs text-muted-foreground",
                children: "Se aplica al subtotal de cada factura. Ejemplo: 19 para 19%."
              }
            ),
            !taxRateValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "settings.business.tax_rate_error",
                className: "text-xs text-destructive",
                children: "Ingresa un porcentaje entre 0 y 100."
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end justify-end sm:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "submit",
              disabled: !canSubmit,
              "data-ocid": "settings.business.save_button",
              className: "gap-2",
              children: [
                saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                saveMutation.isPending ? "Guardando…" : "Guardar datos"
              ]
            }
          ) })
        ]
      }
    ) })
  ] });
}
function CallerProfileCard() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching
  });
  const [displayName, setDisplayName] = reactExports.useState("");
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const data = profileQuery.data;
    if (!data || initialized) return;
    setDisplayName(data.name);
    setInitialized(true);
  }, [profileQuery.data, initialized]);
  const saveMutation = useMutation({
    mutationFn: async (value) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.saveCallerUserProfile(value);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      ue.success("Nombre actualizado");
    },
    onError: (error) => {
      ue.error("No se pudo actualizar tu nombre", {
        description: errorMessage(error)
      });
    }
  });
  const canSubmit = displayName.trim() !== "" && !saveMutation.isPending;
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(displayName.trim());
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.profile.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeading,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-4", "aria-hidden": "true" }),
        title: "Mi perfil",
        description: "El nombre con el que apareces en las órdenes y movimientos."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: profileQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "settings.profile.loading_state", className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full max-w-sm" })
    ] }) : profileQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "settings.profile.error_state",
        className: "flex flex-col items-start gap-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
            "No se pudo cargar tu perfil."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => void profileQuery.refetch(),
              "data-ocid": "settings.profile.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        onSubmit: handleSubmit,
        className: "flex flex-col gap-4 sm:flex-row sm:items-end",
        "data-ocid": "settings.profile.form",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-2 sm:max-w-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "profile-name", children: "Nombre para mostrar" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "profile-name",
                value: displayName,
                onChange: (event) => setDisplayName(event.target.value),
                placeholder: "Tu nombre",
                autoComplete: "name",
                "data-ocid": "settings.profile.name_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "submit",
              disabled: !canSubmit,
              "data-ocid": "settings.profile.save_button",
              className: "gap-2",
              children: [
                saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4", "aria-hidden": "true" }),
                saveMutation.isPending ? "Guardando…" : "Guardar nombre"
              ]
            }
          )
        ]
      }
    ) })
  ] });
}
function UsersTable() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching
  });
  const roleMutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setUserRole(input.principal, input.role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["caller-role"] });
      ue.success("Rol actualizado");
    },
    onError: (error) => {
      ue.error("No se pudo actualizar el rol", {
        description: errorMessage(error)
      });
    }
  });
  const users = usersQuery.data ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.users.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeading,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-4", "aria-hidden": "true" }),
        title: "Usuarios y roles",
        description: "Asigna el rol de cada persona registrada en el taller."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ShieldCheck,
          {
            className: "mt-0.5 size-4 shrink-0 text-primary",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "El primer usuario que inicia sesión queda como",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "administrador" }),
          " ",
          "automáticamente. Los mecánicos pueden ver el inventario y crear órdenes, pero no acceden a costos, compras, cuentas por pagar ni configuración."
        ] })
      ] }),
      usersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "settings.users.loading_state", className: "space-y-2", children: Array.from({ length: 3 }, (_, i) => `users-skeleton-${i}`).map(
        (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)
      ) }) : usersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "settings.users.error_state",
          className: "flex flex-col items-start gap-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
              "No se pudo cargar la lista de usuarios."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => void usersQuery.refetch(),
                "data-ocid": "settings.users.retry_button",
                children: "Reintentar"
              }
            )
          ]
        }
      ) : users.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "settings.users.empty_state",
          className: "flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Users,
              {
                className: "size-6 text-muted-foreground",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-medium", children: "Aún no hay usuarios registrados" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Cuando alguien inicie sesión por primera vez aparecerá aquí para que le asignes un rol." })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "settings.users.table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "bg-secondary/60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs uppercase tracking-wider", children: "Usuario" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs uppercase tracking-wider", children: "Principal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs uppercase tracking-wider", children: "Rol" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs uppercase tracking-wider", children: "Registro" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right text-xs uppercase tracking-wider", children: "Asignar rol" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: users.map((user, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TableRow,
          {
            "data-ocid": `settings.users.row.${index + 1}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: user.name || "Sin nombre" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-xs text-muted-foreground", children: formatPrincipal(user.principal.toString()) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  className: roleBadgeClass(user.role),
                  children: ROLE_LABELS[user.role]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "tabular text-xs text-muted-foreground", children: formatDate(user.createdAt) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: user.role,
                  onValueChange: (value) => roleMutation.mutate({
                    principal: user.principal,
                    role: value
                  }),
                  disabled: roleMutation.isPending,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        size: "sm",
                        className: "ml-auto w-[150px]",
                        "aria-label": `Rol de ${user.name || "usuario"}`,
                        "data-ocid": `settings.users.role_select.${index + 1}`,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ROLE_ORDER.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: role, children: ROLE_LABELS[role] }, role)) })
                  ]
                }
              ) })
            ]
          },
          user.principal.toString()
        )) })
      ] }) })
    ] })
  ] });
}
function SettingsPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "settings.page", className: "mx-auto w-full max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-6 flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground", children: "Administración" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Configuración" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Datos fiscales del negocio, impuestos y gestión de usuarios y roles." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessSettingsForm, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DriveBackupCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LocalBackupCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CallerProfileCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UsersTable, {})
    ] })
  ] });
}
export {
  SettingsPage
};
