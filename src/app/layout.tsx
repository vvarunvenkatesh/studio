
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font as Geist is not default
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

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
      {/* Apply the font class to the body */}
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use font-sans utility */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
