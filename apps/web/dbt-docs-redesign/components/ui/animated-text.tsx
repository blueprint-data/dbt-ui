"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type AnimatedTextProps = {
  text: string
  className?: string
  wordClassName?: string
  delayMs?: number
  staggerMs?: number
  threshold?: number
  immediate?: boolean
}

function AnimatedText({
  text,
  className,
  wordClassName,
  delayMs = 0,
  staggerMs = 70,
  threshold = 0.2,
  immediate = false
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const [isVisible, setIsVisible] = useState(immediate)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference)
      return () => mediaQuery.removeEventListener("change", updatePreference)
    }

    mediaQuery.addListener(updatePreference)

    return () => mediaQuery.removeListener(updatePreference)
  }, [])

  useEffect(() => {
    if (immediate || prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const element = containerRef.current

    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -10% 0px"
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [immediate, prefersReducedMotion, threshold])

  return (
    <span ref={containerRef} className={cn(className)}>
      {words.map((word, index) => {
        const visible = isVisible || prefersReducedMotion

        return (
          <Fragment key={`${word}-${index}`}>
            <span
              data-visible={visible ? "true" : "false"}
              className={cn("bp-text-word", wordClassName)}
              style={{
                display: "inline-block",
                opacity: visible ? 1 : 0,
                transform: visible ? "translate3d(0, 0, 0)" : "translate3d(0, 0.45em, 0)",
                filter: visible ? "none" : "blur(6px)",
                transitionProperty: "opacity, transform, filter",
                transitionDuration: prefersReducedMotion ? "0ms" : "700ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: prefersReducedMotion ? "0ms" : `${delayMs + index * staggerMs}ms`,
                willChange: visible ? "auto" : "opacity, transform, filter"
              }}
            >
              {word}
            </span>
            {index < words.length - 1 ? " " : null}
          </Fragment>
        )
      })}
    </span>
  )
}

export { AnimatedText }
