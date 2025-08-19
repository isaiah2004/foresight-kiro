"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { IncomeDialog } from "./income-dialog";
import { IncomeTable } from "./income-table";
import { RaiseDialog } from "./raise-dialog";
import { IncomeSummaryCards } from "./income-summary-cards";
import { IncomeChart } from "./income-chart";
import { IncomeDocument } from "@/types/financial";
import { IncomePageSkeleton } from "@/components/income/income-page-skeleton";

interface IncomeProjectionsData {
  projections: { month: string; amount: number }[];
  monthlyIncome: number;
  annualIncome: number;
  breakdown: { type: string; amount: number; percentage: number }[];
}

export function IncomeManagement() {
  const { user } = useUser();
  const { toast } = useToast();

  const [incomes, setIncomes] = useState<IncomeDocument[]>([]);
  const [projectionsData, setProjectionsData] = useState<IncomeProjectionsData>(
    {
      projections: [],
      monthlyIncome: 0,
      annualIncome: 0,
      breakdown: [],
    }
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRaiseDialogOpen, setIsRaiseDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<
    IncomeDocument | undefined
  >();
  const [raiseIncome, setRaiseIncome] = useState<IncomeDocument | undefined>();

  useEffect(() => {
    if (user) {
      fetchIncomes();
      fetchProjections();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIncomes = async () => {
    try {
      const response = await fetch("/api/income");
      if (!response.ok) throw new Error("Failed to fetch incomes");
      const data = await response.json();
      setIncomes(data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      toast({
        title: "Error",
        description: "Failed to load income sources",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjections = async () => {
    try {
      const response = await fetch("/api/income/projections");
      if (!response.ok) throw new Error("Failed to fetch projections");
      const data = await response.json();
      // Adapt API payload (which returns objects for monthly/annual) to numeric values
      const monthly = typeof data?.monthlyIncome === 'number'
        ? data.monthlyIncome
        : (data?.monthlyIncome?.amount ?? 0);
      const annual = typeof data?.annualIncome === 'number'
        ? data.annualIncome
        : (data?.annualIncome?.amount ?? 0);

      setProjectionsData({
        projections: Array.isArray(data?.projections) ? data.projections : [],
        monthlyIncome: Number.isFinite(monthly) ? monthly : 0,
        annualIncome: Number.isFinite(annual) ? annual : 0,
        breakdown: Array.isArray(data?.breakdown) ? data.breakdown : [],
      });
    } catch (error) {
      console.error("Error fetching projections:", error);
      toast({
        title: "Error",
        description: "Failed to load income projections",
        variant: "destructive",
      });
    }
  };

  const handleSaveIncome = async (formData: any) => {
    try {
      const url = editingIncome
        ? `/api/income/${editingIncome.id}`
        : "/api/income";
      const method = editingIncome ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save income");

      toast({
        title: "Success",
        description: `Income source ${
          editingIncome ? "updated" : "added"
        } successfully`,
      });

      await fetchIncomes();
      await fetchProjections();
      setEditingIncome(undefined);
    } catch (error) {
      console.error("Error saving income:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          editingIncome ? "update" : "add"
        } income source`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditIncome = (income: IncomeDocument) => {
    setEditingIncome(income);
    setIsDialogOpen(true);
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      const response = await fetch(`/api/income/${incomeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete income");

      toast({
        title: "Success",
        description: "Income source deleted successfully",
      });

      await fetchIncomes();
      await fetchProjections();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast({
        title: "Error",
        description: "Failed to delete income source",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (incomeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/income/${incomeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error("Failed to update income status");

      toast({
        title: "Success",
        description: `Income source ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      });

      await fetchIncomes();
      await fetchProjections();
    } catch (error) {
      console.error("Error updating income status:", error);
      toast({
        title: "Error",
        description: "Failed to update income status",
        variant: "destructive",
      });
    }
  };

  const handleAddRaise = (income: IncomeDocument) => {
    setRaiseIncome(income);
    setIsRaiseDialogOpen(true);
  };

  const handleSaveRaise = async (raiseData: {
    newAmount: number;
    effectiveDate: Date;
  }) => {
    if (!raiseIncome) return;

    try {
      // First, set the end date on the current income to the day before the raise
      const endDate = new Date(raiseData.effectiveDate);
      endDate.setDate(endDate.getDate() - 1);

      await fetch(`/api/income/${raiseIncome.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endDate: endDate.toISOString(),
          isActive: false,
        }),
      });

      // Then create a new income record with the new amount
      const newIncomeData = {
        type: raiseIncome.type,
        source: raiseIncome.source,
        amount: { amount: raiseData.newAmount, currency: raiseIncome.amount.currency },
        frequency: raiseIncome.frequency,
        startDate: raiseData.effectiveDate.toISOString(),
        isActive: true,
      };

      const response = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIncomeData),
      });

      if (!response.ok) throw new Error("Failed to create new income record");

      toast({
        title: "Success",
        description: "Salary raise applied successfully",
      });

      await fetchIncomes();
      await fetchProjections();
      setRaiseIncome(undefined);
    } catch (error) {
      console.error("Error applying raise:", error);
      toast({
        title: "Error",
        description: "Failed to apply salary raise",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchIncomes(), fetchProjections()]);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <IncomePageSkeleton />
      ) : (
        <>
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Income Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage your income sources to understand your earning
            potential
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income Source
          </Button>
        </div>
        </div>

      {/* Summary Cards */}
      <IncomeSummaryCards
        data={{
          monthlyIncome: projectionsData.monthlyIncome,
          annualIncome: projectionsData.annualIncome,
          breakdown: projectionsData.breakdown,
        }}
  isLoading={isLoading}
      />

  {/* Charts */}
      <IncomeChart
        projections={projectionsData.projections}
        breakdown={projectionsData.breakdown}
        isLoading={isLoading}
      />

      {/* Income Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
          <CardDescription>
            Manage your income sources and track their contribution to your
            total earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncomeTable
            incomes={incomes}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
            onToggleStatus={handleToggleStatus}
            onAddRaise={handleAddRaise}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Income Dialog */}
      <IncomeDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingIncome(undefined);
          }
        }}
        income={editingIncome}
        onSave={handleSaveIncome}
      />

      {/* Raise Dialog */}
      <RaiseDialog
        open={isRaiseDialogOpen}
        onOpenChange={(open) => {
          setIsRaiseDialogOpen(open);
          if (!open) {
            setRaiseIncome(undefined);
          }
        }}
        income={raiseIncome}
        onSave={handleSaveRaise}
      />
      </>
      )}
    </div>
  );
}
