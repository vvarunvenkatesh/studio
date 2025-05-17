
'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Edit2, Loader2, KeyRound, ShieldCheck, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getSimulatedCurrentUserId, isUserVerifiedByTicketCount } from '@/services/ticket-marketplace'; // Import new verification

interface UserData {
  name: string;
  email: string;
  contact: string;
  gender: 'male' | 'female' | 'other' | string;
}

const GENDER_AVATARS: Record<string, { url: string; hint: string }> = {
  male: { url: 'https://placehold.co/100x100.png', hint: 'male cartoon' },
  female: { url: 'https://placehold.co/100x100.png', hint: 'female cartoon' },
  other: { url: 'https://placehold.co/100x100.png', hint: 'neutral avatar' },
};
const DEFAULT_AVATAR_INFO = GENDER_AVATARS.other;

export default function ProfileBasicInfoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isClientLoggedIn, setIsClientLoggedIn] = React.useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);


  const [userData, setUserData] = React.useState<UserData>({
    name: 'Alex Doe',
    email: '',
    contact: '',
    gender: 'other',
  });

  const [profileImage, setProfileImage] = React.useState<string>(DEFAULT_AVATAR_INFO.url);
  const [profileImageHint, setProfileImageHint] = React.useState<string>(DEFAULT_AVATAR_INFO.hint);
  const [isUserVerified, setIsUserVerified] = React.useState(false);

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(userData.name);

  const [editingField, setEditingField] = React.useState<'email' | 'contact' | null>(null);
  const [tempValue, setTempValue] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState(false);

  const getAvatarInfoForGender = (gender: string): { url: string; hint: string } => {
    return GENDER_AVATARS[gender as keyof typeof GENDER_AVATARS] || DEFAULT_AVATAR_INFO;
  };

  const checkUserVerificationStatus = React.useCallback(() => {
    if (currentUserId && currentUserId !== 'anonymousUser') {
      const verified = isUserVerifiedByTicketCount(currentUserId);
      setIsUserVerified(verified);
      if (verified) {
        localStorage.setItem('hasSeenVerificationPrompt', 'true');
      }
    } else {
      setIsUserVerified(false);
    }
  }, [currentUserId]);


  React.useEffect(() => {
    const updateAuthAndUserData = () => {
      if (typeof window !== 'undefined') {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userIdFromStorage = getSimulatedCurrentUserId(); // Use service
        
        setIsClientLoggedIn(loggedIn);
        setCurrentUserId(userIdFromStorage);
        setIsLoadingAuth(false);

        if (!loggedIn) {
          router.replace('/login?redirect=/profile');
          return;
        }

        const storedUserData = localStorage.getItem('userData');
        let currentGender = 'other';
        let currentName = 'Alex Doe';
        let initialEmail = '';
        let initialContact = '';

        if (storedUserData) {
          try {
            const parsedData: UserData = JSON.parse(storedUserData);
            currentName = parsedData.name || currentName;
            initialEmail = parsedData.email || '';
            initialContact = parsedData.contact || '';
            currentGender = parsedData.gender || 'other';
          } catch (e) {
            console.error("Failed to parse user data from localStorage", e);
          }
        }
        
        setUserData({
          name: currentName,
          email: initialEmail,
          contact: initialContact,
          gender: currentGender,
        });
        setTempName(currentName);

        const avatarInfo = getAvatarInfoForGender(currentGender);
        setProfileImage(avatarInfo.url);
        setProfileImageHint(avatarInfo.hint);
        localStorage.setItem('profileImageUrl', avatarInfo.url);
        window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: avatarInfo.url, storageArea: localStorage }));
      }
    };

    updateAuthAndUserData();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'isLoggedIn' || event.key === 'userId' || event.key === 'userData' || event.key === 'profileImageUrl' || event.key === 'marketplaceTickets') {
        updateAuthAndUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  React.useEffect(() => {
    checkUserVerificationStatus();
  }, [currentUserId, userData, checkUserVerificationStatus]);


  const saveUserDataToLocalStorage = (updatedData: UserData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(updatedData));
      
      if (currentUserId) { // Ensure currentUserId is available
        const isNowVerified = isUserVerifiedByTicketCount(currentUserId);
        setIsUserVerified(isNowVerified); // Update local state
         if (isNowVerified) {
           localStorage.setItem('hasSeenVerificationPrompt', 'true');
         }
      }

      const newAvatarInfo = getAvatarInfoForGender(updatedData.gender);
      if (profileImage !== newAvatarInfo.url) {
        setProfileImage(newAvatarInfo.url);
        setProfileImageHint(newAvatarInfo.hint);
        localStorage.setItem('profileImageUrl', newAvatarInfo.url);
        window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: newAvatarInfo.url, storageArea: localStorage }));
      }
      // Dispatch custom event or rely on storage event for other components like Header
      window.dispatchEvent(new CustomEvent('userDataChanged', { detail: updatedData }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'userData', newValue: JSON.stringify(updatedData), storageArea: localStorage }));
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      localStorage.removeItem('profileImageUrl');
      localStorage.removeItem('userData');
      window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn', newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'userId', newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'userData', newValue: null, storageArea: localStorage }));
      toast({ title: "Logged Out", description: "You have been successfully logged out.", variant: "success" });
      router.push('/');
    }
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setTempName(userData.name);
  };

  const handleSaveName = () => {
    if (tempName.trim() === '') {
        toast({ title: "Invalid Name", description: "Name cannot be empty.", variant: "destructive" });
        return;
    }
    const updatedUserData = { ...userData, name: tempName };
    setUserData(updatedUserData);
    saveUserDataToLocalStorage(updatedUserData);
    setIsEditingName(false);
    toast({ title: "Name Updated", description: "Your name has been saved.", variant: "success" });
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempName(userData.name);
  };

  const handleGenderChange = (value: string) => {
    const updatedUserData = { ...userData, gender: value };
    setUserData(updatedUserData);
    saveUserDataToLocalStorage(updatedUserData); // Save immediately on gender change
    toast({ title: "Gender Updated", description: "Your gender selection has been updated.", variant: "success" });
  };

  const handleEditField = (field: 'email' | 'contact') => {
    setEditingField(field);
    setOtp('');
    setOtpSent(false);
    setOtpError(false);
    if (field === 'email') setTempValue(userData.email);
    if (field === 'contact') setTempValue(userData.contact);
  };

  const handleCancelEditField = () => {
    setEditingField(null);
    setOtp('');
    setOtpSent(false);
    setOtpError(false);
  };

  const handleSendOtpForUpdate = async () => {
    if (!editingField) return;
    setOtpError(false);

    let valueToVerify = tempValue;
    let originalValue = '';

    if (editingField === 'email') {
        originalValue = userData.email;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valueToVerify)) {
            toast({title: `Invalid Email`, description: "Please enter a valid email address (e.g., user@example.com).", variant: "destructive"});
            return;
        }
    } else if (editingField === 'contact') {
        originalValue = userData.contact;
        const phoneRegex = /^\d{10}$/; // Indian phone number format
        if (!phoneRegex.test(valueToVerify)) {
            toast({title: `Invalid Contact Number`, description: "Contact number must be exactly 10 digits.", variant: "destructive"});
            return;
        }
    }

    if (valueToVerify === originalValue && originalValue !== '') {
        toast({title: "No Change", description: `${editingField.charAt(0).toUpperCase() + editingField.slice(1)} is the same as current.`, variant: "default"});
        setEditingField(null);
        return;
    }

    setIsSendingOtp(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOtpSent(true);
    toast({
      title: 'OTP Sent (Simulation)',
      description: `An OTP has been sent for ${editingField} update. Use '123456' to verify.`,
      variant: 'warning',
    });
    setIsSendingOtp(false);
  };

  const handleVerifyOtpForUpdate = async () => {
    if (!editingField || !otp || otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter a valid 6-digit OTP.', variant: 'destructive' });
      setOtpError(true);
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(false);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (otp === '123456') { // Simulated OTP check
      const updatedUserData = { ...userData };
      if (editingField === 'email') {
        updatedUserData.email = tempValue;
      } else if (editingField === 'contact') {
        updatedUserData.contact = tempValue;
      }
      setUserData(updatedUserData);
      saveUserDataToLocalStorage(updatedUserData);
      toast({ title: 'Update Successful', description: `${editingField.charAt(0).toUpperCase() + editingField.slice(1)} has been updated.`, variant: 'success' });
      setEditingField(null);
      setOtpSent(false);
      setOtp('');
    } else {
      toast({ title: 'Verification Failed', description: 'Incorrect OTP. Please try again.', variant: 'destructive' });
      setOtpError(true);
    }
    setIsVerifyingOtp(false);
  };

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isClientLoggedIn) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <Card className="w-full bg-card">
      <CardHeader className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative group">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={profileImage}
              alt={userData.gender ? `${userData.gender} avatar` : "User avatar"}
              data-ai-hint={profileImageHint}
            />
            <AvatarFallback>
              <User className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center sm:text-left">
          <CardTitle className="text-foreground flex items-center text-2xl">
            {userData.name}
            {isUserVerified ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 gap-1.5 ml-2">
                <ShieldCheck className="h-4 w-4" />
                Verified
                </Badge>
            ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300 gap-1.5 ml-2">
                  <AlertCircle className="h-4 w-4" />
                  Pending Verification
                </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Name</Label>
          {isEditingName ? (
            <div className="space-y-2">
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-foreground"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveName} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> Save
                </Button>
                <Button variant="ghost" onClick={handleCancelEditName} className="gap-2 hover:text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="name" value={userData.name} readOnly className="bg-muted/50 text-foreground flex-grow cursor-pointer" onClick={handleEditName} />
              <Button variant="outline" size="icon" onClick={handleEditName} aria-label="Edit Name">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email Address</Label>
          {editingField === 'email' ? (
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="text-foreground"
                disabled={otpSent || isSendingOtp || isVerifyingOtp}
              />
              {!otpSent ? (
                 <div className="flex gap-2">
                    <Button onClick={handleSendOtpForUpdate} disabled={isSendingOtp || tempValue === userData.email} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEditField} className="gap-2 hover:text-destructive hover:bg-destructive/10"> <X className="h-4 w-4" /> Cancel</Button>
                 </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="emailOtp" className="text-foreground">Enter OTP for Email</Label>
                  <Input
                    id="emailOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                        setOtp(e.target.value.replace(/[^0-9]/g, ''));
                        setOtpError(false);
                    }}
                    onFocus={() => setOtpError(false)}
                    className={cn("text-foreground", otpError && "border-destructive focus-visible:ring-destructive")}
                    disabled={isVerifyingOtp}
                  />
                   <div className="flex gap-2">
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEditField} disabled={isVerifyingOtp} className="gap-2 hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" />Cancel</Button>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="email" type="email" value={userData.email || 'Not set'} readOnly className={cn("bg-muted/50 text-foreground flex-grow", userData.email ? "cursor-pointer" : "cursor-not-allowed opacity-70")} onClick={() => handleEditField('email')} />
              {userData.email && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              <Button variant="outline" size="icon" onClick={() => handleEditField('email')} aria-label="Edit Email">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact" className="text-foreground">Contact Number</Label>
          {editingField === 'contact' ? (
             <div className="space-y-2">
              <Input
                id="contact"
                type="tel"
                placeholder="Enter 10-digit number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={10}
                className="text-foreground"
                disabled={otpSent || isSendingOtp || isVerifyingOtp}
              />
               {!otpSent ? (
                 <div className="flex gap-2">
                    <Button onClick={handleSendOtpForUpdate} disabled={isSendingOtp || tempValue === userData.contact} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEditField} className="gap-2 hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" />Cancel</Button>
                 </div>
                ) : (
                <div className="space-y-2">
                  <Label htmlFor="contactOtp" className="text-foreground">Enter OTP for Contact</Label>
                  <Input
                    id="contactOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                        setOtp(e.target.value.replace(/[^0-9]/g, ''));
                        setOtpError(false);
                    }}
                    onFocus={() => setOtpError(false)}
                    className={cn("text-foreground", otpError && "border-destructive focus-visible:ring-destructive")}
                    disabled={isVerifyingOtp}
                  />
                  <div className="flex gap-2">
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEditField} disabled={isVerifyingOtp} className="gap-2 hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" />Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="contact" value={userData.contact || 'Not set'} readOnly className={cn("bg-muted/50 text-foreground flex-grow", userData.contact ? "cursor-pointer" : "cursor-not-allowed opacity-70")} onClick={() => handleEditField('contact')}/>
              {userData.contact && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              <Button variant="outline" size="icon" onClick={() => handleEditField('contact')} aria-label="Edit Contact">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
       
        <div className="space-y-1">
          <Label className="text-foreground">Gender</Label>
          <RadioGroup
            value={userData.gender}
            onValueChange={handleGenderChange}
            className="flex items-center space-x-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="text-foreground font-normal">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="text-foreground font-normal">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="text-foreground font-normal">Other</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6 mt-4">
        <Button variant="destructive" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </CardFooter>
    </Card>
  );
}
