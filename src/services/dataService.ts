import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, Week, CollegeData } from '../App';

export const STORAGE_KEYS = {
  USER_PROFILE: 'attendify_user_profile',
  SCHOOL_WEEKS: 'attendify_school_weeks',
  SCHOOL_CURRENT_WEEK: 'attendify_school_current_week',
  SCHOOL_PREVIOUS_ATTENDED: 'attendify_school_previous_attended',
  SCHOOL_PREVIOUS_TOTAL: 'attendify_school_previous_total',
  SCHOOL_SATURDAY_ENABLED: 'attendify_school_saturday_enabled',
  COLLEGE_DATA: 'attendify_college_data',
  ECA_COUNT: 'attendify_eca_count',
  AUTH_GUEST_MODE: 'attendify_auth_guest_mode',
};

export interface SchoolDataPayload {
  weeks: Week[];
  currentWeek: number;
  previousAttended: number;
  previousTotal: number;
  saturdayEnabled: boolean;
}

export interface CollegeDataPayload {
  collegeData: CollegeData;
  ecaCount: number;
}

// -------------------------------------------------------------
// PROFILE SERVICE
// -------------------------------------------------------------

export async function fetchUserProfile(userId?: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile from Supabase, checking local cache:', error.message);
      } else if (data) {
        const profile: UserProfile = {
          fullName: data.full_name,
          classOrSemester: data.class_or_semester,
          userType: data.user_type,
        };
        // Update local cache
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        return profile;
      }
    } catch (err) {
      console.warn('Network error fetching profile:', err);
    }
  }

  // Fallback to local storage
  const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return saved ? JSON.parse(saved) : null;
}

export async function saveUserProfile(userId: string | undefined, profile: UserProfile): Promise<void> {
  // Always update local cache
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

  if (isSupabaseConfigured() && userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: profile.fullName,
          class_or_semester: profile.classOrSemester,
          user_type: profile.userType,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to sync profile to Supabase:', error.message);
      }
    } catch (err) {
      console.error('Error saving profile to Supabase:', err);
    }
  }
}

// -------------------------------------------------------------
// SCHOOL DATA SERVICE
// -------------------------------------------------------------

export async function fetchSchoolData(userId?: string): Promise<SchoolDataPayload | null> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('school_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching school data from Supabase:', error.message);
      } else if (data) {
        const payload: SchoolDataPayload = {
          weeks: Array.isArray(data.weeks) && data.weeks.length > 0 ? data.weeks : defaultSchoolWeeks(),
          currentWeek: data.current_week ?? 1,
          previousAttended: data.previous_attended ?? 0,
          previousTotal: data.previous_total ?? 0,
          saturdayEnabled: data.saturday_enabled ?? true,
        };
        // Update local storage cache
        saveSchoolDataToLocal(payload);
        return payload;
      }
    } catch (err) {
      console.warn('Network error fetching school data:', err);
    }
  }

  // Fallback to local storage
  return loadSchoolDataFromLocal();
}

export async function saveSchoolData(userId: string | undefined, data: SchoolDataPayload): Promise<void> {
  // Save locally first
  saveSchoolDataToLocal(data);

  if (isSupabaseConfigured() && userId) {
    try {
      const { error } = await supabase
        .from('school_data')
        .upsert(
          {
            user_id: userId,
            saturday_enabled: data.saturdayEnabled,
            current_week: data.currentWeek,
            previous_attended: data.previousAttended,
            previous_total: data.previousTotal,
            weeks: data.weeks,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Failed to sync school data to Supabase:', error.message);
      }
    } catch (err) {
      console.error('Error syncing school data to Supabase:', err);
    }
  }
}

// -------------------------------------------------------------
// COLLEGE DATA SERVICE
// -------------------------------------------------------------

export async function fetchCollegeData(userId?: string): Promise<CollegeDataPayload | null> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('college_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching college data from Supabase:', error.message);
      } else if (data) {
        const payload: CollegeDataPayload = {
          collegeData: {
            subjects: data.subjects ?? [],
            minimumGoal: data.minimum_goal ?? 75,
          },
          ecaCount: data.eca_count ?? 0,
        };
        // Update local storage cache
        saveCollegeDataToLocal(payload);
        return payload;
      }
    } catch (err) {
      console.warn('Network error fetching college data:', err);
    }
  }

  // Fallback to local storage
  return loadCollegeDataFromLocal();
}

export async function saveCollegeData(userId: string | undefined, data: CollegeDataPayload): Promise<void> {
  // Save locally first
  saveCollegeDataToLocal(data);

  if (isSupabaseConfigured() && userId) {
    try {
      const { error } = await supabase
        .from('college_data')
        .upsert(
          {
            user_id: userId,
            minimum_goal: data.collegeData.minimumGoal,
            eca_count: data.ecaCount,
            subjects: data.collegeData.subjects,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Failed to sync college data to Supabase:', error.message);
      }
    } catch (err) {
      console.error('Error syncing college data to Supabase:', err);
    }
  }
}

// -------------------------------------------------------------
// MIGRATION HELPER: LocalStorage -> Supabase
// -------------------------------------------------------------

export async function migrateLocalDataToCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !userId) return;

  try {
    // 1. Profile migration
    const localProfileStr = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (localProfileStr) {
      const profile: UserProfile = JSON.parse(localProfileStr);
      await saveUserProfile(userId, profile);
    }

    // 2. School data migration
    const localSchoolData = loadSchoolDataFromLocal();
    if (localSchoolData && localSchoolData.weeks.length > 0) {
      await saveSchoolData(userId, localSchoolData);
    }

    // 3. College data migration
    const localCollegeData = loadCollegeDataFromLocal();
    if (localCollegeData && (localCollegeData.collegeData.subjects.length > 0 || localCollegeData.ecaCount > 0)) {
      await saveCollegeData(userId, localCollegeData);
    }
  } catch (err) {
    console.warn('Error during local to cloud data migration:', err);
  }
}

// -------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -------------------------------------------------------------

export function defaultSchoolWeeks(): Week[] {
  return [
    {
      weekNumber: 1,
      startDate: new Date().toISOString(),
      attendance: {
        monday: 'absent',
        tuesday: 'absent',
        wednesday: 'absent',
        thursday: 'absent',
        friday: 'absent',
        saturday: 'absent',
      },
    },
  ];
}

function saveSchoolDataToLocal(data: SchoolDataPayload) {
  localStorage.setItem(STORAGE_KEYS.SCHOOL_WEEKS, JSON.stringify(data.weeks));
  localStorage.setItem(STORAGE_KEYS.SCHOOL_CURRENT_WEEK, data.currentWeek.toString());
  localStorage.setItem(STORAGE_KEYS.SCHOOL_PREVIOUS_ATTENDED, data.previousAttended.toString());
  localStorage.setItem(STORAGE_KEYS.SCHOOL_PREVIOUS_TOTAL, data.previousTotal.toString());
  localStorage.setItem(STORAGE_KEYS.SCHOOL_SATURDAY_ENABLED, data.saturdayEnabled ? 'true' : 'false');
}

function loadSchoolDataFromLocal(): SchoolDataPayload | null {
  const weeksStr = localStorage.getItem(STORAGE_KEYS.SCHOOL_WEEKS);
  if (!weeksStr) return null;

  return {
    weeks: JSON.parse(weeksStr),
    currentWeek: parseInt(localStorage.getItem(STORAGE_KEYS.SCHOOL_CURRENT_WEEK) || '1', 10),
    previousAttended: parseInt(localStorage.getItem(STORAGE_KEYS.SCHOOL_PREVIOUS_ATTENDED) || '0', 10),
    previousTotal: parseInt(localStorage.getItem(STORAGE_KEYS.SCHOOL_PREVIOUS_TOTAL) || '0', 10),
    saturdayEnabled: localStorage.getItem(STORAGE_KEYS.SCHOOL_SATURDAY_ENABLED) !== 'false',
  };
}

function saveCollegeDataToLocal(data: CollegeDataPayload) {
  localStorage.setItem(STORAGE_KEYS.COLLEGE_DATA, JSON.stringify(data.collegeData));
  localStorage.setItem(STORAGE_KEYS.ECA_COUNT, data.ecaCount.toString());
}

function loadCollegeDataFromLocal(): CollegeDataPayload | null {
  const collegeStr = localStorage.getItem(STORAGE_KEYS.COLLEGE_DATA);
  if (!collegeStr) return null;

  return {
    collegeData: JSON.parse(collegeStr),
    ecaCount: parseInt(localStorage.getItem(STORAGE_KEYS.ECA_COUNT) || '0', 10),
  };
}
