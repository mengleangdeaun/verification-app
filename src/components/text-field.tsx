import type { ValidComponent } from "solid-js"
import { splitProps } from "solid-js"
import * as TextFieldPrimitive from "@kobalte/core/text-field"
import type { PolymorphicProps } from "@kobalte/core/polymorphic"
import { cva } from "class-variance-authority"
import { cn } from "@/utils"

const TextField = TextFieldPrimitive.Root

type TextFieldLabelProps<T extends ValidComponent = "label"> =
  TextFieldPrimitive.TextFieldLabelProps<T> & {
    class?: string | undefined
  }

const TextFieldLabel = <T extends ValidComponent = "label">(
  props: PolymorphicProps<T, TextFieldLabelProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldLabelProps, ["class"])
  return (
    <label
      class={cn(
        "text-xs font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block",
        local.class
      )}
      {...others}
    />
  )
}

const inputStyles = cva(
  "flex h-9 w-full border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
)

type TextFieldInputProps<T extends ValidComponent = "input"> =
  TextFieldPrimitive.TextFieldInputProps<T> & {
    class?: string | undefined
  }

const TextFieldInput = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, TextFieldInputProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldInputProps, ["class"])
  return (
    <input
      class={cn(inputStyles(), local.class)}
      {...others}
    />
  )
}

type TextFieldTextAreaProps<T extends ValidComponent = "textarea"> =
  TextFieldPrimitive.TextFieldTextAreaProps<T> & {
    class?: string | undefined
  }

const TextFieldTextArea = <T extends ValidComponent = "textarea">(
  props: PolymorphicProps<T, TextFieldTextAreaProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldTextAreaProps, ["class"])
  return (
    <textarea
      class={cn(
        "flex min-h-[60px] w-full border border-input bg-background px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  )
}

type TextFieldDescriptionProps<T extends ValidComponent = "div"> =
  TextFieldPrimitive.TextFieldDescriptionProps<T> & {
    class?: string | undefined
  }

const TextFieldDescription = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, TextFieldDescriptionProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldDescriptionProps, ["class"])
  return (
    <TextFieldPrimitive.Description
      class={cn("text-[11px] text-muted-foreground", local.class)}
      {...others}
    />
  )
}

type TextFieldErrorMessageProps<T extends ValidComponent = "div"> =
  TextFieldPrimitive.TextFieldErrorMessageProps<T> & {
    class?: string | undefined
  }

const TextFieldErrorMessage = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, TextFieldErrorMessageProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldErrorMessageProps, ["class"])
  return (
    <TextFieldPrimitive.ErrorMessage
      class={cn("text-[11px] font-medium text-destructive", local.class)}
      {...others}
    />
  )
}

const Input = (props: PolymorphicProps<"input", TextFieldInputProps<"input">>) => {
  const [local, others] = splitProps(props, ["class"])
  return <input class={cn(inputStyles(), local.class)} {...others} />
}

const TextArea = (props: PolymorphicProps<"textarea", TextFieldTextAreaProps<"textarea">>) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <textarea
      class={cn(
        "flex min-h-[60px] w-full  border border-input bg-background px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  )
}

export {
  TextField,
  TextFieldLabel,
  TextFieldInput,
  TextFieldTextArea,
  TextFieldDescription,
  TextFieldErrorMessage,
  Input,
  TextArea,
}
