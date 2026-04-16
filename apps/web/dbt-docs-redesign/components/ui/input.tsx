import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "bp-input border-[var(--semantic-border-subtle)] bg-[var(--semantic-surface-default)] text-[var(--semantic-text-strong)] file:text-[var(--semantic-text-body)] placeholder:text-[var(--semantic-text-body)] selection:bg-[var(--brand-primary-500)] selection:text-white flex h-12 w-full min-w-0 rounded-[var(--component-input-radius)] border px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
