"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render nothing on the server and on the initial client-side render.
    // This avoids a hydration mismatch.
    return null
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
