import { BaseFirebaseService } from '../firebase-service';
import { Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ExpenseCategoryItem, ExpenseCategoryType } from '@/types/financial';
// Shape used in user collection to satisfy BaseFirebaseService constraint
type UserCategoryModel = Omit<ExpenseCategoryItem, 'userId' | 'isSystem'> & {
  userId: string;
  isSystem?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export class CategoryService extends BaseFirebaseService<UserCategoryModel> {
  private systemCollection = 'expenseCategoriesSystem';

  constructor() {
    super('expenseCategories');
  }

  async listUserCategories(userId: string, type?: ExpenseCategoryType): Promise<ExpenseCategoryItem[]> {
    const filters: { field: string; operator: any; value: any }[] = [];
    if (type) {
      filters.push({ field: 'type', operator: '==', value: type });
    }
    const items = await this.getFiltered(userId, filters, 'name', 'asc');
    return items.map(i => ({
      id: (i as any).id,
      userId,
      name: (i as any).name,
      emoji: (i as any).emoji,
      type: (i as any).type,
      isSystem: false,
    }));
  }

  async listSystemCategories(type?: ExpenseCategoryType): Promise<ExpenseCategoryItem[]> {
    const colRef = collection(db, this.systemCollection);
    const constraints: any[] = [];
    if (type) constraints.push(where('type', '==', type));
    constraints.push(orderBy('name', 'asc'));
    const snap = await getDocs(query(colRef, ...constraints));
    return snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        userId: null,
        name: data.name,
        emoji: data.emoji,
        type: data.type,
        isSystem: true,
      } as ExpenseCategoryItem;
    });
  }

  async listMerged(userId: string, type?: ExpenseCategoryType): Promise<ExpenseCategoryItem[]> {
    const [system, user] = await Promise.all([
      this.listSystemCategories(type),
      this.listUserCategories(userId, type),
    ]);
    // Merge with user categories appearing first
    const merged = [...user, ...system];
    return merged;
  }
}

export const categoryService = new CategoryService();
