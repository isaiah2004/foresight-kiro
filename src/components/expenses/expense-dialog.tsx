'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Loader2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createExpenseSchema, updateExpenseSchema } from '@/lib/validations';
import { Expense, ExpenseCategory, ExpenseFrequency } from '@/types/financial';
import { z } from 'zod';
import { CategoryPicker } from './category-picker';
import { CategoryModal } from './category-modal';

const expenseCategories: { value: ExpenseCategory; label: string; description: string }[] = [
  { value: 'rent', label: 'Rent/Mortgage', description: 'Housing payments and related costs' },
  { value: 'groceries', label: 'Groceries', description: 'Food and household essentials' },
  { value: 'utilities', label: 'Utilities', description: 'Electricity, water, gas, internet' },
  { value: 'entertainment', label: 'Entertainment', description: 'Movies, dining out, hobbies' },
  { value: 'other', label: 'Other', description: 'Miscellaneous expenses' },
];

const expenseFrequencies: { value: ExpenseFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onExpenseCreated: (expense: Expense) => void;
  onExpenseUpdated: (expense: Expense) => void;
}

// Form data type with string dates for form handling
type FormData = {
  category: ExpenseCategory; // legacy field kept for now
  categoryId?: string;
  tags?: string[];
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  isFixed: boolean; // treat as recurring toggle default false
  startDate: string;
  endDate?: string;
};

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onExpenseCreated,
  onExpenseUpdated,
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const isEditing = !!expense;

  const form = useForm<FormData>({
    defaultValues: {
      category: 'other',
  categoryId: undefined,
  tags: [],
      name: '',
      amount: 0,
      frequency: 'monthly',
  isFixed: false, // default non-recurring
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        category: expense.category,
  categoryId: expense.categoryId,
  tags: expense.tags ?? [],
        name: expense.name,
        amount: expense.amount.amount,
        frequency: expense.frequency,
        isFixed: expense.isFixed,
        startDate: expense.startDate.toDate().toISOString().split('T')[0],
        endDate: expense.endDate ? expense.endDate.toDate().toISOString().split('T')[0] : undefined,
      });
    } else {
      form.reset({
        category: 'other',
  categoryId: undefined,
  tags: [],
        name: '',
        amount: 0,
        frequency: 'monthly',
  isFixed: false,
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [expense, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Validate the data
      const schema = isEditing ? updateExpenseSchema : createExpenseSchema;
  const validatedData = schema.parse(data);

      const url = isEditing ? `/api/expenses/${expense.id}` : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      const savedExpense = await response.json();

      if (isEditing) {
        onExpenseUpdated(savedExpense);
      } else {
        onExpenseCreated(savedExpense);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your expense details below.'
              : 'Add a new expense to track your spending patterns.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Rent, Grocery Shopping" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormDescription>Choose from quick categories or add your own.</FormDescription>
                    <FormControl>
                      <div>
                        <CategoryPicker
                          value={field.value}
                          onChange={field.onChange}
                          onAddCategory={() => setCategoryModalOpen(true)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseFrequencies.map((frequency) => (
                          <SelectItem key={frequency.value} value={frequency.value}>
                            {frequency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
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
                  <FormDescription>
                    Enter the amount for the selected frequency
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFixed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Expense</FormLabel>
                    <FormDescription>
                      Turn on if this repeats (e.g., rent, loans, insurance)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormDescription>Add custom tags and press Enter</FormDescription>
                  <FormControl>
                    <div className="flex flex-wrap gap-2 border rounded-md p-2">
                      {(field.value ?? []).map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-secondary">
                          <Tag className="w-3 h-3" /> {t}
                          <button type="button" className="ml-1" onClick={() => field.onChange((field.value ?? []).filter((x) => x !== t))}>×</button>
                        </span>
                      ))}
                      <input
                        className="flex-1 min-w-[120px] outline-none bg-transparent"
                        placeholder="Type and press Enter"
                        value={tagsInput}
                        onChange={(e)=>setTagsInput(e.target.value)}
                        onKeyDown={(e)=>{
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const v = tagsInput.trim();
                            if (v) {
                              const next = Array.from(new Set([...(field.value ?? []), v])).slice(0,20);
                              field.onChange(next);
                              setTagsInput('');
                            }
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
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
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) => date > new Date()}
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
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>No end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) => {
                            const startDate = form.getValues('startDate');
                            return startDate ? date < new Date(startDate) : false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave empty for ongoing expenses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Expense' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
  <CategoryModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} onCreated={(id)=>form.setValue('categoryId', id)} />
    </Dialog>
  );
}