
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Phone, KeyRound } from 'lucide-react'; // Import icons, added KeyRound for OTP
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = React.useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = React.useState(''); // Unified state for email/phone
  const [otp, setOtp] = React.useState(''); // State for OTP input
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isValidIdentifier = () => {
    if (loginMethod === 'email') {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(identifier);
    } else {
      // Basic phone regex (simple E.164-ish check)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(identifier);
    }
  };

  const handleSendOtp = async (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e) e.preventDefault(); // Prevent default if called from button click
      if (!isValidIdentifier()) {
         toast({
             title: 'Invalid Input',
             description: `Please enter a valid ${loginMethod}.`,
             variant: 'destructive',
         });
         return;
      }

      setIsSendingOtp(true);
      // Simulate API call to send OTP
      console.log(`Sending OTP to ${loginMethod}: ${identifier}`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `An OTP has been sent to your ${loginMethod}.`,
      });
      setIsSendingOtp(false);
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { // Assuming OTP is 6 digits
        toast({
            title: 'Invalid OTP',
            description: 'Please enter a valid 6-digit OTP.',
            variant: 'destructive',
        });
        return;
    }
    setIsVerifyingOtp(true);

    // Simulate API call for OTP verification
    console.log(`Verifying OTP: ${otp} for ${identifier}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation (replace with actual OTP verification logic)
    let loginSuccess = false;
    if (otp === '123456') { // Simulate correct OTP
        loginSuccess = true;
    }

    if (loginSuccess) {
      // Set login flag in localStorage on successful login simulation
      try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('isLoggedIn', 'true');
             // Trigger storage event for header update
             window.dispatchEvent(new StorageEvent('storage', {
                key: 'isLoggedIn',
                newValue: 'true',
                storageArea: localStorage,
             }));
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
      window.location.href = '/'; // Use window.location.href to force a full page reload
    } else {
      toast({
        title: 'Login Failed',
        description: 'Incorrect OTP. Please try again.',
        variant: 'destructive',
      });
      setIsVerifyingOtp(false);
    }
  };

  // Clear identifier and reset OTP state when switching tabs
  const handleTabChange = (value: string) => {
    setIdentifier(''); // Clear input when switching method
    setOtp('');
    setOtpSent(false);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setLoginMethod(value as 'email' | 'phone');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Wallpaper */}
      <Image
        src="https://picsum.photos/1920/1080?random=login"
        alt="Background"
        fill
        style={{ objectFit: 'cover' }}
        className="-z-10 brightness-50"
        data-ai-hint="travel landscape journey"
        priority
      />

      {/* Login Card - Use default bg-card */}
      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-sm"> {/* Use default bg-card */}
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Use text-foreground defined in globals.css */}
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                 </span>
             </Link>
             {/* Use text-foreground defined in globals.css */}
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
           {/* Removed description */}
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

          <form onSubmit={handleOtpVerification} className="space-y-4">
            {/* Identifier Input (Email or Phone) */}
            <div className="space-y-2">
              {/* Use default text-foreground */}
              <Label htmlFor={loginMethod} className="text-foreground">{loginMethod === 'email' ? 'Email' : 'Phone Number'}</Label>
              <div className="flex gap-2">
                  <Input
                    id={loginMethod}
                    type={loginMethod === 'email' ? 'email' : 'tel'}
                    placeholder={loginMethod === 'email' ? 'm@example.com' : 'Enter phone number'}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isSendingOtp || otpSent || isVerifyingOtp}
                    // Use default text-foreground for input text
                    className="bg-background/80 text-foreground"
                  />
                  {/* Send OTP Button - Show only if OTP not sent yet */}
                  {!otpSent && (
                      <Button
                          type="button"
                          onClick={handleSendOtp}
                          className="w-auto"
                          disabled={isSendingOtp || !isValidIdentifier()}
                      >
                          {isSendingOtp ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Sending...
                            </>
                          ) : (
                            'Send OTP'
                          )}
                      </Button>
                  )}
              </div>
            </div>

            {/* OTP Input - Show only after OTP is sent */}
            {otpSent && (
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                     {/* Use default text-foreground */}
                    <Label htmlFor="otp" className="text-foreground">Enter OTP</Label>
                     {/* Optional: Add a resend OTP link/button */}
                    <Button
                        variant="link"
                        type="button"
                        onClick={() => handleSendOtp()} // Reuse send OTP logic
                        disabled={isSendingOtp || isVerifyingOtp}
                        className="text-sm text-primary hover:underline p-0 h-auto"
                    >
                        Resend OTP
                    </Button>
                 </div>
                <Input
                  id="otp"
                  type="text" // Use text to allow easier input, add pattern later if needed
                  inputMode="numeric" // Hint for numeric keyboard on mobile
                  maxLength={6} // Assuming 6-digit OTP
                  placeholder="Enter 6-digit OTP"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Allow only digits
                  disabled={isVerifyingOtp || isSendingOtp}
                  // Use default text-foreground for input text
                  className="bg-background/80 text-foreground"
                />
              </div>
            )}

            {/* Login/Verify OTP Button - Show only after OTP is sent */}
            {otpSent && (
                <Button type="submit" className="w-full gap-2" disabled={isVerifyingOtp || isSendingOtp || otp.length !== 6}>
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Verify OTP & Login
                    </>
                  )}
                </Button>
            )}
          </form>
        </CardContent>
         {/* Use default text-muted-foreground */}
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
