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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Generate breadcrumb items based on current path
  const generateBreadcrumbItems = (path: string) => {
    const pathSegments = path.split('/').filter(Boolean);
    const items = [];
    
    // Always start with dashboard
    items.push({
      title: "Financial Dashboard",
      href: "/dashboard",
      isPage: false,
    });

    // Route mapping for better titles
    const routeMap: Record<string, string> = {
      'dashboard': 'Overview',
      'health': 'Financial Health',
      'cash-flow': 'Cash Flow',
      'investments': 'Portfolio',
      'stocks': 'Stocks',
      'bonds': 'Bonds',
      'real-estate': 'Real Estate',
      'crypto': 'Cryptocurrency',
      'mutual-funds': 'Mutual Funds',
      'etf': 'ETFs',
      'options': 'Options',
      'other': 'Other Investments',
      'income-expenses': 'Income & Expenses',
      'income': 'Income Sources',
      'expenses': 'Expense Tracking',
      'budget': 'Budget Planning',
      'loans': 'All Loans',
      'mortgage': 'Mortgage',
      'auto': 'Auto Loans',
      'personal': 'Personal Loans',
      'payoff': 'Payoff Strategy',
      'goals': 'All Goals',
      'retirement': 'Retirement',
      'education': 'Education',
      'emergency': 'Emergency Fund',
      'insights': 'AI Recommendations',
      'risk': 'Risk Assessment',
      'tax': 'Tax Optimization',
      'settings': 'Settings',
    };

    if (pathSegments.length > 1) {
      // If not just /dashboard, build nested breadcrumb
      let currentPath = '';
      
      for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        const fullPath = `/dashboard${currentPath}`;
        
        const isLastSegment = i === pathSegments.length - 1;
        const title = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        
        if (isLastSegment) {
          // Last segment is the current page
          items.push({
            title,
            href: fullPath,
            isPage: true,
          });
        } else {
          // Intermediate segments are links
          items.push({
            title,
            href: fullPath,
            isPage: false,
          });
        }
      }
    } else {
      // Just /dashboard - set Overview as current page
      items[0].isPage = true;
    }

    return items;
  };

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
        <header className="flex z-0 shrink-0 items-center gap-2 border-1 border-border rounded-lg mx-4 mt-4 mb-2 p-4 shadow-sm shadow-shadow ">
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
