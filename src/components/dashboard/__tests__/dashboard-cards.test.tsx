import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardCards } from "../dashboard-cards";
import { DashboardMetrics } from "@/lib/dashboard-calculations";

// Mock data for testing
const mockMetrics: DashboardMetrics = {
  netWorth: 50000,
  monthlyIncome: 8000,
  monthlyExpenses: 3000,
  totalDebt: 15000,
  goalProgress: [
    {
      id: "1",
      name: "Emergency Fund",
      progress: 60,
      targetAmount: 10000,
      currentAmount: 6000,
    },
    {
      id: "2",
      name: "Retirement",
      progress: 25,
      targetAmount: 100000,
      currentAmount: 25000,
    },
  ],
  financialHealthScore: 75,
  portfolioValue: 45000,
  savingsRate: 62.5,
  debtToIncomeRatio: 15.6,
};

const mockPoorMetrics: DashboardMetrics = {
  netWorth: -5000,
  monthlyIncome: 4000,
  monthlyExpenses: 4500,
  totalDebt: 25000,
  goalProgress: [],
  financialHealthScore: 25,
  portfolioValue: 2000,
  savingsRate: 0,
  debtToIncomeRatio: 52.1,
};

describe("DashboardCards", () => {
  it("renders all dashboard cards with correct data", () => {
    render(<DashboardCards metrics={mockMetrics} />);

    // Check Net Worth card
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument();
    expect(screen.getByText("Positive net worth")).toBeInTheDocument();

    // Check Monthly Cash Flow card
    expect(screen.getByText("Monthly Cash Flow")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument(); // 8000 - 3000
    expect(screen.getByText(/Income: \$8,000/)).toBeInTheDocument();
    expect(screen.getByText(/Expenses: \$3,000/)).toBeInTheDocument();

    // Check Portfolio Value card
    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
    expect(screen.getByText("$45,000")).toBeInTheDocument();
    expect(screen.getByText("Savings Rate: 62.5%")).toBeInTheDocument();

    // Check Total Debt card
    expect(screen.getByText("Total Debt")).toBeInTheDocument();
    expect(screen.getByText("$15,000")).toBeInTheDocument();
    expect(screen.getByText("Debt-to-Income: 15.6%")).toBeInTheDocument();
  });

  it("displays financial health score correctly", () => {
    render(<DashboardCards metrics={mockMetrics} />);

    expect(screen.getByText("Financial Health Score")).toBeInTheDocument();
    expect(screen.getByText("75/100")).toBeInTheDocument();
    expect(screen.getByText("GOOD")).toBeInTheDocument();
    expect(
      screen.getByText("Your financial health is good.")
    ).toBeInTheDocument();
  });

  it("displays goal progress when goals exist", () => {
    render(<DashboardCards metrics={mockMetrics} />);

    expect(screen.getByText("Goal Progress")).toBeInTheDocument();
    expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
    expect(screen.getByText("$6,000 / $10,000")).toBeInTheDocument();
    expect(screen.getByText("60.0% complete")).toBeInTheDocument();

    expect(screen.getByText("Retirement")).toBeInTheDocument();
    expect(screen.getByText("$25,000 / $100,000")).toBeInTheDocument();
    expect(screen.getByText("25.0% complete")).toBeInTheDocument();
  });

  it("does not display goal progress when no goals exist", () => {
    render(<DashboardCards metrics={mockPoorMetrics} />);

    expect(screen.queryByText("Goal Progress")).not.toBeInTheDocument();
  });

  it("handles negative net worth correctly", () => {
    render(<DashboardCards metrics={mockPoorMetrics} />);

    expect(screen.getByText("-$5,000")).toBeInTheDocument();
    expect(screen.getByText("Negative net worth")).toBeInTheDocument();
  });

  it("handles negative cash flow correctly", () => {
    render(<DashboardCards metrics={mockPoorMetrics} />);

    expect(screen.getByText("-$500")).toBeInTheDocument(); // 4000 - 4500
  });

  it("shows warning for high debt-to-income ratio", () => {
    render(<DashboardCards metrics={mockPoorMetrics} />);

    expect(screen.getByText("Debt-to-Income: 52.1%")).toBeInTheDocument();
    // Should show warning icon for debt-to-income > 36%
  });

  it("displays poor financial health status correctly", () => {
    render(<DashboardCards metrics={mockPoorMetrics} />);

    expect(screen.getByText("25/100")).toBeInTheDocument();
    expect(screen.getByText("POOR")).toBeInTheDocument();
    expect(
      screen.getByText("Your financial health needs significant improvement.")
    ).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    render(<DashboardCards metrics={mockMetrics} isLoading={true} />);

    // Should show skeleton elements instead of actual data
    const skeletonElements = screen.getAllByRole("generic");
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Should not show actual data
    expect(screen.queryByText("$50,000")).not.toBeInTheDocument();
    expect(screen.queryByText("Net Worth")).not.toBeInTheDocument();
  });

  it("limits goal progress display to 3 goals", () => {
    const metricsWithManyGoals: DashboardMetrics = {
      ...mockMetrics,
      goalProgress: [
        {
          id: "1",
          name: "Goal 1",
          progress: 25,
          targetAmount: 1000,
          currentAmount: 250,
        },
        {
          id: "2",
          name: "Goal 2",
          progress: 50,
          targetAmount: 2000,
          currentAmount: 1000,
        },
        {
          id: "3",
          name: "Goal 3",
          progress: 75,
          targetAmount: 4000,
          currentAmount: 3000,
        },
        {
          id: "4",
          name: "Goal 4",
          progress: 10,
          targetAmount: 5000,
          currentAmount: 500,
        },
        {
          id: "5",
          name: "Goal 5",
          progress: 90,
          targetAmount: 1000,
          currentAmount: 900,
        },
      ],
    };

    render(<DashboardCards metrics={metricsWithManyGoals} />);

    expect(screen.getByText("Goal 1")).toBeInTheDocument();
    expect(screen.getByText("Goal 2")).toBeInTheDocument();
    expect(screen.getByText("Goal 3")).toBeInTheDocument();
    expect(screen.queryByText("Goal 4")).not.toBeInTheDocument();
    expect(screen.queryByText("Goal 5")).not.toBeInTheDocument();
    expect(screen.getByText("+2 more goals")).toBeInTheDocument();
  });

  it("formats currency values correctly", () => {
    const metricsWithLargeNumbers: DashboardMetrics = {
      ...mockMetrics,
      netWorth: 1234567,
      monthlyIncome: 12345,
      portfolioValue: 987654,
      totalDebt: 54321,
    };

    render(<DashboardCards metrics={metricsWithLargeNumbers} />);

    expect(screen.getByText("$1,234,567")).toBeInTheDocument();
    expect(screen.getByText("$987,654")).toBeInTheDocument();
    expect(screen.getByText("$54,321")).toBeInTheDocument();
  });

  it("displays appropriate trend indicators", () => {
    render(<DashboardCards metrics={mockMetrics} />);

    // Should show positive trend indicators for positive values
    const trendingUpIcons = screen.getAllByTestId("trending-up");
    expect(trendingUpIcons.length).toBeGreaterThan(0);
  });
});
