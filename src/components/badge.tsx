import type { Component, ComponentProps } from "solid-js"
import { splitProps } from "solid-js"

import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

import { cn } from "@/utils"

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        warning: "border-amber-200/80 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        error: "border-rose-200/80 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

type BadgeProps = ComponentProps<"div"> &
  VariantProps<typeof badgeVariants> & {
    round?: boolean
  }

const Badge: Component<BadgeProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "variant", "round"])
  return (
    <div
      class={cn(
        badgeVariants({ variant: local.variant }),
        local.round && "rounded-full",
        local.class
      )}
      {...others}
    />
  )
}

export type { BadgeProps }
export { Badge, badgeVariants }
