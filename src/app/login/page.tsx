
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, KeyRound, Phone, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Image from 'next/image';


// Animated Background Component
function AnimatedBackground() {
    const images = [
        { src: 'https://placehold.co/1920/1080.png', alt: 'Sketch art of a speeding train', hint: 'train sketch art' },
        { src: 'https://placehold.co/1920/1080.png', alt: 'Sketch art of a modern bus on a highway', hint: 'bus sketch art' },
        { src: 'https://placehold.co/1920/1080.png', alt: 'Sketch art of a train station', hint: 'train station sketch' },
    ];

    return (
        <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
            {images.map((image, index) => (
                <Image
                    key={index}
                    src={image.src}
                    alt={image.alt}
                    fill
                    style={{ objectFit: 'cover', animationDelay: `${index * 5}s` }}
                    className="absolute inset-0 w-full h-full opacity-0 animate-fade-in-out"
                    data-ai-hint={image.hint}
                    priority={index === 0}
                />
            ))}
            <div className="absolute inset-0 bg-black/60"></div>
        </div>
    );
}

export default function LoginPage() {
  // Email state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Phone state
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set up reCAPTCHA verifier
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      // Ensure the container is in the DOM before creating the verifier
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          }
        });
      }
    }
  }, []);

  const handleSuccessfulLogin = (user: any) => {
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
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      console.error("Firebase Email Login Error: ", error);
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
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation for Indian phone numbers, prepending +91
    if (!/^\d{10}$/.test(phone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const phoneNumber = `+91${phone}`;
      const verifier = window.recaptchaVerifier;
      if (!verifier) {
          throw new Error("reCAPTCHA verifier not initialized.");
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      toast({
        title: 'OTP Sent',
        description: `An OTP has been sent to ${phoneNumber}.`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error("Firebase Phone Auth Error: ", error);
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again. You may need to refresh the page.',
        variant: 'destructive',
      });
      // In case of error, reset reCAPTCHA
      if (window.grecaptcha && window.recaptchaVerifier) {
          window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit OTP.',
        variant: 'destructive',
      });
      return;
    }
    if (!confirmationResult) {
      toast({
        title: 'Verification Error',
        description: 'Please request an OTP first.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const userCredential = await confirmationResult.confirm(otp);
      handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      console.error("Firebase OTP Verify Error: ", error);
      let errorMessage = 'Failed to verify OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
          errorMessage = 'The OTP is incorrect. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
          errorMessage = 'The OTP has expired. Please send a new one.';
      }
      toast({
        title: 'OTP Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4">
      <AnimatedBackground />
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 <span className="text-3xl font-bold text-white">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>inI<span className="text-primary">T</span>
                 </span>
             </Link>
              <span className="text-xs text-white/90 mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/20">
              <TabsTrigger value="email" className="text-white data-[state=active]:bg-card/80 data-[state=active]:text-foreground">
                <Mail className="mr-2 h-4 w-4" /> Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="text-white data-[state=active]:bg-card/80 data-[state=active]:text-foreground">
                <Phone className="mr-2 h-4 w-4" /> Phone
              </TabsTrigger>
            </TabsList>

            {/* Email Login Form */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center gap-2"><Mail className="h-4 w-4"/> Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                    className="bg-background/80 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white flex items-center gap-2"><KeyRound className="h-4 w-4"/> Password</Label>
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
                    className="bg-background/80 text-foreground"
                  />
                </div>
                <Button type="submit" className="w-full gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    'Login with Email'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Phone OTP Login Form */}
            <TabsContent value="phone">
              {!confirmationResult ? (
                // Step 1: Enter Phone Number
                <form onSubmit={handleSendOtp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white flex items-center gap-2"><Phone className="h-4 w-4"/> Phone Number</Label>
                    <div className="flex items-center gap-2">
                        <span className="border rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">+91</span>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="10-digit number"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          disabled={isSendingOtp}
                          className="bg-background/80 text-foreground"
                          maxLength={10}
                        />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90" disabled={isSendingOtp}>
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </form>
              ) : (
                // Step 2: Enter OTP
                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-white flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="6-digit OTP"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      disabled={isVerifyingOtp}
                      className="bg-background/80 text-foreground"
                      maxLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90" disabled={isVerifyingOtp}>
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                   <Button variant="link" size="sm" onClick={() => setConfirmationResult(null)} disabled={isVerifyingOtp} className="w-full text-primary">
                    Use a different phone number
                   </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm text-white/80 pt-4">
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

// Add reCAPTCHA verifier to the window interface for TypeScript
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    grecaptcha?: any;
  }
}

    