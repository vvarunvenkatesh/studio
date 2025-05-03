
import { Header } from '@/components/header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: This layout assumes client-side navigation for tabs.
  // For full server-side tab state management, a different approach might be needed.
  // Shadcn Tabs component works well with client-side state or URL-based state.

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <Tabs defaultValue="basic-info" className="w-full">
           {/* Using Links inside TabsTrigger for navigation, requires client-side handling or more complex setup */}
           {/* Simple approach: Use Links as triggers, rely on Next.js routing */}
          <TabsList className="mb-6 grid w-full grid-cols-2 md:max-w-[400px]">
             {/* For simplicity, linking directly. Active state won't automatically sync with Tabs component this way */}
             {/* A more robust solution might use usePathname hook in a client component */}
            <TabsTrigger value="basic-info" asChild>
                <Link href="/profile">Basic Info</Link>
            </TabsTrigger>
            <TabsTrigger value="my-orders" asChild>
                 <Link href="/profile/orders">My Orders</Link>
            </TabsTrigger>
          </TabsList>

          {/* Content is rendered based on the route */}
          {children}

        </Tabs>
      </main>
       <footer className="py-4 border-t bg-muted/30 mt-auto">
         <div className="container text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
         </div>
       </footer>
    </div>
  );
}
