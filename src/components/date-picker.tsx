import { children, Show, splitProps } from "solid-js"
import { DatePicker as DatePickerPrimitive } from "@ark-ui/solid"
import { cn } from "@/utils"
import { buttonVariants } from "@/components/button"

const DatePicker = DatePickerPrimitive.Root
const DatePickerLabel = DatePickerPrimitive.Label
const DatePickerContext = DatePickerPrimitive.Context
const DatePickerTableHead = DatePickerPrimitive.TableHead
const DatePickerTableBody = DatePickerPrimitive.TableBody
const DatePickerYearSelect = DatePickerPrimitive.YearSelect
const DatePickerMonthSelect = DatePickerPrimitive.MonthSelect
const DatePickerClearTrigger = DatePickerPrimitive.ClearTrigger

const DatePickerPositioner = (props: DatePickerPrimitive.PositionerProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.Positioner
      class={cn("z-50", local.class)}
      {...others}
    />
  )
}

const DatePickerControl = (props: DatePickerPrimitive.ControlProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.Control
      class={cn("relative flex items-center w-full", local.class)}
      {...others}
    />
  )
}

const DatePickerInput = (props: DatePickerPrimitive.InputProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.Input
      class={cn(
        "flex h-9 w-full border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  )
}

const DatePickerTrigger = (props: DatePickerPrimitive.TriggerProps) => {
  const [local, others] = splitProps(props, ["class", "children"])
  const resolvedChildren = children(() => local.children)
  const hasChildren = () => resolvedChildren.toArray().length !== 0

  return (
    <DatePickerPrimitive.Trigger
      class={cn(
        "inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        local.class
      )}
      {...others}
    >
      <Show when={!hasChildren()} fallback={resolvedChildren()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      </Show>
    </DatePickerPrimitive.Trigger>
  )
}

const DatePickerContent = (props: DatePickerPrimitive.ContentProps) => {
  const [local, others] = splitProps(props, ["class", "children"])

  return (
    <DatePickerPrimitive.Content
      class={cn(
        "z-50 w-[280px] border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none select-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        local.class
      )}
      {...others}
    >
      {local.children}
    </DatePickerPrimitive.Content>
  )
}

const DatePickerView = (props: DatePickerPrimitive.ViewProps) => {
  const [local, others] = splitProps(props, ["class"])
  return <DatePickerPrimitive.View class={cn("space-y-3", local.class)} {...others} />
}

const DatePickerViewControl = (props: DatePickerPrimitive.ViewControlProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.ViewControl
      class={cn("flex items-center justify-between gap-2", local.class)}
      {...others}
    />
  )
}

const DatePickerPrevTrigger = (props: DatePickerPrimitive.PrevTriggerProps) => {
  const [local, others] = splitProps(props, ["class", "children"])
  const resolvedChildren = children(() => local.children)
  const hasChildren = () => resolvedChildren.toArray().length !== 0

  return (
    <DatePickerPrimitive.PrevTrigger
      class={cn(
        buttonVariants({ variant: "outline" }),
        "size-7 bg-transparent p-0 border border-border hover:bg-muted text-muted-foreground hover:text-foreground",
        local.class
      )}
      {...others}
    >
      <Show when={!hasChildren()} fallback={resolvedChildren()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-3.5"
        >
          <path d="M15 6l-6 6l6 6" />
          <title>Previous</title>
        </svg>
      </Show>
    </DatePickerPrimitive.PrevTrigger>
  )
}

const DatePickerNextTrigger = (props: DatePickerPrimitive.NextTriggerProps) => {
  const [local, others] = splitProps(props, ["class", "children"])
  const resolvedChildren = children(() => local.children)
  const hasChildren = () => resolvedChildren.toArray().length !== 0

  return (
    <DatePickerPrimitive.NextTrigger
      class={cn(
        buttonVariants({ variant: "outline" }),
        "size-7 bg-transparent p-0 border border-border hover:bg-muted text-muted-foreground hover:text-foreground",
        local.class
      )}
      {...others}
    >
      <Show when={!hasChildren()} fallback={resolvedChildren()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-3.5"
        >
          <path d="M9 6l6 6l-6 6" />
          <title>Next</title>
        </svg>
      </Show>
    </DatePickerPrimitive.NextTrigger>
  )
}

const DatePickerViewTrigger = (props: DatePickerPrimitive.ViewTriggerProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.ViewTrigger
      class={cn(buttonVariants({ variant: "ghost" }), "h-7 px-2 text-xs font-semibold hover:bg-muted", local.class)}
      {...others}
    />
  )
}

const DatePickerRangeText = (props: DatePickerPrimitive.RangeTextProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.RangeText class={cn("text-xs font-semibold text-foreground", local.class)} {...others} />
  )
}

const DatePickerTable = (props: DatePickerPrimitive.TableProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.Table
      class={cn("w-full border-collapse space-y-1", local.class)}
      {...others}
    />
  )
}

const DatePickerTableRow = (props: DatePickerPrimitive.TableRowProps) => {
  const [local, others] = splitProps(props, ["class"])
  return <DatePickerPrimitive.TableRow class={cn("mt-1 flex w-full justify-between", local.class)} {...others} />
}

const DatePickerTableHeader = (props: DatePickerPrimitive.TableHeaderProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.TableHeader
      class={cn("w-8 text-center text-[11px] font-semibold text-muted-foreground uppercase", local.class)}
      {...others}
    />
  )
}

const DatePickerTableCell = (props: DatePickerPrimitive.TableCellProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.TableCell
      class={cn(
        "flex-1 p-0 text-center text-xs has-[[data-range-end]]:rounded-r-md has-[[data-range-start]]:rounded-l-md has-[[data-in-range]]:bg-accent has-[[data-outside-range][data-in-range]]:bg-accent/50 has-[[data-in-range]]:first-of-type:rounded-l-md has-[[data-in-range]]:last-of-type:rounded-r-md",
        local.class
      )}
      {...others}
    />
  )
}

const DatePickerTableCellTrigger = (props: DatePickerPrimitive.TableCellTriggerProps) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <DatePickerPrimitive.TableCellTrigger
      class={cn(
        buttonVariants({ variant: "ghost" }),
        "h-8 min-w-8 w-full p-0 text-xs font-normal transition-colors data-[selected]:opacity-100",
        "data-[today]:bg-accent data-[today]:text-accent-foreground",
        "[&:is([data-today][data-selected])]:bg-primary [&:is([data-today][data-selected])]:text-primary-foreground",
        "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
        "data-[disabled]:text-muted-foreground data-[disabled]:opacity-40",
        "data-[outside-range]:text-muted-foreground data-[outside-range]:opacity-40",
        "[&:is([data-outside-range][data-in-range])]:bg-accent/50 [&:is([data-outside-range][data-in-range])]:text-muted-foreground [&:is([data-outside-range][data-in-range])]:opacity-30",
        local.class
      )}
      {...others}
    />
  )
}

export {
  DatePicker,
  DatePickerLabel,
  DatePickerControl,
  DatePickerInput,
  DatePickerTrigger,
  DatePickerClearTrigger,
  DatePickerContent,
  DatePickerView,
  DatePickerViewControl,
  DatePickerPrevTrigger,
  DatePickerNextTrigger,
  DatePickerViewTrigger,
  DatePickerRangeText,
  DatePickerContext,
  DatePickerTable,
  DatePickerTableHead,
  DatePickerTableBody,
  DatePickerTableRow,
  DatePickerTableHeader,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerYearSelect,
  DatePickerMonthSelect,
  DatePickerPositioner,
}
