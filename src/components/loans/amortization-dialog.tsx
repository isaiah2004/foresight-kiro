'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loan } from '@/types/financial';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calendar, DollarSign, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AmortizationDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AmortizationData {
  schedule: {
    paymentNumber: number;
    paymentDate: Date;
    principalPayment: number;
    interestPayment: number;
    remainingBalance: number;
  }[];
  totalInterest: number;
  payoffDate: Date;
  totalPayments: number;
}

export function AmortizationDialog({ loan, open, onOpenChange }: AmortizationDialogProps) {
  const [amortizationData, setAmortizationData] = useState<AmortizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    if (open && loan) {
      fetchAmortizationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loan]);

  const fetchAmortizationData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/loans/amortization/${loan.id}`);
      if (response.ok) {
        const data = await response.json();
        setAmortizationData({
          ...data,
          payoffDate: new Date(data.payoffDate),
          schedule: Array.isArray(data.schedule) ? data.schedule.map((payment: any) => ({
            ...payment,
            paymentDate: new Date(payment.paymentDate),
          })) : [],
        });
      } else {
        console.error('Error fetching amortization data:', await response.text());
        // Set empty data to prevent crashes
        setAmortizationData({
          schedule: [],
          totalInterest: 0,
          payoffDate: new Date(),
          totalPayments: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching amortization data:', error);
      // Set empty data to prevent crashes
      setAmortizationData({
        schedule: [],
        totalInterest: 0,
        payoffDate: new Date(),
        totalPayments: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!amortizationData) return;

    const headers = ['Payment #', 'Date', 'Principal', 'Interest', 'Remaining Balance'];
    const csvContent = [
      headers.join(','),
      ...amortizationData.schedule.map(payment => [
        payment.paymentNumber,
        payment.paymentDate.toLocaleDateString(),
        payment.principalPayment.toFixed(2),
        payment.interestPayment.toFixed(2),
        payment.remainingBalance.toFixed(2),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loan.name}_amortization_schedule.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const displayedPayments = showAllPayments 
    ? amortizationData?.schedule || []
    : amortizationData?.schedule.slice(0, 12) || [];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Amortization Schedule</DialogTitle>
            <DialogDescription>Loading payment schedule...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Amortization Schedule - {loan.name}</DialogTitle>
          <DialogDescription>
            Detailed payment breakdown showing how much goes to principal vs. interest
          </DialogDescription>
        </DialogHeader>

        {amortizationData && (
          <div className="space-y-6">
            {/* Show message for paid off loans or empty schedules */}
            {amortizationData.schedule.length === 0 && (
              <div className="text-center py-8">
                <div className="text-green-600 text-lg font-semibold mb-2">
                  🎉 Congratulations!
                </div>
                <p className="text-muted-foreground">
                  {loan.currentBalance.amount <= 0 
                    ? 'This loan has been paid off!' 
                    : 'No payment schedule available for this loan.'}
                </p>
              </div>
            )}

            {amortizationData.schedule.length > 0 && (
            <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(amortizationData.totalInterest, loan.principal.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Over life of loan
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payoff Date</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {amortizationData.payoffDate.toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Final payment date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {amortizationData.totalPayments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monthly payments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(loan.principal.amount + amortizationData.totalInterest, loan.principal.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Principal + Interest
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Schedule Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Schedule</CardTitle>
                    <CardDescription>
                      {showAllPayments 
                        ? `All ${amortizationData.schedule.length} payments`
                        : `First 12 payments (${amortizationData.schedule.length} total)`
                      }
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllPayments(!showAllPayments)}
                    >
                      {showAllPayments ? 'Show Less' : 'Show All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCsv}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Payment #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedPayments.map((payment) => (
                        <TableRow key={payment.paymentNumber}>
                          <TableCell className="font-medium">
                            {payment.paymentNumber}
                          </TableCell>
                          <TableCell>
                            {payment.paymentDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(payment.principalPayment, loan.principal.currency)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(payment.interestPayment, loan.principal.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payment.remainingBalance, loan.principal.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {!showAllPayments && amortizationData.schedule.length > 12 && (
                  <div className="mt-4 text-center">
                    <Badge variant="outline">
                      {amortizationData.schedule.length - 12} more payments
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Educational Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Understanding Your Amortization</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800">
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Principal:</strong> The amount that reduces your loan balance</li>
                  <li>• <strong>Interest:</strong> The cost of borrowing money</li>
                  <li>• <strong>Early payments:</strong> More goes to interest, less to principal</li>
                  <li>• <strong>Later payments:</strong> More goes to principal, less to interest</li>
                  <li>• <strong>Extra payments:</strong> Go directly to principal, saving interest</li>
                </ul>
              </CardContent>
            </Card>
            </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}