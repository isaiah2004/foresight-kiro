"use client";

import { generateBreadcrumbItems } from "@/lib/navigation-config";
import { usePathname } from "next/navigation";

export default function BreadcrumbTestPage() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbItems(pathname);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Breadcrumb Test</h1>
      
      <div>
        <h2 className="text-lg font-semibold">Current Path:</h2>
        <code className="bg-gray-100 p-2 rounded">{pathname}</code>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold">Generated Breadcrumbs:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {JSON.stringify(breadcrumbs, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Visual Breadcrumb:</h2>
        <div className="flex items-center gap-2">
          {breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              {item.isPage ? (
                <span className="font-medium">{item.title}</span>
              ) : (
                <a href={item.href} className="text-blue-600 hover:underline">
                  {item.title}
                </a>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="text-gray-400">/</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Test Links:</h2>
        <ul className="space-y-2">
          <li><a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a></li>
          <li><a href="/dashboard/budget" className="text-blue-600 hover:underline">Budget</a></li>
          <li><a href="/dashboard/budget/buckets" className="text-blue-600 hover:underline">Budget Buckets</a></li>
          <li><a href="/dashboard/budget/income-splits" className="text-blue-600 hover:underline">Budget Income Splits</a></li>
          <li><a href="/dashboard/budget/manage-budgets" className="text-blue-600 hover:underline">Budget Manage Budgets</a></li>
          <li><a href="/dashboard/investments" className="text-blue-600 hover:underline">Investments</a></li>
          <li><a href="/dashboard/investments/stocks" className="text-blue-600 hover:underline">Investments Stocks</a></li>
        </ul>
      </div>
    </div>
  );
}
