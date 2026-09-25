import { K as createLucideIcon, s as reactExports, a2 as useComposedRefs, a0 as useControllableState, j as jsxRuntimeExports, a3 as Primitive, a4 as composeEventHandlers, a9 as createContextScope, ae as cn, a1 as useId, at as useCallbackRef, a5 as Presence, k as useBackend, q as useNavigate, r as useSearch, l as useQuery, B as Button, U as Users, t as Search, v as Input, w as Badge, T as TriangleAlert, C as ClipboardList, ar as ue, au as UserCog, x as formatMoney, aj as formatTaxRate, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, $ as DialogFooter, L as Link, O as OrderStatus } from "./index-CzQEXdHP.js";
import { D as DataTable } from "./DataTable-CAP1Nt9Z.js";
import { O as OrderStatusBadge } from "./OrderStatusBadge-CxgFlEFQ.js";
import { P as PageHeader } from "./PageHeader-JDKYCqW_.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
import { C as Card, c as CardContent } from "./card-D8aqbagN.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { u as usePrevious, g as useSize, h as createCollection, i as useDirection, S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { u as useTechnicians, a as useTechnicianWorkloads, b as useDeleteTechnician, c as useCreateTechnician, d as useUpdateTechnician } from "./use-technicians-WbGtHu33.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import { P as Pencil } from "./pencil-Vues_1SE.js";
import "./alert-dialog-BQof8xF8.js";
import "./table-CKrT3zG1.js";
import "./trash-2-M_celBpV.js";
import "./check-DrBSQP0y.js";
import "./ban-DaWQDtIv.js";
import "./chevron-up-B1sEs4Rc.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m12 14 4-4", key: "9kzdfg" }],
  ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }]
];
const Gauge = createLucideIcon("gauge", __iconNode);
var SWITCH_NAME = "Switch";
var [createSwitchContext] = createContextScope(SWITCH_NAME);
var [SwitchProvider, useSwitchContext] = createSwitchContext(SWITCH_NAME);
var Switch$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeSwitch,
      name,
      checked: checkedProp,
      defaultChecked,
      required,
      disabled,
      value = "on",
      onCheckedChange,
      form,
      ...switchProps
    } = props;
    const [button, setButton] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
    const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
    const isFormControl = button ? form || !!button.closest("form") : true;
    const [checked, setChecked] = useControllableState({
      prop: checkedProp,
      defaultProp: defaultChecked ?? false,
      onChange: onCheckedChange,
      caller: SWITCH_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(SwitchProvider, { scope: __scopeSwitch, checked, disabled, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": checked,
          "aria-required": required,
          "data-state": getState(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled,
          value,
          ...switchProps,
          ref: composedRefs,
          onClick: composeEventHandlers(props.onClick, (event) => {
            setChecked((prevChecked) => !prevChecked);
            if (isFormControl) {
              hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
              if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
            }
          })
        }
      ),
      isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SwitchBubbleInput,
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
Switch$1.displayName = SWITCH_NAME;
var THUMB_NAME = "SwitchThumb";
var SwitchThumb = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSwitch, ...thumbProps } = props;
    const context = useSwitchContext(THUMB_NAME, __scopeSwitch);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.span,
      {
        "data-state": getState(context.checked),
        "data-disabled": context.disabled ? "" : void 0,
        ...thumbProps,
        ref: forwardedRef
      }
    );
  }
);
SwitchThumb.displayName = THUMB_NAME;
var BUBBLE_INPUT_NAME = "SwitchBubbleInput";
var SwitchBubbleInput = reactExports.forwardRef(
  ({
    __scopeSwitch,
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
      "input",
      {
        type: "checkbox",
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
SwitchBubbleInput.displayName = BUBBLE_INPUT_NAME;
function getState(checked) {
  return checked ? "checked" : "unchecked";
}
var Root$1 = Switch$1;
var Thumb = SwitchThumb;
function Switch({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root$1,
    {
      "data-slot": "switch",
      className: cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Thumb,
        {
          "data-slot": "switch-thumb",
          className: cn(
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )
        }
      )
    }
  );
}
var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
var EVENT_OPTIONS = { bubbles: false, cancelable: true };
var GROUP_NAME = "RovingFocusGroup";
var [Collection, useCollection, createCollectionScope] = createCollection(GROUP_NAME);
var [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope(
  GROUP_NAME,
  [createCollectionScope]
);
var [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME);
var RovingFocusGroup = reactExports.forwardRef(
  (props, forwardedRef) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RovingFocusGroupImpl, { ...props, ref: forwardedRef }) }) });
  }
);
RovingFocusGroup.displayName = GROUP_NAME;
var RovingFocusGroupImpl = reactExports.forwardRef((props, forwardedRef) => {
  const {
    __scopeRovingFocusGroup,
    orientation,
    loop = false,
    dir,
    currentTabStopId: currentTabStopIdProp,
    defaultCurrentTabStopId,
    onCurrentTabStopIdChange,
    onEntryFocus,
    preventScrollOnEntryFocus = false,
    ...groupProps
  } = props;
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const direction = useDirection(dir);
  const [currentTabStopId, setCurrentTabStopId] = useControllableState({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId ?? null,
    onChange: onCurrentTabStopIdChange,
    caller: GROUP_NAME
  });
  const [isTabbingBackOut, setIsTabbingBackOut] = reactExports.useState(false);
  const handleEntryFocus = useCallbackRef(onEntryFocus);
  const getItems = useCollection(__scopeRovingFocusGroup);
  const isClickFocusRef = reactExports.useRef(false);
  const [focusableItemsCount, setFocusableItemsCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener(ENTRY_FOCUS, handleEntryFocus);
      return () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
    }
  }, [handleEntryFocus]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    RovingFocusProvider,
    {
      scope: __scopeRovingFocusGroup,
      orientation,
      dir: direction,
      loop,
      currentTabStopId,
      onItemFocus: reactExports.useCallback(
        (tabStopId) => setCurrentTabStopId(tabStopId),
        [setCurrentTabStopId]
      ),
      onItemShiftTab: reactExports.useCallback(() => setIsTabbingBackOut(true), []),
      onFocusableItemAdd: reactExports.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount + 1),
        []
      ),
      onFocusableItemRemove: reactExports.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount - 1),
        []
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.div,
        {
          tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
          "data-orientation": orientation,
          ...groupProps,
          ref: composedRefs,
          style: { outline: "none", ...props.style },
          onMouseDown: composeEventHandlers(props.onMouseDown, () => {
            isClickFocusRef.current = true;
          }),
          onFocus: composeEventHandlers(props.onFocus, (event) => {
            const isKeyboardFocus = !isClickFocusRef.current;
            if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
              const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
              event.currentTarget.dispatchEvent(entryFocusEvent);
              if (!entryFocusEvent.defaultPrevented) {
                const items = getItems().filter((item) => item.focusable);
                const activeItem = items.find((item) => item.active);
                const currentItem = items.find((item) => item.id === currentTabStopId);
                const candidateItems = [activeItem, currentItem, ...items].filter(
                  Boolean
                );
                const candidateNodes = candidateItems.map((item) => item.ref.current);
                focusFirst(candidateNodes, preventScrollOnEntryFocus);
              }
            }
            isClickFocusRef.current = false;
          }),
          onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(false))
        }
      )
    }
  );
});
var ITEM_NAME = "RovingFocusGroupItem";
var RovingFocusGroupItem = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRovingFocusGroup,
      focusable = true,
      active = false,
      tabStopId,
      children,
      ...itemProps
    } = props;
    const autoId = useId();
    const id = tabStopId || autoId;
    const context = useRovingFocusContext(ITEM_NAME, __scopeRovingFocusGroup);
    const isCurrentTabStop = context.currentTabStopId === id;
    const getItems = useCollection(__scopeRovingFocusGroup);
    const { onFocusableItemAdd, onFocusableItemRemove, currentTabStopId } = context;
    reactExports.useEffect(() => {
      if (focusable) {
        onFocusableItemAdd();
        return () => onFocusableItemRemove();
      }
    }, [focusable, onFocusableItemAdd, onFocusableItemRemove]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Collection.ItemSlot,
      {
        scope: __scopeRovingFocusGroup,
        id,
        focusable,
        active,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.span,
          {
            tabIndex: isCurrentTabStop ? 0 : -1,
            "data-orientation": context.orientation,
            ...itemProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
              if (!focusable) event.preventDefault();
              else context.onItemFocus(id);
            }),
            onFocus: composeEventHandlers(props.onFocus, () => context.onItemFocus(id)),
            onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
              if (event.key === "Tab" && event.shiftKey) {
                context.onItemShiftTab();
                return;
              }
              if (event.target !== event.currentTarget) return;
              const focusIntent = getFocusIntent(event, context.orientation, context.dir);
              if (focusIntent !== void 0) {
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                event.preventDefault();
                const items = getItems().filter((item) => item.focusable);
                let candidateNodes = items.map((item) => item.ref.current);
                if (focusIntent === "last") candidateNodes.reverse();
                else if (focusIntent === "prev" || focusIntent === "next") {
                  if (focusIntent === "prev") candidateNodes.reverse();
                  const currentIndex = candidateNodes.indexOf(event.currentTarget);
                  candidateNodes = context.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                }
                setTimeout(() => focusFirst(candidateNodes));
              }
            }),
            children: typeof children === "function" ? children({ isCurrentTabStop, hasTabStop: currentTabStopId != null }) : children
          }
        )
      }
    );
  }
);
RovingFocusGroupItem.displayName = ITEM_NAME;
var MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function getFocusIntent(event, orientation, dir) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}
function focusFirst(candidates, preventScroll = false) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({ preventScroll });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function wrapArray(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
var Root = RovingFocusGroup;
var Item = RovingFocusGroupItem;
var TABS_NAME = "Tabs";
var [createTabsContext] = createContextScope(TABS_NAME, [
  createRovingFocusGroupScope
]);
var useRovingFocusGroupScope = createRovingFocusGroupScope();
var [TabsProvider, useTabsContext] = createTabsContext(TABS_NAME);
var Tabs$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeTabs,
      value: valueProp,
      onValueChange,
      defaultValue,
      orientation = "horizontal",
      dir,
      activationMode = "automatic",
      ...tabsProps
    } = props;
    const direction = useDirection(dir);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
      defaultProp: defaultValue ?? "",
      caller: TABS_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      TabsProvider,
      {
        scope: __scopeTabs,
        baseId: useId(),
        value,
        onValueChange: setValue,
        orientation,
        dir: direction,
        activationMode,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            dir: direction,
            "data-orientation": orientation,
            ...tabsProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
Tabs$1.displayName = TABS_NAME;
var TAB_LIST_NAME = "TabsList";
var TabsList$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, loop = true, ...listProps } = props;
    const context = useTabsContext(TAB_LIST_NAME, __scopeTabs);
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeTabs);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Root,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        orientation: context.orientation,
        dir: context.dir,
        loop,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            role: "tablist",
            "aria-orientation": context.orientation,
            ...listProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
TabsList$1.displayName = TAB_LIST_NAME;
var TRIGGER_NAME = "TabsTrigger";
var TabsTrigger$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, value, disabled = false, ...triggerProps } = props;
    const context = useTabsContext(TRIGGER_NAME, __scopeTabs);
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeTabs);
    const triggerId = makeTriggerId(context.baseId, value);
    const contentId = makeContentId(context.baseId, value);
    const isSelected = value === context.value;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Item,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        focusable: !disabled,
        active: isSelected,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.button,
          {
            type: "button",
            role: "tab",
            "aria-selected": isSelected,
            "aria-controls": contentId,
            "data-state": isSelected ? "active" : "inactive",
            "data-disabled": disabled ? "" : void 0,
            disabled,
            id: triggerId,
            ...triggerProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
              if (!disabled && event.button === 0 && event.ctrlKey === false) {
                context.onValueChange(value);
              } else {
                event.preventDefault();
              }
            }),
            onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
              if ([" ", "Enter"].includes(event.key)) context.onValueChange(value);
            }),
            onFocus: composeEventHandlers(props.onFocus, () => {
              const isAutomaticActivation = context.activationMode !== "manual";
              if (!isSelected && !disabled && isAutomaticActivation) {
                context.onValueChange(value);
              }
            })
          }
        )
      }
    );
  }
);
TabsTrigger$1.displayName = TRIGGER_NAME;
var CONTENT_NAME = "TabsContent";
var TabsContent$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, value, forceMount, children, ...contentProps } = props;
    const context = useTabsContext(CONTENT_NAME, __scopeTabs);
    const triggerId = makeTriggerId(context.baseId, value);
    const contentId = makeContentId(context.baseId, value);
    const isSelected = value === context.value;
    const isMountAnimationPreventedRef = reactExports.useRef(isSelected);
    reactExports.useEffect(() => {
      const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
      return () => cancelAnimationFrame(rAF);
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || isSelected, children: ({ present }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": isSelected ? "active" : "inactive",
        "data-orientation": context.orientation,
        role: "tabpanel",
        "aria-labelledby": triggerId,
        hidden: !present,
        id: contentId,
        tabIndex: 0,
        ...contentProps,
        ref: forwardedRef,
        style: {
          ...props.style,
          animationDuration: isMountAnimationPreventedRef.current ? "0s" : void 0
        },
        children: present && children
      }
    ) });
  }
);
TabsContent$1.displayName = CONTENT_NAME;
function makeTriggerId(baseId, value) {
  return `${baseId}-trigger-${value}`;
}
function makeContentId(baseId, value) {
  return `${baseId}-content-${value}`;
}
var Root2 = Tabs$1;
var List = TabsList$1;
var Trigger = TabsTrigger$1;
var Content = TabsContent$1;
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root2,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    List,
    {
      "data-slot": "tabs-list",
      className: cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function TabsContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Content,
    {
      "data-slot": "tabs-content",
      className: cn("flex-1 outline-none", className),
      ...props
    }
  );
}
const ALL_SPECIALTY = "__all__";
const SKELETON_IDS = Array.from(
  { length: 5 },
  (_, index) => `technician-skeleton-${index}`
);
const ACTIVE_ORDER_STATUSES = [
  OrderStatus.received,
  OrderStatus.inRepair,
  OrderStatus.ready
];
const EMPTY_FORM = {
  code: "",
  name: "",
  phone: "",
  email: "",
  specialty: "",
  hourlyRate: "",
  commissionRate: "",
  active: true
};
function toFormState(technician) {
  return {
    code: technician.code,
    name: technician.name,
    phone: technician.phone,
    email: technician.email ?? "",
    specialty: technician.specialty,
    hourlyRate: (Number(technician.hourlyRate) / 100).toFixed(2),
    commissionRate: technician.commissionRate.toString(),
    active: technician.active
  };
}
function parseRateToCents(value) {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return BigInt(Math.round(amount * 100));
}
function parseCommission(value) {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100) return null;
  return BigInt(Math.round(amount));
}
function toTechnicianInput(form) {
  const code = form.code.trim();
  const name = form.name.trim();
  const phone = form.phone.trim();
  const specialty = form.specialty.trim();
  const email = form.email.trim();
  const hourlyRate = parseRateToCents(form.hourlyRate);
  const commissionRate = parseCommission(form.commissionRate);
  if (code === "" || name === "" || phone === "" || specialty === "" || hourlyRate === null || commissionRate === null) {
    return null;
  }
  return {
    code,
    name,
    phone,
    specialty,
    hourlyRate,
    commissionRate,
    active: form.active,
    email: email === "" ? void 0 : email
  };
}
function duplicateCodeMessage(error, code) {
  const message = error.message ?? "";
  if (!/c[oó]digo/i.test(message)) return null;
  return `Ya existe un técnico con el código ${code}. Usa un código distinto.`;
}
function specialtyOptions(technicians) {
  const values = /* @__PURE__ */ new Set();
  for (const technician of technicians) {
    const specialty = technician.specialty.trim();
    if (specialty !== "") values.add(specialty);
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
}
function TechnicianDialog({
  open,
  onOpenChange,
  technician,
  specialties
}) {
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  const createTechnician = useCreateTechnician();
  const updateTechnician = useUpdateTechnician();
  const isEditing = technician !== null;
  const isPending = createTechnician.isPending || updateTechnician.isPending;
  reactExports.useEffect(() => {
    if (!open) return;
    setForm(technician ? toFormState(technician) : EMPTY_FORM);
    setError(null);
  }, [open, technician]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const input = toTechnicianInput(form);
    if (input === null) {
      setError(
        "Completa el código, el nombre, el teléfono, la especialidad, una tarifa por hora válida y una comisión entre 0 y 100."
      );
      return;
    }
    setError(null);
    const onSuccess = () => {
      ue.success(
        isEditing ? "Técnico actualizado" : "Técnico registrado en el taller"
      );
      onOpenChange(false);
    };
    const onError = (mutationError) => {
      setError(
        duplicateCodeMessage(mutationError, input.code) ?? mutationError.message ?? "No se pudo guardar el técnico. Inténtalo de nuevo."
      );
    };
    if (technician) {
      updateTechnician.mutate(
        { id: technician.id, input },
        { onSuccess, onError }
      );
      return;
    }
    createTechnician.mutate(input, { onSuccess, onError });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "technicians.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar técnico" : "Nuevo técnico" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Código de identificación, datos de contacto, especialidad, tarifa por hora y comisión sobre la mano de obra." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-code", children: "Código de identificación" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-code",
                  value: form.code,
                  onChange: (event) => update("code", event.target.value),
                  placeholder: "TEC-001",
                  autoComplete: "off",
                  "data-ocid": "technicians.code_input",
                  className: "data-rail uppercase",
                  required: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Único por técnico; se muestra junto a su nombre en las órdenes." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-name", children: "Nombre completo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-name",
                  value: form.name,
                  onChange: (event) => update("name", event.target.value),
                  placeholder: "Marco Antonio Ríos",
                  "data-ocid": "technicians.name_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-phone", children: "Teléfono" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-phone",
                  value: form.phone,
                  onChange: (event) => update("phone", event.target.value),
                  placeholder: "81 8123 4567",
                  "data-ocid": "technicians.phone_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-email", children: "Correo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-email",
                  type: "email",
                  value: form.email,
                  onChange: (event) => update("email", event.target.value),
                  placeholder: "marco.rios@taller.co",
                  "data-ocid": "technicians.email_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-specialty", children: "Especialidad" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-specialty",
                  value: form.specialty,
                  onChange: (event) => update("specialty", event.target.value),
                  placeholder: "Motores y transmisión",
                  list: "technician-specialty-options",
                  "data-ocid": "technicians.specialty_input",
                  required: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("datalist", { id: "technician-specialty-options", children: specialties.map((specialty) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: specialty }, specialty)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-rate", children: "Tarifa por hora (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-rate",
                  inputMode: "decimal",
                  value: form.hourlyRate,
                  onChange: (event) => update("hourlyRate", event.target.value),
                  placeholder: "180.00",
                  "data-ocid": "technicians.rate_input",
                  className: "data-rail",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-commission", children: "Comisión sobre mano de obra (%)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "technician-commission",
                  inputMode: "numeric",
                  min: 0,
                  max: 100,
                  value: form.commissionRate,
                  onChange: (event) => update("commissionRate", event.target.value),
                  placeholder: "10",
                  "data-ocid": "technicians.commission_input",
                  className: "data-rail",
                  required: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Porcentaje que se paga al técnico sobre la mano de obra que realiza." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 sm:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "technician-active", children: "Técnico activo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Los técnicos inactivos no reciben nuevas órdenes de taller." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Switch,
                {
                  id: "technician-active",
                  checked: form.active,
                  onCheckedChange: (checked) => update("active", checked),
                  "data-ocid": "technicians.active_switch"
                }
              )
            ] })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "technicians.form_error",
              className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
              children: error
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => onOpenChange(false),
                "data-ocid": "technicians.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: isPending,
                "data-ocid": "technicians.submit_button",
                children: isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Registrar técnico"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function TableSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "technicians.loading_state", className: "space-y-2 p-4", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)) });
}
function WorkloadSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-ocid": "technicians.workload.loading_state",
      className: "space-y-2 p-4",
      children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }, id))
    }
  );
}
function ActiveOrderList({ orders }) {
  if (orders.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin órdenes activas asignadas." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: orders.map((view) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      className: "flex flex-wrap items-center gap-2 text-xs",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/ordenes/$id",
            params: { id: view.order.id.toString() },
            className: "data-rail font-medium text-foreground underline-offset-4 hover:text-primary hover:underline",
            children: view.order.orderNumber
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(OrderStatusBadge, { status: view.order.status }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-muted-foreground", children: view.order.problem })
      ]
    },
    view.order.id.toString()
  )) });
}
function WorkloadCard({
  workload,
  orders,
  isLoadingOrders
}) {
  const { technician } = workload;
  const activeCount = Number(workload.activeOrders);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": `technicians.workload.card.${technician.id.toString()}`,
      className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: activeCount > 0 ? "absolute inset-y-0 left-0 w-0.5 bg-primary" : "absolute inset-y-0 left-0 w-0.5 bg-border"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: technician.code }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-display text-sm font-semibold", children: technician.name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: technician.specialty })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                StatusBadge,
                {
                  label: technician.active ? "Activo" : "Inactivo",
                  tone: technician.active ? "accepted" : "neutral"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Badge,
                {
                  variant: "outline",
                  className: "data-rail border-border bg-background text-muted-foreground",
                  children: [
                    activeCount,
                    " ",
                    activeCount === 1 ? "orden" : "órdenes"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: technician.phone }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail", children: [
              formatMoney(technician.hourlyRate),
              " / hora"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-primary", children: [
              "Comisión ",
              formatTaxRate(technician.commissionRate)
            ] })
          ] }),
          isLoadingOrders ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ActiveOrderList, { orders })
        ] })
      ]
    }
  );
}
function TechniciansPage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const [search, setSearch] = reactExports.useState(urlTerm);
  const [specialty, setSpecialty] = reactExports.useState(ALL_SPECIALTY);
  const [activeOnly, setActiveOnly] = reactExports.useState(false);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setSearch(urlTerm);
  }, [urlTerm]);
  const applySearch = reactExports.useCallback(
    (value) => {
      void navigate({
        to: "/tecnicos",
        search: (prev) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true
      });
    },
    [navigate]
  );
  reactExports.useEffect(() => {
    if (search === urlTerm) return;
    const handle = window.setTimeout(() => applySearch(search), 300);
    return () => window.clearTimeout(handle);
  }, [search, urlTerm, applySearch]);
  const techniciansQuery = useTechnicians({
    search,
    specialty: specialty === ALL_SPECIALTY ? null : specialty,
    activeOnly
  });
  const workloadsQuery = useTechnicianWorkloads();
  const deleteTechnician = useDeleteTechnician();
  const technicians = techniciansQuery.data ?? [];
  const workloads = workloadsQuery.data ?? [];
  const specialties = specialtyOptions(technicians);
  const hasFilters = search.trim() !== "" || specialty !== ALL_SPECIALTY || activeOnly;
  const activeCount = technicians.filter((entry) => entry.active).length;
  const totalActiveOrders = workloads.reduce(
    (sum, entry) => sum + Number(entry.activeOrders),
    0
  );
  const activeOrdersQuery = useQuery({
    queryKey: ["technician-active-orders"],
    queryFn: async () => {
      if (!actor) return [];
      const pages = await Promise.all(
        ACTIVE_ORDER_STATUSES.map(
          (status) => actor.listOrders({ status }, 0n, 200n)
        )
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: !!actor && !isFetching,
    // Shared by the workload tab and the active-orders KPI; kept fresh for the
    // session and refreshed only by an explicit retry.
    staleTime: Number.POSITIVE_INFINITY
  });
  const activeOrders = activeOrdersQuery.data ?? [];
  function ordersFor(technicianId) {
    return activeOrders.filter(
      (view) => view.order.technicianIds.some((id) => id === technicianId)
    );
  }
  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(technician) {
    setEditing(technician);
    setDialogOpen(true);
  }
  function handleDelete(technician) {
    deleteTechnician.mutate(technician.id, {
      onSuccess: () => ue.success("Técnico eliminado del taller"),
      onError: (error) => ue.error(
        error.message || "No se pudo eliminar el técnico. Inténtalo de nuevo."
      )
    });
  }
  function clearFilters() {
    setSearch("");
    setSpecialty(ALL_SPECIALTY);
    setActiveOnly(false);
    applySearch("");
  }
  const columns = [
    {
      key: "name",
      header: "Técnico",
      render: (technician) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          UserCog,
          {
            className: "size-3.5 text-muted-foreground",
            "aria-hidden": "true"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: technician.code }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: technician.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: technician.email ?? "Sin correo registrado" })
        ] })
      ] })
    },
    {
      key: "specialty",
      header: "Especialidad",
      render: (technician) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: technician.specialty })
    },
    {
      key: "phone",
      header: "Contacto",
      render: (technician) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: technician.phone })
    },
    {
      key: "hourlyRate",
      header: "Tarifa / hora",
      numeric: true,
      render: (technician) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold", children: formatMoney(technician.hourlyRate) })
    },
    {
      key: "commissionRate",
      header: "Comisión",
      numeric: true,
      render: (technician) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold text-primary", children: formatTaxRate(technician.commissionRate) })
    },
    {
      key: "activeOrders",
      header: "Órdenes activas",
      numeric: true,
      render: (technician) => {
        const workload = workloads.find(
          (entry) => entry.technician.id === technician.id
        );
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: workload ? Number(workload.activeOrders) : 0 });
      }
    },
    {
      key: "status",
      header: "Estado",
      render: (technician) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatusBadge,
        {
          label: technician.active ? "Activo" : "Inactivo",
          tone: technician.active ? "accepted" : "neutral"
        }
      )
    }
  ];
  const actions = [
    {
      kind: "edit",
      label: "Editar técnico",
      onClick: openEdit
    },
    {
      kind: "delete",
      label: "Eliminar técnico",
      onClick: handleDelete
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "technicians.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Taller",
            title: "Técnicos",
            description: "Equipo de taller con código de identificación, especialidades, tarifas, comisión sobre mano de obra y carga de trabajo.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: openCreate,
                "data-ocid": "technicians.open_modal_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Nuevo técnico"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "technicians.kpi.section",
            "aria-label": "Resumen del equipo de taller",
            className: "grid gap-4 sm:grid-cols-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-primary"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Técnicos" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: techniciansQuery.isLoading ? "—" : technicians.length }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: techniciansQuery.isLoading ? "Cargando plantilla" : `${activeCount} activos en piso` })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-info"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Especialidades" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: techniciansQuery.isLoading ? "—" : specialties.length }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Áreas cubiertas por el equipo" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-warning"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Órdenes activas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: workloadsQuery.isLoading ? "—" : totalActiveOrders }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Trabajo asignado en este momento" })
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "list", "data-ocid": "technicians.tabs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "list", "data-ocid": "technicians.tab.list", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-3.5", "aria-hidden": "true" }),
              "Listado"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "workload", "data-ocid": "technicians.tab.workload", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "size-3.5", "aria-hidden": "true" }),
              "Carga de trabajo"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "list", className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Search,
                  {
                    className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "search",
                    value: search,
                    onChange: (event) => setSearch(event.target.value),
                    placeholder: "Buscar por código, nombre, teléfono o especialidad…",
                    "aria-label": "Buscar técnicos",
                    "data-ocid": "technicians.search_input",
                    className: "h-9 pl-9"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: specialty, onValueChange: setSpecialty, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SelectTrigger,
                  {
                    "aria-label": "Filtrar por especialidad",
                    "data-ocid": "technicians.specialty_select",
                    className: "h-9 w-[13rem]",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Especialidad" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ALL_SPECIALTY, children: "Todas las especialidades" }),
                  specialties.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: option }, option))
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  htmlFor: "technicians-active-only",
                  className: "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Switch,
                      {
                        id: "technicians-active-only",
                        checked: activeOnly,
                        onCheckedChange: setActiveOnly,
                        "data-ocid": "technicians.active_only_switch"
                      }
                    ),
                    "Solo activos"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  "data-ocid": "technicians.count_badge",
                  className: "data-rail border-border bg-background text-muted-foreground",
                  children: techniciansQuery.isLoading ? "…" : `${technicians.length} técnicos`
                }
              )
            ] }),
            techniciansQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "technicians.error_state",
                className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "size-5 text-destructive",
                      "aria-hidden": "true"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudo cargar la plantilla" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => void techniciansQuery.refetch(),
                      "data-ocid": "technicians.retry_button",
                      children: "Reintentar"
                    }
                  )
                ]
              }
            ) : techniciansQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) }) : technicians.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "technicians.empty_state",
                className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Users,
                    {
                      className: "size-5 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay técnicos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ningún técnico coincide con los filtros. Ajusta la búsqueda, la especialidad o el estado." : "Registra a tu primer técnico para asignar órdenes de taller y controlar su carga de trabajo." })
                  ] }),
                  hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: clearFilters,
                      "data-ocid": "technicians.clear_filters_button",
                      children: "Limpiar filtros"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      size: "sm",
                      onClick: openCreate,
                      "data-ocid": "technicians.empty_create_button",
                      className: "gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                        "Nuevo técnico"
                      ]
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                ocid: "technicians",
                columns,
                rows: technicians,
                rowKey: (technician) => technician.id.toString(),
                actions
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "workload", className: "space-y-4", children: workloadsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "technicians.workload.error_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-5 text-destructive",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudo cargar la carga de trabajo" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void workloadsQuery.refetch(),
                    "data-ocid": "technicians.workload.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : workloadsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WorkloadSkeleton, {}) }) : workloads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "technicians.workload.empty_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ClipboardList,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin carga de trabajo registrada" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Registra técnicos y asígnalos a órdenes de taller para ver su carga aquí." })
                ] })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "data-ocid": "technicians.workload.list",
              className: "grid gap-4 lg:grid-cols-2",
              children: workloads.map((workload) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                WorkloadCard,
                {
                  workload,
                  orders: ordersFor(workload.technician.id),
                  isLoadingOrders: activeOrdersQuery.isLoading
                },
                workload.technician.id.toString()
              ))
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3", "aria-hidden": "true" }),
          "Usa las acciones de cada fila para editar o eliminar un técnico. La eliminación siempre pide confirmación."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TechnicianDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            technician: editing,
            specialties
          }
        )
      ]
    }
  );
}
export {
  TechniciansPage,
  TechniciansPage as default
};
