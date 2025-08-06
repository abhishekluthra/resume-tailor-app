import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalysisProvider } from '@/context/AnalysisContext';
import { DisclaimerProvider } from '@/context/DisclaimerContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlignMyResume - Optimize Your Resume for Job Applications",
  description: "Upload your resume and job posting to get personalized recommendations and align your resume with your dream job.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DisclaimerProvider>
          <AnalysisProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="flex-grow py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </AnalysisProvider>
        </DisclaimerProvider>
        <Analytics />
      </body>
    </html>
  );
}
