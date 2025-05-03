
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function ProfileBasicInfoPage() {
  // Placeholder data - replace with actual user data fetching
  const userData = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    contact: '+1 123 456 7890',
    gender: 'other', // 'male', 'female', 'other'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            {/* Displaying data, make Input readOnly or use plain text */}
            <Input id="name" value={userData.name} readOnly className="bg-muted/50"/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={userData.email} readOnly className="bg-muted/50"/>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label htmlFor="contact">Contact Number</Label>
                <Input id="contact" value={userData.contact} readOnly className="bg-muted/50"/>
            </div>
            <div className="space-y-1">
                <Label>Gender</Label>
                <RadioGroup defaultValue={userData.gender} className="flex items-center space-x-4 pt-2" disabled>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other</Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
        {/* Add more fields as needed */}
      </CardContent>
      {/* Optionally add CardFooter for actions like 'Edit Profile' */}
    </Card>
  );
}
