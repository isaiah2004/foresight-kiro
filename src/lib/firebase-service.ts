import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

// Base Firebase service class
export abstract class BaseFirebaseService<T extends { id?: string; userId: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get collection reference for a specific user
  protected getUserCollection(userId: string) {
    return collection(db, 'users', userId, this.collectionName);
  }

  // Get document reference
  protected getDocRef(userId: string, docId: string) {
    return doc(db, 'users', userId, this.collectionName, docId);
  }

  // Add timestamps to document data
  protected addTimestamps(data: Partial<T>, isUpdate = false): DocumentData {
    const now = Timestamp.now();
    const result: DocumentData = { ...data };
    
    if (!isUpdate) {
      result.createdAt = now;
    }
    result.updatedAt = now;
    
    // Convert Date objects to Timestamps
    Object.keys(result).forEach(key => {
      if (result[key] instanceof Date) {
        result[key] = Timestamp.fromDate(result[key]);
      }
    });
    
    return result;
  }

  // Convert Firestore document to typed object
  protected convertFromFirestore(doc: DocumentData): T {
    const data = { ...doc };
    
    // Convert Timestamps back to Dates
    Object.keys(data).forEach(key => {
      if (data[key] instanceof Timestamp) {
        data[key] = data[key].toDate();
      }
    });
    
    return data as T;
  }

  // Create a new document
  async create(userId: string, data: Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = this.getUserCollection(userId);
      const docData = this.addTimestamps({ ...data, userId } as T);
      const docRef = await addDoc(collectionRef, docData);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName}`);
    }
  }

  // Get a document by ID
  async getById(userId: string, id: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(userId, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.convertFromFirestore({ id: docSnap.id, ...docSnap.data() });
      }
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error);
      throw new Error(`Failed to get ${this.collectionName}`);
    }
  }

  // Get all documents for a user
  async getAll(userId: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const collectionRef = this.getUserCollection(userId);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.convertFromFirestore({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      throw new Error(`Failed to get ${this.collectionName} list`);
    }
  }

  // Update a document
  async update(userId: string, id: string, data: Partial<Omit<T, 'id' | 'userId'>>): Promise<void> {
    try {
      const docRef = this.getDocRef(userId, id);
      const updateData = this.addTimestamps(data as Partial<T>, true);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName}`);
    }
  }

  // Delete a document
  async delete(userId: string, id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(userId, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName}`);
    }
  }

  // Get documents with filters
  async getFiltered(
    userId: string, 
    filters: { field: string; operator: any; value: any }[],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    limitCount?: number
  ): Promise<T[]> {
    try {
      const collectionRef = this.getUserCollection(userId);
      const constraints: QueryConstraint[] = [];
      
      // Add filters
      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
      
      // Add ordering
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection));
      }
      
      // Add limit
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.convertFromFirestore({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error(`Error getting filtered ${this.collectionName}:`, error);
      throw new Error(`Failed to get filtered ${this.collectionName}`);
    }
  }
}