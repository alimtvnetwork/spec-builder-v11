---
name: Frontend React
description: React/TypeScript frontend standards and best practices
isDefault: false
version: 1
---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20


You are an AI assistant that generates React frontend coding guidelines. These guidelines ensure consistent, maintainable, and performant React applications.

## React Philosophy

- Components should be small and focused
- Prefer composition over inheritance
- Keep state as close to where it's used as possible
- Make side effects explicit and controlled

---

## 🔴 STRICT TYPE-SAFETY RULES

### Absolute Prohibition: `any`, `unknown`, empty interfaces

The use of `any` and `unknown` as value types is **strictly forbidden**. All data must be strongly typed using explicit interfaces, enums, or generics.

```typescript
// ❌ FORBIDDEN
function processData(data: any): void { ... }
const response: unknown = await fetch(...);
const metadata: Record<string, any> = {};
interface Config { settings: any; }

// ✅ CORRECT — explicit types
function processData(data: ProcessInput): void { ... }
const response: ApiResponse = await fetch(...).then(r => r.json());
const metadata: Record<string, string> = {};
interface Config { settings: AppSettings; }

// ✅ CORRECT — generics for reusable containers
function useTypedQuery<T>(key: string): QueryResult<T> { ... }
```

### Replacement Patterns

| Forbidden | Replacement |
|---|---|
| `any` | Concrete interface or generic `<T>` |
| `unknown` | Type guard + explicit type |
| `Record<string, any>` | Typed interface or `Record<string, string>` |
| `as any` type assertion | Proper type narrowing or generic constraint |
| Union of string literals | Proper TypeScript `enum` (see enum guidelines) |

### When Casting is Unavoidable
```typescript
// ✅ Use a typed assertion with a comment explaining WHY
const element = event.target as HTMLInputElement; // DOM event target
```

---

### 🔴 PascalCase for All JSON/API Transport

All JSON keys in API requests, responses, WebSocket messages, and configuration files **MUST** use PascalCase.

```typescript
// ❌ WRONG
{ "user_id": "123", "createdAt": "2026-01-01" }

// ✅ CORRECT
{ "UserId": "123", "CreatedAt": "2026-01-01" }
```

---

## Project Structure

```
src/
├── components/            # Shared UI components
│   ├── ui/               # Base components (Button, Input, etc.)
│   └── common/           # Composed components (Header, Footer)
├── features/             # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── index.ts
│   └── dashboard/
├── hooks/                # Shared custom hooks
├── lib/                  # Utilities and helpers
├── api/                  # API client and types
├── stores/               # Global state (if using)
├── types/                # Shared TypeScript types
├── assets/               # Images, fonts, etc.
└── App.tsx
```

---

## Component Guidelines

### Functional Components Only
```tsx
// Good - Functional component with hooks
export function UserCard({ user, onEdit }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      {/* ... */}
    </div>
  );
}

// Bad - Class components (avoid)
class UserCard extends React.Component { }
```

### Props Interface
```tsx
// Define props interface above component
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  className?: string;
}

// Use destructuring in function signature
export function UserCard({ user, onEdit, className }: UserCardProps) {
  // ...
}
```

### Component Organization
```tsx
export function UserProfile({ userId }: UserProfileProps) {
  // 1. Hooks (in consistent order)
  const { data: user, isLoading } = useUser(userId);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  // 2. Derived state / computations
  const displayName = user?.name ?? 'Unknown';
  const canEdit = user?.permissions.includes('edit');
  
  // 3. Effects
  useEffect(() => {
    // Side effect logic
  }, [userId]);
  
  // 4. Event handlers
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    // ...
  }, [/* dependencies */]);
  
  // 5. Early returns (loading, error states)
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <NotFound />;
  
  // 6. Main render
  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  );
}
```

---

## Naming Conventions

### Files and Folders
```
components/
├── UserCard/
│   ├── UserCard.tsx        # Component
│   ├── UserCard.test.tsx   # Tests
│   ├── UserCard.styles.ts  # Styles (if needed)
│   └── index.ts            # Re-export

# OR flat structure for simple components

**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

├── Button.tsx
├── Button.test.tsx
```

### Variables and Functions
```tsx
// Components: PascalCase
function UserCard() {}

// Hooks: camelCase, start with 'use'
function useUserData() {}

// Event handlers: handle + Event
const handleClick = () => {};
const handleInputChange = () => {};

// Boolean props/state: is/has/should prefix
const isLoading = true;
const hasError = false;
const shouldShowModal = true;

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api';
```

---

## State Management

### Local State (useState)
```tsx
// Simple values
const [count, setCount] = useState(0);
const [name, setName] = useState('');

// Objects - always replace, don't mutate
const [user, setUser] = useState<User | null>(null);
setUser(prevUser => ({ ...prevUser, name: 'New Name' }));

// Complex state - consider useReducer
const [state, dispatch] = useReducer(reducer, initialState);
```

### Server State (React Query)
```tsx
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

// Mutations
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ['user', newUser.id] });
    const previousUser = queryClient.getQueryData(['user', newUser.id]);
    queryClient.setQueryData(['user', newUser.id], newUser);
    return { previousUser };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(['user', newUser.id], context?.previousUser);
  },
});
```

---

## Hooks

### Custom Hook Pattern
```tsx
// hooks/useUser.ts
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUser() {
      try {
        setIsLoading(true);
        const data = await api.getUser(userId);
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    fetchUser();
    
    return () => {
      cancelled = true;
    };
  }, [userId]);
  
  return { user, isLoading, error };
}
```

### Hook Rules
- Only call hooks at the top level
- Only call hooks from React functions
- Dependencies array must be complete
- Use ESLint exhaustive-deps rule

---

## Styling with Tailwind

### Component Styling
```tsx
// Use semantic design tokens
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</button>

// Never use direct colors in components
// Bad:
<div className="bg-blue-500 text-white">

// Good:
<div className="bg-primary text-primary-foreground">
```

### Conditional Classes
```tsx
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-md font-medium',
    'bg-primary text-primary-foreground',
    isDisabled && 'opacity-50 cursor-not-allowed',
    size === 'sm' && 'text-sm px-3 py-1',
    className // Allow overrides
  )}
>
```

### Component Variants with CVA
```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHtmlAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

---

## Testing

### Component Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  };
  
  it('renders user name', () => {
    render(<UserCard user={mockUser} onEdit={vi.fn()} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<UserCard user={mockUser} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(onEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

### Hook Testing
```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from './useUser';

describe('useUser', () => {
  it('returns user data', async () => {
    const { result } = renderHook(() => useUser('1'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.user).toEqual(expectedUser);
  });
});
```

---

## Performance

### Memoization
```tsx
// Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components (sparingly)
const MemoizedList = React.memo(ItemList);
```

### Code Splitting
```tsx
// Lazy load routes
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));

// With Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Image Optimization
```tsx
// Use lazy loading
<img loading="lazy" src={src} alt={alt} />

// Specify dimensions to prevent layout shift
<img width={300} height={200} src={src} alt={alt} />
```

---

## API Integration & Error Resolution

When connecting to backends, ALWAYS follow the Error Resolution verification pattern:

### Mandatory Checks

1. **Endpoint Existence Verification**
   - Verify the endpoint receiving in frontend exactly exists in backend
   - If not found, report or fix immediately — this is a critical error
   - Check router file for route registration

2. **Response Format Verification**
   - Verify the exact JSON structure the backend returns
   - Check if it uses `{success: true, data: {...}}` envelope
   - Don't assume - read the handler code

3. **Detection Logic**
   - Document what conditions trigger "connected" vs "disconnected"
   - Use HTTP status codes (2xx) as primary indicator
   - Don't rely solely on response body fields

4. **Diagnostics**
   - Display both raw env vars and resolved values
   - Show UI origin and API base URL
   - Include request/response in error modals

### Example Pattern

```typescript
// ✅ CORRECT - Use HTTP status as primary indicator
const checkConnection = async () => {
  try {
    const response = await fetch('/api/v1/health');
    if (response.ok) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  } catch (error) {
    setIsConnected(false);
  }
};

// ❌ WRONG - Rely on specific field values
const checkConnection = async () => {
  const data = await fetch('/api/v1/health').then(r => r.json());
  setIsConnected(data.success === true || data.status === "ok");
};
```

### Cross-Reference

See: [Error Resolution Specification](../../../03-error-manage/01-error-resolution/00-overview.md)
