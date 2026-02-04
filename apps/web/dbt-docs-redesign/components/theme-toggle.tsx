"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0">
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9 rounded-lg hover:bg-sky-500/10 hover:text-sky-600 transition-all active:scale-95 group"
            aria-label="Toggle theme"
        >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:text-amber-500" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:text-indigo-400" />
        </Button>
    )
}
