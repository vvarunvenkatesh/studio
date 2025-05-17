
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
    <html lang="en" suppressHydrationWarning={true}> {/* Added suppressHydrationWarning here */}
      {/* Apply the font class, suppress hydration warning, add flex structure and padding-bottom */}
      <body
         // Apply pb-16 always for bottom nav height, as md:pb-0 might not trigger correctly for all devices/views
         // Increased to pb-24 on mobile to accommodate both nav bar and sliding tab trigger
         className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen pb-24 md:pb-8`}
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
