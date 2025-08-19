import { orderBy } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { Goal, GoalType, Priority, GoalSummary } from '../../types/financial';

export class GoalService extends BaseFirebaseService<Goal> {
  constructor() {
    super('goals');
  }

  // Get goals by type
  async getByType(userId: string, type: GoalType): Promise<Goal[]> {
    return this.getFiltered(userId, [
      { field: 'type', operator: '==', value: type }
    ], 'targetDate', 'asc');
  }

  // Get active goals
  async getActiveGoals(userId: string): Promise<Goal[]> {
    return this.getFiltered(userId, [
      { field: 'isActive', operator: '==', value: true }
    ], 'targetDate', 'asc');
  }

  // Get goals by priority
  async getByPriority(userId: string, priority: Priority): Promise<Goal[]> {
    return this.getFiltered(userId, [
      { field: 'priority', operator: '==', value: priority },
      { field: 'isActive', operator: '==', value: true }
    ], 'targetDate', 'asc');
  }

  // Get all goals ordered by target date
  async getAllOrdered(userId: string): Promise<Goal[]> {
    return this.getAll(userId, [orderBy('targetDate', 'asc')]);
  }

  // Calculate goal progress percentage
  calculateProgress(goal: Goal): number {
    if (goal.targetAmount.amount <= 0) return 0;
    return Math.min((goal.currentAmount.amount / goal.targetAmount.amount) * 100, 100);
  }

  // Calculate months remaining to target date
  calculateMonthsRemaining(goal: Goal): number {
    const now = new Date();
    const targetDate = goal.targetDate.toDate();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return Math.max(0, diffMonths);
  }

  // Calculate required monthly contribution to meet goal
  calculateRequiredMonthlyContribution(goal: Goal): number {
    const remainingAmount = goal.targetAmount.amount - goal.currentAmount.amount;
    const monthsRemaining = this.calculateMonthsRemaining(goal);
    
    if (monthsRemaining <= 0 || remainingAmount <= 0) return 0;
    return remainingAmount / monthsRemaining;
  }

  // Check if goal is on track
  isGoalOnTrack(goal: Goal): boolean {
    const requiredContribution = this.calculateRequiredMonthlyContribution(goal);
    return goal.monthlyContribution.amount >= requiredContribution;
  }

  // Get goal summary for dashboard
  async getGoalSummaries(userId: string): Promise<GoalSummary[]> {
    const activeGoals = await this.getActiveGoals(userId);
    
    return activeGoals.map(goal => ({
      id: goal.id!,
      name: goal.name,
      progress: this.calculateProgress(goal),
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount
    }));
  }

  // Get goals at risk (not on track or approaching deadline)
  async getGoalsAtRisk(userId: string): Promise<Goal[]> {
    const activeGoals = await this.getActiveGoals(userId);
    
    return activeGoals.filter(goal => {
      const monthsRemaining = this.calculateMonthsRemaining(goal);
      const isOnTrack = this.isGoalOnTrack(goal);
      const progress = this.calculateProgress(goal);
      
      // Goal is at risk if:
      // 1. Not on track with current contributions
      // 2. Less than 6 months remaining and less than 75% complete
      // 3. Less than 3 months remaining and less than 90% complete
      return !isOnTrack || 
             (monthsRemaining <= 6 && progress < 75) ||
             (monthsRemaining <= 3 && progress < 90);
    });
  }

  // Get completed goals
  async getCompletedGoals(userId: string): Promise<Goal[]> {
    const allGoals = await this.getAllOrdered(userId);
    return allGoals.filter(goal => goal.currentAmount >= goal.targetAmount);
  }

  // Update goal progress (add to current amount)
  async addToGoal(userId: string, goalId: string, amount: number): Promise<void> {
    const goal = await this.getById(userId, goalId);
    if (!goal) throw new Error('Goal not found');
    
    const newCurrentAmount = {
      amount: goal.currentAmount.amount + amount,
      currency: goal.currentAmount.currency
    };
    await this.update(userId, goalId, { currentAmount: newCurrentAmount });
  }

  // Update monthly contribution
  async updateMonthlyContribution(userId: string, goalId: string, monthlyContribution: number): Promise<void> {
    const goal = await this.getById(userId, goalId);
    if (!goal) throw new Error('Goal not found');
    
    await this.update(userId, goalId, { 
      monthlyContribution: {
        amount: monthlyContribution,
        currency: goal.monthlyContribution.currency
      }
    });
  }

  // Deactivate goal
  async deactivateGoal(userId: string, goalId: string): Promise<void> {
    await this.update(userId, goalId, { isActive: false });
  }

  // Reactivate goal
  async reactivateGoal(userId: string, goalId: string): Promise<void> {
    await this.update(userId, goalId, { isActive: true });
  }

  // Get goal projections (when will goal be completed at current contribution rate)
  async getGoalProjections(userId: string): Promise<{
    goalId: string;
    name: string;
    projectedCompletionDate: Date;
    monthsToCompletion: number;
    isOnTrack: boolean;
  }[]> {
    const activeGoals = await this.getActiveGoals(userId);
    
    return activeGoals.map(goal => {
      const remainingAmount = goal.targetAmount.amount - goal.currentAmount.amount;
      const monthsToCompletion = goal.monthlyContribution.amount > 0 
        ? Math.ceil(remainingAmount / goal.monthlyContribution.amount)
        : Infinity;
      
      const projectedCompletionDate = new Date();
      if (monthsToCompletion !== Infinity) {
        projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + monthsToCompletion);
      }
      
      const isOnTrack = this.isGoalOnTrack(goal);
      
      return {
        goalId: goal.id!,
        name: goal.name,
        projectedCompletionDate,
        monthsToCompletion: monthsToCompletion === Infinity ? -1 : monthsToCompletion,
        isOnTrack
      };
    });
  }

  // Calculate total monthly goal contributions
  async getTotalMonthlyContributions(userId: string): Promise<number> {
    const activeGoals = await this.getActiveGoals(userId);
    return activeGoals.reduce((total, goal) => total + goal.monthlyContribution.amount, 0);
  }
}

export const goalService = new GoalService();