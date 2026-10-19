import type { Component, ComponentProps, JSX, ValidComponent } from "solid-js"
import { splitProps } from "solid-js"
import * as AlertDialogPrimitive from "@kobalte/core/alert-dialog"
import type { PolymorphicProps } from "@kobalte/core/polymorphic"
import { cn } from "@/utils"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

type AlertDialogOverlayProps<T extends ValidComponent = "div"> =
  AlertDialogPrimitive.AlertDialogOverlayProps<T> & {
    class?: string | undefined
  }

const AlertDialogOverlay = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, AlertDialogOverlayProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogOverlayProps, ["class"])
  return (
    <AlertDialogPrimitive.Overlay
      class={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-overlay-in",
        local.class
      )}
      {...others}
    />
  )
}

type AlertDialogContentProps<T extends ValidComponent = "div"> =
  AlertDialogPrimitive.AlertDialogContentProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

const AlertDialogContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, AlertDialogContentProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogContentProps, ["class", "children"])
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogOverlay />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <AlertDialogPrimitive.Content
          class={cn(
            "relative w-full max-w-lg border border-border bg-card p-6 text-card-foreground shadow-2xl animate-dialog-in",
            local.class
          )}
          {...others}
        >
          {local.children}
        </AlertDialogPrimitive.Content>
      </div>
    </AlertDialogPrimitive.Portal>
  )
}

const AlertDialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <div
      class={cn("flex flex-col space-y-2 text-center sm:text-left", local.class)}
      {...others}
    />
  )
}

const AlertDialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <div
      class={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-5",
        local.class
      )}
      {...others}
    />
  )
}

type AlertDialogTitleProps<T extends ValidComponent = "h2"> =
  AlertDialogPrimitive.AlertDialogTitleProps<T> & {
    class?: string | undefined
  }

const AlertDialogTitle = <T extends ValidComponent = "h2">(
  props: PolymorphicProps<T, AlertDialogTitleProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogTitleProps, ["class"])
  return (
    <AlertDialogPrimitive.Title
      class={cn("text-lg font-semibold tracking-tight text-foreground", local.class)}
      {...others}
    />
  )
}

type AlertDialogDescriptionProps<T extends ValidComponent = "p"> =
  AlertDialogPrimitive.AlertDialogDescriptionProps<T> & {
    class?: string | undefined
  }

const AlertDialogDescription = <T extends ValidComponent = "p">(
  props: PolymorphicProps<T, AlertDialogDescriptionProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogDescriptionProps, ["class"])
  return (
    <AlertDialogPrimitive.Description
      class={cn("text-sm text-muted-foreground", local.class)}
      {...others}
    />
  )
}

const AlertDialogCloseButton = AlertDialogPrimitive.CloseButton

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCloseButton,
}
