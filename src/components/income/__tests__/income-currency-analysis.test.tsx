import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeCurrencyAnalysis } from '../income-currency-analysis';
import { useCurrency } from '@/contexts/currency-context';

// Mock the currency context
jest.mock('@/contexts/currency-context');
const mockUseCurrency = useCurrency as jest.MockedFunction<typeof useCurrency>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('IncomeCurrencyAnalysis', () => {
  const mockCurrencyContext = {
    primaryCurrency: 'USD',
    currencies: [],
    isLoading: false,
    convertAmount: jest.fn(),
    formatCurrency: jest.fn((amount: number, currency?: string) => `$${amount.toFixed(2)}`),
    formatCurrencyAmount: jest.fn(),
    refreshCurrency: jest.fn()
  };

  const mockCurrencyExposure = [
    {
      currency: 'USD',
      totalValue: { amount: 5000, currency: 'USD' },
      percentage: 60,
      riskLevel: 'low' as const
    },
    {
      currency: 'GBP',
      totalValue: { amount: 3750, currency: 'USD' },
      percentage: 30,
      riskLevel: 'medium' as const
    },
    {
      currency: 'EUR',
      totalValue: { amount: 1250, currency: 'USD' },
      percentage: 10,
      riskLevel: 'low' as const
    }
  ];

  const mockExchangeRateImpact = {
    totalForeignIncome: { amount: 5000, currency: 'USD' },
    currencyRisks: [
      {
        currency: 'GBP',
        monthlyAmount: {
          amount: 3000,
          currency: 'GBP',
          convertedAmount: 3750,
          exchangeRate: 1.25
        },
        volatility30d: 8.5,
        potentialImpact: {
          best: 4125,
          worst: 3375
        }
      }
    ],
    recommendations: [
      'Consider hedging your GBP income exposure',
      'Monitor exchange rates regularly'
    ]
  };

  const mockTaxImplications = {
    domesticIncome: { amount: 5000, currency: 'USD' },
    foreignIncome: { amount: 5000, currency: 'USD' },
    taxConsiderations: [
      {
        currency: 'GBP',
        monthlyAmount: {
          amount: 3000,
          currency: 'GBP',
          convertedAmount: 3750
        },
        considerations: [
          'Foreign income may be subject to withholding tax',
          'You may be eligible for foreign tax credits'
        ]
      }
    ],
    generalRecommendations: [
      'Consult with a tax professional',
      'Keep detailed records of exchange rates'
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrency.mockReturnValue(mockCurrencyContext);
  });

  it('renders loading state initially', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<IncomeCurrencyAnalysis userId="test-user" />);
    // Loading shows skeleton only, header isn't rendered until data arrives
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders single currency message when no foreign income', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ currency: 'USD', totalValue: { amount: 5000, currency: 'USD' }, percentage: 100, riskLevel: 'low' }])
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ totalForeignIncome: { amount: 0, currency: 'USD' }, currencyRisks: [], recommendations: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domesticIncome: { amount: 5000, currency: 'USD' }, foreignIncome: { amount: 0, currency: 'USD' }, taxConsiderations: [], generalRecommendations: [] })
      } as Response);

    render(<IncomeCurrencyAnalysis userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('All Income in USD')).toBeInTheDocument();
      expect(screen.getByText(/You don't have any foreign currency income sources/)).toBeInTheDocument();
    });
  });

  it('renders multi-currency analysis with tabs', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeRateImpact)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTaxImplications)
      } as Response);

    render(<IncomeCurrencyAnalysis userId="test-user" />);

  // Wait for header and tab triggers to appear after data loads
  expect(await screen.findByText('Currency Analysis')).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'Currency Exposure' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'Exchange Rate Impact' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'Tax Implications' })).toBeInTheDocument();
  });

  it('displays currency exposure correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeRateImpact)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTaxImplications)
      } as Response);

    render(<IncomeCurrencyAnalysis userId="test-user" />);

  // Default tab is exposure; assert content using findBy
  expect(await screen.findByText('Income by Currency')).toBeInTheDocument();
  expect(screen.getByText('USD')).toBeInTheDocument();
  expect(screen.getByText('GBP')).toBeInTheDocument();
  expect(screen.getByText('EUR')).toBeInTheDocument();
  // Risk badges may appear multiple times; use getAllByText
  expect(screen.getAllByText('low risk').length).toBeGreaterThan(0);
  expect(screen.getAllByText('medium risk').length).toBeGreaterThan(0);
  // Percentages
  expect(screen.getByText('60.0% of total')).toBeInTheDocument();
  expect(screen.getByText('30.0% of total')).toBeInTheDocument();
  expect(screen.getByText('10.0% of total')).toBeInTheDocument();
  });

  it('displays exchange rate impact analysis', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeRateImpact)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTaxImplications)
      } as Response);

  render(<IncomeCurrencyAnalysis userId="test-user" />);
  const user = userEvent.setup();
  // Wait for tab trigger then click
  const impactTab = await screen.findByRole('tab', { name: 'Exchange Rate Impact' });
  await user.click(impactTab);
  // Now assert content appears
  expect(await screen.findByText('Total Foreign Income')).toBeInTheDocument();
  expect(screen.getByText('Currency Risk Analysis')).toBeInTheDocument();
  expect(screen.getByText('8.5% volatility')).toBeInTheDocument();
  expect(screen.getByText('Best Case')).toBeInTheDocument();
  expect(screen.getByText('Worst Case')).toBeInTheDocument();
  expect(screen.getByText('Recommendations:')).toBeInTheDocument();
  expect(screen.getByText(/Consider hedging your GBP income exposure/)).toBeInTheDocument();
  });

  it('displays tax implications correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeRateImpact)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTaxImplications)
      } as Response);

  render(<IncomeCurrencyAnalysis userId="test-user" />);
  const user = userEvent.setup();
  const taxTab = await screen.findByRole('tab', { name: 'Tax Implications' });
  await user.click(taxTab);
  expect(await screen.findByText('Domestic Income')).toBeInTheDocument();
  expect(screen.getByText('Foreign Income')).toBeInTheDocument();
  expect(screen.getByText('Tax Considerations by Currency')).toBeInTheDocument();
  expect(screen.getByText('GBP Income')).toBeInTheDocument();
  expect(screen.getByText(/Foreign income may be subject to withholding tax/)).toBeInTheDocument();
  expect(screen.getByText(/You may be eligible for foreign tax credits/)).toBeInTheDocument();
  expect(screen.getByText('General Tax Recommendations:')).toBeInTheDocument();
  expect(screen.getByText(/Consult with a tax professional/)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    render(<IncomeCurrencyAnalysis userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load currency analysis')).toBeInTheDocument();
    });
  });

  it('handles partial API failures', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockRejectedValueOnce(new Error('Impact API failed'))
      .mockRejectedValueOnce(new Error('Tax API failed'));

    render(<IncomeCurrencyAnalysis userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load currency analysis')).toBeInTheDocument();
    });
  });

  it('formats currency amounts correctly', async () => {
    mockCurrencyContext.formatCurrency.mockImplementation((amount, currency) => {
      if (currency === 'GBP') return `£${amount.toFixed(2)}`;
      if (currency === 'EUR') return `€${amount.toFixed(2)}`;
      return `$${amount.toFixed(2)}`;
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeRateImpact)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTaxImplications)
      } as Response);

    render(<IncomeCurrencyAnalysis userId="test-user" />);

    await waitFor(() => {
      expect(mockCurrencyContext.formatCurrency).toHaveBeenCalledWith(5000, 'USD');
      expect(mockCurrencyContext.formatCurrency).toHaveBeenCalledWith(3750, 'USD');
      expect(mockCurrencyContext.formatCurrency).toHaveBeenCalledWith(1250, 'USD');
    });
  });

  it('shows appropriate risk level badges', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrencyExposure)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeRateImpact)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTaxImplications)
      } as Response);

    render(<IncomeCurrencyAnalysis userId="test-user" />);

    await waitFor(() => {
      const riskBadges = screen.getAllByText(/risk$/);
      expect(riskBadges).toHaveLength(3);
      
      // Check that different risk levels have different styling
      const lowRiskBadges = screen.getAllByText('low risk');
      const mediumRiskBadges = screen.getAllByText('medium risk');
      
      expect(lowRiskBadges).toHaveLength(2); // USD and EUR
      expect(mediumRiskBadges).toHaveLength(1); // GBP
    });
  });
});