'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateLoanFormSchema, UpdateLoanForm } from '@/lib/validations';
import { Loan } from '@/types/financial';
import { useCurrency } from '@/contexts/currency-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Calculator,
  TrendingUp,
  Save,
  AlertTriangle,
  Building2,
  Car,
  User,
  CreditCard,
  Globe,
  Calendar,
  DollarSign,
  Target,
  Shield,
} from 'lucide-react';
import { formatCurrency, safeToDateString } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EditLoanDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoanUpdated: () => void;
}

export function EditLoanDialog({ loan, open, onOpenChange, onLoanUpdated }: EditLoanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPayment, setCalculatedPayment] = useState<number | null>(null);
  const { primaryCurrency } = useCurrency();

  const form = useForm<UpdateLoanForm>({
    resolver: zodResolver(updateLoanFormSchema),
    defaultValues: {
      id: loan.id,
      type: loan.type,
      name: loan.name,
      principal: loan.principal.amount,
      currentBalance: loan.currentBalance.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment.amount,
      currency: loan.principal.currency as any,
      startDate: safeToDateString(loan.startDate),
      nextPaymentDate: safeToDateString(loan.nextPaymentDate),
    },
  });

  const watchedValues = form.watch([
    "principal",
    "interestRate",
    "termMonths",
    "currency",
  ]);

  // Auto-calculate monthly payment when relevant values change
  useEffect(() => {
    const [principal, interestRate, termMonths] = watchedValues;

    if (principal && principal > 0 && interestRate !== undefined && interestRate >= 0 && termMonths && termMonths > 0) {
      const monthlyRate = interestRate / 100 / 12;
      let payment: number;

      if (monthlyRate === 0) {
        // No interest case
        payment = principal / termMonths;
      } else {
        // Standard loan payment formula
        payment =
          (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
          (Math.pow(1 + monthlyRate, termMonths) - 1);
      }

      setCalculatedPayment(payment);
      form.setValue("monthlyPayment", Math.round(payment * 100) / 100);
    }
  }, [watchedValues, form]);

  // Reset form when loan changes
  useEffect(() => {
    if (loan) {
      form.reset({
        id: loan.id,
        type: loan.type,
        name: loan.name,
        principal: loan.principal.amount,
        currentBalance: loan.currentBalance.amount,
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment.amount,
        currency: loan.principal.currency as any,
        startDate: safeToDateString(loan.startDate),
        nextPaymentDate: safeToDateString(loan.nextPaymentDate),
      });
    }
  }, [loan, form]);

  const onSubmit = async (data: UpdateLoanForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onLoanUpdated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        console.error('Failed to update loan:', error);
      }
    } catch (error) {
      console.error('Error updating loan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loanTypes = [
    {
      value: "home",
      label: "Home Loan",
      description: "Mortgage or home equity loan",
    },
    { value: "car", label: "Car Loan", description: "Auto financing" },
    {
      value: "personal",
      label: "Personal Loan",
      description: "Unsecured personal loan",
    },
    { value: "other", label: "Other", description: "Other type of loan" },
  ];

  const supportedCurrencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] px-2">
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-4 my-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Edit Loan
            </DialogTitle>
            <DialogDescription>
              Update your loan information to keep your financial tracking accurate.
              Payment will be automatically calculated based on your inputs.
            </DialogDescription>
          </DialogHeader>

          <Form {...form as any}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Header */}
              <div className="p-4 rounded-lg border bg-background">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {field.value === "home" && (
                            <Building2 className="h-4 w-4 text-primary" />
                          )}
                          {field.value === "car" && (
                            <Car className="h-4 w-4 text-primary" />
                          )}
                          {field.value === "personal" && (
                            <User className="h-4 w-4 text-primary" />
                          )}
                          {field.value === "other" && (
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          )}
                          Loan Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loanTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  {type.value === "home" && (
                                    <Building2 className="h-4 w-4 text-primary" />
                                  )}
                                  {type.value === "car" && (
                                    <Car className="h-4 w-4 text-primary" />
                                  )}
                                  {type.value === "personal" && (
                                    <User className="h-4 w-4 text-primary" />
                                  )}
                                  {type.value === "other" && (
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <div>
                                    <div className="font-medium">
                                      {type.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {type.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Loan Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Chase Auto Loan, Barclays Mortgage"
                            {...field}
                            className="bg-card"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your lender name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financial details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg border bg-background">
                  <FormField
                    control={form.control}
                    name="principal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          Original Loan Amount
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="25000"
                              {...field}
                              className="pl-8"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The total amount you borrowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                          Current Balance
                          {field.value && field.value > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {(
                                (field.value /
                                  (form.getValues("principal") || 1)) *
                                100
                              ).toFixed(0)}
                              % remaining
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="22500"
                              {...field}
                              className="pl-8"
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          How much you currently owe
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Currency
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {supportedCurrencies.map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm font-bold">
                                    {currency.symbol}
                                  </span>
                                  <span className="font-medium">
                                    {currency.code}
                                  </span>
                                  <span className="text-muted-foreground">
                                    - {currency.name}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Currency of the loan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Loan terms */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calculator className="h-4 w-4" />
                  Loan Terms & Rates
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border bg-background">
                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            Interest Rate
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {field.value}%
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={30}
                            step={0.1}
                            value={[field.value || 0]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Annual Percentage Rate (APR)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Target className="h-3 w-3" />
                            Loan Term
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(((field.value || 0) / 12) * 10) / 10} years (
                            {field.value || 0} months)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={6}
                            max={360}
                            step={6}
                            value={[field.value || 0]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Total length of the loan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payment display */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calculator className="h-4 w-4" />
                  Monthly Payment
                  {calculatedPayment && (
                    <Badge variant="secondary" className="text-sm font-medium ml-auto">
                      Auto-calculated: {formatCurrency(calculatedPayment)}
                    </Badge>
                  )}
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <FormField
                    control={form.control}
                    name="monthlyPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          Monthly Payment
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="450.00"
                              {...field}
                              className="pl-8"
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your required monthly payment amount (auto-calculated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calendar className="h-4 w-4" />
                  Important Dates
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border bg-background">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-primary" />
                          Loan Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>When the loan began</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nextPaymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          Next Payment Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          When your next payment is due
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {form.getValues("currency") &&
                  form.getValues("currency") !== primaryCurrency ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Foreign currency loan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-primary">
                      <Shield className="h-3 w-3" />
                      Domestic currency loan
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Loan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div> {/* Close the padding div */}
      </DialogContent>
    </Dialog>
  );
}