# ResuMold

ResuMold is a modern web application that helps job seekers optimize their resumes for specific job postings using AI-powered analysis. The application provides personalized recommendations and insights to improve resume effectiveness.

## Features

- 📝 Resume Analysis: Upload your resume in DOCX or TXT format
- 🔍 Job Posting Analysis: Compare your resume against specific job postings
- 🎯 Personalized Recommendations: Get actionable suggestions to improve your resume
- 📊 Detailed Scoring: Receive scores across multiple categories
- 📱 Responsive Design: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: 
  - Next.js 15.3.3
  - React 19
  - TypeScript
  - Tailwind CSS
  - Geist Font

- **Backend**:
  - Next.js API Routes
  - OpenAI GPT-4 API
  - Mammoth.js (for DOCX processing)

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- OpenAI API key

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/resumold.git
   cd resumold
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Upload your resume (DOCX or TXT format, max 2MB)
2. Paste the job posting you're interested in
3. Click "Analyze Resume"
4. Review the detailed analysis and recommendations
5. Use the insights to improve your resume

## Project Structure

```
resumold/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── context/         # React context providers
│   ├── types/           # TypeScript type definitions
│   └── api/             # API routes
├── public/              # Static assets
└── ...config files
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is currently in beta and under active development. Features may change and some functionality may be limited. The tool is designed for educational purposes and should be used as a guide rather than a definitive solution for resume optimization.

## Acknowledgments

- OpenAI for providing the GPT-4 API
- Next.js team for the amazing framework
- All contributors and users of the application
