// Export all services
export { investmentService, InvestmentService } from './investment-service';
export { incomeService, IncomeService } from './income-service';
export { expenseService, ExpenseService } from './expense-service';
export { loanService, LoanService } from './loan-service';
export { goalService, GoalService } from './goal-service';
export { financialSnapshotService, FinancialSnapshotService } from './financial-snapshot-service';
export { userService, UserService } from './user-service';

// Re-export base service for custom implementations
export { BaseFirebaseService } from '../firebase-service';