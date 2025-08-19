# Technology Stack & Build System

## Core Technologies
- **Framework**: Next.js 15 with App Router and TypeScript
- **Frontend**: React 19 with Tailwind CSS for styling
- **Authentication**: Clerk for user management and authentication
- **Database**: Firebase Firestore
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Theming**: next-themes for dark/light mode support

## External Services
- **AI/LLM**: OpenAI for intelligent financial insights
- **Financial Data**: 
  - FinnHub.io for real-time market data
  - Alpha Vantage for historical financial data
- **Hosting**: Vercel

## Development Tools
- **Testing**: Jest with React Testing Library
- **Linting**: ESLint with Next.js configuration
- **Type Checking**: TypeScript with strict mode enabled
- **Styling**: PostCSS with Tailwind CSS

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Testing
```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Path Aliases
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/types/*` → `./src/types/*`
- `@/app/*` → `./src/app/*`