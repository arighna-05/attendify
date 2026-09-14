import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { saveUserProfile, fetchUserProfile, migrateLocalDataToCloud } from '../services/dataService';
import { UserProfile } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
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
  Check,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import '../styles/auth.css';

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
    if (!pass) return { score: 0, label: '', style: '' };
    if (pass.length < 6) return { score: 1, label: 'Too short', style: 'weak' };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score === 2) return { score: 2, label: 'Fair', style: 'fair' };
    if (score === 3) return { score: 3, label: 'Good', style: 'good' };
    return { score: 4, label: 'Strong', style: 'strong' };
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
      <DialogContent className="auth-modal-content" style={{ maxWidth: '440px' }}>
        <DialogHeader style={{ textAlign: 'center', alignItems: 'center' }} className="text-center sm:text-center pb-2">
          <div className="auth-brand-logo mx-auto mb-2" style={{ width: 50, height: 50, borderRadius: 15 }}>
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 text-center">
            {tab === 'signin' ? 'Sign In to Attendify' : 'Enable Cloud Backup & Sync'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs mt-1 text-center">
            Never lose your attendance records and access them on any device.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch */}
        <div className="auth-tabs my-2">
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMessage(null); }}
            className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setTab('signin'); setErrorMessage(null); }}
            className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
          >
            Sign In
          </button>
        </div>

        {errorMessage && (
          <div className="auth-error-box mb-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            {/* Student Role Cards */}
            <div className="auth-roles-grid">
              <div
                className={`auth-role-card ${userType === 'school' ? 'active' : ''}`}
                onClick={() => setUserType('school')}
                style={{ padding: '10px 12px' }}
              >
                <div className="auth-role-top">
                  <div className="auth-role-icon" style={{ width: 28, height: 28 }}>
                    <School className="w-3.5 h-3.5" />
                  </div>
                  {userType === 'school' && (
                    <div className="auth-role-badge" style={{ width: 16, height: 16 }}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="auth-role-name" style={{ fontSize: '12px' }}>School</div>
                  <div className="auth-role-desc" style={{ fontSize: '10px' }}>Weekly routines</div>
                </div>
              </div>

              <div
                className={`auth-role-card ${userType === 'college' ? 'active' : ''}`}
                onClick={() => setUserType('college')}
                style={{ padding: '10px 12px' }}
              >
                <div className="auth-role-top">
                  <div className="auth-role-icon" style={{ width: 28, height: 28 }}>
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  {userType === 'college' && (
                    <div className="auth-role-badge" style={{ width: 16, height: 16 }}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="auth-role-name" style={{ fontSize: '12px' }}>College</div>
                  <div className="auth-role-desc" style={{ fontSize: '10px' }}>Subjects & ECA %</div>
                </div>
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-field-group">
                <label className="auth-label">Full Name</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    placeholder="Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">
                  {userType === 'school' ? 'Class' : 'Semester'}
                </label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <input
                    placeholder={userType === 'school' ? 'e.g. 10th' : 'e.g. 4th Sem'}
                    value={classOrSemester}
                    onChange={(e) => setClassOrSemester(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-label">
                <span>Password</span>
                {password && (
                  <span className="auth-strength-text">
                    Strength: <strong style={{ color: '#0f172a' }}>{passwordStrength.label}</strong>
                  </span>
                )}
              </div>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input has-toggle"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="auth-strength-meter">
                  <div className={`auth-strength-segment ${passwordStrength.score >= 1 ? passwordStrength.style : ''}`} />
                  <div className={`auth-strength-segment ${passwordStrength.score >= 2 ? passwordStrength.style : ''}`} />
                  <div className={`auth-strength-segment ${passwordStrength.score >= 3 ? passwordStrength.style : ''}`} />
                  <div className={`auth-strength-segment ${passwordStrength.score >= 4 ? passwordStrength.style : ''}`} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !fullName.trim() || !classOrSemester.trim() || !email.trim() || password.length < 6}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Create Account & Sync Data
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="auth-field-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input has-toggle"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  Sign In & Sync
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
