"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function BucketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Buckets</h1>
          <p className="text-muted-foreground">
            Organize your budget into different spending categories and track your allocations.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Bucket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Essentials</CardTitle>
            <CardDescription>
              Housing, utilities, groceries, and other necessities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Allocated</span>
                <span className="text-sm font-medium">$2,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Spent</span>
                <span className="text-sm font-medium">$1,823</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="text-sm font-medium text-green-600">$677</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entertainment</CardTitle>
            <CardDescription>
              Movies, dining out, subscriptions, and fun activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Allocated</span>
                <span className="text-sm font-medium">$400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Spent</span>
                <span className="text-sm font-medium">$456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="text-sm font-medium text-red-600">-$56</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Savings</CardTitle>
            <CardDescription>
              Emergency fund, investments, and long-term savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Allocated</span>
                <span className="text-sm font-medium">$800</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Saved</span>
                <span className="text-sm font-medium">$800</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium text-green-600">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
