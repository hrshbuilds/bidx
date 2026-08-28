import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export const metadata: Metadata = {
  title: 'BidFlo | AI-Powered Integrated Bid Compliance Verification Platform for GeM',
  description:
    'Embedded compliance verification and tender integrity microservice for Government e-Marketplace procurement officers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
