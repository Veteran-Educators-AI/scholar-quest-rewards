import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:brightness-110",
        outline:
          "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground",
        secondary:
          "bg-gradient-secondary text-secondary-foreground shadow-md hover:shadow-lg hover:brightness-110",
        ghost: 
          "hover:bg-muted hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground shadow-md hover:shadow-lg hover:brightness-110",
        warning:
          "bg-warning text-warning-foreground shadow-md hover:shadow-lg hover:brightness-110",
        hero:
          "bg-gradient-primary text-primary-foreground shadow-glow-primary hover:shadow-lg hover:brightness-110 font-extrabold tracking-wide",
        gold:
          "bg-gradient-gold text-gold-foreground shadow-glow-gold hover:shadow-lg hover:brightness-110 font-extrabold",
        streak:
          "bg-gradient-streak text-streak-foreground shadow-glow-secondary hover:shadow-lg hover:brightness-110 font-extrabold",
        paper:
          "bg-card text-foreground border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted",
        app:
          "bg-gradient-primary text-primary-foreground shadow-glow-primary hover:shadow-lg hover:brightness-110",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm rounded-lg",
        lg: "h-14 px-8 py-4 text-lg rounded-2xl",
        xl: "h-16 px-10 py-5 text-xl rounded-2xl",
        icon: "h-12 w-12",
        "icon-sm": "h-10 w-10",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
