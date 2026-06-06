import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Scholar Canvas Design System — Button
 *
 * Primary   : Signature gradient (#002045 → #1a365d at 135°), tactile press
 * Secondary : surface-container-highest fill, no border
 * Ghost     : transparent, hover surface-container
 * Outline   : Ghost Border (outline-variant at 15% opacity), no solid line
 * Destructive: destructive tint surfaces only
 * Link      : underline on hover
 *
 * Motion    : cubic-bezier(0.4, 0, 0.2, 1) — fluid, intentional
 * Focus     : 2px ghost border using primary at 20% opacity (ring)
 */
const buttonVariants = cva(
  // Base — no solid borders, fluid motion, tactile feel
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "rounded-lg border-0 bg-clip-padding",
    "text-sm font-medium font-[Manrope,sans-serif] whitespace-nowrap",
    "select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
    "outline-none",
    // Ghost-border focus (primary at 20% opacity, 2px)
    "focus-visible:ring-2 focus-visible:ring-[rgba(0,32,69,0.20)]",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
    // Aria invalid — destructive ghost border
    "aria-invalid:ring-2 aria-invalid:ring-[rgba(186,26,26,0.20)]",
    // SVG sizing
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /**
         * PRIMARY — Signature gradient + tactile press
         * Hover: lift Y -2px, ambient shadow doubles
         * Press: scale 98%
         */
        default: [
          "bg-[linear-gradient(135deg,#002045,#1a365d)] text-white",
          "hover:-translate-y-[2px] hover:shadow-[0_16px_48px_rgba(28,28,24,0.12)]",
          "active:scale-[0.98] active:translate-y-0",
          "shadow-[0_8px_24px_rgba(28,28,24,0.06)]",
        ],

        /**
         * SECONDARY — surface-container-highest, no border
         */
        secondary: [
          "bg-[#e5e2db] text-[#1c1c18]",
          "hover:bg-[#dcdad3] hover:-translate-y-[1px]",
          "hover:shadow-[0_8px_24px_rgba(28,28,24,0.06)]",
          "active:scale-[0.98] active:translate-y-0",
        ],

        /**
         * GHOST — transparent, hover surface-container
         */
        ghost: [
          "bg-transparent text-[#1c1c18]",
          "hover:bg-[#f1eee7]",
          "active:scale-[0.98]",
        ],

        /**
         * OUTLINE — Ghost Border (outline-variant at 15% opacity)
         * No solid 1px border — uses ring/shadow trick
         */
        outline: [
          "bg-[#fcf9f2] text-[#1c1c18]",
          "shadow-[inset_0_0_0_1px_rgba(196,198,207,0.15)]",
          "hover:bg-[#f6f3ec] hover:shadow-[inset_0_0_0_1px_rgba(196,198,207,0.25)]",
          "active:scale-[0.98]",
        ],

        /**
         * DESTRUCTIVE — tinted surface only, no solid border
         */
        destructive: [
          "bg-[rgba(186,26,26,0.10)] text-[#ba1a1a]",
          "hover:bg-[rgba(186,26,26,0.18)]",
          "active:scale-[0.98]",
        ],

        /**
         * LINK — underline on hover
         */
        link: [
          "bg-transparent text-[#1a365d]",
          "underline-offset-4 hover:underline",
          "p-0 h-auto",
        ],
      },

      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: [
          "h-6 gap-1 px-2 text-xs",
          "rounded-[min(8px,10px)]",
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
          "[&_svg:not([class*='size-'])]:size-3",
        ],
        sm: [
          "h-7 gap-1 px-2.5 text-[0.8rem]",
          "rounded-[min(8px,12px)]",
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
          "[&_svg:not([class*='size-'])]:size-3.5",
        ],
        lg: "h-10 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(8px,10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(8px,12px)]",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
