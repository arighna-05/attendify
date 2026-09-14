import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { saveUserProfile, fetchUserProfile, migrateLocalDataToCloud } from '../services/dataService';
import { UserProfile } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Cloud,
  Lock,
  Mail,
  User,
  BookOpen,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  GraduationCap,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile, userId: string) => void;
  initialTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'signup' }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'school' | 'college'>('college');
  const [classOrSemester, setClassOrSemester] = useState('');
  const [loading, setLoading] = useState(false);
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

  const formatAuthError = (err: any): string => {
    const msg = err?.message || String(err);
    if (msg.includes('User already registered')) {
      return 'An account with this email already exists. Switch to Sign In.';
    }
    if (msg.includes('Invalid login credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please verify your email before signing in.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.';
    }
    return msg || 'Authentication failed.';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please check .env.local.');
      return;
    }

    setLoading(true);

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
            classOrSemester: 'Active',
            userType: 'college',
          };
          await saveUserProfile(data.user.id, profile);
        }

        // Migrate local data to cloud
        await migrateLocalDataToCloud(data.user.id);

        toast.success(`Signed in! All attendance data synced to cloud.`);
        onAuthSuccess(profile, data.user.id);
        onClose();
      }
    } catch (err: any) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please check .env.local.');
      return;
    }

    if (!fullName.trim() || !classOrSemester.trim()) {
      setErrorMessage('Please fill in your name and class/semester.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

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
        const newProfile: UserProfile = {
          fullName: fullName.trim(),
          userType,
          classOrSemester: classOrSemester.trim(),
        };

        await saveUserProfile(data.user.id, newProfile);
        await migrateLocalDataToCloud(data.user.id);

        toast.success('Account created! Your local data is now backed up to the cloud.');
        onAuthSuccess(newProfile, data.user.id);
        onClose();
      }
    } catch (err: any) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-gray-100 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="text-center pb-1">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white shadow-lg shadow-indigo-500/25">
            <Cloud className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {tab === 'signin' ? 'Sign In to Attendify' : 'Enable Cloud Backup & Sync'}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-xs">
            Never lose your attendance records and access them anywhere.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl my-2">
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMessage(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setTab('signin'); setErrorMessage(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            {/* Student Role Cards */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUserType('school')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  userType === 'school' ? 'border-indigo-600 bg-indigo-50/50 font-semibold' : 'border-gray-200'
                }`}
              >
                <School className="w-4 h-4 text-indigo-600" />
                <span className="text-xs">School</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('college')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  userType === 'college' ? 'border-indigo-600 bg-indigo-50/50 font-semibold' : 'border-gray-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs">College</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  <Input
                    placeholder="Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">
                  {userType === 'school' ? 'Class' : 'Semester'}
                </Label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  <Input
                    placeholder={userType === 'school' ? 'e.g. 10th' : 'e.g. 4th Sem'}
                    value={classOrSemester}
                    onChange={(e) => setClassOrSemester(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Email Address</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-600">Password</Label>
                {password && (
                  <span className="text-[10px] text-gray-400">
                    Strength: <strong className="text-gray-700">{passwordStrength.label}</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 pr-8 h-9 text-xs rounded-lg"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`h-full flex-1 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-gray-200'}`} />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !fullName.trim() || !classOrSemester.trim() || !email.trim() || password.length < 6}
              className="w-full h-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Create Account & Sync Data
                </span>
              )}
            </Button>
          </form>
        )}

        {/* SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Email Address</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 pr-8 h-9 text-xs rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full h-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Sign In & Sync
                </span>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
