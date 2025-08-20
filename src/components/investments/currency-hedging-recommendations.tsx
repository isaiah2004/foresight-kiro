"use client";

import { useState, useEffect } from 'react';
import { InvestmentDocument, CurrencyRiskAnalysis, HedgingOption } from '@/types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info,
  DollarSign,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { currencyService } from '@/lib/services/currency-service';

interface CurrencyHedgingRecommendationsProps {
  investments: InvestmentDocument[];
  riskAnalysis?: CurrencyRiskAnalysis;
}

interface HedgingStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  costLevel: 'low' | 'medium' | 'high';
  effectiveness: number; // 0-100
  timeHorizon: 'short' | 'medium' | 'long';
  instruments: string[];
  pros: string[];
  cons: string[];
  minimumAmount?: number;
}

const HEDGING_STRATEGIES: HedgingStrategy[] = [
  {
    id: 'currency-etfs',
    name: 'Currency ETFs',
    description: 'Invest in currency-hedged ETFs that automatically manage foreign exchange risk',
    riskLevel: 'low',
    complexity: 'beginner',
    costLevel: 'low',
    effectiveness: 75,
    timeHorizon: 'long',
    instruments: ['Currency-hedged ETFs', 'Multi-currency bond ETFs'],
    pros: [
      'Easy to implement through regular brokerage account',
      'Professional management of currency risk',
      'Liquid and transparent',
      'Low minimum investment'
    ],
    cons: [
      'Management fees reduce returns',
      'May not perfectly hedge your specific exposure',
      'Limited customization options'
    ],
    minimumAmount: 1000
  },
  {
    id: 'forward-contracts',
    name: 'Currency Forward Contracts',
    description: 'Lock in exchange rates for future dates to eliminate currency uncertainty',
    riskLevel: 'medium',
    complexity: 'intermediate',
    costLevel: 'medium',
    effectiveness: 95,
    timeHorizon: 'short',
    instruments: ['Forward contracts', 'Non-deliverable forwards (NDFs)'],
    pros: [
      'Precise hedging of specific amounts and dates',
      'No upfront premium required',
      'Customizable terms',
      'High effectiveness'
    ],
    cons: [
      'Requires margin and credit approval',
      'Locks in rates (no upside participation)',
      'Counterparty risk',
      'Complex documentation'
    ],
    minimumAmount: 25000
  },
  {
    id: 'currency-options',
    name: 'Currency Options',
    description: 'Purchase the right (but not obligation) to exchange currencies at specific rates',
    riskLevel: 'medium',
    complexity: 'advanced',
    costLevel: 'high',
    effectiveness: 85,
    timeHorizon: 'medium',
    instruments: ['Currency call options', 'Currency put options', 'Collar strategies'],
    pros: [
      'Provides downside protection while keeping upside',
      'Flexible strike prices and expiration dates',
      'Can be combined in various strategies',
      'Limited loss to premium paid'
    ],
    cons: [
      'Upfront premium cost',
      'Time decay reduces option value',
      'Complex pricing and Greeks',
      'May expire worthless'
    ],
    minimumAmount: 10000
  },
  {
    id: 'natural-hedging',
    name: 'Natural Hedging',
    description: 'Balance currency exposure by diversifying investments across multiple currencies',
    riskLevel: 'low',
    complexity: 'beginner',
    costLevel: 'low',
    effectiveness: 60,
    timeHorizon: 'long',
    instruments: ['International stocks', 'Foreign bonds', 'Global REITs', 'Commodities'],
    pros: [
      'No additional hedging costs',
      'Provides diversification benefits',
      'Simple to implement',
      'Maintains upside potential'
    ],
    cons: [
      'Imperfect hedge correlation',
      'Requires ongoing rebalancing',
      'May increase overall portfolio complexity',
      'Effectiveness varies with market conditions'
    ],
    minimumAmount: 500
  },
  {
    id: 'currency-swaps',
    name: 'Currency Swaps',
    description: 'Exchange principal and interest payments in different currencies',
    riskLevel: 'high',
    complexity: 'advanced',
    costLevel: 'medium',
    effectiveness: 90,
    timeHorizon: 'long',
    instruments: ['Cross-currency swaps', 'Currency interest rate swaps'],
    pros: [
      'Comprehensive hedging of both principal and interest',
      'Long-term hedging capability',
      'Can improve funding costs',
      'Customizable terms'
    ],
    cons: [
      'Complex structure and documentation',
      'High minimum amounts required',
      'Counterparty credit risk',
      'Difficult to unwind early'
    ],
    minimumAmount: 100000
  }
];

export function CurrencyHedgingRecommendations({ 
  investments, 
  riskAnalysis 
}: CurrencyHedgingRecommendationsProps) {
  const { formatCurrency, primaryCurrency } = useCurrency();
  const [selectedStrategy, setSelectedStrategy] = useState<HedgingStrategy | null>(null);
  const [portfolioValue, setPortfolioValue] = useState(0);

  useEffect(() => {
    // Calculate total portfolio value
    const total = investments.reduce((sum, investment) => {
      const currentPrice = investment.currentPrice?.amount || investment.purchasePrice.amount;
      return sum + (currentPrice * investment.quantity);
    }, 0);
    setPortfolioValue(total);
  }, [investments]);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'intermediate':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'advanced':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRecommendedStrategies = () => {
    if (!riskAnalysis) return HEDGING_STRATEGIES.slice(0, 2);

    const riskScore = riskAnalysis.riskScore;
    const totalExposure = riskAnalysis.totalExposure.reduce((sum, exp) => sum + exp.totalValue.amount, 0);

    return HEDGING_STRATEGIES.filter(strategy => {
      // Filter by portfolio size
      if (strategy.minimumAmount && totalExposure < strategy.minimumAmount) {
        return false;
      }

      // Filter by risk level
      if (riskScore < 30 && strategy.riskLevel === 'high') {
        return false;
      }

      if (riskScore > 70 && strategy.riskLevel === 'low') {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by effectiveness and suitability
      let scoreA = a.effectiveness;
      let scoreB = b.effectiveness;

      // Boost score for appropriate complexity
      if (riskScore > 60 && a.complexity === 'advanced') scoreA += 10;
      if (riskScore > 60 && b.complexity === 'advanced') scoreB += 10;
      if (riskScore < 40 && a.complexity === 'beginner') scoreA += 15;
      if (riskScore < 40 && b.complexity === 'beginner') scoreB += 15;

      return scoreB - scoreA;
    });
  };

  const recommendedStrategies = getRecommendedStrategies();

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Currency Hedging Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Add investments to see personalized hedging recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Currency Hedging Recommendations
          </CardTitle>
          <CardDescription>
            Protect your portfolio from foreign exchange risk with these tailored strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Risk Summary */}
              {riskAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Currency Risk Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(riskAnalysis.riskScore)}
                      </div>
                      <Progress value={riskAnalysis.riskScore} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {riskAnalysis.riskScore < 30 ? 'Low Risk' : 
                         riskAnalysis.riskScore < 60 ? 'Medium Risk' : 'High Risk'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(portfolioValue)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total investment value
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Currencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {riskAnalysis.totalExposure.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Different currencies
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Key Recommendations */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Key Recommendations</h3>
                {riskAnalysis?.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Recommendation {index + 1}</AlertTitle>
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendedStrategies.map((strategy) => (
                  <Card 
                    key={strategy.id} 
                    className={`cursor-pointer transition-all ${
                      selectedStrategy?.id === strategy.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedStrategy(strategy)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{strategy.name}</CardTitle>
                        <div className="flex gap-1">
                          <Badge className={getRiskLevelColor(strategy.riskLevel)}>
                            {strategy.riskLevel}
                          </Badge>
                          <Badge className={getComplexityColor(strategy.complexity)}>
                            {strategy.complexity}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        {strategy.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Effectiveness</span>
                        <div className="flex items-center gap-2">
                          <Progress value={strategy.effectiveness} className="w-16 h-2" />
                          <span className="text-sm">{strategy.effectiveness}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Cost Level:</span>
                        <span className={`font-medium ${getCostColor(strategy.costLevel)}`}>
                          {strategy.costLevel.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Time Horizon:</span>
                        <span className="font-medium">{strategy.timeHorizon}-term</span>
                      </div>

                      {strategy.minimumAmount && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Minimum Amount:</span>
                          <span className="font-medium">
                            {formatCurrency(strategy.minimumAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {strategy.instruments.slice(0, 2).map((instrument, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {instrument}
                          </Badge>
                        ))}
                        {strategy.instruments.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{strategy.instruments.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Strategy Details */}
              {selectedStrategy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {selectedStrategy.name} - Detailed Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Advantages
                        </h4>
                        <ul className="space-y-1">
                          {selectedStrategy.pros.map((pro, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Considerations
                        </h4>
                        <ul className="space-y-1">
                          {selectedStrategy.cons.map((con, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Available Instruments</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStrategy.instruments.map((instrument, idx) => (
                          <Badge key={idx} variant="secondary">
                            {instrument}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="implementation" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Implementation Steps</h3>
                
                {recommendedStrategies.slice(0, 1).map((strategy, index) => (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Recommended: {strategy.name}
                      </CardTitle>
                      <CardDescription>
                        Step-by-step implementation guide for your top recommendation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">Assess Your Exposure</h4>
                            <p className="text-sm text-muted-foreground">
                              Review your currency exposure analysis to identify which currencies need hedging
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">Choose Your Approach</h4>
                            <p className="text-sm text-muted-foreground">
                              Decide on the percentage of exposure to hedge (typically 25-75% for most investors)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Select Instruments</h4>
                            <p className="text-sm text-muted-foreground">
                              Choose from: {strategy.instruments.join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                            4
                          </div>
                          <div>
                            <h4 className="font-medium">Monitor and Adjust</h4>
                            <p className="text-sm text-muted-foreground">
                              Regularly review your hedging effectiveness and adjust as your portfolio changes
                            </p>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Professional Advice Recommended</AlertTitle>
                        <AlertDescription>
                          Currency hedging can be complex. Consider consulting with a financial advisor 
                          or currency specialist before implementing these strategies, especially for 
                          advanced instruments like forwards and options.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}