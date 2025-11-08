import { useState, useEffect } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SchoolDashboard } from './components/SchoolDashboard';
import { CollegeDashboard } from './components/CollegeDashboard';
import { SubjectsScreen } from './components/SubjectsScreen';
import { ECASection } from './components/ECASection';
import { StatsScreen } from './components/StatsScreen';
import { Navigation } from './components/Navigation';

export interface UserProfile {
  fullName: string;
  classOrSemester: string;
  userType: 'school' | 'college';
}

export interface WeekAttendance {
  [day: string]: boolean;
}

export interface Week {
  weekNumber: number;
  startDate: string;
  attendance: WeekAttendance;
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
}

// localStorage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'attendify_user_profile',
  SCHOOL_WEEKS: 'attendify_school_weeks',
  SCHOOL_CURRENT_WEEK: 'attendify_school_current_week',
  SCHOOL_PREVIOUS_ATTENDED: 'attendify_school_previous_attended',
  SCHOOL_PREVIOUS_TOTAL: 'attendify_school_previous_total',
  COLLEGE_DATA: 'attendify_college_data',
  ECA_COUNT: 'attendify_eca_count',
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'subjects' | 'eca' | 'stats'>('home');
  
  // School data - multiple weeks + mid-session join
  const [schoolWeeks, setSchoolWeeks] = useState<Week[]>([
    {
      weekNumber: 1,
      startDate: new Date().toISOString(),
      attendance: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
      },
    },
  ]);
  const [currentSchoolWeek, setCurrentSchoolWeek] = useState(1);
  const [previousAttended, setPreviousAttended] = useState<number>(0);
  const [previousTotal, setPreviousTotal] = useState<number>(0);

  // College data - simple subject-based tracking
  const [collegeData, setCollegeData] = useState<CollegeData>({
    subjects: [],
    minimumGoal: 75,
  });

  const [ecaCount, setEcaCount] = useState<number>(0);

  // Load all data from localStorage on mount
  useEffect(() => {
    try {
      // Load user profile
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // Load school data
      const savedSchoolWeeks = localStorage.getItem(STORAGE_KEYS.SCHOOL_WEEKS);
      if (savedSchoolWeeks) {
        setSchoolWeeks(JSON.parse(savedSchoolWeeks));
      }

      const savedCurrentWeek = localStorage.getItem(STORAGE_KEYS.SCHOOL_CURRENT_WEEK);
      if (savedCurrentWeek) {
        setCurrentSchoolWeek(parseInt(savedCurrentWeek));
      }

      const savedPreviousAttended = localStorage.getItem(STORAGE_KEYS.SCHOOL_PREVIOUS_ATTENDED);
      if (savedPreviousAttended) {
        setPreviousAttended(parseInt(savedPreviousAttended));
      }

      const savedPreviousTotal = localStorage.getItem(STORAGE_KEYS.SCHOOL_PREVIOUS_TOTAL);
      if (savedPreviousTotal) {
        setPreviousTotal(parseInt(savedPreviousTotal));
      }

      // Load college data
      const savedCollegeData = localStorage.getItem(STORAGE_KEYS.COLLEGE_DATA);
      if (savedCollegeData) {
        setCollegeData(JSON.parse(savedCollegeData));
      }

      // Load ECA count
      const savedEcaCount = localStorage.getItem(STORAGE_KEYS.ECA_COUNT);
      if (savedEcaCount) {
        setEcaCount(parseInt(savedEcaCount));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user profile to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    }
  }, [user]);

  // Save school weeks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_WEEKS, JSON.stringify(schoolWeeks));
  }, [schoolWeeks]);

  // Save current week to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_CURRENT_WEEK, currentSchoolWeek.toString());
  }, [currentSchoolWeek]);

  // Save previous attended to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_PREVIOUS_ATTENDED, previousAttended.toString());
  }, [previousAttended]);

  // Save previous total to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_PREVIOUS_TOTAL, previousTotal.toString());
  }, [previousTotal]);

  // Save college data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLEGE_DATA, JSON.stringify(collegeData));
  }, [collegeData]);

  // Save ECA count to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ECA_COUNT, ecaCount.toString());
  }, [ecaCount]);

  // Helper to add new school week
  const addNewSchoolWeek = () => {
    const newWeek: Week = {
      weekNumber: schoolWeeks.length + 1,
      startDate: new Date().toISOString(),
      attendance: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
      },
    };
    setSchoolWeeks([...schoolWeeks, newWeek]);
    setCurrentSchoolWeek(newWeek.weekNumber);
  };

  // Helper to reset all data (for testing or user logout)
  const resetAllData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    window.location.reload();
  };

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if no user profile exists
  if (!user) {
    return <OnboardingScreen onComplete={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">
        {/* Header */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <h1 className="text-center text-gray-900">Attendify</h1>
          <p className="text-center text-gray-600 mt-1">
            {user.fullName} • {user.userType === 'school' ? `Class: ${user.classOrSemester}` : `Semester: ${user.classOrSemester}`}
          </p>
          {/* Optional: Add a logout/reset button for testing */}
          <button
            onClick={resetAllData}
            className="text-xs text-gray-400 hover:text-gray-600 mx-auto block mt-2"
          >
            Reset Account
          </button>
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

        {/* Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userType={user.userType}
        />
      </div>
    </div>
  );
}
