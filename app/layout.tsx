import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ClientAuthWrapper } from './ClientAuthWrapper';
import { AppLayout } from './components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Applause - AI-Powered Career Platform | Build Portfolios, Resumes & Land Jobs",
  description: "AI-powered platform to build stunning portfolios, create standout resumes, and land your dream job. Smart job matching, career coaching, and application tracking—all in one place.",
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkFrontendApi = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || 'https://clerk.applausejobs.com';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {publishableKey ? (
          <ClientAuthWrapper publishableKey={publishableKey}>
            <AppLayout>
              {children}
            </AppLayout>
          </ClientAuthWrapper>
        ) : (
          <AppLayout>
            {children}
          </AppLayout>
        )}
      </body>
    </html>
  );
}
