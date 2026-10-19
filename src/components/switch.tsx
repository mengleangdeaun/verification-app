import type { JSX, ValidComponent } from "solid-js"
import { splitProps } from "solid-js"
import * as SwitchPrimitive from "@kobalte/core/switch"
import type { PolymorphicProps } from "@kobalte/core/polymorphic"
import { cn } from "@/utils"

type SwitchRootProps<T extends ValidComponent = "div"> = SwitchPrimitive.SwitchRootProps<T> & {
  class?: string | undefined
  children?: JSX.Element
}

const Switch = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, SwitchRootProps<T>>
) => {
  const [local, others] = splitProps(props as SwitchRootProps, ["class", "children"])
  return (
    <SwitchPrimitive.Root
      class={cn("inline-flex items-center gap-2", local.class)}
      {...others}
    >
      <SwitchPrimitive.Input class="sr-only" />
      <SwitchPrimitive.Control class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary">
        <SwitchPrimitive.Thumb class="pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-5 data-[unchecked]:translate-x-0" />
      </SwitchPrimitive.Control>
      {local.children}
    </SwitchPrimitive.Root>
  )
}

const SwitchLabel = SwitchPrimitive.Label
const SwitchDescription = SwitchPrimitive.Description
const SwitchErrorMessage = SwitchPrimitive.ErrorMessage

export { Switch, SwitchLabel, SwitchDescription, SwitchErrorMessage }
