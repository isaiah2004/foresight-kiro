"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
// Note: We'll validate via zod in the submit handler to avoid resolver TS friction
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, safeToDateString } from "@/lib/utils";
import { IncomeDocument } from "@/types/financial";
import { createIncomeFormSchema } from "@/lib/validations";
import { useCurrency } from "@/contexts/currency-context";

type IncomeFormValues = z.infer<typeof createIncomeFormSchema>;

// API payload shape expected by create/update endpoints
type IncomeApiData = Omit<IncomeFormValues, "amount" | "currency"> & {
  amount: { amount: number; currency: IncomeFormValues["currency"] };
};

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: IncomeDocument;
  onSave: (data: IncomeApiData) => Promise<void>;
}

const incomeTypes = [
  {
    value: "salary",
    label: "Salary",
    description: "Regular employment income",
  },
  {
    value: "bonus",
    label: "Bonus",
    description: "Performance bonuses and one-time payments",
  },
  {
    value: "other",
    label: "Other",
    description: "Freelance, side income, or other sources",
  },
];

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

export function IncomeDialog({
  open,
  onOpenChange,
  income,
  onSave,
}: IncomeDialogProps) {
  const { primaryCurrency, currencies, formatCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IncomeFormValues>({
    defaultValues: {
      type: "salary",
      source: "",
      amount: 0,
      currency: primaryCurrency as IncomeFormValues["currency"],
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: undefined,
      isActive: true,
    },
  });

  // Update default currency when provider loads/changes
  useEffect(() => {
    const currentCurrency = (income?.amount.currency || primaryCurrency) as IncomeFormValues["currency"];
    form.setValue("currency", currentCurrency, { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCurrency]);

  // Update form when income prop changes (prefill for edit) or reset for create
  useEffect(() => {
    if (income) {
      form.reset({
        type: income.type,
        source: income.source,
        amount: income.amount.amount,
        currency: income.amount.currency as IncomeFormValues["currency"],
        frequency: income.frequency,
        startDate: safeToDateString(income.startDate),
        endDate: income.endDate ? safeToDateString(income.endDate) : undefined,
        isActive: income.isActive,
      });
    } else {
      form.reset({
        type: "salary",
        source: "",
        amount: 0,
        currency: primaryCurrency as IncomeFormValues["currency"],
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: undefined,
        isActive: true,
      });
    }
  }, [income, form, primaryCurrency]);

  const amount = form.watch("amount");
  const frequency = form.watch("frequency");
  const currencyCode = form.watch("currency");

  const monthlyEquivalent = useMemo(() => {
    switch (frequency) {
      case "weekly":
        return amount * 4.33;
      case "bi-weekly":
        return amount * 2.17;
      case "quarterly":
        return amount / 3;
      case "annually":
        return amount / 12;
      case "monthly":
      default:
        return amount;
    }
  }, [amount, frequency]);

  const handleSubmit = async (data: IncomeFormValues) => {
    setIsLoading(true);
    try {
      // Validate client-side
      const parsed = createIncomeFormSchema.parse(data);
      // Validate on client and map to API payload
      const payload: IncomeApiData = {
        type: parsed.type,
        source: parsed.source,
        amount: { amount: parsed.amount, currency: parsed.currency },
        frequency: parsed.frequency,
        startDate: parsed.startDate,
        endDate: parsed.endDate || undefined,
        isActive: parsed.isActive,
      };

      await onSave(payload);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving income:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {income ? "Edit Income Source" : "Add Income Source"}
          </DialogTitle>
          <DialogDescription>
            {income
              ? "Update your income source details."
              : "Add a new income source to track your earnings."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Income Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-3"
                    >
                      {incomeTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={type.value} />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={type.value}
                              className="text-sm font-medium leading-none"
                            >
                              {type.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Source</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Company, Freelance Work" {...field} />
                  </FormControl>
                  <FormDescription>Name of the employer or source of this income</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(currencies?.length ? currencies : [{ code: primaryCurrency, name: primaryCurrency }]).map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} {"-"} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Monthly equivalent</p>
                <p className="text-sm font-medium">
                  {formatCurrency(monthlyEquivalent, currencyCode)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split("T")[0])}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>No end date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split("T")[0])}
                          disabled={(date) => {
                            const start = form.getValues("startDate");
                            return start ? date < new Date(start) : false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Leave empty for ongoing income</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Inactive income won't be included in projections</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {income ? "Update Income" : "Add Income"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
