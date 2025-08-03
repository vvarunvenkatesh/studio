
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
import { isUserVerifiedByTicketCount } from '@/services/ticket-marketplace';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth';

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
  const [firebaseUser, setFirebaseUser] = React.useState<import('firebase/auth').User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  
  const [userData, setUserData] = React.useState<UserData>({
    name: '',
    email: '',
    contact: '',
    gender: 'other',
  });

  const [profileImage, setProfileImage] = React.useState<string>(DEFAULT_AVATAR_INFO.url);
  const [profileImageHint, setProfileImageHint] = React.useState<string>(DEFAULT_AVATAR_INFO.hint);
  const [isUserVerified, setIsUserVerified] = React.useState(false);

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState('');

  const [editingField, setEditingField] = React.useState<'email' | 'contact' | null>(null);
  const [tempValue, setTempValue] = React.useState('');
  // This can be adapted for phone verification later
  // const [otp, setOtp] = React.useState('');
  // const [otpSent, setOtpSent] = React.useState(false);
  // const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  // const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  
  const getAvatarInfoForGender = (gender: string): { url: string; hint: string } => {
    return GENDER_AVATARS[gender as keyof typeof GENDER_AVATARS] || DEFAULT_AVATAR_INFO;
  };

  const checkUserVerificationStatus = React.useCallback(async () => {
    if (firebaseUser) {
      const verified = await isUserVerifiedByTicketCount(firebaseUser.uid);
      setIsUserVerified(verified);
      if (verified && typeof window !== 'undefined') {
        localStorage.setItem('hasSeenVerificationPrompt', 'true');
      }
    } else {
      setIsUserVerified(false);
    }
  }, [firebaseUser]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        
        // Load user data from localStorage
        const storedUserData = localStorage.getItem('userData');
        let currentGender = 'other';
        let currentContact = '';

        if (storedUserData) {
            try {
                const parsedData: Partial<UserData> = JSON.parse(storedUserData);
                currentGender = parsedData.gender || 'other';
                currentContact = parsedData.contact || '';
            } catch (e) {
                console.error("Failed to parse user data from localStorage", e);
            }
        }
        
        const initialUserData = {
            name: user.displayName || 'New User',
            email: user.email || '',
            contact: currentContact,
            gender: currentGender,
        };

        setUserData(initialUserData);
        setTempName(initialUserData.name);

        const avatarInfo = getAvatarInfoForGender(initialUserData.gender);
        setProfileImage(avatarInfo.url);
        setProfileImageHint(avatarInfo.hint);

      } else {
        router.replace('/login?redirect=/profile');
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  React.useEffect(() => {
    checkUserVerificationStatus();
  }, [firebaseUser, checkUserVerificationStatus]);

  const saveUserDataToLocalStorage = (updatedData: UserData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(updatedData));
      
      const newAvatarInfo = getAvatarInfoForGender(updatedData.gender);
      if (profileImage !== newAvatarInfo.url) {
        setProfileImage(newAvatarInfo.url);
        setProfileImageHint(newAvatarInfo.hint);
        localStorage.setItem('profileImageUrl', newAvatarInfo.url);
        window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: newAvatarInfo.url, storageArea: localStorage }));
      }
      window.dispatchEvent(new CustomEvent('userDataChanged', { detail: updatedData }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        localStorage.removeItem('profileImageUrl');
        localStorage.removeItem('userData');
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn', newValue: null, storageArea: localStorage }));
      }
      toast({ title: "Logged Out", description: "You have been successfully logged out.", variant: "success" });
      router.push('/');
    } catch (error) {
      toast({ title: "Logout Failed", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setTempName(userData.name);
  };

  const handleSaveName = async () => {
    if (!firebaseUser || tempName.trim() === '') {
        toast({ title: "Invalid Name", description: "Name cannot be empty.", variant: "destructive" });
        return;
    }
    try {
        await updateProfile(firebaseUser, { displayName: tempName });
        const updatedUserData = { ...userData, name: tempName };
        setUserData(updatedUserData);
        saveUserDataToLocalStorage(updatedUserData);
        setIsEditingName(false);
        toast({ title: "Name Updated", description: "Your name has been saved.", variant: "success" });
    } catch (error) {
        toast({ title: "Error", description: "Could not update your name.", variant: "destructive" });
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
  };

  const handleGenderChange = (value: string) => {
    const updatedUserData = { ...userData, gender: value };
    setUserData(updatedUserData);
    saveUserDataToLocalStorage(updatedUserData);
    toast({ title: "Gender Updated", description: "Your selection has been updated.", variant: "success" });
  };
  
  // Phone verification is complex and requires a backend or Firebase Functions.
  // We will keep contact as a simple localStorage value for now.
  const handleEditContact = () => {
    setEditingField('contact');
    setTempValue(userData.contact);
  };

  const handleSaveContact = () => {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(tempValue)) {
        toast({title: `Invalid Contact Number`, description: "Contact number must be exactly 10 digits.", variant: "destructive"});
        return;
      }
      const updatedUserData = { ...userData, contact: tempValue };
      setUserData(updatedUserData);
      saveUserDataToLocalStorage(updatedUserData);
      setEditingField(null);
      toast({ title: "Contact Updated", description: "Your contact number has been saved.", variant: "success" });
  };
  
  const handleCancelEditField = () => {
    setEditingField(null);
  };


  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!firebaseUser) {
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
          <p className="text-sm text-muted-foreground">{userData.email}</p>
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
           <div className="flex items-center gap-2">
              <Input id="email" type="email" value={userData.email} readOnly className="bg-muted/50 text-foreground flex-grow cursor-not-allowed opacity-70" />
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <Button variant="outline" size="icon" disabled aria-label="Edit Email (disabled)">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">Changing email address is not supported in this version.</p>
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
              />
                <div className="flex gap-2">
                    <Button onClick={handleSaveContact} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Save className="h-4 w-4" /> Save Contact
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEditField} className="gap-2 hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" />Cancel</Button>
                </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="contact" value={userData.contact || 'Not set'} readOnly className={cn("bg-muted/50 text-foreground flex-grow cursor-pointer")} onClick={handleEditContact}/>
              {userData.contact && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              <Button variant="outline" size="icon" onClick={handleEditContact} aria-label="Edit Contact">
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
