# GioIA - AI-Powered Payslip Analysis Tool

## Overview
GioIA is an Italian payslip analysis tool that uses Google's Gemini AI to analyze salary documents, track shifts, plan leave, and provide detailed financial insights. The application is a Progressive Web App (PWA) with Firebase authentication and Firestore database integration.

## Project Architecture
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Cloud Firestore
- **AI Integration**: Google Gemini AI
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas

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

### Admin Panel (Admin Users Only)
Users with `role: 'admin'` in Firebase have access to a comprehensive admin panel with:
- **Real-time user monitoring**: See all registered users with live updates
- **Credit management**: Modify any user's credit balance in real-time
- **Account deletion**: Remove user accounts (admin accounts are protected)
- **User statistics**: View total users, admin count, and user distribution
- **Full user details**: View email, plan, credits, role, and personal info
- **Infinite credits**: Admin users have unlimited credits and can use all features without costs

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

## Running the Application
The development server is configured to run automatically on port 5000.
Command: `npm run dev`

## Notes
- The app uses localStorage for caching user data and documents
- Firebase handles authentication and cloud data persistence
- Gemini AI requires an API key to analyze payslips
- The app is designed to work as a PWA with service worker support
