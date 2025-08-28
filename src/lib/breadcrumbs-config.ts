export interface BreadcrumbConfig {
  title: string;
  href: string;
  parent?: string;
}

// Centralized breadcrumb configuration
export const BREADCRUMB_CONFIG: Record<string, BreadcrumbConfig> = {
  // Dashboard routes
  dashboard: {
    title: "Financial Dashboard",
    href: "/dashboard",
  },
  health: {
    title: "Financial Health",
    href: "/dashboard/health",
    parent: "dashboard",
  },
  "cash-flow": {
    title: "Cash Flow",
    href: "/dashboard/cash-flow",
    parent: "dashboard",
  },

  // Budget routes
  budget: {
    title: "Budget Planning",
    href: "/dashboard/budget",
    parent: "dashboard",
  },
  buckets: {
    title: "Budget Buckets",
    href: "/dashboard/budget/buckets",
    parent: "budget",
  },
  "income-splits": {
    title: "Income Splits",
    href: "/dashboard/budget/income-splits",
    parent: "budget",
  },
  "manage-budgets": {
    title: "Manage Budgets",
    href: "/dashboard/budget/manage-budgets",
    parent: "budget",
  },

  // Investment routes
  investments: {
    title: "Portfolio",
    href: "/dashboard/investments",
    parent: "dashboard",
  },
  stocks: {
    title: "Stocks",
    href: "/dashboard/investments/stocks",
    parent: "investments",
  },
  bonds: {
    title: "Bonds",
    href: "/dashboard/investments/bonds",
    parent: "investments",
  },
  "real-estate": {
    title: "Real Estate",
    href: "/dashboard/investments/real-estate",
    parent: "investments",
  },
  crypto: {
    title: "Cryptocurrency",
    href: "/dashboard/investments/crypto",
    parent: "investments",
  },
  "mutual-funds": {
    title: "Mutual Funds",
    href: "/dashboard/investments/mutual-funds",
    parent: "investments",
  },
  etf: {
    title: "ETFs",
    href: "/dashboard/investments/etf",
    parent: "investments",
  },
  options: {
    title: "Options",
    href: "/dashboard/investments/options",
    parent: "investments",
  },
  other: {
    title: "Other Investments",
    href: "/dashboard/investments/other",
    parent: "investments",
  },

  // Income & Expenses routes
  "income-expenses": {
    title: "Income & Expenses",
    href: "/dashboard/income-expenses",
    parent: "dashboard",
  },
  income: {
    title: "Income Sources",
    href: "/dashboard/income",
    parent: "dashboard",
  },
  expenses: {
    title: "Expense Tracking",
    href: "/dashboard/expenses",
    parent: "dashboard",
  },

  // Loans routes
  loans: {
    title: "All Loans",
    href: "/dashboard/loans",
    parent: "dashboard",
  },
  mortgage: {
    title: "Mortgage",
    href: "/dashboard/loans/mortgage",
    parent: "loans",
  },
  auto: {
    title: "Auto Loans",
    href: "/dashboard/loans/auto",
    parent: "loans",
  },
  personal: {
    title: "Personal Loans",
    href: "/dashboard/loans/personal",
    parent: "loans",
  },
  payoff: {
    title: "Payoff Strategy",
    href: "/dashboard/loans/payoff",
    parent: "loans",
  },

  // Goals routes
  goals: {
    title: "All Goals",
    href: "/dashboard/goals",
    parent: "dashboard",
  },
  retirement: {
    title: "Retirement",
    href: "/dashboard/goals/retirement",
    parent: "goals",
  },
  education: {
    title: "Education",
    href: "/dashboard/goals/education",
    parent: "goals",
  },
  emergency: {
    title: "Emergency Fund",
    href: "/dashboard/goals/emergency",
    parent: "goals",
  },

  // Insights routes
  insights: {
    title: "AI Recommendations",
    href: "/dashboard/insights",
    parent: "dashboard",
  },
  risk: {
    title: "Risk Assessment",
    href: "/dashboard/insights/risk",
    parent: "insights",
  },
  tax: {
    title: "Tax Optimization",
    href: "/dashboard/insights/tax",
    parent: "insights",
  },

  // Settings
  settings: {
    title: "Settings",
    href: "/dashboard/settings",
    parent: "dashboard",
  },
};

export interface BreadcrumbItem {
  title: string;
  href: string;
  isPage: boolean;
}

export function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // If not a dashboard route, return basic breadcrumb
  if (!pathSegments.includes('dashboard')) {
    return [{
      title: "Home",
      href: "/",
      isPage: true,
    }];
  }

  // Build breadcrumb chain using configuration
  const items: BreadcrumbItem[] = [];
  
  // Find the current page config
  const currentSegment = pathSegments[pathSegments.length - 1];
  let currentConfig = BREADCRUMB_CONFIG[currentSegment];
  
  // If no specific config found, try to build from path segments
  if (!currentConfig && pathSegments.length >= 2) {
    // For paths like /dashboard/budget/buckets, try to find the last segment
    for (let i = pathSegments.length - 1; i >= 1; i--) {
      const segment = pathSegments[i];
      if (BREADCRUMB_CONFIG[segment]) {
        currentConfig = BREADCRUMB_CONFIG[segment];
        break;
      }
    }
  }

  // If still no config, default to dashboard
  if (!currentConfig) {
    currentConfig = BREADCRUMB_CONFIG.dashboard;
  }

  // Build the breadcrumb chain by following parent relationships
  const chain: BreadcrumbConfig[] = [];
  let current: BreadcrumbConfig | undefined = currentConfig;
  
  while (current) {
    chain.unshift(current);
    current = current.parent ? BREADCRUMB_CONFIG[current.parent] : undefined;
  }

  // Convert to breadcrumb items
  chain.forEach((config, index) => {
    items.push({
      title: config.title,
      href: config.href,
      isPage: index === chain.length - 1, // Last item is the current page
    });
  });

  return items;
}
