# Firebase Setup Instructions

This document provides step-by-step instructions for setting up Firebase for the Foresight Financial App.

## Prerequisites

- Node.js and npm installed
- A Google account
- Firebase CLI installed globally: `npm install -g firebase-tools`

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "foresight-financial-app")
4. Choose whether to enable Google Analytics (recommended)
5. Select or create a Google Analytics account if enabled
6. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll update security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 3: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Since we're using Clerk for authentication, you don't need to enable any providers here
5. However, you may want to enable "Anonymous" for testing purposes

## Step 4: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon (`</>`) to add a web app
4. Enter your app name (e.g., "Foresight Web App")
5. Check "Also set up Firebase Hosting" if you plan to use Firebase Hosting
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 5: Update Environment Variables

1. Open your `.env.local` file in the project root
2. Replace the placeholder values with your actual Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

## Step 6: Deploy Firestore Security Rules

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Accept the default `firestore.rules` file
   - Accept the default `firestore.indexes.json` file

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 7: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for any Firebase connection errors
3. Try creating a test user and verify that the Firebase connection is working

## Firestore Database Structure

The application uses the following Firestore structure:

```
/users/{userId}
  - email: string
  - firstName: string
  - lastName: string
  - preferences: object
  - createdAt: timestamp
  - updatedAt: timestamp
  
  /investments/{investmentId}
    - userId: string
    - type: string
    - name: string
    - symbol?: string
    - quantity: number
    - purchasePrice: number
    - currentPrice?: number
    - purchaseDate: timestamp
    - description?: string
    - createdAt: timestamp
    - updatedAt: timestamp
  
  /income/{incomeId}
    - userId: string
    - type: string
    - source: string
    - amount: number
    - frequency: string
    - startDate: timestamp
    - endDate?: timestamp
    - isActive: boolean
    - createdAt: timestamp
    - updatedAt: timestamp
  
  /expenses/{expenseId}
    - userId: string
    - category: string
    - name: string
    - amount: number
    - frequency: string
    - isFixed: boolean
    - startDate: timestamp
    - endDate?: timestamp
    - createdAt: timestamp
    - updatedAt: timestamp
  
  /loans/{loanId}
    - userId: string
    - type: string
    - name: string
    - principal: number
    - currentBalance: number
    - interestRate: number
    - termMonths: number
    - monthlyPayment: number
    - startDate: timestamp
    - nextPaymentDate: timestamp
    - createdAt: timestamp
    - updatedAt: timestamp
  
  /goals/{goalId}
    - userId: string
    - type: string
    - name: string
    - targetAmount: number
    - currentAmount: number
    - targetDate: timestamp
    - monthlyContribution: number
    - priority: string
    - isActive: boolean
    - createdAt: timestamp
    - updatedAt: timestamp
  
  /snapshots/{snapshotId}
    - userId: string
    - date: timestamp
    - netWorth: number
    - totalIncome: number
    - totalExpenses: number
    - totalDebt: number
    - savingsRate: number
    - financialHealthScore: number
    - createdAt: timestamp
    - updatedAt: timestamp
```

## Security Rules

The Firestore security rules ensure that:

1. Users can only access their own data
2. All financial data is properly isolated by user ID
3. Data validation is enforced at the database level
4. Proper authentication is required for all operations

## Troubleshooting

### Common Issues

1. **"Firebase: No Firebase App '[DEFAULT]' has been created"**
   - Make sure your environment variables are properly set
   - Restart your development server after updating `.env.local`

2. **"Missing or insufficient permissions"**
   - Check that your Firestore security rules are deployed
   - Verify that the user is properly authenticated

3. **"Network request failed"**
   - Check your internet connection
   - Verify that your Firebase project is active
   - Check the Firebase project configuration

### Testing Firebase Connection

You can test your Firebase connection by adding this to any component:

```typescript
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Test function
const testFirebaseConnection = async () => {
  try {
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('Firebase connection successful!');
  } catch (error) {
    console.error('Firebase connection failed:', error);
  }
};
```

## Next Steps

After completing the Firebase setup:

1. Test the connection with a simple read/write operation
2. Implement user authentication integration with Clerk
3. Start using the financial data services in your components
4. Set up monitoring and alerts for your Firebase usage

For more detailed Firebase documentation, visit: https://firebase.google.com/docs