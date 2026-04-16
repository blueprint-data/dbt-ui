"use client"

import { useEffect, useRef, useState } from "react"

type AnimatedNumberProps = {
  end: number
  duration?: number
  delay?: number
  className?: string
  prefix?: string
  suffix?: string
}

function AnimatedNumber({
  end,
  duration = 2000,
  delay = 0,
  className,
  prefix = "",
  suffix = ""
}: AnimatedNumberProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

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
    if (prefersReducedMotion) {
      setCount(end)
      return
    }

    setCount(0)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    const current = ref.current

    if (current) {
      observer.observe(current)
    }

    return () => {
      if (current) {
        observer.unobserve(current)
      }

      observer.disconnect()
    }
  }, [prefersReducedMotion, end])

  useEffect(() => {
    if (prefersReducedMotion || !isVisible) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const start = performance.now()

      const animate = (timestamp: number) => {
        const progress = Math.min((timestamp - start) / duration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        setCount(Math.floor(easeOutQuart * end))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [delay, duration, end, isVisible, prefersReducedMotion])

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {count}
      {suffix}
    </span>
  )
}

export { AnimatedNumber }
