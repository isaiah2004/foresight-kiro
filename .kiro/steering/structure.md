# Project Structure & Organization

## Root Directory Structure
```
├── .context/           # Project documentation and context
├── .kiro/             # Kiro AI assistant configuration
├── src/               # Source code
├── public/            # Static assets
├── .env.local         # Environment variables
└── package.json       # Dependencies and scripts
```

## Source Code Organization (`src/`)

### App Router Structure (`src/app/`)
- **Next.js 15 App Router** with file-based routing
- **Layout files**: `layout.tsx` for shared layouts
- **Page files**: `page.tsx` for route components
- **Route groups**: Organized by feature (dashboard, profile, auth)

### Components (`src/components/`)
```
├── ui/                # Reusable UI components (shadcn/ui)
├── auth/              # Authentication-related components
├── dashboard/         # Dashboard-specific components
├── __tests__/         # Component tests
├── app-sidebar.tsx    # Main application sidebar
├── nav-*.tsx          # Navigation components
├── theme-*.tsx        # Theme-related components
```

### Library Code (`src/lib/`)
```
├── services/          # External service integrations
├── __tests__/         # Library function tests
├── firebase*.ts       # Firebase configuration and services
├── utils.ts           # Utility functions
├── validations.ts     # Zod schemas and validation
├── dashboard-calculations.ts # Financial calculations
└── clerk-theme.ts     # Clerk theming configuration
```

### Types (`src/types/`)
- **financial.ts**: Financial data type definitions
- **index.ts**: General type exports

### Hooks (`src/hooks/`)
- Custom React hooks for shared logic
- **use-mobile.ts**: Mobile detection hook

## Naming Conventions
- **Files**: kebab-case (e.g., `nav-user.tsx`, `theme-toggle.tsx`)
- **Components**: PascalCase (e.g., `NavUser`, `ThemeToggle`)
- **Functions**: camelCase (e.g., `calculateNetWorth`, `formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

## Testing Structure
- **Component tests**: `src/components/__tests__/`
- **Library tests**: `src/lib/__tests__/`
- **Test files**: `*.test.tsx` or `*.test.ts`
- **Setup**: `jest.setup.js` and `src/setupTests.ts`

## Configuration Files
- **TypeScript**: `tsconfig.json` with path aliases
- **Tailwind**: `tailwind.config.js` for styling
- **Next.js**: `next.config.js` with typed routes
- **Jest**: `jest.config.js` for testing setup