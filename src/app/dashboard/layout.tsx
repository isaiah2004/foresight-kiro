"use client"

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/ui/animations";
import { usePathname } from "next/navigation";
import { generateBreadcrumbItems } from "@/lib/navigation-config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Use centralized breadcrumb configuration
  const breadcrumbItems = generateBreadcrumbItems(pathname);
  
  // Read sidebar state cookie on the client; default to true if not set
  const cookie = typeof document !== "undefined"
    ? document.cookie.split("; ").find((c) => c.startsWith("sidebar_state="))
    : undefined
  const defaultOpen = cookie ? cookie.split("=")[1] === "true" : true

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="">
      <AppSidebar />
      <SidebarInset className="shadow-sm shadow-shadow ">
        <header className="flex z-0 shrink-0 items-center gap-2 border-1 bg-card border-border/20 rounded-lg mx-4 mt-4 mb-2 p-4 shadow-md shadow-shadow ">
          <div className="flex items-center gap-2 px-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={item.href}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {item.isPage ? (
                        <BreadcrumbPage>{item.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href}>
                          {item.title}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 && (
                      <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="py-8 px-8 mx-4 z-10 my-0 rounded-lg bg-card border-border/20 border-1 shadow-md shadow-shadow mb-4 relative overflow-hidden min-h-[500px]">
          {/* Background image with opacity */}
          <div
            className="absolute inset-0 bg-cover bg-top bg-no-repeat  z-0 "
            // style={{ backgroundImage: "url('/images/fixed-wallpaper.png')" }}
          />
          <PageTransition className="relative ">{children}</PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
