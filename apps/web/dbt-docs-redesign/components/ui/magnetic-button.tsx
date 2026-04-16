"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

type MagneticButtonProps = Omit<React.ComponentProps<"button">, "onPointerMove" | "onPointerLeave"> & {
  strength?: number
  asChild?: boolean
  onPointerMove?: React.PointerEventHandler<HTMLElement>
  onPointerLeave?: React.PointerEventHandler<HTMLElement>
}

function MagneticButton({
  className,
  strength = 0.3,
  asChild = false,
  onPointerMove,
  onPointerLeave,
  style,
  disabled,
  ...props
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLElement>(null)
  const frameRef = React.useRef<number | null>(null)
  const targetRef = React.useRef({ x: 0, y: 0 })
  const currentRef = React.useRef({ x: 0, y: 0 })
  const canAnimateRef = React.useRef(true)

  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const coarsePointer = window.matchMedia("(pointer: coarse)")

    const updateCapability = () => {
      canAnimateRef.current = !(reducedMotion.matches || coarsePointer.matches)

      if (!canAnimateRef.current) {
        const element = ref.current

        if (element) {
          element.style.setProperty("--bp-magnetic-x", "0px")
          element.style.setProperty("--bp-magnetic-y", "0px")
        }
      }
    }

    updateCapability()

    const listeners: Array<[MediaQueryList, () => void]> = [
      [reducedMotion, updateCapability],
      [coarsePointer, updateCapability]
    ]

    listeners.forEach(([query, listener]) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", listener)
        return
      }

      query.addListener(listener)
    })

    return () => {
      listeners.forEach(([query, listener]) => {
        if (typeof query.removeEventListener === "function") {
          query.removeEventListener("change", listener)
          return
        }

        query.removeListener(listener)
      })

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!disabled || !ref.current) {
      return
    }

    targetRef.current = { x: 0, y: 0 }
    currentRef.current = { x: 0, y: 0 }
    ref.current.style.setProperty("--bp-magnetic-x", "0px")
    ref.current.style.setProperty("--bp-magnetic-y", "0px")
  }, [disabled])

  const animate = React.useCallback(() => {
    const element = ref.current
    frameRef.current = null

    if (!element) {
      return
    }

    const current = currentRef.current
    const target = targetRef.current

    current.x += (target.x - current.x) * 0.22
    current.y += (target.y - current.y) * 0.22

    element.style.setProperty("--bp-magnetic-x", `${current.x.toFixed(2)}px`)
    element.style.setProperty("--bp-magnetic-y", `${current.y.toFixed(2)}px`)

    const shouldContinue = Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05

    if (shouldContinue) {
      frameRef.current = requestAnimationFrame(animate)
    }
  }, [])

  const queueFrame = React.useCallback(() => {
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    onPointerMove?.(event)

    if (disabled || !canAnimateRef.current || !ref.current) {
      return
    }

    const rect = ref.current.getBoundingClientRect()
    const offsetX = event.clientX - rect.left - rect.width / 2
    const offsetY = event.clientY - rect.top - rect.height / 2

    targetRef.current = {
      x: offsetX * strength,
      y: offsetY * strength
    }

    queueFrame()
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    onPointerLeave?.(event)
    targetRef.current = { x: 0, y: 0 }
    queueFrame()
  }

  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref as React.RefObject<never>}
      className={cn("magnetic-button", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        ...style,
        ["--bp-magnetic-x" as string]: "0px",
        ["--bp-magnetic-y" as string]: "0px"
      }}
      disabled={disabled}
      {...props}
    />
  )
}

export { MagneticButton }
