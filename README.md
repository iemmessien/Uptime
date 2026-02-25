# Uptime Monitoring System

A Next.js application for logging and monitoring the uptime of a power generation system comprising two main grids and twelve generators.

## Features

- **Admin Authentication**: Single admin user login using username and password
- **JWT Authentication**: Secure authentication using passport-jwt
- **PostgreSQL Database**: Powered by Prisma ORM
- **Modern UI**: Built with Shadcn components and Tailwind CSS
- **Custom Theme**: Orange theme matching TPSL branding
- **Base Path**: Application runs at `/uptime` instead of root

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js with JWT strategy
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon or local)
- npm or yarn package manager

## Environment Variables

The following environment variables are configured in `.env`:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Admin Credentials
ADMIN_EMAIL="napoleon@tpslng.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"

# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="30d"

# App Configuration
NODE_ENV="development"
APP_URL="http://localhost:3000"
BASE_URL="http://localhost:3000"
APP_NAME="Uptime"
UPLOAD_DIR="./public/uploads"
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Push database schema**:
   ```bash
   npx prisma db push
   ```

4. **Seed the database** (create admin user):
   ```bash
   npx tsx prisma/seed.ts
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at: `http://localhost:3000/uptime`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
Uptime/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with custom theme
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Root /uptime page
├── components/
│   └── ui/                # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── lib/
│   ├── prisma.ts          # Prisma client instance
│   └── utils.ts           # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── public/
│   ├── images/
│   │   └── tpsl-logo.jpeg # TPSL logo
│   └── uploads/           # File uploads directory
└── .env                   # Environment variables
```

## Database Schema

### Admin Model

```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String   // Hashed with bcryptjs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Default Admin Credentials

After seeding the database, you can log in with:
- **Email**: napoleon@tpslng.com
- **Username**: admin
- **Password**: admin

⚠️ **Important**: Change these credentials in production!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:seed` - Seed the database with admin user

## Prisma Commands

- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma migrate deploy` - Apply migrations in production

## Theme Configuration

The application uses an orange theme matching TPSL branding. The primary color is configured in:
- [tailwind.config.ts](tailwind.config.ts)
- [app/globals.css](app/globals.css)

Primary color: `hsl(24 100% 50%)` - A vibrant orange

## Next Steps

1. ✅ Next.js project initialized with TypeScript
2. ✅ Prisma configured with PostgreSQL
3. ✅ Base path set to `/uptime`
4. ✅ Orange theme configured
5. ✅ Shadcn UI components installed
6. ✅ Root `/uptime` page created
7. ✅ Favicon configured with TPSL logo
8. ✅ Admin user model created
9. ✅ Database seeding script created

### To Implement Later

- Login page with authentication
- Dashboard for monitoring power grids and generators
- Uptime logging functionality
- Real-time status monitoring
- Historical data visualization
- Admin profile management (change email, username, password)

## License

Private - TPSL Internal Use Only

## Support

For support, contact: napoleon@tpslng.com
