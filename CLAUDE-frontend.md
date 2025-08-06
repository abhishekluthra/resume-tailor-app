# CLAUDE-frontend.md - ResuMold Frontend Context

## Frontend Architecture Overview
ResuMold's frontend is built with Next.js 15.3.3 App Router, React 19, and TypeScript, focusing on resume analysis and job posting optimization.

## Directory Structure

### `/src/app/` - Next.js App Router Pages
- **`page.tsx`** - Home page with file upload and job posting input
- **`layout.tsx`** - Root layout with context providers and navigation
- **`results/page.tsx`** - Analysis results display with tabular interface
- **`globals.css`** - Tailwind CSS global styles and custom CSS
- **`favicon.ico`** - Application favicon

### `/src/components/` - React Components (10 files)

#### **Core UI Components**
- **`UploadForm.tsx`** - File upload & job posting input with URL/text toggle
- **`Header.tsx`** - Navigation header with analysis context integration
- **`Footer.tsx`** - Site footer with branding and links
- **`LoadingModal.tsx`** - Loading feedback with progress tracking (15% → 100%)

#### **Analysis Results Components** 
- **`TabContainer.tsx`** - Reusable tab interface with keyboard navigation (WCAG 2.1 AA)
- **`JobAnalysisTab.tsx`** - Job analysis display + AI insights integration
- **`RecommendationsTab.tsx`** - Card-based recommendations with category grouping
- **`RecommendationCard.tsx`** - Individual recommendation cards with impact indicators
- **`AIInsights.tsx`** - Dynamic AI insights with loading/error states

#### **Modal Components**
- **`DisclaimerModal.tsx`** - Legal disclaimer acceptance modal

### `/src/context/` - React Context State Management
- **`AnalysisContext.tsx`** - Global analysis results state and navigation
- **`DisclaimerContext.tsx`** - Disclaimer acceptance tracking

### `/src/utils/` - Frontend Utilities
- **`colors.ts`** - Tailwind CSS color utilities for scores and impact levels

## Key Frontend Features

### **File Upload System**
- **Drag-and-drop interface** with react-dropzone
- **File validation**: 2MB max, DOCX/TXT only
- **Real-time feedback** with loading states and progress tracking

### **Job Input Methods**
- **Manual Text Input**: Traditional copy/paste job descriptions
- **URL Scraping**: Automatic job posting extraction with caching
- **Toggle Interface**: Seamless switching between input methods

### **Analysis Results Interface**
- **Executive Summary**: Overall analysis with categorized scores
- **Tabular Layout**: Job Analysis + Recommendations tabs
- **AI Insights**: Market context, position analysis, strategic advice
- **Mobile Responsive**: Touch-friendly with 44px+ tap targets

### **Accessibility & UX**
- **WCAG 2.1 AA Compliance**: Full keyboard navigation, screen reader support
- **Loading States**: Progress indicators (cache hits show ~2s, fresh scrapes 10-30s)
- **Error Handling**: Graceful fallbacks for failed API calls
- **Responsive Design**: Mobile-first Tailwind CSS implementation

## State Management

### **AnalysisContext**
```typescript
interface AnalysisContextType {
  analysisResult: AnalysisResponse | null;
  setAnalysisResult: (result: AnalysisResponse | null) => void;
}
```
- **Global analysis state** shared across pages
- **Navigation integration** for results routing
- **Type-safe** with comprehensive TypeScript interfaces

### **DisclaimerContext**
```typescript
interface DisclaimerContextType {
  hasAcceptedDisclaimer: boolean;
  acceptDisclaimer: () => void;
}
```
- **Legal disclaimer tracking** with localStorage persistence
- **Modal control** for first-time users

## Component Patterns

### **Import Conventions**
```typescript
// External packages first
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Context imports
import { useAnalysis } from '@/context/AnalysisContext';

// Component imports
import { TabContainer } from '@/components/TabContainer';

// Type imports
import { AnalysisResult } from '@/types/resume-analysis';

// Utility imports
import { getScoreColor } from '@/utils/colors';
```

### **TypeScript Integration**
- **Strict typing** for all props and state
- **Shared types** from `/src/types/` directory
- **Type guards** for runtime validation (e.g., `isInvalidJobPostingError`)

### **Styling Conventions**
- **Tailwind CSS** utility-first approach
- **Responsive design** with `sm:`, `md:`, `lg:` breakpoints
- **Color utilities** for consistent score/impact indicators
- **Focus states** for accessibility compliance

## Development Workflows

### **Component Development**
1. Create component in `/src/components/`
2. Define TypeScript interfaces
3. Implement with accessibility in mind
4. Add to relevant page/component
5. Test responsive behavior

### **State Management**
1. Assess if state is local or global
2. Use React Context for cross-component state
3. Implement type-safe interfaces
4. Add localStorage for persistence when needed

### **Styling Guidelines**
1. Use Tailwind utility classes
2. Follow mobile-first responsive design
3. Maintain 44px minimum touch targets
4. Ensure color contrast meets WCAG AA standards

## Integration Points

### **Backend API Integration**
- **Analysis API**: `/api/analyze` for resume analysis
- **Scraping API**: `/api/scrape` for URL-based job posting extraction  
- **Insights API**: `/api/insights` for AI-powered market analysis
- **Cache Stats**: `/api/cache/stats` for debugging and monitoring

### **External Dependencies**
- **React Dropzone**: File upload interface
- **Next.js Router**: Navigation and page management
- **Vercel Analytics**: Usage tracking (production)

## Performance Considerations
- **Lazy loading** for non-critical components
- **Optimized images** through Next.js Image component (not currently used)
- **Client-side caching** through React Context
- **Progressive enhancement** with loading states

## Future Frontend Enhancements
- **PDF upload support** (backend dependency ready)
- **Batch processing** for multiple resumes
- **Export functionality** for analysis results
- **User accounts** for analysis history
- **A/B testing** framework integration