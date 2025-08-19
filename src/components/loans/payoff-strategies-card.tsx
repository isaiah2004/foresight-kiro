'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingDown, 
  Clock, 
  DollarSign,
  Snowflake,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Loan } from '@/types/financial';
import { formatCurrency } from '@/lib/utils';

interface PayoffStrategy {
  order: Loan[];
  totalInterest: number;
  payoffTime: number;
}

interface StrategiesData {
  strategies: {
    snowball: PayoffStrategy;
    avalanche: PayoffStrategy;
  };
  summary: {
    totalDebt: number;
    totalMonthlyPayments: number;
  };
}

export function PayoffStrategiesCard() {
  const [strategiesData, setStrategiesData] = useState<StrategiesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStrategiesData();
  }, []);

  const fetchStrategiesData = async () => {
    try {
      const response = await fetch('/api/loans/strategies');
      if (response.ok) {
        const data = await response.json();
        setStrategiesData(data);
      } else {
        // Handle API errors gracefully
        const errorData = await response.json();
        if (errorData.strategies) {
          // API returned partial data with error
          setStrategiesData(errorData);
        } else {
          console.error('Error fetching strategies:', errorData);
          setStrategiesData({
            strategies: {
              snowball: { order: [], totalInterest: 0, payoffTime: 0 },
              avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
            },
            summary: { totalDebt: 0, totalMonthlyPayments: 0 }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching payoff strategies:', error);
      setStrategiesData({
        strategies: {
          snowball: { order: [], totalInterest: 0, payoffTime: 0 },
          avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
        },
        summary: { totalDebt: 0, totalMonthlyPayments: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt Payoff Strategies</CardTitle>
          <CardDescription>Loading payoff strategies...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategiesData || strategiesData.strategies.snowball.order.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt Payoff Strategies</CardTitle>
          <CardDescription>No active loans to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Add loans to see personalized payoff strategies
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { snowball, avalanche } = strategiesData.strategies;
  const interestSavings = snowball.totalInterest - avalanche.totalInterest;
  const timeSavings = snowball.payoffTime - avalanche.payoffTime;

  const getLoanIcon = (type: string) => {
    switch (type) {
      case 'home': return '🏠';
      case 'car': return '🚗';
      case 'personal': return '👤';
      default: return '📄';
    }
  };

  const StrategyContent = ({ strategy, title, icon, description, isRecommended = false }: {
    strategy: PayoffStrategy;
    title: string;
    icon: React.ReactNode;
    description: string;
    isRecommended?: boolean;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-semibold">{title}</span>
          {isRecommended && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Recommended
            </Badge>
          )}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">{description}</p>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total Interest</p>
          <p className="font-semibold text-red-600">
            {formatCurrency(strategy.totalInterest)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Payoff Time</p>
          <p className="font-semibold">
            {strategy.payoffTime} months
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Payment Order</h4>
        <div className="space-y-2">
          {strategy.order.slice(0, 3).map((loan, index) => (
            <div key={loan.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getLoanIcon(loan.type)}</span>
                <div>
                  <p className="text-sm font-medium">{loan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.interestRate}% APR
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(loan.currentBalance.amount, loan.currentBalance.currency)}
                </p>
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
              </div>
            </div>
          ))}
          {strategy.order.length > 3 && (
            <div className="text-center">
              <Badge variant="outline">
                +{strategy.order.length - 3} more loans
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Debt Payoff Strategies</span>
        </CardTitle>
        <CardDescription>
          Compare different approaches to paying off your debt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="avalanche" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="avalanche" className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>Avalanche</span>
            </TabsTrigger>
            <TabsTrigger value="snowball" className="flex items-center space-x-1">
              <Snowflake className="h-4 w-4" />
              <span>Snowball</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="avalanche" className="mt-4">
            <StrategyContent
              strategy={avalanche}
              title="Debt Avalanche"
              icon={<Zap className="h-5 w-5 text-blue-600" />}
              description="Pay minimums on all debts, then put extra money toward the highest interest rate debt first. Saves the most money overall."
              isRecommended={interestSavings > 0}
            />
          </TabsContent>
          
          <TabsContent value="snowball" className="mt-4">
            <StrategyContent
              strategy={snowball}
              title="Debt Snowball"
              icon={<Snowflake className="h-5 w-5 text-purple-600" />}
              description="Pay minimums on all debts, then put extra money toward the smallest balance first. Provides psychological wins and momentum."
            />
          </TabsContent>
        </Tabs>

        {/* Comparison */}
        {interestSavings > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-900">Potential Savings</span>
            </div>
            <p className="text-sm text-green-800">
              The Debt Avalanche method could save you{' '}
              <strong>{formatCurrency(interestSavings)}</strong> in interest
              {timeSavings > 0 && (
                <span> and {timeSavings} months of payments</span>
              )} compared to the Snowball method.
            </p>
          </div>
        )}

        {/* Educational Tip */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Strategy Tips</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Avalanche:</strong> Best for saving money (mathematically optimal)</li>
            <li>• <strong>Snowball:</strong> Best for motivation (quick psychological wins)</li>
            <li>• Consider your personality and what will keep you motivated</li>
            <li>• Any extra payments toward debt will accelerate your progress</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}