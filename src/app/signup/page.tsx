
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
import { auth } from '@/lib/firebase'; // Import auth instance
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Import Firebase auth functions

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
    if (password !== confirmPassword) {
      toast({
        title: 'Signup Failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    if (!name || !email || !password) {
        toast({
            title: 'Signup Failed',
            description: 'Please fill in all fields.',
            variant: 'destructive',
        });
        return;
    }

    setIsSigningUp(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user's profile with their name
      await updateProfile(user, { displayName: name });

      // Create a basic user data object in localStorage (can be moved to Firestore later)
      const userData = {
        name: name,
        email: email,
        contact: '',
        gender: 'other',
      };
      localStorage.setItem('userData', JSON.stringify(userData));

      toast({
        title: 'Signup Successful',
        description: 'Account created! Please log in.',
        variant: 'success',
      });
      router.push('/login');

    } catch (error: any) {
      console.error("Firebase Signup Error: ", error);
      let errorMessage = 'An unknown error occurred.';
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. It must be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      }
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Wallpaper */}
      <Image
        src="https://picsum.photos/1920/1080?random=signup" // Different random image
        alt="Background"
        fill // Use fill instead of layout="fill"
        style={{ objectFit: 'cover' }} // Use style prop for objectFit
        className="-z-10 brightness-50"
        data-ai-hint="cityscape urban modern"
        priority
      />

      {/* Signup Card - Use default bg-card */}
      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-sm"> {/* Use default bg-card */}
        <CardHeader className="text-center">
           {/* CardTitle now contains the brand name and slogan */}
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Consistent LastMinIT styling - Use text-foreground defined in globals.css */}
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>inI<span className="text-primary">T</span>
                 </span>
             </Link>
              {/* Slogan - Use text-foreground defined in globals.css */}
              <span className="text-xs text-foreground mt-[-4px] opacity-80">Ticket Reselling Platform</span>
          </CardTitle>
          {/* Use default text-foreground */}
          <CardDescription className="text-foreground">Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
              {/* Use default text-foreground */}
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSigningUp}
                 // Use default text-foreground for input text
                className="bg-background/80 text-foreground"
              />
            </div>
            <div className="space-y-2">
              {/* Use default text-foreground */}
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSigningUp}
                 // Use default text-foreground for input text
                className="bg-background/80 text-foreground"
              />
            </div>
            <div className="space-y-2">
              {/* Use default text-foreground */}
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Must be at least 6 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSigningUp}
                 // Use default text-foreground for input text
                className="bg-background/80 text-foreground"
              />
            </div>
             <div className="space-y-2">
              {/* Use default text-foreground */}
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSigningUp}
                 // Use default text-foreground for input text
                className="bg-background/80 text-foreground"
              />
            </div>
            <Button type="submit" className="w-full gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90" disabled={isSigningUp}>
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
         {/* Use default text-muted-foreground */}
        <CardFooter className="text-center text-sm text-muted-foreground">
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
