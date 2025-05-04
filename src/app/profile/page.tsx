
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Edit2, Camera, Loader2 } from 'lucide-react'; // Import icons
import { useToast } from '@/hooks/use-toast';


export default function ProfileBasicInfoPage() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Placeholder user data (replace with actual fetched data)
  const [userData, setUserData] = React.useState({
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    contact: '+1 123 456 7890',
    gender: 'other', // 'male', 'female', 'other'
  });

  // State for profile picture preview
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Load profile image from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem('profileImageUrl');
      setProfileImage(storedImage);
    }
  }, []);


  // Handle profile picture selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  // Simulate saving the profile picture
  const handleImageSave = async () => {
     if (!selectedFile) {
       toast({ title: "No Image Selected", description: "Please select an image file first.", variant: "destructive" });
       return;
     }
     if (!profileImage) return; // Should have a preview if file is selected

     setIsSaving(true);
     // Simulate API call to upload image
     await new Promise(resolve => setTimeout(resolve, 1000));

     try {
         if (typeof window !== 'undefined') {
             // In a real app, you'd save the *URL* returned by your backend
             // For simulation, we save the data URL (can be large!)
             localStorage.setItem('profileImageUrl', profileImage);

             // Trigger storage event for header update
             window.dispatchEvent(new StorageEvent('storage', {
                key: 'profileImageUrl',
                newValue: profileImage,
                storageArea: localStorage,
             }));
         }
         toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
         setSelectedFile(null); // Clear selected file after saving
     } catch (error) {
         console.error("Failed to save profile image:", error);
         toast({ title: "Save Failed", description: "Could not save the profile picture.", variant: "destructive" });
     } finally {
        setIsSaving(false);
     }
  };

  // Trigger hidden file input
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Function to handle logout
  const handleLogout = () => {
     if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('profileImageUrl'); // Clear image on logout
        // Optionally trigger storage event for header update
         window.dispatchEvent(new StorageEvent('storage', {
            key: 'isLoggedIn',
            newValue: null,
            storageArea: localStorage,
         }));
         window.dispatchEvent(new StorageEvent('storage', {
            key: 'profileImageUrl',
            newValue: null,
            storageArea: localStorage,
         }));

        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        // Redirect to home or login page
         window.location.href = '/'; // Force reload to update header state reliably
     }
  };


  return (
    // Removed mx-auto to align card left within the Tabs content area
    // Use default bg-card
    <Card className="w-full max-w-2xl bg-card"> {/* Reverted bg-card */}
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
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
         </div>
         <div className="text-center sm:text-left">
            {/* Use default text-card-foreground */}
            <CardTitle className="text-card-foreground">Basic Information</CardTitle>
            {/* Use default text-muted-foreground */}
            <CardDescription className="text-muted-foreground">View and manage your profile details.</CardDescription>
              {selectedFile && (
                 <Button size="sm" onClick={handleImageSave} disabled={isSaving} className="mt-2 gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                    {isSaving ? 'Saving...' : 'Save Picture'}
                 </Button>
             )}
         </div>
      </CardHeader>
      <CardContent className="space-y-4">
         {/* Changed grid to single column for better centering appearance */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
             {/* Use default text-card-foreground */}
            <Label htmlFor="name" className="text-card-foreground">Name</Label>
            {/* In a real app, make these editable with a form */}
            <Input id="name" value={userData.name} readOnly className="bg-muted/50 text-card-foreground"/> {/* Ensure text-card-foreground */}
          </div>
          <div className="space-y-1">
             {/* Use default text-card-foreground */}
            <Label htmlFor="email" className="text-card-foreground">Email Address</Label>
            <Input id="email" type="email" value={userData.email} readOnly className="bg-muted/50 text-card-foreground"/> {/* Ensure text-card-foreground */}
          </div>
        </div>
         {/* Changed grid to single column for better centering appearance */}
        <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
                {/* Use default text-card-foreground */}
                <Label htmlFor="contact" className="text-card-foreground">Contact Number</Label>
                <Input id="contact" value={userData.contact} readOnly className="bg-muted/50 text-card-foreground"/> {/* Ensure text-card-foreground */}
            </div>
            <div className="space-y-1">
                {/* Use default text-card-foreground */}
                <Label className="text-card-foreground">Gender</Label>
                <RadioGroup defaultValue={userData.gender} className="flex items-center space-x-4 pt-2" disabled>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                         {/* Use default text-card-foreground */}
                        <Label htmlFor="male" className="text-card-foreground">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                         {/* Use default text-card-foreground */}
                        <Label htmlFor="female" className="text-card-foreground">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                         {/* Use default text-card-foreground */}
                        <Label htmlFor="other" className="text-card-foreground">Other</Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
        {/* Add more fields as needed */}
         {/* Add Edit Button if implementing edit functionality */}
         {/* <Button variant="outline" className="mt-4">Edit Profile</Button> */}
      </CardContent>
       <CardFooter className="flex justify-end border-t pt-4">
           {/* Moved Logout Button Here */}
           <Button variant="destructive" onClick={handleLogout} className="gap-2">
             <LogOut className="h-4 w-4" />
             Logout
           </Button>
       </CardFooter>
    </Card>
  );
}



