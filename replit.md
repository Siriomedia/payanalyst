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
- Subscription/credit system
- Admin panel
- PDF report generation

## Configuration

### Development Server
- Port: 5000 (required for Replit)
- Host: 0.0.0.0
- HMR: Configured for Replit's proxy environment

### Environment Variables
- `GEMINI_API_KEY`: Required for AI analysis features (Google Gemini API key)

### Firebase Configuration
Firebase configuration is included in `src/firebase.ts`. The Firebase client API keys are safe to expose in client-side code as Firebase uses security rules to protect data.

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
- Configured HMR for Replit's proxy environment
- Set up development workflow

## Running the Application
The development server is configured to run automatically on port 5000.
Command: `npm run dev`

## Notes
- The app uses localStorage for caching user data and documents
- Firebase handles authentication and cloud data persistence
- Gemini AI requires an API key to analyze payslips
- The app is designed to work as a PWA with service worker support
