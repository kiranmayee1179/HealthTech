// LocalStorage Auth, Profile, and Multi-User Persistence

const STORAGE_KEYS = {
  CURRENT_USER: 'vitalcheck_current_user',
  USERS_DB: 'vitalcheck_users_db',
};

// Default Demo User Seed
export const DEMO_USER = {
  email: 'demo@vitalcheck.ai',
  password: 'Demo1234',
  profile: {
    name: 'Alex Demo',
    age: 34,
    ageRange: '25-34',
    gender: 'Non-binary / Prefer not to say',
    existingConditions: ['Asthma (Mild)'],
    medications: 'None',
    heightCm: 175,
    weightKg: 70,
    bmi: '22.9 (Normal)',
    allergies: 'Penicillin (mild rash)',
    emergencyContact: 'Jordan Morgan - (555) 019-2834',
    preferredCareLocation: 'Seattle Community Health Clinic',
    isOnboarded: true,
  },
  logs: [
    { id: 'log-14', date: '2026-09-07', mood: 4, moodLabel: 'Good', sleepHours: 7.5, waterLiters: 2.4, steps: 8400, exerciseMinutes: 30, symptoms: 'Feeling energetic after morning jog' },
    { id: 'log-13', date: '2026-09-08', mood: 4, moodLabel: 'Good', sleepHours: 8.0, waterLiters: 2.5, steps: 7900, exerciseMinutes: 25, symptoms: 'None' },
    { id: 'log-12', date: '2026-09-09', mood: 5, moodLabel: 'Great', sleepHours: 8.2, waterLiters: 2.8, steps: 9500, exerciseMinutes: 45, symptoms: 'Great energy all day' },
    { id: 'log-11', date: '2026-09-10', mood: 3, moodLabel: 'Neutral', sleepHours: 6.5, waterLiters: 2.0, steps: 6100, exerciseMinutes: 15, symptoms: 'Slight fatigue, back tightness' },
    { id: 'log-10', date: '2026-09-11', mood: 4, moodLabel: 'Good', sleepHours: 7.0, waterLiters: 2.2, steps: 7200, exerciseMinutes: 30, symptoms: 'None' },
    { id: 'log-9',  date: '2026-09-12', mood: 4, moodLabel: 'Good', sleepHours: 7.8, waterLiters: 2.4, steps: 8100, exerciseMinutes: 35, symptoms: 'Felt well rested' },
    { id: 'log-8',  date: '2026-09-13', mood: 3, moodLabel: 'Neutral', sleepHours: 6.8, waterLiters: 1.9, steps: 5800, exerciseMinutes: 0, symptoms: 'Mild tension headache' },
    { id: 'log-7',  date: '2026-09-14', mood: 4, moodLabel: 'Good', sleepHours: 7.5, waterLiters: 2.3, steps: 7600, exerciseMinutes: 20, symptoms: 'None' },
    { id: 'log-6',  date: '2026-09-15', mood: 3, moodLabel: 'Neutral', sleepHours: 6.2, waterLiters: 1.8, steps: 5200, exerciseMinutes: 10, symptoms: 'Work stress building up' },
    { id: 'log-5',  date: '2026-09-16', mood: 2, moodLabel: 'Low', sleepHours: 5.5, waterLiters: 1.5, steps: 4300, exerciseMinutes: 0, symptoms: 'Poor sleep, anxious thoughts' },
    { id: 'log-4',  date: '2026-09-17', mood: 2, moodLabel: 'Low', sleepHours: 5.8, waterLiters: 1.6, steps: 4100, exerciseMinutes: 0, symptoms: 'Fatigue, heavy feeling in neck' },
    { id: 'log-3',  date: '2026-09-18', mood: 2, moodLabel: 'Low', sleepHours: 6.0, waterLiters: 1.7, steps: 4800, exerciseMinutes: 10, symptoms: 'Low motivation, headache' },
    { id: 'log-2',  date: '2026-09-19', mood: 3, moodLabel: 'Neutral', sleepHours: 7.0, waterLiters: 2.1, steps: 6400, exerciseMinutes: 20, symptoms: 'Slightly better after evening walk' },
    { id: 'log-1',  date: '2026-09-20', mood: 4, moodLabel: 'Good', sleepHours: 7.5, waterLiters: 2.4, steps: 7800, exerciseMinutes: 30, symptoms: 'Hydrated and refreshed' },
  ],
  triageHistory: [
    {
      id: 'intake-101',
      date: '2026-09-18T14:30:00Z',
      symptomSummary: 'Dull ache behind eyes and neck tightness for 2 days',
      urgency: 'Self-Care',
      urgencyColor: 'green',
      explanations: [
        'Tension-type headache often linked to screen strain or neck stiffness',
        'Dehydration or irregular sleep pattern effect',
        'Mild sinus congestion related to allergies'
      ],
      nextSteps: 'Rest in a dimly lit room, maintain 2.5L water intake, try warm neck compress, and take screen breaks every 30 mins.',
      messagesCount: 5,
    },
    {
      id: 'intake-102',
      date: '2026-09-10T09:15:00Z',
      symptomSummary: 'Sneezing, itchy nose, and watery eyes during pollen season',
      urgency: 'Self-Care',
      urgencyColor: 'green',
      explanations: [
        'Seasonal allergic rhinitis triggered by tree/grass pollen',
        'Environmental dust sensitivity'
      ],
      nextSteps: 'Consider over-the-counter antihistamines as advised by pharmacist, keep windows closed during high pollen hours.',
      messagesCount: 4,
    },
    {
      id: 'intake-103',
      date: '2026-08-25T11:00:00Z',
      symptomSummary: 'Mild wheezing after cold air exposure',
      urgency: 'See a Doctor Soon',
      urgencyColor: 'amber',
      explanations: [
        'Mild asthma airway hyper-reactivity triggered by cold weather',
        'Post-viral bronchial irritation'
      ],
      nextSteps: 'Use prescribed inhaler if available, avoid cold dry air, and consult pulmonologist or primary care physician.',
      messagesCount: 4,
    }
  ]
};

// Initialize Users Database if empty
function getUsersDB() {
  const data = localStorage.getItem(STORAGE_KEYS.USERS_DB);
  if (data) {
    return JSON.parse(data);
  }
  const initialDB = { [DEMO_USER.email]: DEMO_USER };
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(initialDB));
  return initialDB;
}

function saveUsersDB(db) {
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
}

// Auth API
export const getCurrentUser = () => {
  const email = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!email) return null;
  const db = getUsersDB();
  return db[email] || null;
};

export const loginUser = (email, password) => {
  const db = getUsersDB();
  const user = db[email?.toLowerCase()];
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.email);
  return user;
};

export const demoLoginUser = () => {
  const db = getUsersDB();
  // Ensure demo user exists
  if (!db[DEMO_USER.email]) {
    db[DEMO_USER.email] = DEMO_USER;
    saveUsersDB(db);
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, DEMO_USER.email);
  return db[DEMO_USER.email];
};

export const signupUser = (email, password, initialName) => {
  const db = getUsersDB();
  const lowerEmail = email.toLowerCase();
  if (db[lowerEmail]) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    email: lowerEmail,
    password,
    profile: {
      name: initialName || 'New Patient',
      age: 28,
      ageRange: '25-34',
      gender: 'Prefer not to say',
      existingConditions: [],
      medications: 'None',
      heightCm: 170,
      weightKg: 68,
      bmi: '23.5 (Normal)',
      allergies: 'None',
      emergencyContact: '',
      isOnboarded: false, // Triggers one-time onboarding wizard!
    },
    logs: [],
    triageHistory: [],
  };

  db[lowerEmail] = newUser;
  saveUsersDB(db);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, lowerEmail);
  return newUser;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const saveUserProfile = (newProfile) => {
  const user = getCurrentUser();
  if (!user) return null;

  const db = getUsersDB();
  const updatedUser = {
    ...user,
    profile: {
      ...user.profile,
      ...newProfile,
      isOnboarded: true,
    }
  };

  db[user.email] = updatedUser;
  saveUsersDB(db);
  return updatedUser.profile;
};

export const getWellnessLogs = () => {
  const user = getCurrentUser();
  return user ? user.logs || [] : DEMO_USER.logs;
};

export const saveWellnessLog = (logEntry) => {
  const user = getCurrentUser();
  if (!user) return [];

  const db = getUsersDB();
  const logs = user.logs || [];
  const existingIdx = logs.findIndex(l => l.date === logEntry.date);
  let updatedLogs;
  if (existingIdx >= 0) {
    updatedLogs = [...logs];
    updatedLogs[existingIdx] = { ...updatedLogs[existingIdx], ...logEntry };
  } else {
    updatedLogs = [{ id: `log-${Date.now()}`, ...logEntry }, ...logs];
  }

  db[user.email].logs = updatedLogs;
  saveUsersDB(db);
  return updatedLogs;
};

export const getTriageHistory = () => {
  const user = getCurrentUser();
  return user ? user.triageHistory || [] : DEMO_USER.triageHistory;
};

export const saveTriageEntry = (entry) => {
  const user = getCurrentUser();
  if (!user) return [];

  const db = getUsersDB();
  const history = user.triageHistory || [];
  const updated = [{ id: `intake-${Date.now()}`, date: new Date().toISOString(), ...entry }, ...history];

  db[user.email].triageHistory = updated;
  saveUsersDB(db);
  return updated;
};

export const resetAllData = () => {
  const user = getCurrentUser();
  if (!user) return null;

  const db = getUsersDB();
  if (user.email === DEMO_USER.email) {
    db[DEMO_USER.email] = JSON.parse(JSON.stringify(DEMO_USER));
  } else {
    db[user.email].logs = [];
    db[user.email].triageHistory = [];
  }

  saveUsersDB(db);
  return db[user.email];
};
