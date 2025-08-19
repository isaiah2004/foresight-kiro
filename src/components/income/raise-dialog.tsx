'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { IncomeDocument } from '@/types/financial';
import { formatCurrency } from '@/lib/dashboard-calculations';

const raiseFormSchema = z.object({
  newAmount: z.number().positive('New amount must be positive'),
  effectiveDate: z.date(),
});

type RaiseFormValues = z.infer<typeof raiseFormSchema>;

interface RaiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: IncomeDocument;
  onSave: (data: RaiseFormValues) => Promise<void>;
}

export function RaiseDialog({ open, onOpenChange, income, onSave }: RaiseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RaiseFormValues>({
    resolver: zodResolver(raiseFormSchema),
    defaultValues: {
      newAmount: income?.amount.amount || 0,
      effectiveDate: new Date(),
    },
  });

  const currentAmount = income?.amount.amount || 0;
  const newAmount = form.watch('newAmount');
  const increaseAmount = newAmount - currentAmount;
  const increasePercentage = currentAmount > 0 ? (increaseAmount / currentAmount) * 100 : 0;

  const handleSubmit = async (data: RaiseFormValues) => {
    setIsLoading(true);
    try {
      await onSave(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving raise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!income) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Add Salary Raise
          </DialogTitle>
          <DialogDescription>
            Update the salary amount for {income.source}. This will create a new income record with the updated amount.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current Amount</p>
              <p className="font-semibold">{formatCurrency(currentAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Frequency</p>
              <p className="font-semibold capitalize">{income.frequency}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the new {income.frequency} amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {newAmount > 0 && newAmount !== currentAmount && (
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Increase Amount</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {increaseAmount > 0 ? '+' : ''}{formatCurrency(increaseAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Increase Percentage</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {increasePercentage > 0 ? '+' : ''}{increasePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Effective Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When does this raise take effect?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Raise
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}