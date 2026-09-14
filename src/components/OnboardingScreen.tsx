import { useState } from 'react';
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
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { toast } from 'sonner';
import '../styles/auth.css';

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
      return 'Please check your email to verify your account.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    return msg || 'Authentication error occurred.';
  };

  // Sign Up Handler
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
      toast.error('Supabase credentials not configured. Continuing in offline mode.');
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

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
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
          icon: <Check className="w-4 h-4 text-emerald-500" />,
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

  // Guest / Offline Mode Handler
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
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="auth-title">
            Attendify
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="auth-subtitle">Smart attendance tracking for students</p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'guest' && (
          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="auth-error-box" style={{ marginBottom: '16px' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CREATE ACCOUNT FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            {/* Student Role Cards */}
            <div className="auth-field-group">
              <label className="auth-label">I AM TRACKING FOR</label>
              <div className="auth-roles-grid">
                {/* School Card */}
                <div
                  className={`auth-role-card ${userType === 'school' ? 'active' : ''}`}
                  onClick={() => setUserType('school')}
                >
                  <div className="auth-role-top">
                    <div className="auth-role-icon">
                      <School className="w-4 h-4" />
                    </div>
                    {userType === 'school' && (
                      <div className="auth-role-badge">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="auth-role-name">School</div>
                    <div className="auth-role-desc">Weekly routines</div>
                  </div>
                </div>

                {/* College Card */}
                <div
                  className={`auth-role-card ${userType === 'college' ? 'active' : ''}`}
                  onClick={() => setUserType('college')}
                >
                  <div className="auth-role-top">
                    <div className="auth-role-icon">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    {userType === 'college' && (
                      <div className="auth-role-badge">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="auth-role-name">College</div>
                    <div className="auth-role-desc">Subjects & ECA %</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Name and Class/Semester */}
            <div className="auth-form-row">
              <div className="auth-field-group">
                <label htmlFor="signup-name" className="auth-label">Full Name</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="e.g. Alex Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label htmlFor="signup-class" className="auth-label">
                  {userType === 'school' ? 'Class' : 'Semester'}
                </label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-class"
                    type="text"
                    placeholder={userType === 'school' ? 'e.g. 10th' : 'e.g. 4th Sem'}
                    value={classOrSemester}
                    onChange={(e) => setClassOrSemester(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="auth-field-group">
              <label htmlFor="signup-email" className="auth-label">Email Address</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="alex@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
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
                  id="signup-password"
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Progress */}
              {password.length > 0 && (
                <div className="auth-strength-meter">
                  <div className={`auth-strength-segment ${passwordStrength.score >= 1 ? passwordStrength.style : ''}`} />
                  <div className={`auth-strength-segment ${passwordStrength.score >= 2 ? passwordStrength.style : ''}`} />
                  <div className={`auth-strength-segment ${passwordStrength.score >= 3 ? passwordStrength.style : ''}`} />
                  <div className={`auth-strength-segment ${passwordStrength.score >= 4 ? passwordStrength.style : ''}`} />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !fullName.trim() || !classOrSemester.trim() || !email.trim() || password.length < 6}
              className="auth-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Create Account & Start Tracking
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Guest Option */}
            <div className="auth-switch-text">
              Want to try first without an email?{' '}
              <button
                type="button"
                onClick={() => { setMode('guest'); setErrorMessage(null); }}
                className="auth-link-btn"
              >
                Continue as Guest
              </button>
            </div>
          </form>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="auth-field-group">
              <label htmlFor="signin-email" className="auth-label">Email Address</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="signin-email"
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
              <label htmlFor="signin-password" className="auth-label">Password</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="signin-password"
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="auth-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  Sign In & Restore Attendance
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="auth-switch-text">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMessage(null); }}
                className="auth-link-btn"
              >
                Create one now
              </button>
            </div>
          </form>
        )}

        {/* GUEST / OFFLINE FORM */}
        {mode === 'guest' && (
          <div className="auth-form">
            <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', color: '#92400e', fontSize: '12px', lineHeight: '1.4' }}>
              <strong>Offline Mode:</strong> Your data will be saved locally on this device. You can upgrade to a cloud account anytime from the header to enable automatic backups.
            </div>

            <div className="auth-field-group">
              <label htmlFor="guest-name" className="auth-label">Your Name</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="guest-name"
                  type="text"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-field-group">
                <label className="auth-label">Student Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setUserType('school')}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: userType === 'school' ? '#ffffff' : 'transparent',
                      color: userType === 'school' ? '#0f172a' : '#64748b',
                      boxShadow: userType === 'school' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    School
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('college')}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: userType === 'college' ? '#ffffff' : 'transparent',
                      color: userType === 'college' ? '#0f172a' : '#64748b',
                      boxShadow: userType === 'college' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    College
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label htmlFor="guest-class" className="auth-label">
                  {userType === 'school' ? 'Class' : 'Semester'}
                </label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <input
                    id="guest-class"
                    type="text"
                    placeholder={userType === 'school' ? 'e.g. 10th' : 'e.g. 3rd Sem'}
                    value={classOrSemester}
                    onChange={(e) => setClassOrSemester(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestContinue}
              disabled={!fullName.trim() || !classOrSemester.trim()}
              className="auth-submit-btn"
              style={{ background: '#0f172a' }}
            >
              Continue to App (Offline)
            </button>

            <div className="auth-switch-text">
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMessage(null); }}
                className="auth-link-btn"
              >
                ← Back to Cloud Account Creation
              </button>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="auth-footer">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Encrypted and secured by Supabase Cloud</span>
        </div>
      </div>
    </div>
  );
}
