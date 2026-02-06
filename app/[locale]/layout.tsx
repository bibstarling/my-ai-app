import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "../globals.css";
import { ClientAuthWrapper } from '../ClientAuthWrapper';
import { AppLayout } from '../components/AppLayout';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Await params in Next.js 16+
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
