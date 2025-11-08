import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UserProfile } from '../App';
import { GraduationCap } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: (user: UserProfile) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [fullName, setFullName] = useState('');
  const [classOrSemester, setClassOrSemester] = useState('');
  const [userType, setUserType] = useState<'school' | 'college' | ''>('');

  const handleContinue = () => {
    if (fullName && classOrSemester && userType) {
      onComplete({
        fullName,
        classOrSemester,
        userType: userType as 'school' | 'college',
      });
    }
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value as 'school' | 'college');
    setClassOrSemester(''); // Reset the class/semester field when type changes
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Attendify</h1>
          <p className="text-gray-600">Track your attendance with ease</p>
        </div>

        {/* Create Account Card */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Get started by filling in your details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">Select Type</Label>
              <Select value={userType} onValueChange={handleUserTypeChange}>
                <SelectTrigger id="userType">
                  <SelectValue placeholder="Select School / College" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic field based on selection */}
            {userType && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="classOrSemester">
                  {userType === 'school' ? 'Class' : 'Semester'}
                </Label>
                <Input
                  id="classOrSemester"
                  placeholder={
                    userType === 'school' 
                      ? 'e.g., 10th Grade' 
                      : 'e.g., 5th Semester'
                  }
                  value={classOrSemester}
                  onChange={(e) => setClassOrSemester(e.target.value)}
                />
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              onClick={handleContinue}
              disabled={!fullName || !classOrSemester || !userType}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
