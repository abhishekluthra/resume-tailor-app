# Changelog

All notable changes to ResuMold will be documented in this file.

## [Latest] - 2025-08-06
### Changed
- **Directory Restructure**: Reorganized codebase to standard Next.js conventions with `src/lib/` for backend utilities. Added comprehensive CLAUDE-frontend.md and CLAUDE-backend.md context files.

## [1.2.0] - 2025-08-02  
### Added
- **Phase 2 Complete**: Implemented tabular results interface with AI-powered insights API. Added comprehensive debugging logs and fixed TypeScript build errors.

### Changed  
- **Default Input Mode**: Changed default from text input to URL scraping for better user experience. Extended cache TTL to 30 days for cost optimization.

## [1.1.0] - 2025-07-16
### Added
- **Phase 1 Complete**: Implemented URL-based job scraping with agentic AI using LangChain and OpenAI. Features include hash-based caching, privacy-compliant storage, and intelligent content extraction.

### Fixed
- **Deployment Compatibility**: Replaced Playwright with Puppeteer for better Vercel compatibility. Resolved TypeScript build errors in scraping API.

## [1.0.1] - 2025-07-11
### Changed
- **Code Organization**: Extracted OpenAI system prompts to separate utils file for better maintainability and reusability.

## [1.0.0] - 2025-06-15
### Added
- **Core Functionality**: Initial resume analysis system with file upload, AI-powered analysis, and structured feedback. Project renamed to ResuMold.

### Changed
- **UI/UX Improvements**: Updated layouts, navigation, and page consistency. Fixed critical bugs in results page display.

## [0.1.0] - 2025-06-14  
### Added
- **Project Genesis**: Initial Next.js application setup with basic structure and dependencies.

---

## Development Phases

### Phase 1 (Complete ✅)
**URL-Based Job Scraping**: Implemented web scraping with LangChain + OpenAI for intelligent job posting extraction.

### Phase 2 (Complete ✅) 
**Enhanced Results Interface**: Added tabular organization with AI insights, mobile responsiveness, and accessibility compliance.

### Phase 3 (Next Priority)
**Multi-Agent System**: Enhanced scraping with specialized agents for different job board formats.

### Phase 4 (Future)
**Microservices Architecture**: Selective migration to GCP Cloud Run for scalable production deployment.

---

*This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format with high-level summaries for easy tracking.*