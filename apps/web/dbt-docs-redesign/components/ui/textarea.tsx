import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "bp-textarea border-[var(--semantic-border-subtle)] bg-[var(--semantic-surface-default)] text-[var(--semantic-text-strong)] placeholder:text-[var(--semantic-text-body)] selection:bg-[var(--brand-primary-500)] selection:text-white flex field-sizing-content min-h-[var(--component-textarea-min-height)] w-full rounded-[var(--component-input-radius)] border px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color,background-color] outline-none aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
