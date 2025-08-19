# Validation Requirements

## Critical Rule: Always Implement Comprehensive Validation

**NEVER skip or forget validation** - it's a security and data integrity requirement, not optional.

## Required Validation Layers

### 1. Frontend Validation (React Hook Form + Zod)
- **Always use Zod schemas** for form validation
- **Always use zodResolver** with React Hook Form
- **Display validation errors** to users immediately
- **Prevent form submission** with invalid data

```typescript
// REQUIRED pattern for all forms
const form = useForm<FormData>({
  resolver: zodResolver(validationSchema),
  defaultValues: { /* ... */ }
});
```

### 2. API Route Validation (Server-side)
- **Always validate request bodies** using Zod schemas
- **Always validate path parameters** and query parameters
- **Always return proper error responses** (400 for validation errors)
- **Never trust client data** - validate everything server-side

```typescript
// REQUIRED pattern for all API routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSchema.parse(body); // REQUIRED
    // ... rest of logic
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    // ... other error handling
  }
}
```

### 3. Database Validation
- **Always validate before database operations**
- **Use TypeScript types** that match Zod schemas
- **Validate foreign key relationships**
- **Check user permissions** before any operation

### 4. Business Logic Validation
- **Validate business rules** (e.g., end date after start date)
- **Check data consistency** (e.g., current balance ≤ principal)
- **Validate calculated fields** (e.g., percentages between 0-100)
- **Implement cross-field validation** where needed

## Validation Schema Organization

### Schema Structure
```typescript
// Base schema
export const baseSchema = z.object({
  // common fields
});

// Create schema (no id)
export const createSchema = baseSchema.omit({ id: true });

// Update schema (partial + required id)
export const updateSchema = baseSchema.partial().required({ id: true });

// Always export type inference
export type CreateData = z.infer<typeof createSchema>;
export type UpdateData = z.infer<typeof updateSchema>;
```

### Required Validations for Financial Data
- **Amounts**: Must be positive numbers with proper decimal handling
- **Dates**: Must be valid dates with logical relationships
- **Percentages**: Must be between 0-100
- **Enums**: Must be from predefined lists
- **Required fields**: Must not be empty or null
- **String lengths**: Must have reasonable min/max limits
- **Email formats**: Must be valid email addresses
- **User ownership**: Must validate user can access/modify data

## Error Handling Requirements

### Client-side Error Display
- **Show field-level errors** immediately
- **Show form-level errors** for cross-field validation
- **Use consistent error styling** (red text, borders)
- **Provide helpful error messages** (not just "invalid")

### Server-side Error Responses
- **400 Bad Request**: For validation errors
- **401 Unauthorized**: For authentication errors
- **403 Forbidden**: For authorization errors
- **404 Not Found**: For missing resources
- **500 Internal Server Error**: For unexpected errors

### Error Message Standards
- **Be specific**: "Email is required" not "Invalid input"
- **Be helpful**: "Password must be at least 8 characters" 
- **Be consistent**: Use same language patterns
- **Be user-friendly**: Avoid technical jargon

## Security Validation

### Input Sanitization
- **Sanitize all string inputs** to prevent XSS
- **Validate file uploads** (type, size, content)
- **Check for SQL injection** patterns
- **Validate URLs and external references**

### Authorization Validation
- **Always check user authentication** in API routes
- **Validate user owns the resource** being accessed
- **Check user permissions** for the requested operation
- **Validate API rate limits** and usage quotas

## Testing Validation

### Required Test Cases
- **Valid data**: Should pass validation
- **Invalid data**: Should fail with proper errors
- **Edge cases**: Empty strings, null values, extreme numbers
- **Security cases**: Malicious inputs, unauthorized access
- **Business logic**: Cross-field validation, business rules

### Test Pattern
```typescript
describe('Validation', () => {
  it('should accept valid data', () => {
    const result = schema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should reject invalid data', () => {
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should provide helpful error messages', () => {
    try {
      schema.parse(invalidData);
    } catch (error) {
      expect(error.errors[0].message).toContain('helpful message');
    }
  });
});
```

## Checklist for Every Feature

Before considering any feature complete, verify:

- [ ] Frontend form has Zod validation with zodResolver
- [ ] API routes validate all inputs with Zod schemas
- [ ] Database operations validate data integrity
- [ ] Business rules are enforced with validation
- [ ] Error messages are user-friendly and specific
- [ ] Security validations prevent unauthorized access
- [ ] Tests cover valid, invalid, and edge cases
- [ ] TypeScript types match validation schemas
- [ ] Cross-field validation works correctly
- [ ] File uploads are properly validated (if applicable)

## Common Validation Mistakes to Avoid

1. **Trusting client-side validation only** - Always validate server-side
2. **Generic error messages** - Be specific about what's wrong
3. **Missing edge case validation** - Test empty, null, extreme values
4. **Forgetting user authorization** - Always check user can access data
5. **Not validating relationships** - Check foreign keys exist
6. **Inconsistent validation rules** - Keep client/server validation in sync
7. **Poor error UX** - Show errors clearly and helpfully
8. **Missing business rule validation** - Enforce domain-specific rules
9. **Not sanitizing inputs** - Prevent XSS and injection attacks
10. **Skipping validation in tests** - Test both valid and invalid cases

Remember: **Validation is not optional - it's a fundamental requirement for every feature.**