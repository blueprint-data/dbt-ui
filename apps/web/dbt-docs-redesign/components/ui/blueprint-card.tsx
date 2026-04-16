import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type BlueprintCardProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  interactive?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  children?: React.ReactNode
}

function BlueprintCard({
  title,
  description,
  interactive = false,
  className,
  headerClassName,
  contentClassName,
  children
}: BlueprintCardProps) {
  return (
    <Card className={cn(interactive && "bp-card-interactive", className)}>
      {(title || description) && (
        <CardHeader className={headerClassName}>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}

      <CardContent className={cn(!title && !description && "p-6", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export { BlueprintCard }
