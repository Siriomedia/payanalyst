# GioIA - AI-Powered Payslip Analysis Tool

## Overview
GioIA is an Italian payslip analysis tool that uses Google's Gemini AI to analyze salary documents, track shifts, plan leave, and provide detailed financial insights. The application is a Progressive Web App (PWA) with Firebase authentication and Firestore database integration.

## Project Architecture
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Cloud Firestore
- **AI Integration**: Google Gemini AI
- **Styling**: Tailwind CSS (via CDN) with responsive design (mobile-first)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Responsive Design**: Fully optimized for mobile (320px+), tablet (768px+), and desktop (1024px+)

## Key Features
- Payslip upload and AI-powered analysis
- Historical salary analysis with charts
- Shift planning and tracking
- Leave planner
- **Credit recharge system** with PayPal integration
- **Admin panel** with real-time user management
- PDF report generation

### Credit System
The app uses a credit-based system:
- Credits are purchased in packages (not subscriptions)
- Credits **accumulate** - they add to your existing balance
- Credits never expire
- No automatic renewals
- PayPal payment integration for secure transactions

**Technical Implementation** (Race-Condition Safe):
- **Atomic Operations**: All credit modifications use Firestore's `increment()` function to prevent race conditions
- **Dual-Flag Guard System**: Two ref flags prevent write loops:
  - `isUpdatingFromFirestore`: Prevents save effect when Firestore listener updates state
  - `isAtomicCreditUpdate`: Prevents save effect when atomic increment is used
- **Real-time Sync**: onSnapshot listener ensures instant credit updates across all sessions
- **User Consumption**: `handleCreditConsumption` uses atomic `increment(-cost)` 
- **Admin Operations**: Admin panel uses atomic increments for safe concurrent modifications
- This architecture ensures that user consumption and admin gifts compose correctly even when concurrent

### Admin Panel (Admin Users Only)
Users with `role: 'admin'` in Firebase have access to a comprehensive admin panel with:
- **Real-time user monitoring**: See all registered users with live updates
- **Credit management**: Two modes for safe operations:
  - **🔧 Imposta** (Set): Set absolute credit value (for both adding and removing)
  - **🎁 Regala** (Gift): Atomic increment for adding credits only (race-condition safe)
- **Account deletion**: Remove user accounts (admin accounts are protected)
- **User statistics**: View total users, admin count, and user distribution
- **Full user details**: View email, plan, credits, role, and personal info
- **Infinite credits**: Admin users have unlimited credits (∞) and can use all features without costs
- **Always-visible credit display**: Credits shown in top-right header with 💎 icon

**Admin Credit Operations**:
- Use "Imposta" when you need to set a specific final value (e.g., set to 100 credits)
- Use "Regala" when you want to add credits (e.g., gift +50 credits)
- Both operations are race-condition safe and work correctly even when multiple admins operate simultaneously

To make a user an admin:
1. Go to Firebase Console → Firestore Database
2. Find the user's document in the `users` collection
3. Set the `role` field to `'admin'`

## Configuration

### Development Server
- Port: 5000 (required for Replit)
- Host: 0.0.0.0
- HMR: Configured for Replit's proxy environment

### Environment Variables
- `GEMINI_API_KEY`: Required for AI analysis features (Google Gemini API key)

### Firebase Configuration
Firebase configuration is included in `src/firebase.ts`. The Firebase client API keys are safe to expose in client-side code as Firebase uses security rules to protect data.

**Authentication**: The app uses Firebase Authentication with 3 methods:
- **Google Sign-In**: Quick login with Google account
- **Apple Sign-In**: Login with Apple ID
- **Email/Password**: Traditional email and password authentication with registration

**Important**: To enable Google Sign-In on Replit, you must add the Replit domain to Firebase's authorized domains:
1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project (gioia-e1f29)
3. Navigate to Authentication > Settings > Authorized domains
4. Add your Replit domain (e.g., `*.replit.dev`)

Without this, you'll see an `auth/unauthorized-domain` error when attempting to sign in.

## File Structure
```
/
├── src/
│   ├── components/        # React components
│   │   ├── common/       # Reusable UI components
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── Assistant.tsx
│   │   └── ...
│   ├── services/         # API services
│   │   ├── geminiService.ts
│   │   ├── authService.ts
│   │   └── userCreditsService.ts
│   ├── config/           # Configuration files
│   ├── data/            # Mock data
│   ├── App.tsx          # Main app component
│   ├── index.tsx        # Entry point
│   ├── firebase.ts      # Firebase setup
│   └── types.ts         # TypeScript types
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

## Recent Changes (Nov 18, 2025)
- Imported from GitHub to Replit
- Updated Vite config to use port 5000 for Replit compatibility
- Added `allowedHosts: true` to Vite config for Replit's proxy
- Configured HMR for Replit's proxy environment
- Removed importmap from index.html (Vite handles module resolution)
- Added proper module script tag for React app entry point
- Created index.css for basic styling
- Set up development workflow
- Configured deployment for autoscale with build and preview
- **Implemented comprehensive responsive design** (mobile-first approach):
  - Optimized all major components for mobile (320px+), tablet (768px+), and desktop (1024px+)
  - Updated Layout.tsx: responsive header, compact credit display, adaptive user info
  - Enhanced Dashboard.tsx: responsive title/export button, mobile-friendly tabs, adaptive cards/charts/tables
  - Improved Archive.tsx: responsive list items with stacked layout on mobile
  - Optimized Compare.tsx: horizontally scrollable tables with compact mobile headers
  - Updated AdminPanel.tsx: responsive user table with adaptive columns and mobile-friendly forms
  - Enhanced Subscription.tsx: credit packages responsive grid layout
  - Improved Settings.tsx: responsive forms with mobile-optimized inputs
  - Optimized Upload.tsx: responsive file upload area and buttons
  - Updated LeavePlanner.tsx: responsive headers, mobile-friendly buttons, modal forms with grid-cols-1 sm:grid-cols-2
  - Enhanced ShiftPlanner.tsx: adaptive layout, modal forms with grid-cols-1 sm:grid-cols-2, weekly calendar with overflow-x-auto for horizontal scrolling on mobile
  - Improved Login.tsx: responsive authentication forms
  - PDF components (PdfReport, HistoricalAnalysisPdfReport) retain fixed grids for print/export contexts
  - Updated service worker cache to v32 for new responsive styles
  - **Production-ready**: Architect-verified for devices 320px to 1920px+
- **Transformed subscription system into credit recharge packages**:
  - Credits now accumulate (add to existing balance)
  - Features are examples of what you can do with credits
  - Removed all references to "monthly" and "renewal"
  - Added "Most convenient" badge to Professional package
  - Enhanced PayPal payment confirmation messages
  - Added informative section explaining how credits work
  - Completely recreated Subscription.tsx component for cache clearing
- **Implemented comprehensive Admin Panel**:
  - Real-time user list from Firebase with automatic updates
  - Credit editing functionality for any user
  - User account deletion (with admin protection)
  - User statistics and role management
  - Protected access (admin role required)
  - Admin users have infinite credits (∞)
- **Simplified authentication to Firebase-only**:
  - Removed all alternative authentication methods
  - Removed admin login with email/password
  - Removed hardcoded admin email check
  - Authentication via Firebase: Google Sign-In, Apple Sign-In, Email/Password
  - Admin role managed exclusively through Firebase Firestore
  - Removed `password` field from User type
- **Data validation for payslip analysis** (CRITICAL SECURITY FEATURE):
  - ALL 4 required fields must be present in both user profile and payslip: firstName, lastName, dateOfBirth, placeOfBirth
  - **Gemini AI extraction validation**:
    - Schema enforces dateOfBirth and placeOfBirth as REQUIRED fields
    - Post-response validation blocks analysis if any anagraphic field is missing/empty
    - Clear error message guides user to verify payslip quality if extraction fails
  - **User profile validation**:
    - If user profile is incomplete: shows "PROFILO INCOMPLETO" error, temporary analysis only
  - **Payslip data validation**:
    - If payslip extraction fails: shows "DATI ANAGRAFICI MANCANTI" error before analysis
    - If payslip data incomplete: shows "DATI INCOMPLETI NELLA BUSTA PAGA" error, temporary analysis only
  - **Data matching validation**:
    - If data doesn't match: shows detailed mismatch error, temporary analysis only, NOT saved to archive
    - If data matches: payslip is saved to archive normally
  - **Robust normalization**:
    - Date normalization: supports D/M/YYYY, DD/MM/YYYY, YYYY-MM-DD, with separators: / - .
    - Name/place normalization: case-insensitive, accent-insensitive, apostrophe-normalized, whitespace-normalized
  - **Admin bypass**: Admin users bypass all validation checks
  - **Implementation**: geminiService.ts (schema + validation), App.tsx (comparison logic)

## Credit Management System
- **User Interface**: Credits are always visible in the top-right header with a diamond icon (💎)
- **Real-time synchronization**: Credits update instantly when modified by admin
- **Admin Panel**:
  - **🔧 Imposta** - Set absolute credit value for any user
  - **🎁 Regala** - Add credits to users (gift credits)
  - Real-time updates visible to users immediately
  - Prevents negative credit values

## Running the Application
The development server is configured to run automatically on port 5000.
- Development: `npm run dev` (port 5000)
- Build: `npm run build`
- Preview (production): `npm run preview` (port 5000)

## Deployment Configuration
The app is configured for **Autoscale** deployment on Replit:
- Build command: `npm run build`
- Run command: `npm run preview`
- Port: 5000 (configured in vite.config.ts for both dev and preview modes)

## Notes
- The app uses localStorage for caching user data and documents
- Firebase handles authentication and cloud data persistence
- Gemini AI requires an API key to analyze payslips
- The app is designed to work as a PWA with service worker support
