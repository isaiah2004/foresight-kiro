'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLoanFormSchema, CreateLoanForm } from '@/lib/validations';
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
import { Calculator, MapPin, TrendingUp, Plus, AlertTriangle, Building2, Car, User, CreditCard, Globe, Calendar, DollarSign, Target, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoanAdded: () => void;
}

export function AddLoanDialog({ open, onOpenChange, onLoanAdded }: AddLoanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPayment, setCalculatedPayment] = useState<number | null>(null);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [currencyRiskWarning, setCurrencyRiskWarning] = useState<string | null>(null);
  
  const { primaryCurrency, formatCurrency: formatCurrencyWithSymbol } = useCurrency();

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
      currency: primaryCurrency as any, // Type assertion to handle currency enum
    },
  });

  const watchedValues = form.watch(['principal', 'interestRate', 'termMonths', 'name', 'type', 'currency']);

  // Auto-detect currency based on lender name
  useEffect(() => {
    const [, , , lenderName, loanType] = watchedValues;
    if (lenderName && lenderName.length > 2) {
      // Simple currency detection based on lender name
      const detected = detectCurrencyFromLender(lenderName, loanType);
      if (detected !== primaryCurrency) {
        setDetectedCurrency(detected);
        form.setValue('currency', detected as any); // Type assertion for currency enum
        
        // Show currency risk warning for foreign currency loans
        setCurrencyRiskWarning(
          `This appears to be a ${detected} loan. Foreign currency loans carry exchange rate risk that could affect your payments and total cost.`
        );
      } else {
        setDetectedCurrency(null);
        setCurrencyRiskWarning(null);
      }
    }
  }, [watchedValues, primaryCurrency, form]);

  // Simple currency detection function
  const detectCurrencyFromLender = (lenderName: string, loanType: string): string => {
    const name = lenderName.toLowerCase();
    
    // UK lenders
    if (name.includes('barclays') || name.includes('lloyds') || name.includes('natwest') || 
        name.includes('hsbc uk') || name.includes('santander uk') || name.includes('uk')) {
      return 'GBP';
    }
    
    // European lenders
    if (name.includes('deutsche') || name.includes('bnp paribas') || name.includes('ing') || 
        name.includes('unicredit') || name.includes('euro')) {
      return 'EUR';
    }
    
    // Canadian lenders
    if (name.includes('rbc') || name.includes('td bank') || name.includes('scotiabank') || 
        name.includes('bmo') || name.includes('canada')) {
      return 'CAD';
    }
    
    // Australian lenders
    if (name.includes('commonwealth') || name.includes('westpac') || name.includes('anz') || 
        name.includes('nab') || name.includes('australia')) {
      return 'AUD';
    }
    
    // Japanese lenders
    if (name.includes('mitsubishi') || name.includes('sumitomo') || name.includes('mizuho') || 
        name.includes('japan')) {
      return 'JPY';
    }
    
    // Swiss lenders
    if (name.includes('ubs') || name.includes('credit suisse') || name.includes('swiss')) {
      return 'CHF';
    }
    
    return primaryCurrency; // Default to user's primary currency
  };

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

  const supportedCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add New Loan
            {detectedCurrency && (
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {detectedCurrency} Detected
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Add a loan to track your debt and payment schedule. We&apos;ll help you understand the impact on your finances and any currency risks.
          </DialogDescription>
        </DialogHeader>

        {currencyRiskWarning && (
          <Alert className="border-amber-200 bg-amber-50">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription className="text-amber-800">
              {currencyRiskWarning}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Enhanced Header Section with Visual Indicators */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {field.value === 'home' && <Building2 className="h-4 w-4 text-green-600" />}
                        {field.value === 'car' && <Car className="h-4 w-4 text-blue-600" />}
                        {field.value === 'personal' && <User className="h-4 w-4 text-purple-600" />}
                        {field.value === 'other' && <CreditCard className="h-4 w-4 text-gray-600" />}
                        Loan Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select loan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loanTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                {type.value === 'home' && <Building2 className="h-4 w-4 text-green-600" />}
                                {type.value === 'car' && <Car className="h-4 w-4 text-blue-600" />}
                                {type.value === 'personal' && <User className="h-4 w-4 text-purple-600" />}
                                {type.value === 'other' && <CreditCard className="h-4 w-4 text-gray-600" />}
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm text-muted-foreground">{type.description}</div>
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
                        {detectedCurrency && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Auto-detecting currency...
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Chase Auto Loan, Barclays Mortgage" 
                          {...field} 
                          className="bg-white"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your lender name - we&apos;ll auto-detect the currency
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Enhanced Financial Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <DollarSign className="h-4 w-4" />
                Financial Details
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-600" />
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
                              // Auto-set current balance to principal for new loans
                              if (!form.getValues('currentBalance')) {
                                form.setValue('currentBalance', parseFloat(e.target.value) || 0);
                              }
                            }}
                          />
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
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
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                        Current Balance
                        {field.value > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {((field.value / (form.getValues('principal') || 1)) * 100).toFixed(0)}% remaining
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
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
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
                        {detectedCurrency && (
                          <Badge variant="outline" className="text-xs animate-pulse">
                            <MapPin className="h-3 w-3 mr-1" />
                            Auto-detected
                          </Badge>
                        )}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supportedCurrencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold">{currency.symbol}</span>
                                <span className="font-medium">{currency.code}</span>
                                <span className="text-muted-foreground">- {currency.name}</span>
                                {currency.code === detectedCurrency && (
                                  <Badge variant="secondary" className="text-xs">Detected</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Currency of the loan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Enhanced Loan Terms Section with Visual Feedback */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calculator className="h-4 w-4" />
                Loan Terms & Rates
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
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
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-600">{field.value}%</span>
                          <Badge variant={field.value < 5 ? "default" : field.value < 10 ? "secondary" : "destructive"} className="text-xs">
                            {field.value < 5 ? "Excellent" : field.value < 10 ? "Good" : "High"}
                          </Badge>
                        </div>
                      </FormLabel>
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
                        Annual Percentage Rate (APR) - Lower is better
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
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-600">{Math.round(field.value / 12 * 10) / 10} years</span>
                          <Badge variant="outline" className="text-xs">
                            {field.value} months
                          </Badge>
                        </div>
                      </FormLabel>
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
                        Total length of the loan - Shorter terms save interest
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Enhanced Payment Calculator Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calculator className="h-4 w-4" />
                Payment Calculator
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateMonthlyPayment}
                    className="flex items-center space-x-2 bg-white hover:bg-gray-50"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Calculate Payment</span>
                  </Button>
                  {calculatedPayment && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Calculated:</span>
                      <Badge variant="default" className="text-sm font-bold">
                        {formatCurrency(calculatedPayment)}
                      </Badge>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="monthlyPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        Monthly Payment
                        {field.value > 0 && calculatedPayment && Math.abs(field.value - calculatedPayment) > 10 && (
                          <Badge variant="outline" className="text-xs">
                            {field.value > calculatedPayment ? "Above calculated" : "Below calculated"}
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="450.00"
                            {...field}
                            className="pl-8 bg-white"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Your required monthly payment amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Enhanced Date Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Important Dates
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        Loan Start Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white" />
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
                      <FormLabel className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        Next Payment Date
                        {field.value && new Date(field.value) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            Due Soon!
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white" />
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

            {/* Enhanced Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {currencyRiskWarning ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Foreign currency loan detected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600">
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
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Loan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}