import { orderBy } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { Investment, InvestmentType, PortfolioSummary } from '../../types/financial';
import { currencyService } from './currency-service';

export class InvestmentService extends BaseFirebaseService<Investment> {
  constructor() {
    super('investments');
  }

  // Get investments by type
  async getByType(userId: string, type: InvestmentType): Promise<Investment[]> {
    // Get all investments and filter in memory to avoid index requirement
    const allInvestments = await this.getAllOrdered(userId);
    return allInvestments.filter(investment => investment.type === type);
  }

  // Get active investments (those with current prices)
  async getActiveInvestments(userId: string): Promise<Investment[]> {
    // Since currentPrice is now a CurrencyAmount object, we can't filter by > 0 directly
    // We'll get all investments and filter in memory
    const allInvestments = await this.getAllOrdered(userId);
    return allInvestments.filter(investment => 
      investment.currentPrice && investment.currentPrice.amount > 0
    );
  }

  // Get all investments ordered by purchase date
  async getAllOrdered(userId: string): Promise<Investment[]> {
    return this.getAll(userId, [orderBy('purchaseDate', 'desc')]);
  }

  // Calculate portfolio summary
  async getPortfolioSummary(userId: string, primaryCurrency: string = 'USD'): Promise<PortfolioSummary> {
    const investments = await this.getAllOrdered(userId);

    let totalValue = 0;
    let totalCost = 0;
    const typeDistribution: Record<InvestmentType, number> = {
      stocks: 0,
      etf: 0,
      options: 0,
      bonds: 0,
      mutual_funds: 0,
      real_estate: 0,
      crypto: 0,
      other: 0
    };

    // Convert all amounts to primary currency before summing
    for (const investment of investments) {
      const currentPrice = investment.currentPrice || investment.purchasePrice;
      const investmentCurrency = investment.currency || currentPrice.currency;
      
      // Convert current value to primary currency
      const currentValueInOriginalCurrency = currentPrice.amount * investment.quantity;
      let currentValueConverted = currentValueInOriginalCurrency;
      if (investmentCurrency !== primaryCurrency) {
        try {
          const convertedAmount = await currencyService.convertAmount(
            currentValueInOriginalCurrency, 
            investmentCurrency, 
            primaryCurrency
          );
          currentValueConverted = convertedAmount.amount;
        } catch (error) {
          console.warn(`Failed to convert ${investmentCurrency} to ${primaryCurrency}, using original amount:`, error);
          // Fallback: use original amount (not ideal but prevents errors)
        }
      }

      // Convert cost basis to primary currency
      const costBasisInOriginalCurrency = investment.purchasePrice.amount * investment.quantity;
      const purchaseCurrency = investment.purchasePrice.currency;
      let costBasisConverted = costBasisInOriginalCurrency;
      if (purchaseCurrency !== primaryCurrency) {
        try {
          const convertedCost = await currencyService.convertAmount(
            costBasisInOriginalCurrency, 
            purchaseCurrency, 
            primaryCurrency
          );
          costBasisConverted = convertedCost.amount;
        } catch (error) {
          console.warn(`Failed to convert ${purchaseCurrency} to ${primaryCurrency}, using original amount:`, error);
          // Fallback: use original amount (not ideal but prevents errors)
        }
      }

      totalValue += currentValueConverted;
      totalCost += costBasisConverted;
      typeDistribution[investment.type] += currentValueConverted;
    }

    const totalGainLoss = totalValue - totalCost;
    const gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Calculate diversification score (0-100)
    const nonZeroTypes = Object.values(typeDistribution).filter(value => value > 0).length;
    const diversificationScore = Math.min((nonZeroTypes / 8) * 100, 100);

    // Determine risk level based on portfolio composition
    const cryptoPercentage = totalValue > 0 ? (typeDistribution.crypto / totalValue) * 100 : 0;
    const stocksPercentage = totalValue > 0 ? (typeDistribution.stocks / totalValue) * 100 : 0;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (cryptoPercentage > 20 || stocksPercentage > 80) {
      riskLevel = 'high';
    } else if (cryptoPercentage > 5 || stocksPercentage > 50) {
      riskLevel = 'medium';
    }

    // Calculate currency exposure
    const currencyExposure = await currencyService.calculateCurrencyExposure(investments);

    return {
      totalValue: {
        amount: totalValue,
        currency: primaryCurrency
      },
      totalGainLoss: {
        amount: totalGainLoss,
        currency: primaryCurrency
      },
      gainLossPercentage,
      diversificationScore,
      riskLevel,
      currencyExposure
    };
  }

  // Update investment current price
  async updateCurrentPrice(userId: string, id: string, currentPrice: number): Promise<void> {
    // Get the investment to determine its currency
    const investment = await this.getById(userId, id);
    if (!investment) {
      throw new Error('Investment not found');
    }
    
    // Update with a CurrencyAmount object
    await this.update(userId, id, { 
      currentPrice: {
        amount: currentPrice,
        currency: investment.currency
      }
    });
  }

  // Get investments by symbol (for price updates)
  async getBySymbol(userId: string, symbol: string): Promise<Investment[]> {
    return this.getFiltered(userId, [
      { field: 'symbol', operator: '==', value: symbol }
    ]);
  }
}

export const investmentService = new InvestmentService();