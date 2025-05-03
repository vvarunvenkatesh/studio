
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

export default function SignupPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation (replace with actual auth logic)
    if (password !== confirmPassword) {
      toast({
        title: 'Signup Failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      setIsSigningUp(false);
      return;
    }

    if (name && email && password) {
      toast({
        title: 'Signup Successful',
        description: 'Account created! Redirecting you to login...',
      });
      // Redirect to login page after successful signup simulation
      router.push('/login');
    } else {
      toast({
        title: 'Signup Failed',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      setIsSigningUp(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Wallpaper */}
      <Image
        src="https://picsum.photos/1920/1080?random=signup" // Different random image
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10 brightness-50"
        data-ai-hint="cityscape urban modern"
        priority
      />

      {/* Signup Card */}
      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
           {/* CardTitle now contains the brand name and slogan */}
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="text-card-foreground whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Updated Brand Name with colored letters */}
                 <span className="text-3xl font-bold">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-amber-700">T</span>
                 </span>
             </Link>
              {/* Slogan */}
              <span className="text-xs text-foreground mt-[-4px] opacity-80">Ticket Reselling Platform</span>
          </CardTitle>
          <CardDescription>Create your account to start selling</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSigningUp}
                className="bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSigningUp}
                className="bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSigningUp}
                className="bg-background/80"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSigningUp}
                className="bg-background/80"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isSigningUp}>
              {isSigningUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Already have an account?{' '}
          <Link
            href="/login" // Link back to login page
             className="ml-1 text-primary hover:underline font-medium"
           >
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
