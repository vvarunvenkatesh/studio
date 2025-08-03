
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Login Failed',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoggingIn(true);
    setLoginError(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Upon successful login, set flags in localStorage for client-side state management
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        // Use Firebase UID as the unique user identifier
        localStorage.setItem('userId', user.uid);

        // Dispatch storage events to notify other components (like Header)
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn', newValue: 'true', storageArea: localStorage }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userId', newValue: user.uid, storageArea: localStorage }));
      }

      const redirectPath = searchParams.get('redirect');
      toast({
        title: 'Login Successful',
        description: redirectPath ? 'Redirecting you back...' : 'Redirecting to homepage...',
        variant: 'success',
      });
      // Use window.location.href for a full page reload to ensure all states are fresh
      window.location.href = redirectPath || '/';

    } catch (error: any) {
      console.error("Firebase Login Error: ", error);
      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-card">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>inI<span className="text-primary">T</span>
                 </span>
             </Link>
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground flex items-center gap-2"><Mail className="h-4 w-4"/> Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground flex items-center gap-2"><KeyRound className="h-4 w-4"/> Password</Label>
                <Link href="/forgot-password" passHref legacyBehavior>
                    <a className="text-sm text-primary hover:underline">Forgot?</a>
                </Link>
               </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                className="bg-background text-foreground"
              />
            </div>
            <Button type="submit" className="w-full gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90" disabled={isLoggingIn}>
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
        <CardFooter className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            href="/signup"
             className="ml-1 text-primary hover:underline font-medium"
           >
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
