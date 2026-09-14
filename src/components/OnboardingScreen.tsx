import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { UserProfile } from '../App';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { saveUserProfile, fetchUserProfile, migrateLocalDataToCloud } from '../services/dataService';
import {
  GraduationCap,
  School,
  Sparkles,
  Mail,
  Lock,
  User,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingScreenProps {
  onComplete: (user: UserProfile, userId?: string) => void;
  onOpenAuth?: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [mode, setMode] = useState<'signup' | 'signin' | 'guest'>('signup');
  const [fullName, setFullName] = useState('');
  const [classOrSemester, setClassOrSemester] = useState('');
  const [userType, setUserType] = useState<'school' | 'college'>('college');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: 'bg-red-400' };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-400' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Friendly error formatter
  const formatAuthError = (err: any): string => {
    const msg = err?.message || String(err);
    if (msg.includes('User already registered')) {
      return 'An account with this email already exists. Please switch to Sign In.';
    }
    if (msg.includes('Invalid login credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please check your email to verify your account before signing in.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    return msg || 'An error occurred during authentication.';
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !classOrSemester.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!isConfigured) {
      toast.error('Supabase credentials not detected. Continuing in offline mode.');
      handleGuestContinue();
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            user_type: userType,
            class_or_semester: classOrSemester.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const profile: UserProfile = {
          fullName: fullName.trim(),
          classOrSemester: classOrSemester.trim(),
          userType,
        };

        await saveUserProfile(data.user.id, profile);
        await migrateLocalDataToCloud(data.user.id);

        toast.success('Account created! Attendance synced to cloud.', {
          icon: <Cloud className="w-4 h-4 text-emerald-500" />,
        });

        onComplete(profile, data.user.id);
      }
    } catch (err: any) {
      const message = formatAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Check .env.local.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        let profile = await fetchUserProfile(data.user.id);

        if (!profile) {
          profile = {
            fullName: data.user.user_metadata?.full_name || email.split('@')[0],
            classOrSemester: data.user.user_metadata?.class_or_semester || 'Active',
            userType: (data.user.user_metadata?.user_type as any) || 'college',
          };
          await saveUserProfile(data.user.id, profile);
        }

        await migrateLocalDataToCloud(data.user.id);

        toast.success(`Welcome back, ${profile.fullName}!`, {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        });

        onComplete(profile, data.user.id);
      }
    } catch (err: any) {
      const message = formatAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Guest / Offline Mode
  const handleGuestContinue = () => {
    if (!fullName.trim() || !classOrSemester.trim()) {
      setErrorMessage('Please provide your name and class/semester for guest mode.');
      return;
    }

    const profile: UserProfile = {
      fullName: fullName.trim(),
      classOrSemester: classOrSemester.trim(),
      userType,
    };

    saveUserProfile(undefined, profile);
    toast.info('Using Attendify in Offline Mode. You can sync to cloud anytime from the header!');
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 mb-3 shadow-xl shadow-indigo-500/25 ring-4 ring-white">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-1.5">
            Attendify
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Smart, hassle-free attendance tracking for students</p>
        </div>

        {/* Main Card */}
        <Card className="border border-gray-100 shadow-xl shadow-gray-200/50 bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 m-3 bg-gray-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
          </div>

          <CardContent className="p-5 sm:p-6 pt-2">
            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Visual Student Role Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    I am tracking for
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType('school')}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all flex flex-col items-start gap-1.5 ${
                        userType === 'school'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${userType === 'school' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <School className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">School</div>
                        <div className="text-[10px] text-gray-500 leading-tight">Weekly schedules</div>
                      </div>
                      {userType === 'school' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 absolute top-2.5 right-2.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType('college')}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all flex flex-col items-start gap-1.5 ${
                        userType === 'college'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${userType === 'college' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">College</div>
                        <div className="text-[10px] text-gray-500 leading-tight">Subjects & ECA %</div>
                      </div>
                      {userType === 'college' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 absolute top-2.5 right-2.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Name & Academic Class */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <Input
                        id="signup-name"
                        placeholder="e.g. Alex Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-class" className="text-xs font-medium text-gray-700">
                      {userType === 'school' ? 'Class' : 'Semester'}
                    </Label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <Input
                        id="signup-class"
                        placeholder={userType === 'school' ? 'e.g. 10th' : 'e.g. 4th Sem'}
                        value={classOrSemester}
                        onChange={(e) => setClassOrSemester(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="alex@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-gray-700">
                      Password
                    </Label>
                    {password && (
                      <span className="text-[10px] text-gray-400">
                        Strength: <strong className="text-gray-700">{passwordStrength.label}</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-xs rounded-xl"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Progress Bar */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-gray-200'}`} />
                        <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-gray-200'}`} />
                        <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-gray-200'}`} />
                        <div className={`h-full flex-1 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-gray-200'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !fullName.trim() || !classOrSemester.trim() || !email.trim() || password.length < 6}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all mt-2"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Create Account & Start Tracking
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                {/* Offline Option */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('guest'); setErrorMessage(null); }}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Want to try first without an email? <span className="font-semibold text-indigo-600">Continue as Guest</span>
                  </button>
                </div>
              </form>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="signin-email" className="text-xs font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signin-password" className="text-xs font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-xs rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all mt-2"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      Sign In & Restore Attendance
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMessage(null); }}
                    className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Don't have an account? <span className="font-semibold text-indigo-600">Create one for free</span>
                  </button>
                </div>
              </form>
            )}

            {/* GUEST MODE FORM */}
            {mode === 'guest' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-800 text-xs leading-relaxed">
                  <strong>Offline / Guest Mode:</strong> Your data is stored on this device. You can upgrade to a cloud account anytime from the header to prevent data loss.
                </div>

                <div className="space-y-1">
                  <Label htmlFor="guest-name" className="text-xs font-medium text-gray-700">
                    Your Name
                  </Label>
                  <Input
                    id="guest-name"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Student Type</Label>
                    <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setUserType('school')}
                        className={`py-1.5 text-xs font-medium rounded-lg transition-all ${userType === 'school' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      >
                        School
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('college')}
                        className={`py-1.5 text-xs font-medium rounded-lg transition-all ${userType === 'college' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      >
                        College
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="guest-class" className="text-xs font-medium text-gray-700">
                      {userType === 'school' ? 'Class' : 'Semester'}
                    </Label>
                    <Input
                      id="guest-class"
                      placeholder={userType === 'school' ? 'e.g. 10th' : 'e.g. 3rd Sem'}
                      value={classOrSemester}
                      onChange={(e) => setClassOrSemester(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGuestContinue}
                  disabled={!fullName.trim() || !classOrSemester.trim()}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all"
                >
                  Continue to App (Offline)
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMessage(null); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    ← Back to Cloud Account Creation
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Security Badge */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
          <span>Encrypted and secured by Supabase Cloud</span>
        </div>
      </div>
    </div>
  );
}
