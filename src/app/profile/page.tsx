
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Edit2, Camera, Loader2, KeyRound, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProfileBasicInfoPage() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSavingImage, setIsSavingImage] = React.useState(false);

  const [userData, setUserData] = React.useState({
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    contact: '+1 123 456 7890',
    gender: 'other',
  });

  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Editing states
  const [editingField, setEditingField] = React.useState<'email' | 'contact' | null>(null);
  const [tempEmail, setTempEmail] = React.useState(userData.email);
  const [tempContact, setTempContact] = React.useState(userData.contact);
  const [otp, setOtp] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);


  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem('profileImageUrl');
      setProfileImage(storedImage);
      // In a real app, fetch user data from backend
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setTempEmail(parsedData.email);
          setTempContact(parsedData.contact);
      } else {
          // Save initial userData if not present
          localStorage.setItem('userData', JSON.stringify(userData));
      }
    }
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('profileImageUrl', profileImage);
        window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: profileImage, storageArea: localStorage }));
        toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
        setSelectedFile(null);
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
      localStorage.removeItem('userData'); // Clear user data on logout
      window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn', newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: null, storageArea: localStorage }));
      toast({ title: "Logged Out", description: "You have been successfully logged out.", variant: "success" });
      window.location.href = '/';
    }
  };

  const handleEditField = (field: 'email' | 'contact') => {
    setEditingField(field);
    setOtp('');
    setOtpSent(false);
    if (field === 'email') setTempEmail(userData.email);
    if (field === 'contact') setTempContact(userData.contact);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setOtp('');
    setOtpSent(false);
    setTempEmail(userData.email);
    setTempContact(userData.contact);
  };

  const handleSendOtpForUpdate = async () => {
    if (!editingField) return;

    let valueToVerify = '';
    if (editingField === 'email') {
        valueToVerify = tempEmail;
        if (valueToVerify === userData.email) {
            toast({title: "No Change", description: "Email is the same as current.", variant: "default"});
            setEditingField(null);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valueToVerify)) {
            toast({title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive"});
            return;
        }
    } else if (editingField === 'contact') {
        valueToVerify = tempContact;
        if (valueToVerify === userData.contact) {
            toast({title: "No Change", description: "Contact number is the same as current.", variant: "default"});
            setEditingField(null);
            return;
        }
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
         if (!phoneRegex.test(valueToVerify)) {
            toast({title: "Invalid Phone Number", description: "Please enter a valid phone number.", variant: "destructive"});
            return;
        }
    }

    setIsSendingOtp(true);
    // Simulate API call to send OTP
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
    // Simulate API call to verify OTP
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (otp === '123456') { // Simulated OTP check
      const updatedUserData = { ...userData };
      if (editingField === 'email') {
        updatedUserData.email = tempEmail;
      } else if (editingField === 'contact') {
        updatedUserData.contact = tempContact;
      }
      setUserData(updatedUserData);
      if (typeof window !== 'undefined') {
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
      toast({ title: 'Update Successful', description: `${editingField} has been updated.`, variant: 'success' });
      setEditingField(null);
      setOtpSent(false);
      setOtp('');
    } else {
      toast({ title: 'Verification Failed', description: 'Incorrect OTP. Please try again.', variant: 'destructive' });
    }
    setIsVerifyingOtp(false);
  };


  return (
    <Card className="w-full max-w-2xl bg-card">
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
          <CardTitle className="text-foreground">Basic Information</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage your profile details.</CardDescription>
          {selectedFile && (
            <Button size="sm" onClick={handleImageSave} disabled={isSavingImage} className="mt-2 gap-2">
              {isSavingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
              {isSavingImage ? 'Saving...' : 'Save Picture'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-foreground">Name</Label>
          <Input id="name" value={userData.name} readOnly className="bg-muted/50 text-foreground" />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email Address</Label>
          {editingField === 'email' ? (
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="text-foreground"
                disabled={otpSent || isSendingOtp || isVerifyingOtp}
              />
              {!otpSent ? (
                 <div className="flex gap-2">
                    <Button onClick={handleSendOtpForUpdate} disabled={isSendingOtp || tempEmail === userData.email} className="gap-2">
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEdit} className="gap-2"> <X className="h-4 w-4" /> Cancel</Button>
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
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEdit} disabled={isVerifyingOtp} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
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
                value={tempContact}
                onChange={(e) => setTempContact(e.target.value)}
                className="text-foreground"
                disabled={otpSent || isSendingOtp || isVerifyingOtp}
              />
               {!otpSent ? (
                 <div className="flex gap-2">
                    <Button onClick={handleSendOtpForUpdate} disabled={isSendingOtp || tempContact === userData.contact} className="gap-2">
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEdit} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
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
                      <Button onClick={handleVerifyOtpForUpdate} disabled={isVerifyingOtp || otp.length !== 6} className="gap-2">
                        {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {isVerifyingOtp ? 'Verifying...' : 'Verify & Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEdit} disabled={isVerifyingOtp} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
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

        <div className="space-y-1">
          <Label className="text-foreground">Gender</Label>
          <RadioGroup defaultValue={userData.gender} className="flex items-center space-x-4 pt-2" disabled>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="text-foreground">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="text-foreground">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="text-foreground">Other</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <Button variant="destructive" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </CardFooter>
    </Card>
  );
}
