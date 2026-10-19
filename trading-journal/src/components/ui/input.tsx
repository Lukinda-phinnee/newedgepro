import * as React from "react"
import { cn } from "cn"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "flex h-10 w-full min-w-0 rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground shadow-xs transition-colors",
          "placeholder:text-muted-foreground/50",
          "hover:border-border",
          "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
