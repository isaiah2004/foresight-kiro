'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calculator, 
  CreditCard,
  Home,
  Car,
  User,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loan } from '@/types/financial';
import { EditLoanDialog } from './edit-loan-dialog';
import { AmortizationDialog } from './amortization-dialog';
import { formatCurrency, safeFormatDate } from '@/lib/utils';

interface LoansListProps {
  loans: Loan[];
  onLoanUpdated: () => void;
  onLoanDeleted: () => void;
}

export function LoansList({ loans, onLoanUpdated, onLoanDeleted }: LoansListProps) {
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [amortizationLoan, setAmortizationLoan] = useState<Loan | null>(null);

  const getLoanIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'car': return <Car className="h-4 w-4" />;
      case 'personal': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getLoanTypeColor = (type: string) => {
    switch (type) {
      case 'home': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'car': return 'bg-green-100 text-green-800 border-green-200';
      case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onLoanDeleted();
      } else {
        console.error('Failed to delete loan');
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const calculateProgress = (loan: Loan) => {
    if (loan.principal.amount === 0) return 0;
    const paidAmount = loan.principal.amount - loan.currentBalance.amount;
    return (paidAmount / loan.principal.amount) * 100;
  };

  const activeLoans = loans.filter(loan => loan.currentBalance.amount > 0);
  const paidOffLoans = loans.filter(loan => loan.currentBalance.amount === 0);

  if (loans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Loans</CardTitle>
          <CardDescription>No loans found. Add your first loan to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Track your loans and debt to better manage your finances
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Loans ({activeLoans.length})</CardTitle>
            <CardDescription>Loans with remaining balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeLoans.map((loan) => (
              <div key={loan.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getLoanIcon(loan.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{loan.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getLoanTypeColor(loan.type)}`}
                        >
                          {loan.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {loan.interestRate}% APR
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingLoan(loan)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAmortizationLoan(loan)}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Amortization
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Balance</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(loan.currentBalance.amount, loan.currentBalance.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Payment</p>
                    <p className="font-semibold">
                      {formatCurrency(loan.monthlyPayment.amount, loan.monthlyPayment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Original Amount</p>
                    <p className="font-semibold">
                      {formatCurrency(loan.principal.amount, loan.principal.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Payment</p>
                    <p className="font-semibold">
                      {safeFormatDate(loan.nextPaymentDate)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{calculateProgress(loan).toFixed(1)}% paid off</span>
                  </div>
                  <Progress value={calculateProgress(loan)} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Paid Off Loans */}
      {paidOffLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paid Off Loans ({paidOffLoans.length})</CardTitle>
            <CardDescription>Congratulations on paying off these loans!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paidOffLoans.map((loan) => (
              <div key={loan.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {getLoanIcon(loan.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{loan.name}</h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        PAID OFF
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Original Amount</p>
                    <p className="font-semibold">{formatCurrency(loan.principal.amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {editingLoan && (
        <EditLoanDialog
          loan={editingLoan}
          open={!!editingLoan}
          onOpenChange={(open) => !open && setEditingLoan(null)}
          onLoanUpdated={onLoanUpdated}
        />
      )}

      {amortizationLoan && (
        <AmortizationDialog
          loan={amortizationLoan}
          open={!!amortizationLoan}
          onOpenChange={(open) => !open && setAmortizationLoan(null)}
        />
      )}
    </div>
  );
}