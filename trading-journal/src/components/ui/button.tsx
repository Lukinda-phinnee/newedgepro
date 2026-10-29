import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white! shadow-md shadow-violet-900/30 hover:bg-violet-500 hover:shadow-violet-900/50 cursor-pointer",
        outline:
          "border border-border/80 bg-background/60 text-foreground/80 hover:bg-accent hover:text-foreground hover:border-border cursor-pointer",
        ghost:
          "text-foreground/70 hover:bg-accent hover:text-foreground cursor-pointer",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 cursor-pointer",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 cursor-pointer",
        link: "text-violet-600 dark:text-violet-400 underline-offset-4 hover:underline cursor-pointer",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
