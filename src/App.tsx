import { useState, useEffect, useRef } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SchoolDashboard } from './components/SchoolDashboard';
import { CollegeDashboard } from './components/CollegeDashboard';
import { SubjectsScreen } from './components/SubjectsScreen';
import { ECASection } from './components/ECASection';
import { StatsScreen } from './components/StatsScreen';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  fetchUserProfile,
  saveUserProfile,
  fetchSchoolData,
  saveSchoolData,
  fetchCollegeData,
  saveCollegeData,
  defaultSchoolWeeks,
  STORAGE_KEYS,
} from './services/dataService';
import { Cloud, CloudOff, Loader2, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { Toaster } from 'sonner';

export interface UserProfile {
  fullName: string;
  classOrSemester: string;
  userType: 'school' | 'college';
}

export type DayStatus = "present" | "absent" | "holiday";

export interface Week {
  weekNumber: number;
  startDate: string;
  attendance: {
    monday: DayStatus;
    tuesday: DayStatus;
    wednesday: DayStatus;
    thursday: DayStatus;
    friday: DayStatus;
    saturday: DayStatus;
  };
}

export interface CollegeSubject {
  id: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
}

export interface CollegeData {
  subjects: CollegeSubject[];
  minimumGoal: number;
  subjectAttendance?: SubjectAttendance[];
}

export interface SubjectAttendance {
  subjectId: string;
  weeklyRecords: Record<string, boolean>;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'subjects' | 'eca' | 'stats'>('home');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  // School data
  const [saturdayEnabled, setSaturdayEnabled] = useState(true);
  const [schoolWeeks, setSchoolWeeks] = useState<Week[]>(defaultSchoolWeeks());
  const [currentSchoolWeek, setCurrentSchoolWeek] = useState(1);
  const [previousAttended, setPreviousAttended] = useState<number>(0);
  const [previousTotal, setPreviousTotal] = useState<number>(0);

  // College data
  const [collegeData, setCollegeData] = useState<CollegeData>({
    subjects: [],
    minimumGoal: 75,
  });
  const [ecaCount, setEcaCount] = useState<number>(0);

  // Ref to skip initial autosave triggers on mount
  const isInitialLoadDone = useRef(false);
  const schoolDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const collegeDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Load initial data on mount (Supabase or localStorage)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      let currentUid: string | null = null;
      let email: string | null = null;

      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            currentUid = session.user.id;
            email = session.user.email ?? null;
            if (isMounted) {
              setUserId(currentUid);
              setUserEmail(email);
            }
          }
        } catch (err) {
          console.warn('Error fetching Supabase session:', err);
        }
      }

      // Load Profile
      const profile = await fetchUserProfile(currentUid || undefined);
      if (isMounted && profile) {
        setUser(profile);
      }

      // Load School Data
      const schoolData = await fetchSchoolData(currentUid || undefined);
      if (isMounted && schoolData) {
        setSchoolWeeks(schoolData.weeks);
        setCurrentSchoolWeek(schoolData.currentWeek);
        setPreviousAttended(schoolData.previousAttended);
        setPreviousTotal(schoolData.previousTotal);
        setSaturdayEnabled(schoolData.saturdayEnabled);
      }

      // Load College Data
      const loadedCollegeData = await fetchCollegeData(currentUid || undefined);
      if (isMounted && loadedCollegeData) {
        setCollegeData(loadedCollegeData.collegeData);
        setEcaCount(loadedCollegeData.ecaCount);
      }

      if (isMounted) {
        setIsLoading(false);
        setSyncStatus(currentUid ? 'synced' : 'offline');
        // Mark initial load finished after small tick so watchers don't trigger re-saves
        setTimeout(() => {
          isInitialLoadDone.current = true;
        }, 100);
      }
    }

    loadData();

    // Setup Supabase auth listener
    let authSubscription: any = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const uid = session.user.id;
            setUserId(uid);
            setUserEmail(session.user.email ?? null);

            // Fetch fresh cloud data
            const profile = await fetchUserProfile(uid);
            if (profile) setUser(profile);

            const school = await fetchSchoolData(uid);
            if (school) {
              setSchoolWeeks(school.weeks);
              setCurrentSchoolWeek(school.currentWeek);
              setPreviousAttended(school.previousAttended);
              setPreviousTotal(school.previousTotal);
              setSaturdayEnabled(school.saturdayEnabled);
            }

            const college = await fetchCollegeData(uid);
            if (college) {
              setCollegeData(college.collegeData);
              setEcaCount(college.ecaCount);
            }

            setSyncStatus('synced');
          }
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setUserEmail(null);
          setSyncStatus('offline');
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe?.();
    };
  }, []);

  // 2. Autosave user profile
  useEffect(() => {
    if (!isInitialLoadDone.current || !user) return;
    saveUserProfile(userId || undefined, user);
  }, [user, userId]);

  // 3. Debounced Autosave for School Data
  useEffect(() => {
    if (!isInitialLoadDone.current) return;

    const payload = {
      weeks: schoolWeeks,
      currentWeek: currentSchoolWeek,
      previousAttended,
      previousTotal,
      saturdayEnabled,
    };

    if (userId) {
      setSyncStatus('syncing');
      if (schoolDebounceTimer.current) {
        clearTimeout(schoolDebounceTimer.current);
      }
      schoolDebounceTimer.current = setTimeout(async () => {
        try {
          await saveSchoolData(userId, payload);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('error');
        }
      }, 600);
    } else {
      // Offline mode: immediate local save
      saveSchoolData(undefined, payload);
      setSyncStatus('offline');
    }

    return () => {
      if (schoolDebounceTimer.current) clearTimeout(schoolDebounceTimer.current);
    };
  }, [schoolWeeks, currentSchoolWeek, previousAttended, previousTotal, saturdayEnabled, userId]);

  // 4. Debounced Autosave for College Data
  useEffect(() => {
    if (!isInitialLoadDone.current) return;

    const payload = {
      collegeData,
      ecaCount,
    };

    if (userId) {
      setSyncStatus('syncing');
      if (collegeDebounceTimer.current) {
        clearTimeout(collegeDebounceTimer.current);
      }
      collegeDebounceTimer.current = setTimeout(async () => {
        try {
          await saveCollegeData(userId, payload);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('error');
        }
      }, 600);
    } else {
      // Offline mode: immediate local save
      saveCollegeData(undefined, payload);
      setSyncStatus('offline');
    }

    return () => {
      if (collegeDebounceTimer.current) clearTimeout(collegeDebounceTimer.current);
    };
  }, [collegeData, ecaCount, userId]);

  // Helper to add new school week
  const addNewSchoolWeek = () => {
    const newWeek: Week = {
      weekNumber: schoolWeeks.length + 1,
      startDate: new Date().toISOString(),
      attendance: {
        monday: 'absent',
        tuesday: 'absent',
        wednesday: 'absent',
        thursday: 'absent',
        friday: 'absent',
        saturday: 'absent',
      },
    };
    setSchoolWeeks([...schoolWeeks, newWeek]);
    setCurrentSchoolWeek(newWeek.weekNumber);
  };

  // Sign out handler
  const handleSignOut = async () => {
    if (isSupabaseConfigured() && userId) {
      await supabase.auth.signOut();
    }
    setUserId(null);
    setUserEmail(null);
    setSyncStatus('offline');
  };

  // Helper to reset all local data
  const resetAllData = () => {
    if (confirm('Are you sure you want to reset your local data?')) {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      window.location.reload();
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Attendify...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if no user profile exists
  if (!user) {
    return (
      <>
        <Toaster richColors position="top-center" closeButton />
        <OnboardingScreen
          onComplete={(profile, uid) => {
            setUser(profile);
            if (uid) {
              setUserId(uid);
              setSyncStatus('synced');
            } else {
              setSyncStatus('offline');
            }
          }}
          onOpenAuth={() => {
            setAuthModalTab('signin');
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab={authModalTab}
          onAuthSuccess={(profile, uid) => {
            setUser(profile);
            setUserId(uid);
            setSyncStatus('synced');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster richColors position="top-center" closeButton />
      <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">
        {/* Header */}
        <div className="p-5 bg-white/85 backdrop-blur-md border-b border-gray-100/80 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Attendify</h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {user.fullName} • {user.userType === 'school' ? `Class ${user.classOrSemester}` : `Semester ${user.classOrSemester}`}
              </p>
            </div>

            {/* Cloud Sync Badge & Account Controls */}
            <div className="flex items-center gap-2">
              {userId ? (
                <div className="flex items-center gap-1.5">
                  <div
                    title={syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Saving to Cloud...' : 'Sync Error'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-red-50 text-red-700 border border-red-200/60'
                    }`}
                  >
                    {syncStatus === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {syncStatus === 'syncing' && <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                    {syncStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                    <span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Saving' : 'Offline'}</span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    title={`Signed in as ${userEmail || user.fullName}. Click to sign out.`}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalTab('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Sync to Cloud
                </button>
              )}
            </div>
          </div>

          {/* Quick link to reset for testing if needed */}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
            <span className="text-[11px] text-gray-400">
              {userId ? (userEmail ? `Cloud Account: ${userEmail}` : 'Connected to Supabase') : 'Local Storage Mode'}
            </span>
            <button
              onClick={resetAllData}
              className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'home' && user.userType === 'school' && (
            <SchoolDashboard
              weeks={schoolWeeks}
              currentWeek={currentSchoolWeek}
              onWeeksChange={setSchoolWeeks}
              onCurrentWeekChange={setCurrentSchoolWeek}
              onAddNewWeek={addNewSchoolWeek}
              previousAttended={previousAttended}
              previousTotal={previousTotal}
              onPreviousAttendedChange={setPreviousAttended}
              onPreviousTotalChange={setPreviousTotal}
              saturdayEnabled={saturdayEnabled}
              onSaturdayEnabledChange={setSaturdayEnabled}
            />
          )}
          
          {activeTab === 'home' && user.userType === 'college' && (
            <CollegeDashboard
              data={collegeData}
              onDataChange={setCollegeData}
              ecaCount={ecaCount}
            />
          )}

          {activeTab === 'subjects' && user.userType === 'college' && (
            <SubjectsScreen
              data={collegeData}
              onDataChange={setCollegeData}
            />
          )}

          {activeTab === 'eca' && user.userType === 'college' && (
            <ECASection
              ecaCount={ecaCount}
              onEcaChange={setEcaCount}
              userType={user.userType}
              collegeData={collegeData}
            />
          )}

          {activeTab === 'stats' && (
            <StatsScreen
              userType={user.userType}
              schoolWeeks={schoolWeeks}
              collegeData={collegeData}
              ecaCount={ecaCount}
              previousAttended={previousAttended}
              previousTotal={previousTotal}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userType={user.userType}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab={authModalTab}
          onAuthSuccess={(profile, uid) => {
            setUser(profile);
            setUserId(uid);
            setSyncStatus('synced');
          }}
        />
      </div>
    </div>
  );
}