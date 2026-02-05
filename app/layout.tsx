import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ClientAuthWrapper } from './ClientAuthWrapper';
import { AppLayout } from './components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Bianca Starling | Lead Product Manager",
  description: "Lead Product Manager focused on discovery, retention, and AI-powered products. Proven track record in driving measurable outcomes through strategic product thinking.",
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
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
