import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserDocument, UserPreferences } from '../../types/financial';

export class UserService {
  private collectionName = 'users';

  // Get user document reference
  private getUserDocRef(userId: string) {
    return doc(db, this.collectionName, userId);
  }

  // Create or update user profile
  async createOrUpdateUser(userId: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
    preferences?: Partial<UserPreferences>;
  }): Promise<void> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      const now = Timestamp.now();
      
      // Check if user already exists
      const existingUser = await getDoc(userDocRef);
      
      const defaultPreferences: UserPreferences = {
        primaryCurrency: 'USD',
        locale: 'en-US',
        riskTolerance: 'moderate',
        notifications: true,
        showOriginalCurrencies: true,
        autoDetectCurrency: false
      };
      
      if (existingUser.exists()) {
        // Update existing user
        await updateDoc(userDocRef, {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          preferences: { ...defaultPreferences, ...userData.preferences },
          updatedAt: now
        });
      } else {
        // Create new user
        const newUser: Omit<UserDocument, 'id'> = {
          userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          preferences: { ...defaultPreferences, ...userData.preferences },
          createdAt: now,
          updatedAt: now
        };
        
        await setDoc(userDocRef, newUser);
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user profile');
    }
  }

  // Get user profile
  async getUser(userId: string): Promise<UserDocument | null> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user profile');
    }
  }

  // Alias for getUser for consistency with other services
  async getById(userId: string): Promise<UserDocument | null> {
    return this.getUser(userId);
  }

  // Update user preferences
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      const existingUser = await getDoc(userDocRef);
      
      if (!existingUser.exists()) {
        // Create user if it doesn't exist
        const defaultPreferences = {
          primaryCurrency: 'USD',
          locale: 'en-US',
          riskTolerance: 'moderate',
          notifications: true,
          showOriginalCurrencies: true,
          autoDetectCurrency: false,
          ...preferences
        };
        
        await setDoc(userDocRef, {
          id: userId,
          firstName: 'User',
          lastName: '',
          email: '',
          preferences: defaultPreferences,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return;
      }
      
      const currentPreferences = existingUser.data().preferences || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      await updateDoc(userDocRef, {
        preferences: updatedPreferences,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  // Update user profile information
  async updateProfile(userId: string, profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<void> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      const existingUser = await getDoc(userDocRef);
      
      if (!existingUser.exists()) {
        throw new Error('User not found');
      }
      
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        // Return default preferences if user doesn't exist
        return {
          primaryCurrency: 'USD',
          locale: 'en-US',
          riskTolerance: 'moderate',
          notifications: true,
          showOriginalCurrencies: true,
          autoDetectCurrency: false
        };
      }
      return user.preferences || {
        primaryCurrency: 'USD',
        locale: 'en-US',
        riskTolerance: 'moderate',
        notifications: true,
        showOriginalCurrencies: true,
        autoDetectCurrency: false
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw new Error('Failed to get user preferences');
    }
  }

  // Check if user exists
  async userExists(userId: string): Promise<boolean> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  // Initialize new user with default data
  async initializeNewUser(userId: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    try {
      // Create user profile
      await this.createOrUpdateUser(userId, userData);
      
      // You could add additional initialization logic here, such as:
      // - Creating default goals
      // - Setting up initial financial categories
      // - Creating welcome notifications
      
    } catch (error) {
      console.error('Error initializing new user:', error);
      throw new Error('Failed to initialize new user');
    }
  }
}

export const userService = new UserService();