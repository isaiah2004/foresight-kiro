"use client"

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read sidebar state cookie on the client; default to true if not set
  const cookie = typeof document !== "undefined"
    ? document.cookie.split("; ").find((c) => c.startsWith("sidebar_state="))
    : undefined
  const defaultOpen = cookie ? cookie.split("=")[1] === "true" : true

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="">
      <AppSidebar />
      <SidebarInset className="shadow-sm shadow-shadow ">
        <header className="flex z-0 shrink-0 items-center gap-2 border-1 border-border rounded-lg mx-4 mt-4 mb-2 p-4 shadow-sm shadow-shadow ">
          <div className="flex items-center gap-2 px-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Financial Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="py-8 px-8 mx-4 z-10 my-0 rounded-lg bg-background border-border border-1 shadow-sm shadow-shadow mb-4 relative overflow-hidden min-h-[500px]">
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
