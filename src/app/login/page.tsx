
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Phone } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = React.useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = React.useState(''); // Unified state for email/phone
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
    let loginSuccess = false;
    if (identifier && password) {
        if (loginMethod === 'email') {
            // Simulate email validation/login
            console.log(`Logging in with email: ${identifier}`);
            loginSuccess = true; // Assume success for simulation
        } else {
            // Simulate phone validation/login
            // Basic phone validation example (adjust as needed)
            const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Simple E.164-ish check
            if (phoneRegex.test(identifier)) {
                console.log(`Logging in with phone: ${identifier}`);
                loginSuccess = true; // Assume success for simulation
            } else {
                toast({
                    title: 'Login Failed',
                    description: 'Please enter a valid phone number.',
                    variant: 'destructive',
                });
                setIsLoggingIn(false);
                return;
            }
        }
    }

    if (loginSuccess) {
      // Set login flag in localStorage on successful login simulation
      try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('isLoggedIn', 'true');
          }
      } catch (error) {
         console.error("Failed to set login status in localStorage", error);
         // Optionally show a different toast or handle the error
      }


      toast({
        title: 'Login Successful',
        description: 'Redirecting you to the homepage...',
      });
      // Redirect to homepage after successful login simulation
      // Use window.location.href to force a full page reload, which helps header update
      window.location.href = '/';
      // router.push('/'); // router.push might not trigger header re-check immediately
    } else if (!identifier || !password) { // Only show this if validation didn't fail above
      toast({
        title: 'Login Failed',
        description: `Please enter both ${loginMethod} and password.`,
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
    // If login failed for other reasons (handled above), isLoggingIn is already false
  };

  // Clear identifier when switching tabs
  const handleTabChange = (value: string) => {
    setIdentifier(''); // Clear input when switching method
    setLoginMethod(value as 'email' | 'phone');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Wallpaper */}
      <Image
        src="https://picsum.photos/1920/1080?random=login"
        alt="Background"
        fill // Use fill directly
        style={{ objectFit: 'cover' }} // Use style for objectFit
        className="-z-10 brightness-50" // Lower brightness to make card stand out
        data-ai-hint="travel landscape journey"
        priority // Load background quickly
      />

      {/* Login Card */}
      <Card className="w-full max-w-sm bg-background/90 backdrop-blur-sm">
        <CardHeader className="text-center">
           {/* CardTitle now contains the brand name and slogan */}
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Consistent LastMiniT styling - Updated text color */}
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                 </span>
             </Link>
             {/* Slogan */}
              {/* Reduced opacity */}
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
           {/* Removed description text */}
           <CardDescription className="mt-2"></CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs for Email/Phone Selection */}
          <Tabs value={loginMethod} onValueChange={handleTabChange} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4"/> Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Phone className="h-4 w-4"/> Phone
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className={cn("space-y-2", loginMethod === 'email' ? 'block' : 'hidden')}>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required={loginMethod === 'email'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoggingIn}
                className="bg-background/80"
              />
            </div>

             {/* Phone Input */}
            <div className={cn("space-y-2", loginMethod === 'phone' ? 'block' : 'hidden')}>
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <Input
                id="phone"
                type="tel" // Use tel type for phone numbers
                placeholder="Enter phone number"
                required={loginMethod === 'phone'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoggingIn}
                className="bg-background/80"
              />
            </div>

            {/* Password Input (Common) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1}
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
        <CardFooter className="text-center text-sm text-foreground">
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
