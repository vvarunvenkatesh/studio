
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font as Geist is not default
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from '@/components/bottom-navigation'; // Import BottomNavigation

// Setup Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable
});


export const metadata: Metadata = {
  title: 'LastminIT - Resell Your Tickets', // Updated title for branding
  description: 'Easily resell your train, bus, event, or movie tickets at the last minute.', // More descriptive
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font class, suppress hydration warning, add flex structure and padding-bottom */}
      <body
         className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen pb-16 md:pb-0`} // Add pb-16 for bottom nav height, remove for md+
         suppressHydrationWarning={true}
       >
         {/* Wrap children in a div that grows to push footer down */}
         <div className="flex-grow">
           {children}
         </div>
         <Toaster />
         <BottomNavigation /> {/* Add BottomNavigation here */}
      </body>
    </html>
  );
}
