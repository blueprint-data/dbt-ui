"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Card3DProps = {
  children: React.ReactNode
  className?: string
  intensity?: number
}

function Card3D({ children, className, intensity = 1 }: Card3DProps) {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<number | null>(null)
  const targetRef = React.useRef({ rotateX: 0, rotateY: 0 })
  const currentRef = React.useRef({ rotateX: 0, rotateY: 0 })
  const canAnimateRef = React.useRef(true)

  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const coarsePointer = window.matchMedia("(pointer: coarse)")

    const updateCapability = () => {
      canAnimateRef.current = !(reducedMotion.matches || coarsePointer.matches)

      if (!canAnimateRef.current && innerRef.current) {
        innerRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)"
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

  const animate = React.useCallback(() => {
    const inner = innerRef.current
    frameRef.current = null

    if (!inner) {
      return
    }

    const current = currentRef.current
    const target = targetRef.current

    current.rotateX += (target.rotateX - current.rotateX) * 0.2
    current.rotateY += (target.rotateY - current.rotateY) * 0.2

    inner.style.transform = `perspective(1000px) rotateX(${current.rotateX.toFixed(2)}deg) rotateY(${current.rotateY.toFixed(2)}deg) translateZ(0)`

    const shouldContinue =
      Math.abs(target.rotateX - current.rotateX) > 0.05 || Math.abs(target.rotateY - current.rotateY) > 0.05

    if (shouldContinue) {
      frameRef.current = requestAnimationFrame(animate)
    }
  }, [])

  const queueFrame = React.useCallback(() => {
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canAnimateRef.current || !cardRef.current) {
      return
    }

    const rect = cardRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    targetRef.current = {
      rotateX: ((y - centerY) / centerY) * -10 * intensity,
      rotateY: ((x - centerX) / centerX) * 10 * intensity
    }

    queueFrame()
  }

  const handlePointerLeave = () => {
    targetRef.current = { rotateX: 0, rotateY: 0 }
    queueFrame()
  }

  return (
    <div
      ref={cardRef}
      className={cn("card-3d", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <div
        ref={innerRef}
        className="card-3d-inner h-full"
        style={{
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)",
          backfaceVisibility: "hidden",
          willChange: "transform"
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { Card3D }
