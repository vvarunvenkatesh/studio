

'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [linkSent, setLinkSent] = React.useState(false);
  const { toast } = useToast();

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast({
            title: 'Missing Email',
            description: 'Please enter your email address.',
            variant: 'destructive',
        });
        return;
    }

    setIsSending(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success
    setLinkSent(true);
    toast({
      title: 'Reset Link Sent',
      description: `If an account exists for ${email}, you will receive a password reset link.`,
    });
    setIsSending(false);

    // Note: In a real application, you would make an API call here
    // to your backend to handle the password reset logic (generate token, send email).
    // Handle potential errors from the API call.
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Wallpaper */}
      <Image
        src="https://picsum.photos/1920/1080?random=forgot" // Different random image
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10 brightness-50"
        data-ai-hint="path road direction"
        priority
      />

      {/* Forgot Password Card */}
      <Card className="w-full max-w-sm bg-background/90 backdrop-blur-sm"> {/* Changed bg-card/90 to bg-background/90 */}
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Consistent LastMiniT styling - Updated text color */}
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                 </span>
             </Link>
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
          <CardDescription className="text-foreground">
            {linkSent ? 'Check your email' : 'Enter your email to reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkSent ? (
            <div className="text-center text-sm text-muted-foreground">
              <p>A password reset link has been sent to your email address (if it exists in our system).</p>
              <p className="mt-2">Please check your inbox and spam folder.</p>
            </div>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                  className="bg-background/80 text-foreground" // Added text-foreground
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-foreground">
          Remembered your password?{' '}
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


