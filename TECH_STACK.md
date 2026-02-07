# Gulf Premium Telecom - Technology Stack

## Complete Technology Recommendations

## 📋 Summary

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Frontend** | Next.js | 14+ | SSR, API routes, TypeScript support |
| **UI Framework** | React | 18+ | Component-based, large ecosystem |
| **Styling** | Tailwind CSS | 3+ | Utility-first, responsive design |
| **UI Components** | shadcn/ui | Latest | Beautiful, accessible components |
| **State Management** | Zustand | 4+ | Lightweight, simple API |
| **Data Fetching** | React Query | 5+ | Server state management |
| **Backend API** | Node.js + Express | 20+ LTS | Fast, non-blocking I/O |
| **Language** | TypeScript | 5+ | Type safety, better DX |
| **ORM** | Prisma | 5+ | Type-safe database access |
| **Database** | PostgreSQL | 14+ | ACID, JSON support, performance |
| **Caching** | Redis | 7+ | Fast in-memory cache |
| **PBX** | Asterisk | 18-20 | Industry standard, PJSIP |
| **Authentication** | NextAuth.js | 4+ | OAuth, JWT support |
| **Validation** | Zod | 3+ | Runtime type validation |
| **API Docs** | Swagger/OpenAPI | 3.0 | API documentation |
| **Monitoring** | Asternic CC | Latest | Call center stats |

---

## Frontend Stack

### 1. Next.js 14+ (App Router)

**Why:**
- Server-side rendering (SSR) for better SEO and initial load
- API routes for backend endpoints
- File-based routing
- Built-in optimization (images, fonts, scripts)
- TypeScript support out of the box
- Easy deployment to Vercel or self-hosted

**Structure:**
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── allocations/
│   │   ├── destinations/
│   │   ├── customers/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── allocations/
│   │   └── routing/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── forms/
│   ├── tables/
│   └── charts/
├── lib/
│   ├── api.ts        # API client
│   ├── utils.ts
│   └── validations.ts
├── hooks/
├── types/
└── styles/
```

### 2. React 18+

**Features to use:**
- Concurrent rendering
- Automatic batching
- Transitions for smooth UX
- Suspense for data fetching
- Server Components (Next.js 14)

### 3. Tailwind CSS 3+

**Configuration:**
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          50: '#E6F2FF',
          100: '#CCE5FF',
          // ... more shades
        },
        // Add Gulf Premium Telecom brand colors
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### 4. shadcn/ui

**Why:**
- Beautiful, accessible components
- Copy-paste, not a dependency
- Built on Radix UI primitives
- Fully customizable

**Key components needed:**
- Table (for data grids)
- Form (for allocation/destination forms)
- Dialog (for modals)
- Select (for dropdowns)
- DatePicker (for date ranges)
- Chart (for analytics)

### 5. State Management - Zustand

**Example store:**
```typescript
// store/useAllocationStore.ts
import { create } from 'zustand'

interface AllocationStore {
  allocations: Allocation[]
  selectedAllocation: Allocation | null
  isLoading: boolean
  fetchAllocations: () => Promise<void>
  selectAllocation: (id: string) => void
  updateAllocation: (id: string, data: Partial<Allocation>) => Promise<void>
}

export const useAllocationStore = create<AllocationStore>((set, get) => ({
  allocations: [],
  selectedAllocation: null,
  isLoading: false,
  
  fetchAllocations: async () => {
    set({ isLoading: true })
    const data = await api.getAllocations()
    set({ allocations: data, isLoading: false })
  },
  
  selectAllocation: (id: string) => {
    const allocation = get().allocations.find(a => a.id === id)
    set({ selectedAllocation: allocation })
  },
  
  updateAllocation: async (id: string, data: Partial<Allocation>) => {
    await api.updateAllocation(id, data)
    await get().fetchAllocations()
  },
}))
```

### 6. React Query (TanStack Query)

**Example usage:**
```typescript
// hooks/useAllocations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useAllocations() {
  return useQuery({
    queryKey: ['allocations'],
    queryFn: async () => {
      const response = await fetch('/api/allocations')
      return response.json()
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useCreateAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateAllocationDto) => {
      const response = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}
```

---

## Backend Stack

### 1. Node.js 20 LTS + Express

**Server structure:**
```typescript
// backend/src/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/allocations', allocationRoutes)
app.use('/api/destinations', destinationRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/routing', routingRoutes)
app.use('/api/reports', reportRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`)
})
```

### 2. TypeScript 5+

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Prisma ORM

**Schema example:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model AllocationNumber {
  id               String   @id @default(uuid())
  allocatedNumber  String   @unique @map("allocated_number")
  destinationId    String?  @map("destination_id")
  customerId       String?  @map("customer_id")
  status           String   @default("active")
  allocatedAt      DateTime @default(now()) @map("allocated_at")
  expiresAt        DateTime? @map("expires_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  destination      InboundDestination? @relation(fields: [destinationId], references: [id])
  customer         Customer?           @relation(fields: [customerId], references: [id])
  
  @@map("allocation_numbers")
}

model InboundDestination {
  id                String   @id @default(uuid())
  destinationNumber String   @map("destination_number")
  destinationName   String?  @map("destination_name")
  routingType       String   @map("routing_type")
  countryCode       String?  @map("country_code")
  areaCode          String?  @map("area_code")
  trunkId           String?  @map("trunk_id")
  status            String   @default("active")
  maxChannels       Int      @default(10) @map("max_channels")
  currentChannels   Int      @default(0) @map("current_channels")
  metadata          Json?
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  allocations       AllocationNumber[]
  routingRules      RoutingRule[]
  trunk             SipTrunk?          @relation(fields: [trunkId], references: [id])
  
  @@map("inbound_destinations")
}

// ... more models
```

**Usage:**
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create allocation
const allocation = await prisma.allocationNumber.create({
  data: {
    allocatedNumber: '+966501234567',
    destinationId: 'dest-uuid',
    customerId: 'customer-uuid',
    status: 'active',
  },
  include: {
    destination: true,
    customer: true,
  },
})

// Query with filters
const allocations = await prisma.allocationNumber.findMany({
  where: {
    status: 'active',
    customer: {
      companyName: {
        contains: 'Gulf',
      },
    },
  },
  include: {
    destination: {
      include: {
        routingRules: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 50,
})
```

### 4. PostgreSQL 14+

**Connection pooling:**
```typescript
// lib/db.ts
import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### 5. Redis 7+ (Caching)

**Setup:**
```typescript
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

// Cache helper
export async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }
  
  const result = await fn()
  await redis.setex(key, ttl, JSON.stringify(result))
  return result
}

// Usage
const stats = await cached('dashboard:stats', 300, async () => {
  return await getDashboardStats()
})
```

---

## Authentication

### NextAuth.js 4+

**Configuration:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.hashedPassword) {
          return null
        }
        
        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )
        
        if (!isValid) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
})

export { handler as GET, handler as POST }
```

---

## Validation

### Zod

**Example schemas:**
```typescript
// lib/validations/allocation.ts
import { z } from 'zod'

export const createAllocationSchema = z.object({
  allocatedNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  destinationId: z.string().uuid(),
  customerId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
})

export const updateAllocationSchema = z.object({
  destinationId: z.string().uuid().optional(),
  status: z.enum(['active', 'suspended', 'expired']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

export type CreateAllocationDto = z.infer<typeof createAllocationSchema>
export type UpdateAllocationDto = z.infer<typeof updateAllocationSchema>
```

**Usage in API:**
```typescript
app.post('/api/allocations', async (req, res) => {
  try {
    const data = createAllocationSchema.parse(req.body)
    const allocation = await createAllocation(data)
    res.json(allocation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})
```

---

## Development Tools

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    
    "backend:dev": "tsx watch src/server.ts",
    "backend:build": "tsc",
    "backend:start": "node dist/server.js",
    
    "agi:dev": "tsx watch src/agi/server.ts",
    "agi:build": "tsc",
    "agi:start": "node dist/agi/server.js",
    
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## Deployment

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: gulf_premium_telecom
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/gulf_premium_telecom
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  agi:
    build: ./backend
    command: node dist/agi/server.js
    ports:
      - "4573:4573"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/gulf_premium_telecom
    depends_on:
      - postgres
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Summary Justifications

1. **Next.js** - Best React framework for production
2. **TypeScript** - Type safety prevents bugs
3. **Prisma** - Type-safe database access
4. **PostgreSQL** - Best relational DB for telecom data
5. **Redis** - Fast caching for routing lookups
6. **Asterisk PJSIP** - Modern SIP stack
7. **Node.js AGI** - Fast, same language as frontend
8. **React Query** - Best server state management
9. **Zod** - Runtime validation matching TypeScript types
10. **shadcn/ui** - Beautiful, accessible, customizable

This stack provides:
- ✅ Type safety end-to-end
- ✅ Fast development
- ✅ Production-ready performance
- ✅ Easy to scale
- ✅ Great developer experience
