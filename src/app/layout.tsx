
'use client';

import * as React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from '@/components/bottom-navigation';
import { ClientOnly } from '@/components/client-only';
import { Preloader } from '@/components/preloader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// This metadata would ideally be in a server component layout, but for simplicity we keep it here.
// export const metadata: Metadata = {
//   title: 'LastminIT - Resell Your Tickets',
//   description: 'Easily resell your train, bus, event, or movie tickets at the last minute.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Show preloader for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <title>LastminIT - Resell Your Tickets</title>
        <meta name="description" content="Easily resell your train, bus, event, or movie tickets at the last minute." />
      </head>
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen pb-24 md:pb-8`}>
         {loading ? (
           <Preloader />
         ) : (
           <>
             <div className="flex-grow">
               {children}
             </div>
             <Toaster />
             <ClientOnly>
               <BottomNavigation />
             </ClientOnly>
           </>
         )}
      </body>
    </html>
  );
}
