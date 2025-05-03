
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation (replace with actual auth logic)
    if (email && password) {
      toast({
        title: 'Login Successful',
        description: 'Redirecting you to the homepage...',
      });
      // Simulate setting login state
      if (typeof window !== 'undefined') {
         localStorage.setItem('isLoggedIn', 'true');
      }
      // Redirect to homepage after successful login simulation
      router.push('/');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Wallpaper */}
      <Image
        src="https://picsum.photos/1920/1080?random=login"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10 brightness-50" // Lower brightness to make card stand out
        data-ai-hint="travel landscape journey"
        priority // Load background quickly
      />

      {/* Login Card */}
      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-sm"> {/* Added slight transparency and blur */}
        <CardHeader className="text-center">
           {/* CardTitle now contains the brand name and slogan */}
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="text-card-foreground whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Reverted Brand Name styling */}
                 <span className="text-3xl font-bold">
                    LastMiniT
                 </span>
             </Link>
             {/* Slogan */}
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                className="bg-background/80" // Slightly transparent input
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password" // Updated link to forgot password page
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1} // Optional: manage focus order
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                className="bg-background/80"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging In...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Don't have an account?{' '}
          <Link
            href="/signup" // Updated link to signup page
             className="ml-1 text-primary hover:underline font-medium"
           >
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

