import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  splitProps,
  type JSX,
  type ValidComponent,
} from "solid-js";
import * as TooltipPrimitive from "@kobalte/core/tooltip";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { cn } from "@/utils";

export type TooltipSide = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

export type TooltipPlacement =
  | TooltipSide
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

export function resolvePlacement(
  placement?: TooltipPlacement,
  position?: TooltipPlacement,
  side?: TooltipSide | TooltipPlacement,
  align?: TooltipAlign
): TooltipPlacement | undefined {
  const base = placement || position || side;
  if (!base) return undefined;
  if (align && align !== "center" && !base.includes("-")) {
    return `${base as TooltipSide}-${align}` as TooltipPlacement;
  }
  return base;
}

interface TooltipContextValue {
  setContentPlacement: (p: TooltipPlacement) => void;
  setContentGutter: (g: number) => void;
  rootPlacement: () => TooltipPlacement | undefined;
}

const TooltipContext = createContext<TooltipContextValue>();

export interface TooltipProps extends TooltipPrimitive.TooltipRootProps {
  placement?: TooltipPlacement;
  position?: TooltipPlacement;
  side?: TooltipSide | TooltipPlacement;
  align?: TooltipAlign;
  gutter?: number;
  offset?: number;
  sideOffset?: number;
}

const Tooltip = (props: TooltipProps) => {
  const [local, others] = splitProps(props, [
    "placement",
    "position",
    "side",
    "align",
    "gutter",
    "offset",
    "sideOffset",
  ]);

  const [contentPlacement, setContentPlacement] = createSignal<TooltipPlacement | undefined>(undefined);
  const [contentGutter, setContentGutter] = createSignal<number | undefined>(undefined);

  const directPlacement = () =>
    resolvePlacement(local.placement, local.position, local.side, local.align);

  const effectivePlacement = () =>
    directPlacement() || contentPlacement() || "top";

  const effectiveGutter = () =>
    local.gutter ?? local.offset ?? local.sideOffset ?? contentGutter() ?? 6;

  // If placement changes while mounted, notify window resize to trigger floating-ui autoUpdate
  createEffect(() => {
    effectivePlacement();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"));
    }
  });

  return (
    <TooltipContext.Provider
      value={{
        setContentPlacement,
        setContentGutter,
        rootPlacement: directPlacement,
      }}
    >
      <TooltipPrimitive.Root
        openDelay={300}
        closeDelay={100}
        skipDelayDuration={500}
        gutter={effectiveGutter()}
        placement={effectivePlacement()}
        {...others}
      />
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps<T extends ValidComponent = "div">
  extends TooltipPrimitive.TooltipContentProps<T> {
  class?: string | undefined;
  children?: JSX.Element;
  placement?: TooltipPlacement;
  position?: TooltipPlacement;
  side?: TooltipSide | TooltipPlacement;
  align?: TooltipAlign;
  gutter?: number;
  offset?: number;
  sideOffset?: number;
}

const TooltipContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, TooltipContentProps<T>>
) => {
  const ctx = useContext(TooltipContext);
  const [local, others] = splitProps(props as TooltipContentProps, [
    "class",
    "children",
    "placement",
    "position",
    "side",
    "align",
    "gutter",
    "offset",
    "sideOffset",
  ]);

  // Synchronously inform parent context during component setup
  const initPlacement = resolvePlacement(
    local.placement,
    local.position,
    local.side,
    local.align
  );
  if (initPlacement && ctx) {
    ctx.setContentPlacement(initPlacement);
  }

  const initGutter = local.gutter ?? local.offset ?? local.sideOffset;
  if (initGutter !== undefined && ctx) {
    ctx.setContentGutter(initGutter);
  }

  // React to prop changes dynamically
  createEffect(() => {
    const p = resolvePlacement(local.placement, local.position, local.side, local.align);
    if (p && ctx) {
      ctx.setContentPlacement(p);
    }
    const g = local.gutter ?? local.offset ?? local.sideOffset;
    if (g !== undefined && ctx) {
      ctx.setContentGutter(g);
    }
  });

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        class={cn(
          "z-50 overflow-hidden border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md animate-tooltip-in",
          local.class
        )}
        {...others}
      >
        {local.children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
};

const TooltipArrow = TooltipPrimitive.Arrow;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipArrow };
