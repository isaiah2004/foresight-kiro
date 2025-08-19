'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLoanFormSchema, CreateLoanForm } from '@/lib/validations';
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
import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoanAdded: () => void;
}

export function AddLoanDialog({ open, onOpenChange, onLoanAdded }: AddLoanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPayment, setCalculatedPayment] = useState<number | null>(null);

  const form = useForm<CreateLoanForm>({
    resolver: zodResolver(createLoanFormSchema),
    defaultValues: {
      type: 'personal',
      name: '',
      principal: 0,
      currentBalance: 0,
      interestRate: 5,
      termMonths: 60,
      monthlyPayment: 0,
      startDate: new Date().toISOString().split('T')[0],
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const watchedValues = form.watch(['principal', 'interestRate', 'termMonths']);

  // Calculate monthly payment based on loan parameters
  const calculateMonthlyPayment = () => {
    const [principal, interestRate, termMonths] = watchedValues;
    
    if (principal > 0 && interestRate >= 0 && termMonths > 0) {
      const monthlyRate = interestRate / 100 / 12;
      let payment: number;
      
      if (monthlyRate === 0) {
        // No interest case
        payment = principal / termMonths;
      } else {
        // Standard loan payment formula
        payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
      }
      
      setCalculatedPayment(payment);
      form.setValue('monthlyPayment', Math.round(payment * 100) / 100);
    }
  };

  const onSubmit = async (data: CreateLoanForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onLoanAdded();
        onOpenChange(false);
        form.reset();
        setCalculatedPayment(null);
      } else {
        const error = await response.json();
        console.error('Failed to create loan:', error);
      }
    } catch (error) {
      console.error('Error creating loan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loanTypes = [
    { value: 'home', label: 'Home Loan', description: 'Mortgage or home equity loan' },
    { value: 'car', label: 'Car Loan', description: 'Auto financing' },
    { value: 'personal', label: 'Personal Loan', description: 'Unsecured personal loan' },
    { value: 'other', label: 'Other', description: 'Other type of loan' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
          <DialogDescription>
            Add a loan to track your debt and payment schedule. We&apos;ll help you understand the impact on your finances.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loanTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
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
                    <FormLabel>Loan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chase Auto Loan" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your loan a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Loan Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="25000"
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          // Auto-set current balance to principal for new loans
                          if (!form.getValues('currentBalance')) {
                            form.setValue('currentBalance', parseFloat(e.target.value) || 0);
                          }
                        }}
                      />
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
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="22500"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      How much you currently owe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={30}
                      step={0.1}
                      value={[field.value]}
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
                  <FormLabel>Loan Term: {field.value} months ({Math.round(field.value / 12 * 10) / 10} years)</FormLabel>
                  <FormControl>
                    <Slider
                      min={6}
                      max={360}
                      step={6}
                      value={[field.value]}
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

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={calculateMonthlyPayment}
                className="flex items-center space-x-2"
              >
                <Calculator className="h-4 w-4" />
                <span>Calculate Payment</span>
              </Button>
              {calculatedPayment && (
                <span className="text-sm text-muted-foreground">
                  Calculated: {formatCurrency(calculatedPayment)}
                </span>
              )}
            </div>

            <FormField
              control={form.control}
              name="monthlyPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Payment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="450.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Your required monthly payment amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      When the loan began
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextPaymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Payment Date</FormLabel>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Loan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}