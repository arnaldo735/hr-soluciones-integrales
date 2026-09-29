import { Y as createLucideIcon, ba as useDriveConnection, bb as useStartDriveAuthorization, bc as useDisconnectDrive, bd as useCreateBackup, t as reactExports, j as jsxRuntimeExports, aW as CloudUpload, x as Badge, T as TriangleAlert, B as Button, aj as formatDateTime, ak as LoaderCircle, az as CircleCheck, av as ue, be as backupErrorMessage, bf as describeBackupError, o as formatNumber, bg as useListBackups, bh as useDownloadLocalBackup, k as useBackend, l as useAuth, ap as useMutation, K as Label, V as Save, an as ShieldCheck, a4 as useControllableState, a7 as Primitive, a6 as useComposedRefs, a8 as composeEventHandlers, a9 as Presence, ad as createContextScope, Z as cn, ao as useQueryClient, m as useQuery, J as UserRound, w as Input, f as Building2, bi as HopeMode, bj as formatColombiaDateDDMMYYYY, U as Users, L as Link } from "./index-EqGEeyjs.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardDescription, c as CardContent } from "./card-YKA4f36t.js";
import { S as Separator } from "./separator-B6xouacW.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { R as RefreshCw } from "./refresh-cw-DqHpo3iM.js";
import { C as Copy, K as KeyRound } from "./key-round-DJ0fLI8j.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { D as Download } from "./download-C8tLpeh6.js";
import { C as Checkbox } from "./checkbox-BNL-r_nI.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { U as Upload } from "./upload-CmMwQ1re.js";
import { H as History } from "./history-Nsgyxjng.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { u as useServiceTermsSettings, a as useUpdateServiceTermsSettings, S as SERVICE_TERMS_DEFAULT_TEXT } from "./use-service-terms-DA5dJHUn.js";
import { u as useWarrantyTermsSettings, a as useUpdateWarrantyTermsSettings, W as WARRANTY_TERMS_DEFAULT_TEXT } from "./use-warranty-terms-BDnUd14y.js";
import { R as Root, I as Item, c as createRovingFocusGroupScope } from "./index-B1QqcSkg.js";
import { u as useDirection } from "./index-Bg9EgBy1.js";
import { u as usePrevious, a as useSize } from "./index-DDy-lNY6.js";
import { S as Switch } from "./switch-OTDHE5Rm.js";
import { a as useHopeSettings, u as useDailyHopeMessage, b as useUpdateHopeSettings } from "./use-hope-35eM4bcJ.js";
import { C as Check } from "./check-LdjEv5O-.js";
import "./warranty-BU5LnZHy.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$8 = [
  ["path", { d: "M12 7v14", key: "1akyts" }],
  [
    "path",
    {
      d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      key: "ruj8y"
    }
  ]
];
const BookOpen = createLucideIcon("book-open", __iconNode$8);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$7 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "9", x2: "15", y1: "15", y2: "9", key: "1dfufj" }]
];
const CircleSlash = createLucideIcon("circle-slash", __iconNode$7);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$6 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
];
const CircleX = createLucideIcon("circle-x", __iconNode$6);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]];
const Circle = createLucideIcon("circle", __iconNode$5);
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
  ["path", { d: "M15 12h-5", key: "r7krc0" }],
  ["path", { d: "M15 8h-5", key: "1khuty" }],
  ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4", key: "zz82l3" }],
  [
    "path",
    {
      d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",
      key: "1ph1d7"
    }
  ]
];
const ScrollText = createLucideIcon("scroll-text", __iconNode$1);
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
const RESTORE_SECTION_LABELS = {
  parts: "Repuestos",
  lots: "Lotes",
  movements: "Movimientos de inventario",
  customers: "Clientes",
  motorcycles: "Motos",
  orders: "Órdenes de taller",
  suppliers: "Proveedores",
  purchases: "Compras",
  payments: "Pagos a proveedores",
  invoices: "Facturas",
  businessSettings: "Datos del negocio",
  userProfiles: "Perfiles de usuario",
  quotes: "Cotizaciones",
  services: "Servicios",
  serviceCategories: "Categorías de servicios",
  technicians: "Técnicos",
  appointments: "Citas",
  expenses: "Gastos",
  expenseCategories: "Categorías de gastos",
  posSales: "Ventas POS",
  receivablePayments: "Abonos de cartera",
  supplierOrders: "Pedidos a proveedores",
  company: "Perfil de la empresa"
};
function restoreSectionLabel(key) {
  return RESTORE_SECTION_LABELS[key] ?? key;
}
function describeRestoreError(error) {
  switch (error.__kind__) {
    case "invalidFormat":
      return error.invalidFormat ? `El archivo no tiene el formato esperado: ${error.invalidFormat}` : "El archivo no tiene el formato esperado.";
    case "incompatibleVersion":
      return `La versión del archivo (${Number(
        error.incompatibleVersion
      )}) no es compatible con esta aplicación.`;
    case "noKnownSections":
      return "El archivo no contiene ninguna sección reconocida de la copia.";
    case "unknownSection":
      return `La sección «${error.unknownSection}» no existe en el archivo.`;
    case "invalidSection":
      return `La sección «${error.invalidSection}» tiene un contenido inválido.`;
    case "notAuthorized":
      return "Solo el administrador puede restaurar una copia.";
    default:
      return "No se pudo procesar el archivo de copia.";
  }
}
function restoreErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo completar la restauración.";
}
function toSectionState(status) {
  switch (status.__kind__) {
    case "restored":
      return { state: "restored" };
    case "skipped":
      return { state: "skipped" };
    case "error":
      return { state: "error", message: status.error };
    default:
      return { state: "error" };
  }
}
async function readRestoreFile(file) {
  try {
    return await file.text();
  } catch {
    throw new Error(
      "No se pudo leer el archivo seleccionado. Verifica que sea un JSON válido."
    );
  }
}
function useValidateRestoreFile() {
  const { actor } = useBackend();
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (json) => {
      if (!actor) throw new Error("Backend no disponible");
      const outcome = await actor.validateRestoreFile(
        token,
        json
      );
      if (outcome.__kind__ === "err") {
        throw new Error(describeRestoreError(outcome.err));
      }
      return outcome.ok;
    }
  });
}
function useRestoreBackup() {
  const { actor } = useBackend();
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      const selected = new Set(input.selectedKeys);
      const results = [];
      let restoredSections = 0n;
      let skippedSections = 0n;
      let failedSections = 0n;
      let totalRecords = 0n;
      for (const section of input.sections) {
        if (!selected.has(section.key)) {
          results.push({
            key: section.key,
            index: section.index,
            status: "skipped",
            restored: 0n
          });
          skippedSections += 1n;
          continue;
        }
        const outcome = await actor.restoreSection(
          token,
          input.json,
          section.index
        );
        if (outcome.__kind__ === "err") {
          results.push({
            key: section.key,
            index: section.index,
            status: "error",
            restored: 0n,
            message: describeRestoreError(outcome.err)
          });
          failedSections += 1n;
          continue;
        }
        const { state, message } = toSectionState(outcome.ok.status);
        results.push({
          key: section.key,
          index: section.index,
          status: state,
          restored: outcome.ok.restored,
          message
        });
        if (state === "restored") {
          restoredSections += 1n;
          totalRecords += outcome.ok.restored;
        } else if (state === "skipped") {
          skippedSections += 1n;
        } else {
          failedSections += 1n;
        }
      }
      return {
        sections: results,
        restoredSections,
        skippedSections,
        failedSections,
        totalRecords
      };
    }
  });
}
function sectionStatusLabel(status) {
  switch (status) {
    case "restored":
      return "Restaurada";
    case "skipped":
      return "Omitida";
    default:
      return "Error";
  }
}
function RestoreBackupCard() {
  const fileInputRef = reactExports.useRef(null);
  const validateFile = useValidateRestoreFile();
  const restoreBackup = useRestoreBackup();
  const [step, setStep] = reactExports.useState("idle");
  const [fileName, setFileName] = reactExports.useState("");
  const [fileContent, setFileContent] = reactExports.useState("");
  const [preview, setPreview] = reactExports.useState(null);
  const [selectedKeys, setSelectedKeys] = reactExports.useState([]);
  const [confirmed, setConfirmed] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [summary, setSummary] = reactExports.useState(null);
  const previewSections = ((preview == null ? void 0 : preview.sections) ?? []).map(
    (section) => ({ ...section, label: restoreSectionLabel(section.key) })
  );
  function resetFlow() {
    setStep("idle");
    setFileName("");
    setFileContent("");
    setPreview(null);
    setSelectedKeys([]);
    setConfirmed(false);
    setError(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function handleOpenPicker() {
    var _a;
    setError(null);
    (_a = fileInputRef.current) == null ? void 0 : _a.click();
  }
  async function handleFileChange(event) {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    setError(null);
    setSummary(null);
    setPreview(null);
    setConfirmed(false);
    setFileName(file.name);
    let content;
    try {
      content = await readRestoreFile(file);
    } catch (readError) {
      setError(restoreErrorMessage(readError));
      setStep("idle");
      return;
    }
    setFileContent(content);
    validateFile.mutate(content, {
      onSuccess: (result) => {
        setPreview(result);
        setSelectedKeys(result.sections.map((section) => section.key));
        setStep("preview");
      },
      onError: (validationError) => {
        setPreview(null);
        setSelectedKeys([]);
        setError(restoreErrorMessage(validationError));
        setStep("idle");
      }
    });
  }
  function toggleSection(key, checked) {
    setSelectedKeys(
      (current) => checked ? current.includes(key) ? current : [...current, key] : current.filter((entry) => entry !== key)
    );
  }
  function handleConfirm() {
    if (!preview || selectedKeys.length === 0) return;
    setError(null);
    setStep("running");
    restoreBackup.mutate(
      { json: fileContent, sections: preview.sections, selectedKeys },
      {
        onSuccess: (result) => {
          setSummary(result);
          setStep("done");
          if (result.failedSections === 0n) {
            ue.success("Restauración completada");
          } else {
            ue.warning("Restauración completada con errores");
          }
        },
        onError: (restoreError) => {
          setError(restoreErrorMessage(restoreError));
          setStep("preview");
        }
      }
    );
  }
  const isBusy = validateFile.isPending || restoreBackup.isPending;
  const canConfirm = step === "preview" && confirmed && selectedKeys.length > 0 && !isBusy;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.restore.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: "Restaurar copia local" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Carga un archivo JSON de copia local previamente descargado y elige qué secciones sobrescribir. La restauración reemplaza los datos actuales de las secciones incluidas." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5 pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "application/json,.json",
          onChange: handleFileChange,
          className: "sr-only",
          "data-ocid": "settings.restore.file_input"
        }
      ),
      step === "idle" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            onClick: handleOpenPicker,
            disabled: isBusy,
            "data-ocid": "settings.restore.upload_button",
            className: "gap-2",
            children: [
              validateFile.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-4", "aria-hidden": "true" }),
              validateFile.isPending ? "Validando archivo…" : "Restaurar copia"
            ]
          }
        ),
        validateFile.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "settings.restore.loading_state",
            className: "text-xs text-muted-foreground",
            children: "Estamos revisando el archivo. No cierres esta ventana."
          }
        ) : null
      ] }) : null,
      error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "settings.restore.error_state",
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: resetFlow,
                "data-ocid": "settings.restore.retry_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "size-3.5", "aria-hidden": "true" }),
                  "Elegir otro archivo"
                ]
              }
            )
          ]
        }
      ) : null,
      step === "preview" && preview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "settings.restore.preview",
            className: "space-y-3 rounded-md border border-border bg-muted/40 px-4 py-4",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                History,
                {
                  className: "mt-0.5 size-4 shrink-0 text-primary",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Vista previa de la copia" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-xs text-muted-foreground", children: fileName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  "Generada el ",
                  formatDateTime(preview.generatedAt),
                  " ·",
                  " ",
                  formatNumber(preview.totalSections),
                  " secciones · versión",
                  " ",
                  Number(preview.formatVersion)
                ] })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Secciones incluidas" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => setSelectedKeys(
                    preview.sections.map((section) => section.key)
                  ),
                  "data-ocid": "settings.restore.select_all_button",
                  children: "Seleccionar todo"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => setSelectedKeys([]),
                  "data-ocid": "settings.restore.clear_all_button",
                  children: "Quitar todo"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "ul",
            {
              "data-ocid": "settings.restore.section_list",
              className: "divide-y divide-border rounded-md border border-border",
              children: previewSections.map((section, position) => {
                const checked = selectedKeys.includes(section.key);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    "data-ocid": `settings.restore.section.${position + 1}`,
                    className: "flex items-center gap-3 px-3 py-2.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Checkbox,
                        {
                          id: `restore-section-${section.key}`,
                          checked,
                          onCheckedChange: (value) => toggleSection(section.key, value === true),
                          "data-ocid": `settings.restore.section_checkbox.${position + 1}`
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "label",
                        {
                          htmlFor: `restore-section-${section.key}`,
                          className: "flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm text-foreground", children: section.label }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 font-mono text-xs text-muted-foreground", children: [
                              formatNumber(section.count),
                              " registros"
                            ] })
                          ]
                        }
                      )
                    ]
                  },
                  section.key
                );
              })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-4 shrink-0 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "La restauración",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "reemplaza por completo" }),
            " ",
            "los datos actuales de las secciones seleccionadas. Las secciones que dejes sin marcar se conservan tal como están."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "label",
          {
            htmlFor: "restore-confirm",
            className: "flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Checkbox,
                {
                  id: "restore-confirm",
                  checked: confirmed,
                  onCheckedChange: (value) => setConfirmed(value === true),
                  "data-ocid": "settings.restore.confirm_checkbox"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-foreground", children: "Entiendo que se reemplazarán los datos actuales de las secciones seleccionadas y confirmo la restauración." })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "destructive",
              onClick: handleConfirm,
              disabled: !canConfirm,
              "data-ocid": "settings.restore.confirm_button",
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                "Restaurar secciones seleccionadas"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: resetFlow,
              disabled: isBusy,
              "data-ocid": "settings.restore.cancel_button",
              children: "Cancelar"
            }
          )
        ] })
      ] }) : null,
      step === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "settings.restore.running_state",
          className: "flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-4",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LoaderCircle,
              {
                className: "size-4 shrink-0 animate-spin text-primary",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Restaurando secciones…" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Se aplica una sección por llamada. No cierres esta ventana." })
            ] })
          ]
        }
      ) : null,
      step === "done" && summary ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "settings.restore.success_state",
            className: "flex items-start gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-3",
            children: [
              summary.failedSections === 0n ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                CircleCheck,
                {
                  className: "mt-0.5 size-4 shrink-0 text-success",
                  "aria-hidden": "true"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: summary.failedSections === 0n ? "Restauración completada" : "Restauración completada con errores" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  formatNumber(summary.totalRecords),
                  " registros restaurados en",
                  " ",
                  formatNumber(summary.restoredSections),
                  " secciones ·",
                  " ",
                  formatNumber(summary.skippedSections),
                  " omitidas ·",
                  " ",
                  formatNumber(summary.failedSections),
                  " con error."
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "ul",
          {
            "data-ocid": "settings.restore.result_list",
            className: "divide-y divide-border rounded-md border border-border",
            children: summary.sections.map((section, position) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "li",
              {
                "data-ocid": `settings.restore.result.${position + 1}`,
                className: "flex items-start gap-3 px-3 py-2.5",
                children: [
                  section.status === "restored" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CircleCheck,
                    {
                      className: "mt-0.5 size-4 shrink-0 text-success",
                      "aria-hidden": "true"
                    }
                  ) : section.status === "skipped" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CircleSlash,
                    {
                      className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CircleX,
                    {
                      className: "mt-0.5 size-4 shrink-0 text-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm text-foreground", children: restoreSectionLabel(section.key) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
                        sectionStatusLabel(section.status),
                        section.status === "restored" ? ` · ${formatNumber(section.restored)} registros` : ""
                      ] })
                    ] }),
                    section.message ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: section.message }) : null
                  ] })
                ]
              },
              section.key
            ))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              onClick: () => window.location.reload(),
              "data-ocid": "settings.restore.reload_button",
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "size-4", "aria-hidden": "true" }),
                "Recargar la aplicación"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: resetFlow,
              "data-ocid": "settings.restore.close_button",
              children: "Cerrar"
            }
          )
        ] })
      ] }) : null
    ] })
  ] });
}
function errorMessage$2(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
function SectionHeading$2({
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
function ServiceTermsCard() {
  const settingsQuery = useServiceTermsSettings();
  const saveMutation = useUpdateServiceTermsSettings();
  const [text, setText] = reactExports.useState("");
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setText(data.text);
    setInitialized(true);
  }, [settingsQuery.data, initialized]);
  const canSubmit = text.trim() !== "" && !saveMutation.isPending;
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(
      { text: text.trim() },
      {
        onSuccess: () => {
          ue.success("Términos y condiciones guardados", {
            description: "Los documentos generados a partir de ahora usarán este pie de página."
          });
        },
        onError: (error) => {
          ue.error("No se pudieron guardar los términos y condiciones", {
            description: errorMessage$2(error)
          });
        }
      }
    );
  }
  if (settingsQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        "data-ocid": "settings.service_terms.card",
        className: "rounded-lg shadow-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeading$2,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollText, { className: "size-4", "aria-hidden": "true" }),
              title: "Términos y condiciones del Servicio",
              description: "Texto que aparece en el pie de los documentos generados."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CardContent,
            {
              "data-ocid": "settings.service_terms.loading_state",
              className: "space-y-3 pt-6",
              children: Array.from(
                { length: 3 },
                (_, i) => `service-terms-skeleton-${i}`
              ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
              ] }, id))
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
        "data-ocid": "settings.service_terms.card",
        className: "rounded-lg shadow-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeading$2,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollText, { className: "size-4", "aria-hidden": "true" }),
              title: "Términos y condiciones del Servicio",
              description: "Texto que aparece en el pie de los documentos generados."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            CardContent,
            {
              "data-ocid": "settings.service_terms.error_state",
              className: "flex flex-col items-start gap-3 pt-6",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
                  "No se pudieron cargar los términos y condiciones del servicio."
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void settingsQuery.refetch(),
                    "data-ocid": "settings.service_terms.retry_button",
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "settings.service_terms.card",
      className: "rounded-lg shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionHeading$2,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollText, { className: "size-4", "aria-hidden": "true" }),
            title: "Términos y condiciones del Servicio",
            description: "Texto que aparece en el pie de los documentos generados."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "form",
          {
            onSubmit: handleSubmit,
            className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]",
            "data-ocid": "settings.service_terms.form",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-terms-text", children: "Texto del pie de página" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      id: "service-terms-text",
                      value: text,
                      onChange: (event) => setText(event.target.value),
                      placeholder: SERVICE_TERMS_DEFAULT_TEXT,
                      rows: 7,
                      "aria-invalid": !canSubmit && text.trim() === "",
                      "aria-describedby": "service-terms-help",
                      "data-ocid": "settings.service_terms.textarea"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      id: "service-terms-help",
                      className: "text-xs text-muted-foreground",
                      children: "Este pie de página aparece en órdenes de trabajo, cotizaciones, POS y facturas. Si lo dejas vacío, se usará el texto de recepción de la motocicleta por defecto."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "submit",
                    disabled: !canSubmit,
                    "data-ocid": "settings.service_terms.save_button",
                    className: "gap-2",
                    children: [
                      saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                      saveMutation.isPending ? "Guardando…" : "Guardar términos y condiciones"
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-label", children: "Vista previa en el pie del documento" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": "settings.service_terms.preview",
                    className: "rounded-md border border-dashed border-border bg-card px-4 py-4",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-line text-xs leading-relaxed text-muted-foreground", children: text.trim() || SERVICE_TERMS_DEFAULT_TEXT })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Así se verá el pie de página al final de cada documento generado." })
              ] })
            ]
          }
        ) })
      ]
    }
  );
}
function errorMessage$1(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
function SectionHeading$1({
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
function WarrantyTermsCard() {
  const settingsQuery = useWarrantyTermsSettings();
  const saveMutation = useUpdateWarrantyTermsSettings();
  const [text, setText] = reactExports.useState("");
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setText(data.text);
    setInitialized(true);
  }, [settingsQuery.data, initialized]);
  const canSubmit = text.trim() !== "" && !saveMutation.isPending;
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(
      { text: text.trim() },
      {
        onSuccess: () => {
          ue.success("Términos y condiciones de garantía guardados", {
            description: "El documento de garantía de las órdenes usará este texto."
          });
        },
        onError: (error) => {
          ue.error("No se pudieron guardar los términos de garantía", {
            description: errorMessage$1(error)
          });
        }
      }
    );
  }
  function handleRestoreDefault() {
    setText(WARRANTY_TERMS_DEFAULT_TEXT);
    ue.info("Texto predeterminado restaurado", {
      description: "Guarda para aplicar el texto de garantía predeterminado a los documentos."
    });
  }
  if (settingsQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        "data-ocid": "settings.warranty_terms.card",
        className: "rounded-lg shadow-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeading$1,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-4", "aria-hidden": "true" }),
              title: "Términos y Condiciones de Garantía",
              description: "Texto del documento de garantía de las órdenes de trabajo."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CardContent,
            {
              "data-ocid": "settings.warranty_terms.loading_state",
              className: "space-y-3 pt-6",
              children: Array.from(
                { length: 3 },
                (_, i) => `warranty-terms-skeleton-${i}`
              ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
              ] }, id))
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
        "data-ocid": "settings.warranty_terms.card",
        className: "rounded-lg shadow-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeading$1,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-4", "aria-hidden": "true" }),
              title: "Términos y Condiciones de Garantía",
              description: "Texto del documento de garantía de las órdenes de trabajo."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            CardContent,
            {
              "data-ocid": "settings.warranty_terms.error_state",
              className: "flex flex-col items-start gap-3 pt-6",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
                  "No se pudieron cargar los términos y condiciones de garantía."
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void settingsQuery.refetch(),
                    "data-ocid": "settings.warranty_terms.retry_button",
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "settings.warranty_terms.card",
      className: "rounded-lg shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionHeading$1,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-4", "aria-hidden": "true" }),
            title: "Términos y Condiciones de Garantía",
            description: "Texto del documento de garantía de las órdenes de trabajo."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "form",
          {
            onSubmit: handleSubmit,
            className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]",
            "data-ocid": "settings.warranty_terms.form",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "warranty-terms-text", children: "Texto del documento de garantía" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      id: "warranty-terms-text",
                      value: text,
                      onChange: (event) => setText(event.target.value),
                      placeholder: WARRANTY_TERMS_DEFAULT_TEXT,
                      rows: 14,
                      "aria-invalid": !canSubmit && text.trim() === "",
                      "aria-describedby": "warranty-terms-help",
                      "data-ocid": "settings.warranty_terms.textarea"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      id: "warranty-terms-help",
                      className: "text-xs text-muted-foreground",
                      children: "Este texto reemplaza el contenido del documento de garantía de las órdenes de trabajo (pantalla, imprimible y PDF). Si lo dejas vacío, se usará el texto de garantía predeterminado."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: handleRestoreDefault,
                      disabled: saveMutation.isPending,
                      "data-ocid": "settings.warranty_terms.restore_default_button",
                      className: "gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                        "Restaurar texto predeterminado"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "submit",
                      disabled: !canSubmit,
                      "data-ocid": "settings.warranty_terms.save_button",
                      className: "gap-2",
                      children: [
                        saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                        saveMutation.isPending ? "Guardando…" : "Guardar términos de garantía"
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-label", children: "Vista previa del documento" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": "settings.warranty_terms.preview",
                    className: "max-h-[22rem] overflow-y-auto rounded-md border border-dashed border-border bg-card px-4 py-4",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-line text-xs leading-relaxed text-muted-foreground", children: text.trim() || WARRANTY_TERMS_DEFAULT_TEXT })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Así se verá el contenido del documento de garantía de cada orden." })
              ] })
            ]
          }
        ) })
      ]
    }
  );
}
var RADIO_NAME = "Radio";
var [createRadioContext, createRadioScope] = createContextScope(RADIO_NAME);
var [RadioProvider, useRadioContext] = createRadioContext(RADIO_NAME);
var Radio = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRadio,
      name,
      checked = false,
      required,
      disabled,
      value = "on",
      onCheck,
      form,
      ...radioProps
    } = props;
    const [button, setButton] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
    const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
    const isFormControl = button ? form || !!button.closest("form") : true;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(RadioProvider, { scope: __scopeRadio, checked, disabled, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.button,
        {
          type: "button",
          role: "radio",
          "aria-checked": checked,
          "data-state": getState(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled,
          value,
          ...radioProps,
          ref: composedRefs,
          onClick: composeEventHandlers(props.onClick, (event) => {
            if (!checked) onCheck == null ? void 0 : onCheck();
            if (isFormControl) {
              hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
              if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
            }
          })
        }
      ),
      isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
        RadioBubbleInput,
        {
          control: button,
          bubbles: !hasConsumerStoppedPropagationRef.current,
          name,
          value,
          checked,
          required,
          disabled,
          form,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
Radio.displayName = RADIO_NAME;
var INDICATOR_NAME = "RadioIndicator";
var RadioIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeRadio, forceMount, ...indicatorProps } = props;
    const context = useRadioContext(INDICATOR_NAME, __scopeRadio);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.checked, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.span,
      {
        "data-state": getState(context.checked),
        "data-disabled": context.disabled ? "" : void 0,
        ...indicatorProps,
        ref: forwardedRef
      }
    ) });
  }
);
RadioIndicator.displayName = INDICATOR_NAME;
var BUBBLE_INPUT_NAME = "RadioBubbleInput";
var RadioBubbleInput = reactExports.forwardRef(
  ({
    __scopeRadio,
    control,
    checked,
    bubbles = true,
    ...props
  }, forwardedRef) => {
    const ref = reactExports.useRef(null);
    const composedRefs = useComposedRefs(ref, forwardedRef);
    const prevChecked = usePrevious(checked);
    const controlSize = useSize(control);
    reactExports.useEffect(() => {
      const input = ref.current;
      if (!input) return;
      const inputProto = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(
        inputProto,
        "checked"
      );
      const setChecked = descriptor.set;
      if (prevChecked !== checked && setChecked) {
        const event = new Event("click", { bubbles });
        setChecked.call(input, checked);
        input.dispatchEvent(event);
      }
    }, [prevChecked, checked, bubbles]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.input,
      {
        type: "radio",
        "aria-hidden": true,
        defaultChecked: checked,
        ...props,
        tabIndex: -1,
        ref: composedRefs,
        style: {
          ...props.style,
          ...controlSize,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0
        }
      }
    );
  }
);
RadioBubbleInput.displayName = BUBBLE_INPUT_NAME;
function getState(checked) {
  return checked ? "checked" : "unchecked";
}
var ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
var RADIO_GROUP_NAME = "RadioGroup";
var [createRadioGroupContext] = createContextScope(RADIO_GROUP_NAME, [
  createRovingFocusGroupScope,
  createRadioScope
]);
var useRovingFocusGroupScope = createRovingFocusGroupScope();
var useRadioScope = createRadioScope();
var [RadioGroupProvider, useRadioGroupContext] = createRadioGroupContext(RADIO_GROUP_NAME);
var RadioGroup$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRadioGroup,
      name,
      defaultValue,
      value: valueProp,
      required = false,
      disabled = false,
      orientation,
      dir,
      loop = true,
      onValueChange,
      ...groupProps
    } = props;
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup);
    const direction = useDirection(dir);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? null,
      onChange: onValueChange,
      caller: RADIO_GROUP_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      RadioGroupProvider,
      {
        scope: __scopeRadioGroup,
        name,
        required,
        disabled,
        value,
        onValueChange: setValue,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Root,
          {
            asChild: true,
            ...rovingFocusGroupScope,
            orientation,
            dir: direction,
            loop,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Primitive.div,
              {
                role: "radiogroup",
                "aria-required": required,
                "aria-orientation": orientation,
                "data-disabled": disabled ? "" : void 0,
                dir: direction,
                ...groupProps,
                ref: forwardedRef
              }
            )
          }
        )
      }
    );
  }
);
RadioGroup$1.displayName = RADIO_GROUP_NAME;
var ITEM_NAME = "RadioGroupItem";
var RadioGroupItem$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeRadioGroup, disabled, ...itemProps } = props;
    const context = useRadioGroupContext(ITEM_NAME, __scopeRadioGroup);
    const isDisabled = context.disabled || disabled;
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup);
    const radioScope = useRadioScope(__scopeRadioGroup);
    const ref = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const checked = context.value === itemProps.value;
    const isArrowKeyPressedRef = reactExports.useRef(false);
    reactExports.useEffect(() => {
      const handleKeyDown = (event) => {
        if (ARROW_KEYS.includes(event.key)) {
          isArrowKeyPressedRef.current = true;
        }
      };
      const handleKeyUp = () => isArrowKeyPressedRef.current = false;
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
      };
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Item,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        focusable: !isDisabled,
        active: checked,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Radio,
          {
            disabled: isDisabled,
            required: context.required,
            checked,
            ...radioScope,
            ...itemProps,
            name: context.name,
            ref: composedRefs,
            onCheck: () => context.onValueChange(itemProps.value),
            onKeyDown: composeEventHandlers((event) => {
              if (event.key === "Enter") event.preventDefault();
            }),
            onFocus: composeEventHandlers(itemProps.onFocus, () => {
              var _a;
              if (isArrowKeyPressedRef.current) (_a = ref.current) == null ? void 0 : _a.click();
            })
          }
        )
      }
    );
  }
);
RadioGroupItem$1.displayName = ITEM_NAME;
var INDICATOR_NAME2 = "RadioGroupIndicator";
var RadioGroupIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeRadioGroup, ...indicatorProps } = props;
    const radioScope = useRadioScope(__scopeRadioGroup);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RadioIndicator, { ...radioScope, ...indicatorProps, ref: forwardedRef });
  }
);
RadioGroupIndicator.displayName = INDICATOR_NAME2;
var Root2 = RadioGroup$1;
var Item2 = RadioGroupItem$1;
var Indicator = RadioGroupIndicator;
function RadioGroup({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root2,
    {
      "data-slot": "radio-group",
      className: cn("grid gap-3", className),
      ...props
    }
  );
}
function RadioGroupItem({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Item2,
    {
      "data-slot": "radio-group-item",
      className: cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Indicator,
        {
          "data-slot": "radio-group-indicator",
          className: "relative flex items-center justify-center",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" })
        }
      )
    }
  );
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
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings(token);
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
      return actor.updateBusinessSettings(token, settings);
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
  var _a;
  const { actor, isFetching } = useBackend();
  const { user, roleName, token, refetch } = useAuth();
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
  const sessionName = (user == null ? void 0 : user.name) ?? ((_a = profileQuery.data) == null ? void 0 : _a.name) ?? "";
  const username = (user == null ? void 0 : user.username) ?? "";
  const displayRole = user ? roleName : profileQuery.data ? roleName : "";
  reactExports.useEffect(() => {
    if (initialized) return;
    if (user) {
      setDisplayName(user.name);
      setInitialized(true);
      return;
    }
    const data = profileQuery.data;
    if (!data) return;
    setDisplayName(data.name);
    setInitialized(true);
  }, [user, profileQuery.data, initialized]);
  const saveMutation = useMutation({
    mutationFn: async (value) => {
      if (!actor) throw new Error("Backend no disponible");
      if (token) {
        return actor.updateCallerName(token, value);
      }
      return actor.saveCallerUserProfile(value);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
      refetch();
      ue.success("Nombre actualizado");
    },
    onError: (error) => {
      ue.error("No se pudo actualizar tu nombre", {
        description: errorMessage(error)
      });
    }
  });
  const canSubmit = displayName.trim() !== "" && displayName.trim() !== sessionName && !saveMutation.isPending;
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
        description: "Tu nombre, usuario de acceso y rol en el taller."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: profileQuery.isLoading && !user ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "settings.profile.loading_state", className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full max-w-sm" })
    ] }) : profileQuery.isError && !user ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "field-label", children: "Nombre" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "dd",
            {
              "data-ocid": "settings.profile.name_value",
              className: "truncate text-sm font-medium",
              children: sessionName || "Sin nombre"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "field-label", children: "Usuario de acceso" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "dd",
            {
              "data-ocid": "settings.profile.username_value",
              className: "users-username truncate",
              children: username || "—"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "field-label", children: "Rol" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { "data-ocid": "settings.profile.role_value", className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge-role", "data-role": "custom", children: displayRole || "—" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "form",
        {
          onSubmit: handleSubmit,
          className: "flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-end",
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
      )
    ] }) })
  ] });
}
function ChangePasswordCard() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = reactExports.useState("");
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [feedback, setFeedback] = reactExports.useState(null);
  const changeMutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      if (!token) {
        throw new Error(
          "Debes iniciar sesión con usuario y contraseña para cambiarla."
        );
      }
      return actor.changeOwnPassword(
        token,
        input.currentPassword,
        input.newPassword
      );
    },
    onSuccess: (changed) => {
      if (changed) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFeedback({
          tone: "success",
          message: "Tu contraseña se actualizó correctamente."
        });
        ue.success("Contraseña actualizada");
      } else {
        setFeedback({
          tone: "error",
          message: "La contraseña actual no es correcta. Verifícala e inténtalo de nuevo."
        });
      }
    },
    onError: (error) => {
      setFeedback({ tone: "error", message: errorMessage(error) });
    }
  });
  const mismatch = confirmPassword !== "" && newPassword !== confirmPassword;
  const canSubmit = currentPassword !== "" && newPassword !== "" && confirmPassword !== "" && !mismatch && !changeMutation.isPending;
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setFeedback(null);
    changeMutation.mutate({ currentPassword, newPassword });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.password.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeading,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "size-4", "aria-hidden": "true" }),
        title: "Cambiar contraseña",
        description: "Actualiza la contraseña con la que ingresas a la aplicación."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        onSubmit: handleSubmit,
        className: "grid max-w-xl gap-4",
        "data-ocid": "settings.password.form",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password-current", children: "Contraseña actual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "password-current",
                type: "password",
                value: currentPassword,
                onChange: (event) => setCurrentPassword(event.target.value),
                autoComplete: "current-password",
                "data-ocid": "settings.password.current_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password-new", children: "Contraseña nueva" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "password-new",
                type: "password",
                value: newPassword,
                onChange: (event) => setNewPassword(event.target.value),
                autoComplete: "new-password",
                "data-ocid": "settings.password.new_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password-confirm", children: "Confirmar contraseña nueva" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "password-confirm",
                type: "password",
                value: confirmPassword,
                onChange: (event) => setConfirmPassword(event.target.value),
                autoComplete: "new-password",
                "aria-invalid": mismatch,
                "aria-describedby": mismatch ? "password-confirm-error" : void 0,
                "data-ocid": "settings.password.confirm_input"
              }
            ),
            mismatch && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                id: "password-confirm-error",
                "data-ocid": "settings.password.confirm_error",
                className: "text-xs text-destructive",
                children: "Las contraseñas nuevas no coinciden."
              }
            )
          ] }),
          feedback && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": feedback.tone === "success" ? "settings.password.success_state" : "settings.password.error_state",
              className: "auth-alert",
              "data-tone": feedback.tone === "success" ? "info" : "error",
              children: [
                feedback.tone === "success" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mt-0.5 size-4 shrink-0", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-4 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: feedback.message })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "submit",
              disabled: !canSubmit,
              "data-ocid": "settings.password.submit_button",
              className: "gap-2",
              children: [
                changeMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "size-4", "aria-hidden": "true" }),
                changeMutation.isPending ? "Actualizando…" : "Cambiar contraseña"
              ]
            }
          ) })
        ]
      }
    ) })
  ] });
}
function HopeMessageCard() {
  var _a, _b, _c, _d, _e;
  const settingsQuery = useHopeSettings();
  const dailyQuery = useDailyHopeMessage();
  const saveMutation = useUpdateHopeSettings();
  const [enabled, setEnabled] = reactExports.useState(true);
  const [mode, setMode] = reactExports.useState(HopeMode.auto);
  const [manualText, setManualText] = reactExports.useState("");
  const [manualCitation, setManualCitation] = reactExports.useState("");
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setEnabled(data.enabled);
    setMode(data.mode);
    setManualText(data.manualText);
    setManualCitation(data.manualCitation);
    setInitialized(true);
  }, [settingsQuery.data, initialized]);
  const manualTextValid = manualText.trim() !== "";
  const manualCitationValid = manualCitation.trim() !== "";
  const manualValid = manualTextValid && manualCitationValid;
  const canSubmit = (mode === HopeMode.auto || manualValid) && !saveMutation.isPending;
  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(
      {
        enabled,
        mode,
        manualText: manualText.trim(),
        manualCitation: manualCitation.trim()
      },
      {
        onSuccess: () => {
          ue.success("Mensaje de esperanza guardado", {
            description: "Los documentos generados a partir de ahora usarán esta configuración."
          });
        },
        onError: (error) => {
          ue.error("No se pudo guardar el mensaje de esperanza", {
            description: errorMessage(error)
          });
        }
      }
    );
  }
  const previewText = mode === HopeMode.manual ? manualText.trim() : ((_a = dailyQuery.data) == null ? void 0 : _a.text) ?? "";
  const previewCitation = mode === HopeMode.manual ? manualCitation.trim() : ((_b = dailyQuery.data) == null ? void 0 : _b.citation) ?? "";
  const previewDate = ((_c = dailyQuery.data) == null ? void 0 : _c.referenceDate) ?? formatColombiaDateDDMMYYYY(/* @__PURE__ */ new Date());
  if (settingsQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.hope.card", className: "rounded-lg shadow-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionHeading,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-4", "aria-hidden": "true" }),
          title: "Mensaje de esperanza",
          description: "Promesa bíblica que aparece en el pie de los documentos."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        CardContent,
        {
          "data-ocid": "settings.hope.loading_state",
          className: "space-y-3 pt-6",
          children: Array.from({ length: 3 }, (_, i) => `hope-skeleton-${i}`).map(
            (id) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
            ] }, id)
          )
        }
      )
    ] });
  }
  if (settingsQuery.isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.hope.card", className: "rounded-lg shadow-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionHeading,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-4", "aria-hidden": "true" }),
          title: "Mensaje de esperanza",
          description: "Promesa bíblica que aparece en el pie de los documentos."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        CardContent,
        {
          "data-ocid": "settings.hope.error_state",
          className: "flex flex-col items-start gap-3 pt-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
              "No se pudo cargar la configuración del mensaje de esperanza."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => void settingsQuery.refetch(),
                "data-ocid": "settings.hope.retry_button",
                children: "Reintentar"
              }
            )
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "settings.hope.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeading,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-4", "aria-hidden": "true" }),
        title: "Mensaje de esperanza",
        description: "Promesa bíblica que aparece en el pie de los documentos y mensajes."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        onSubmit: handleSubmit,
        className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]",
        "data-ocid": "settings.hope.form",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 rounded-md border border-border bg-secondary/40 px-3 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "hope-enabled", className: "text-sm font-medium", children: "Mostrar el mensaje en los formatos" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Actívalo para incluir la promesa en el pie de facturas, cotizaciones y órdenes." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Switch,
                {
                  id: "hope-enabled",
                  checked: enabled,
                  onCheckedChange: setEnabled,
                  "data-ocid": "settings.hope.enabled_switch"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "field-label", children: "Modo del mensaje" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                RadioGroup,
                {
                  value: mode,
                  onValueChange: (value) => setMode(value),
                  className: "grid gap-3 sm:grid-cols-2",
                  "data-ocid": "settings.hope.mode_radio",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "label",
                      {
                        htmlFor: "hope-mode-auto",
                        className: "flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:bg-secondary/40",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            RadioGroupItem,
                            {
                              id: "hope-mode-auto",
                              value: HopeMode.auto,
                              className: "mt-0.5",
                              "data-ocid": "settings.hope.mode_auto_radio"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 space-y-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium", children: "Automático" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Rota una promesa distinta cada día." })
                          ] })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "label",
                      {
                        htmlFor: "hope-mode-manual",
                        className: "flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:bg-secondary/40",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            RadioGroupItem,
                            {
                              id: "hope-mode-manual",
                              value: HopeMode.manual,
                              className: "mt-0.5",
                              "data-ocid": "settings.hope.mode_manual_radio"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 space-y-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium", children: "Manual" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Usa siempre el texto y la cita que escribas." })
                          ] })
                        ]
                      }
                    )
                  ]
                }
              )
            ] }),
            mode === HopeMode.auto ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "settings.hope.auto_panel",
                className: "space-y-2 rounded-md border border-border bg-secondary/30 px-3 py-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-label", children: "Promesa de hoy" }),
                  dailyQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      "data-ocid": "settings.hope.auto_loading_state",
                      className: "space-y-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-2/3" })
                      ]
                    }
                  ) : dailyQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      "data-ocid": "settings.hope.auto_error_state",
                      className: "flex flex-col items-start gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: "No se pudo cargar la promesa de hoy." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "outline",
                            size: "sm",
                            onClick: () => void dailyQuery.refetch(),
                            "data-ocid": "settings.hope.auto_retry_button",
                            children: "Reintentar"
                          }
                        )
                      ]
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("blockquote", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "p",
                      {
                        "data-ocid": "settings.hope.auto_text",
                        className: "text-sm italic text-foreground",
                        children: [
                          "“",
                          ((_d = dailyQuery.data) == null ? void 0 : _d.text) ?? "—",
                          "”"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "footer",
                      {
                        "data-ocid": "settings.hope.auto_citation",
                        className: "text-xs font-medium text-muted-foreground",
                        children: ((_e = dailyQuery.data) == null ? void 0 : _e.citation) ?? "—"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "La promesa cambia automáticamente cada día. No es editable en este modo." })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "hope-manual-text", children: "Texto del mensaje" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    id: "hope-manual-text",
                    value: manualText,
                    onChange: (event) => setManualText(event.target.value),
                    placeholder: "Escribe la promesa que quieres mostrar…",
                    rows: 3,
                    "aria-invalid": !manualTextValid,
                    "aria-describedby": manualTextValid ? void 0 : "hope-manual-text-error",
                    "data-ocid": "settings.hope.manual_text_input"
                  }
                ),
                !manualTextValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    id: "hope-manual-text-error",
                    "data-ocid": "settings.hope.manual_text_error",
                    className: "text-xs text-destructive",
                    children: "El texto del mensaje no puede estar vacío."
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "hope-manual-citation", children: "Cita bíblica" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "hope-manual-citation",
                    value: manualCitation,
                    onChange: (event) => setManualCitation(event.target.value),
                    placeholder: "Juan 3:16",
                    "aria-invalid": !manualCitationValid,
                    "aria-describedby": manualCitationValid ? void 0 : "hope-manual-citation-error",
                    "data-ocid": "settings.hope.manual_citation_input"
                  }
                ),
                !manualCitationValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    id: "hope-manual-citation-error",
                    "data-ocid": "settings.hope.manual_citation_error",
                    className: "text-xs text-destructive",
                    children: "La cita bíblica no puede estar vacía."
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: !canSubmit,
                "data-ocid": "settings.hope.save_button",
                className: "gap-2",
                children: [
                  saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                  saveMutation.isPending ? "Guardando…" : "Guardar mensaje"
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-label", children: "Vista previa en el pie del documento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                "data-ocid": "settings.hope.preview",
                className: "rounded-md border border-dashed border-border bg-card px-4 py-4",
                children: enabled ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm italic text-foreground", children: [
                    "“",
                    previewText || "—",
                    "”"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: previewCitation || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "border-t border-border pt-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground", children: previewDate })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "settings.hope.preview_hidden",
                    className: "text-center text-xs text-muted-foreground",
                    children: "El mensaje está oculto y no aparecerá en los documentos."
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Así se verá la promesa al final de cada documento generado." })
          ] })
        ]
      }
    ) })
  ] });
}
function UserManagementLinksCard() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "settings.user_management.card",
      className: "rounded-lg shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionHeading,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-4", "aria-hidden": "true" }),
            title: "Usuarios y roles",
            description: "La gestión de usuarios y roles ahora tiene sus propias pantallas."
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/configuracion/usuarios", "data-ocid": "settings.users.link", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-4", "aria-hidden": "true" }),
              "Gestionar usuarios"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/configuracion/roles", "data-ocid": "settings.roles.link", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-4", "aria-hidden": "true" }),
              "Gestionar roles"
            ] }) })
          ] })
        ] })
      ]
    }
  );
}
function SettingsPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "settings.page", className: "mx-auto w-full max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-6 flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground", children: "Administración" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Configuración" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Datos fiscales del negocio, impuestos, tu perfil y tu contraseña." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessSettingsForm, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HopeMessageCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ServiceTermsCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(WarrantyTermsCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DriveBackupCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LocalBackupCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RestoreBackupCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CallerProfileCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChangePasswordCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UserManagementLinksCard, {})
    ] })
  ] });
}
export {
  CallerProfileCard,
  ChangePasswordCard,
  SettingsPage
};
