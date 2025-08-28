import {
  BarChart3,
  Calculator,
  CreditCard,
  DollarSign,
  Goal,
  Lightbulb,
  TrendingUp,
  Settings2,
  LifeBuoy,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Unified navigation configuration for both sidebar and breadcrumbs
export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavigationSubItem[];
}

export interface NavigationSubItem {
  title: string;
  url: string;
}

export interface BreadcrumbItem {
  title: string;
  href: string;
  isPage: boolean;
}

// Single source of truth for all navigation
export const NAVIGATION_CONFIG: NavigationItem[] = [
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
    title: "Budget",
    url: "/dashboard/budget",
    icon: Calculator,
    items: [
      {
        title: "Buckets",
        url: "/dashboard/budget/buckets",
      },
      {
        title: "Income Splits",
        url: "/dashboard/budget/income-splits",
      },
      {
        title: "Manage Budgets",
        url: "/dashboard/budget/manage-budgets",
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
];

// Helper function to find navigation item by URL
function findNavigationItem(url: string): { parent?: NavigationItem; item?: NavigationSubItem | NavigationItem; } {
  // First, check if it's a main navigation item
  for (const navItem of NAVIGATION_CONFIG) {
    if (navItem.url === url) {
      return { item: navItem };
    }
    
    // Check sub-items
    if (navItem.items) {
      for (const subItem of navItem.items) {
        if (subItem.url === url) {
          return { parent: navItem, item: subItem };
        }
      }
    }
  }
  
  return {};
}

// Generate breadcrumb items from the unified navigation configuration
export function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  try {
    // Handle non-dashboard routes
    if (!pathname.startsWith('/dashboard')) {
      return [{
        title: "Home",
        href: "/",
        isPage: true,
      }];
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Handle exact dashboard match
    if (pathname === '/dashboard') {
      return [{
        title: "Financial Dashboard", 
        href: "/dashboard",
        isPage: true,
      }];
    }

    const { parent, item } = findNavigationItem(pathname);
    
    // If we found a match in our navigation
    if (parent && item) {
      // It's a sub-item, add parent first
      breadcrumbs.push({
        title: parent.title,
        href: parent.url,
        isPage: false,
      });
      
      // Add the sub-item as current page
      breadcrumbs.push({
        title: item.title,
        href: pathname,
        isPage: true,
      });
    } else if (item) {
      // It's a main nav item
      breadcrumbs.push({
        title: item.title,
        href: pathname,
        isPage: true,
      });
    } else {
      // Fallback: build breadcrumbs from path segments
      const pathSegments = pathname.split('/').filter(Boolean);
      
      if (pathSegments.length >= 2) {
        // Always start with Financial Dashboard
        breadcrumbs.push({
          title: "Financial Dashboard",
          href: "/dashboard",
          isPage: false,
        });
        
        // Try to find parent section
        const dashboardPath = `/${pathSegments[0]}/${pathSegments[1]}`;
        const parentMatch = NAVIGATION_CONFIG.find(nav => nav.url === dashboardPath);
        
        if (parentMatch && pathSegments.length > 2) {
          // Add parent section
          breadcrumbs.push({
            title: parentMatch.title,
            href: parentMatch.url,
            isPage: false,
          });
          
          // Add current page with formatted title
          const lastSegment = pathSegments[pathSegments.length - 1];
          const formattedTitle = lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          breadcrumbs.push({
            title: formattedTitle,
            href: pathname,
            isPage: true,
          });
        } else if (parentMatch) {
          // Just the parent section as current page
          breadcrumbs[0] = {
            title: "Financial Dashboard",
            href: "/dashboard",
            isPage: false,
          };
          breadcrumbs.push({
            title: parentMatch.title,
            href: pathname,
            isPage: true,
          });
        } else {
          // Format the current page title
          const lastSegment = pathSegments[pathSegments.length - 1];
          const formattedTitle = lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          breadcrumbs.push({
            title: formattedTitle,
            href: pathname,
            isPage: true,
          });
        }
      } else {
        // Default dashboard breadcrumb
        breadcrumbs.push({
          title: "Financial Dashboard",
          href: "/dashboard",
          isPage: true,
        });
      }
    }
    
    return breadcrumbs;
  } catch (error) {
    console.error('Error generating breadcrumbs for', pathname, error);
    // Fallback breadcrumb in case of errors
    return [{
      title: "Financial Dashboard",
      href: "/dashboard",
      isPage: true,
    }];
  }
}

// Export navigation data for sidebar
export function getSidebarNavigation() {
  return {
    navMain: NAVIGATION_CONFIG,
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
}
