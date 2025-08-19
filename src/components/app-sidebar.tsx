"use client";

import * as React from "react";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  Eye,
  Goal,
  LifeBuoy,
  Lightbulb,
  PieChart,
  Send,
  Settings2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Financial Health",
          url: "/dashboard/health",
        },
        {
          title: "Cash Flow",
          url: "/dashboard/cash-flow",
        },
      ],
    },
    {
      title: "Investments",
      url: "/dashboard/investments",
      icon: TrendingUp,
      items: [
        {
          title: "Portfolio",
          url: "/dashboard/investments",
        },
        {
          title: "Stocks",
          url: "/dashboard/investments/stocks",
        },
        {
          title: "Bonds",
          url: "/dashboard/investments/bonds",
        },
        {
          title: "Real Estate",
          url: "/dashboard/investments/real-estate",
        },
        {
          title: "Crypto",
          url: "/dashboard/investments/crypto",
        },
      ],
    },
    {
      title: "Income & Expenses",
      url: "/dashboard/income-expenses",
      icon: DollarSign,
      items: [
        {
          title: "Income Sources",
          url: "/dashboard/income",
        },
        {
          title: "Expense Tracking",
          url: "/dashboard/expenses",
        },
        {
          title: "Budget Planning",
          url: "/dashboard/budget",
        },
      ],
    },
    {
      title: "Loans & Debt",
      url: "/dashboard/loans",
      icon: CreditCard,
      items: [
        {
          title: "All Loans",
          url: "/dashboard/loans",
        },
        {
          title: "Mortgage",
          url: "/dashboard/loans/mortgage",
        },
        {
          title: "Auto Loans",
          url: "/dashboard/loans/auto",
        },
        {
          title: "Personal Loans",
          url: "/dashboard/loans/personal",
        },
        {
          title: "Payoff Strategy",
          url: "/dashboard/loans/payoff",
        },
      ],
    },
    {
      title: "Goals",
      url: "/dashboard/goals",
      icon: Goal,
      items: [
        {
          title: "All Goals",
          url: "/dashboard/goals",
        },
        {
          title: "Retirement",
          url: "/dashboard/goals/retirement",
        },
        {
          title: "Education",
          url: "/dashboard/goals/education",
        },
        {
          title: "Emergency Fund",
          url: "/dashboard/goals/emergency",
        },
      ],
    },
    {
      title: "Insights",
      url: "/dashboard/insights",
      icon: Lightbulb,
      items: [
        {
          title: "AI Recommendations",
          url: "/dashboard/insights",
        },
        {
          title: "Risk Assessment",
          url: "/dashboard/insights/risk",
        },
        {
          title: "Tax Optimization",
          url: "/dashboard/insights/tax",
        },
        {
          title: "Education",
          url: "/dashboard/insights/education",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
    {
      title: "Help & Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Send Feedback",
      url: "/feedback",
      icon: Send,
    },
  ],
  quickActions: [
    {
      name: "Add Investment",
      url: "/dashboard/investments",
      icon: TrendingUp,
    },
    {
      name: "Track Expense",
      url: "/dashboard/expenses",
      icon: DollarSign,
    },
    {
      name: "Set Goal",
      url: "/dashboard/goals",
      icon: Goal,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  // Create user data object for NavUser component
  const userData = {
    name: user?.fullName || user?.firstName || "User",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl || "",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Eye className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Foresight</span>
                  <span className="truncate text-xs">Financial Planning</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.quickActions} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
