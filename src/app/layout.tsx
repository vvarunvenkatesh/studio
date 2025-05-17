
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from '@/components/bottom-navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LastminIT - Resell Your Tickets',
  description: 'Easily resell your train, bus, event, or movie tickets at the last minute.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen pb-24 md:pb-8`}>
         <div className="flex-grow">
           {children}
         </div>
         <Toaster />
         <BottomNavigation />
      </body>
    </html>
  );
}
