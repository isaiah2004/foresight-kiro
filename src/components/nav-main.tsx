"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const STORAGE_KEY = "nav-main:open-map"

  // Open-state map for collapsible sections; initialize empty to ensure SSR/CSR match
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})
  const [mounted, setMounted] = React.useState(false)

  // After mount, hydrate state from localStorage and start controlling Radix Collapsible
  React.useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>
        setOpenMap(parsed)
      }
    } catch {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on change (client-only)
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openMap))
    } catch {
      // no-op
    }
  }, [openMap])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Financial Management</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = item.url || item.title
          const isOpen = Object.prototype.hasOwnProperty.call(openMap, key)
            ? openMap[key]
            : !!item.isActive

          return (
            <Collapsible
              key={item.title}
              asChild
              {...(mounted
                ? {
                    open: isOpen,
                    onOpenChange: (v: boolean) =>
                      setOpenMap((prev) => ({ ...prev, [key]: v })),
                  }
                : {
                    // Use defaultOpen pre-mount to keep SSR and initial client render in sync
                    defaultOpen: isOpen,
                  })}
            >
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url as any}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url as any}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
