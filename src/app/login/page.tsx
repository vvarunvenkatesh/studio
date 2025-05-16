
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Phone, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = React.useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = React.useState(''); // Unified state for email/phone
  const [otp, setOtp] = React.useState(''); // State for OTP input
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState(false); // New state for OTP error
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isValidIdentifier = () => {
    if (loginMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(identifier);
    } else {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Simple international phone regex
      return phoneRegex.test(identifier);
    }
  };

  const handleSendOtp = async (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e) e.preventDefault();
      if (!isValidIdentifier()) {
         toast({
             title: 'Invalid Input',
             description: `Please enter a valid ${loginMethod}.`,
             variant: 'destructive',
         });
         return;
      }

      setIsSendingOtp(true);
      setOtpError(false); // Reset OTP error on new OTP request
      console.log(`Sending OTP to ${loginMethod}: ${identifier}`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setOtpSent(true);
      toast({
        title: 'OTP Sent (Simulation)',
        description: `An OTP has been sent to your ${loginMethod}. Use '123456' to login.`,
      });
      setIsSendingOtp(false);
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
        toast({
            title: 'Invalid OTP',
            description: 'Please enter a valid 6-digit OTP.',
            variant: 'destructive',
        });
        setOtpError(true); // Set error for invalid OTP format
        return;
    }
    setIsVerifyingOtp(true);
    setOtpError(false); // Reset error before verification attempt

    console.log(`Verifying OTP: ${otp} for ${identifier}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    let loginSuccess = false;
    if (otp === '123456') { // Simulated OTP check
        loginSuccess = true;
    }

    if (loginSuccess) {
      try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('isLoggedIn', 'true');
             window.dispatchEvent(new StorageEvent('storage', {
                key: 'isLoggedIn',
                newValue: 'true',
                storageArea: localStorage,
             }));
          }
      } catch (error) {
         console.error("Failed to set login status in localStorage", error);
      }

      const redirectPath = searchParams.get('redirect');

      toast({
        title: 'Login Successful',
        description: redirectPath ? 'Redirecting you back...' : 'Redirecting you to the homepage...',
      });
      window.location.href = redirectPath || '/';
    } else {
      toast({
        title: 'Login Failed',
        description: 'Incorrect OTP. Please try again.',
        variant: 'destructive',
      });
      setOtpError(true); // Set error for incorrect OTP
      setIsVerifyingOtp(false);
    }
  };

  const handleTabChange = (value: string) => {
    setIdentifier('');
    setOtp('');
    setOtpSent(false);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setOtpError(false); // Reset OTP error on tab change
    setLoginMethod(value as 'email' | 'phone');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-card">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-primary">T</span>
                 </span>
             </Link>
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
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
                    className="bg-background text-foreground"
                  />
                  {!otpSent && (
                      <Button
                          type="button"
                          onClick={handleSendOtp}
                          className="w-auto bg-[#FF2459] text-white hover:bg-[#FF2459]/90"
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

            {otpSent && (
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="text-foreground">Enter OTP</Label>
                    <Button
                        variant="link"
                        type="button"
                        onClick={() => handleSendOtp()} // Resend OTP
                        disabled={isSendingOtp || isVerifyingOtp}
                        className="text-sm text-primary hover:underline p-0 h-auto"
                    >
                        Resend OTP
                    </Button>
                 </div>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError(false); // Clear error on input change
                  }}
                  onFocus={() => setOtpError(false)} // Clear error on focus
                  disabled={isVerifyingOtp || isSendingOtp}
                  className={cn(
                    "bg-background text-foreground",
                    otpError && "border-destructive focus-visible:ring-destructive" // Apply red border if otpError is true
                  )}
                />
              </div>
            )}

            {otpSent && (
                <Button type="submit" className="w-full gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90" disabled={isVerifyingOtp || isSendingOtp || otp.length !== 6}>
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
