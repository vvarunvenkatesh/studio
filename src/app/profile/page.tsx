
'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Edit2, Camera, Loader2, KeyRound, ShieldCheck, X, Fingerprint, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Import Badge component

interface UserData {
  name: string;
  email: string;
  contact: string;
  gender: 'male' | 'female' | 'other' | string;
  aadhaarNumber?: string;
}

export default function ProfileBasicInfoPage() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSavingImage, setIsSavingImage] = React.useState(false);

  const [userData, setUserData] = React.useState<UserData>({
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    contact: '+1 123 456 7890',
    gender: 'other',
    aadhaarNumber: '',
  });

  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUserVerified, setIsUserVerified] = React.useState(false);

  // Editing states
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(userData.name);

  const [editingField, setEditingField] = React.useState<'email' | 'contact' | 'aadhaar' | null>(null);
  const [tempValue, setTempValue] = React.useState(''); // For email, contact, aadhaar
  const [otp, setOtp] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);

  const checkUserVerification = (data: UserData) => {
    const verified = !!(data.email && data.contact && data.aadhaarNumber);
    setIsUserVerified(verified);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem('profileImageUrl');
      setProfileImage(storedImage);
      
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
          try {
            const parsedData: UserData = JSON.parse(storedUserData);
            setUserData(prevData => ({ ...prevData, ...parsedData }));
            setTempName(parsedData.name || userData.name);
            checkUserVerification(parsedData);
          } catch (e) {
            console.error("Failed to parse user data from localStorage", e);
            localStorage.setItem('userData', JSON.stringify(userData));
            setTempName(userData.name);
            checkUserVerification(userData);
          }
      } else {
          localStorage.setItem('userData', JSON.stringify(userData));
          setTempName(userData.name);
          checkUserVerification(userData);
      }
    }
  }, []);

  const saveUserDataToLocalStorage = (updatedData: UserData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(updatedData));
      checkUserVerification(updatedData); // Re-check verification status after saving
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select an image file (JPEG, PNG, GIF, etc.).", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSave = async () => {
    if (!selectedFile || !profileImage) {
      toast({ title: "No Image Selected", description: "Please select an image file first.", variant: "destructive" });
      return;
    }
    setIsSavingImage(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('profileImageUrl', profileImage);
        window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: profileImage, storageArea: localStorage }));
        toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
        setSelectedFile(null); // Clear selected file after save
      }
    } catch (error) {
      console.error("Failed to save profile image:", error);
      toast({ title: "Save Failed", description: "Could not save the profile picture.", variant: "destructive" });
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('profileImageUrl');
      localStorage.removeItem('userData'); // Also clear userData on logout
      window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn', newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'userData', newValue: null, storageArea: localStorage }));
      toast({ title: "Logged Out", description: "You have been successfully logged out.", variant: "success" });
      window.location.href = '/';
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
    toast({ title: "Name Updated", description: "Your name has been saved." });
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempName(userData.name);
  };

  const handleGenderChange = (value: string) => {
    const updatedUserData = { ...userData, gender: value };
    setUserData(updatedUserData);
    saveUserDataToLocalStorage(updatedUserData);
    toast({ title: "Gender Updated", description: "Your gender selection has been updated." });
  };

  const handleEditField = (field: 'email' | 'contact' | 'aadhaar') => {
    setEditingField(field);
    setOtp('');
    setOtpSent(false);
    if (field === 'email') setTempValue(userData.email);
    if (field === 'contact') setTempValue(userData.contact);
    if (field === 'aadhaar') setTempValue(userData.aadhaarNumber || '');
  };

  const handleCancelEditField = () => {
    setEditingField(null);
    setOtp('');
    setOtpSent(false);
  };

  const handleSendOtpForUpdate = async () => {
    if (!editingField) return;

    let valueToVerify = tempValue;
    let originalValue = '';
    let validationRegex: RegExp | null = null;
    let validationMessage = '';

    if (editingField === 'email') {
        originalValue = userData.email;
        validationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        validationMessage = "Please enter a valid email address.";
    } else if (editingField === 'contact') {
        originalValue = userData.contact;
        validationRegex = /^\+?[1-9]\d{1,14}$/; 
        validationMessage = "Please enter a valid phone number.";
    } else if (editingField === 'aadhaar') {
        originalValue = userData.aadhaarNumber || '';
        validationRegex = /^\d{12}$/;
        validationMessage = "Aadhaar number must be 12 digits.";
    }

    if (valueToVerify === originalValue && !(editingField === 'aadhaar' && !userData.aadhaarNumber) ) { 
        toast({title: "No Change", description: `${editingField.charAt(0).toUpperCase() + editingField.slice(1)} is the same as current.`, variant: "default"});
        setEditingField(null);
        return;
    }
    if (validationRegex && !validationRegex.test(valueToVerify)) {
        toast({title: `Invalid ${editingField.charAt(0).toUpperCase() + editingField.slice(1)}`, description: validationMessage, variant: "destructive"});
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
      return;
    }
    setIsVerifyingOtp(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    if (otp === '123456') { 
      const updatedUserData = { ...userData };
      if (editingField === 'email') {
        updatedUserData.email = tempValue;
      } else if (editingField === 'contact') {
        updatedUserData.contact = tempValue;
      } else if (editingField === 'aadhaar') {
        updatedUserData.aadhaarNumber = tempValue;
      }
      setUserData(updatedUserData);
      saveUserDataToLocalStorage(updatedUserData);
      toast({ title: 'Update Successful', description: `${editingField.charAt(0).toUpperCase() + editingField.slice(1)} has been updated.`, variant: 'success' });
      setEditingField(null);
      setOtpSent(false);
      setOtp('');
    } else {
      toast({ title: 'Verification Failed', description: 'Incorrect OTP. Please try again.', variant: 'destructive' });
    }
    setIsVerifyingOtp(false);
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative group">
          <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={profileImage || undefined} alt="User profile picture" data-ai-hint="user avatar" />
            <AvatarFallback>
              <User className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
        </div>
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2">
            <CardTitle className="text-foreground">User Profile</CardTitle>
            {isUserVerified && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </Badge>
            )}
          </div>
          {selectedFile && (
            <Button size="sm" onClick={handleImageSave} disabled={isSavingImage} className="mt-2 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {isSavingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSavingImage ? 'Saving...' : 'Save Picture'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Name Field */}
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
                <Button variant="ghost" onClick={handleCancelEditName} className="gap-2">
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="name" value={userData.name} readOnly className="bg-muted/50 text-foreground flex-grow" />
              <Button variant="outline" size="icon" onClick={handleEditName} aria-label="Edit Name">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Email Field */}
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
                    <Button variant="ghost" onClick={handleCancelEditField} className="gap-2"> <X className="h-4 w-4" /> Cancel</Button>
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
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-foreground"
                    disabled={isVerifyingOtp}
                  />
                   <div className="flex gap-2">
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEditField} disabled={isVerifyingOtp} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="email" type="email" value={userData.email} readOnly className="bg-muted/50 text-foreground flex-grow" />
              <Button variant="outline" size="icon" onClick={() => handleEditField('email')} aria-label="Edit Email">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Contact Field */}
        <div className="space-y-2">
          <Label htmlFor="contact" className="text-foreground">Contact Number</Label>
          {editingField === 'contact' ? (
             <div className="space-y-2">
              <Input
                id="contact"
                type="tel"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="text-foreground"
                disabled={otpSent || isSendingOtp || isVerifyingOtp}
              />
               {!otpSent ? (
                 <div className="flex gap-2">
                    <Button onClick={handleSendOtpForUpdate} disabled={isSendingOtp || tempValue === userData.contact} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEditField} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
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
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-foreground"
                    disabled={isVerifyingOtp}
                  />
                  <div className="flex gap-2">
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEditField} disabled={isVerifyingOtp} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input id="contact" value={userData.contact} readOnly className="bg-muted/50 text-foreground flex-grow" />
              <Button variant="outline" size="icon" onClick={() => handleEditField('contact')} aria-label="Edit Contact">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Aadhaar Field */}
        <div className="space-y-2">
          <Label htmlFor="aadhaar" className="text-foreground">Aadhaar Number</Label>
          {editingField === 'aadhaar' ? (
             <div className="space-y-2">
              <Input
                id="aadhaar"
                type="text"
                placeholder="Enter 12-digit Aadhaar"
                value={tempValue}
                maxLength={12}
                onChange={(e) => setTempValue(e.target.value.replace(/[^0-9]/g, ''))}
                className="text-foreground"
                disabled={otpSent || isSendingOtp || isVerifyingOtp}
              />
               {!otpSent ? (
                 <div className="flex gap-2">
                    <Button onClick={handleSendOtpForUpdate} disabled={isSendingOtp || (tempValue === userData.aadhaarNumber && !!userData.aadhaarNumber)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEditField} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
                 </div>
                ) : (
                <div className="space-y-2">
                  <Label htmlFor="aadhaarOtp" className="text-foreground">Enter OTP for Aadhaar</Label>
                  <Input
                    id="aadhaarOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-foreground"
                    disabled={isVerifyingOtp}
                  />
                  <div className="flex gap-2">
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEditField} disabled={isVerifyingOtp} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                id="aadhaarDisplay"
                value={userData.aadhaarNumber ? `********${userData.aadhaarNumber.slice(-4)}` : 'Not Provided'}
                readOnly
                className="bg-muted/50 text-foreground flex-grow"
              />
              <Button variant="outline" size="icon" onClick={() => handleEditField('aadhaar')} aria-label={userData.aadhaarNumber ? "Edit Aadhaar" : "Add Aadhaar"}>
                 {userData.aadhaarNumber ? <Edit2 className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
              </Button>
            </div>
          )}
           <p className="text-xs text-muted-foreground">
             For verification purposes only. Your Aadhaar number will be masked.
           </p>
        </div>

        {/* Gender Field */}
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
