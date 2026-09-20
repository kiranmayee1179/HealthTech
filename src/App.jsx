import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EmergencyModal from './components/EmergencyModal';

import LoginView from './views/LoginView';
import OnboardingView from './views/OnboardingView';
import LandingView from './views/LandingView';
import IntakeChatView from './views/IntakeChatView';
import WellnessDashboardView from './views/WellnessDashboardView';
import GuidancePlanView from './views/GuidancePlanView';
import MentalHealthView from './views/MentalHealthView';
import HistoryProfileView from './views/HistoryProfileView';

import { getCurrentUser, logoutUser, getWellnessLogs } from './utils/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('landing');
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [initialIntakeText, setInitialIntakeText] = useState('');
  
  // Emergency Modal State
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const activitySessionRef = useRef(null);

  const reportActivity = (endpoint, body, keepalive = false) => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/activity/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive,
    }).catch(() => {});
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setWellnessLogs(user.logs || []);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return undefined;

    const sessionId = `${currentUser.email}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activitySessionRef.current = sessionId;
    const activityUser = { email: currentUser.email, name: currentUser.profile?.name || 'Patient', sessionId };
    reportActivity('login', activityUser);

    const heartbeat = window.setInterval(() => {
      reportActivity('heartbeat', { sessionId });
    }, 30000);

    return () => {
      window.clearInterval(heartbeat);
    };
  }, [currentUser?.email]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setWellnessLogs(user.logs || []);
    if (user.profile?.isOnboarded) {
      setActiveTab('landing');
    }
  };

  const handleLogout = () => {
    if (activitySessionRef.current) {
      reportActivity('logout', { sessionId: activitySessionRef.current }, true);
      activitySessionRef.current = null;
    }
    logoutUser();
    setCurrentUser(null);
    setActiveTab('landing');
  };

  const handleTriggerEmergency = (data) => {
    setEmergencyData(data || null);
    setIsEmergencyOpen(true);
  };

  const handleStartIntakeWithText = (text) => {
    setInitialIntakeText(text);
    setActiveTab('intake');
  };

  // If not logged in -> Show LoginView
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-health-500 selection:text-white flex flex-col justify-between">
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <Footer onTriggerEmergency={() => handleTriggerEmergency()} />
        <EmergencyModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          data={emergencyData}
        />
      </div>
    );
  }

  // If logged in but first time setup -> Show OnboardingView
  if (currentUser && !currentUser.profile?.isOnboarded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-health-500 selection:text-white flex flex-col justify-between">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTriggerEmergency={() => handleTriggerEmergency()}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <OnboardingView
          userProfile={currentUser.profile}
          onCompleteOnboarding={(updatedProfile) => {
            setCurrentUser(prev => ({ ...prev, profile: updatedProfile }));
            setActiveTab('landing');
          }}
        />
        <Footer onTriggerEmergency={() => handleTriggerEmergency()} />
      </div>
    );
  }

  // Main Authenticated Application
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-health-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerEmergency={() => handleTriggerEmergency()}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Router Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'landing' && (
          <LandingView
            setActiveTab={setActiveTab}
            onStartIntakeWithText={handleStartIntakeWithText}
          />
        )}

        {activeTab === 'intake' && (
          <IntakeChatView
            initialPrompt={initialIntakeText}
            userProfile={currentUser.profile}
            onTriageComplete={() => {
              // Intakes auto-saved to localStorage
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <WellnessDashboardView
            userProfile={currentUser.profile}
            onUpdateLogs={(newLogs) => setWellnessLogs(newLogs)}
          />
        )}

        {activeTab === 'guidance' && (
          <GuidancePlanView
            logs={wellnessLogs}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'mental' && (
          <MentalHealthView
            userProfile={currentUser.profile}
          />
        )}

        {activeTab === 'history' && (
          <HistoryProfileView
            userProfile={currentUser.profile}
            onUpdateProfile={(updated) => {
              setCurrentUser(prev => ({ ...prev, profile: updated }));
            }}
            onDataReset={(resetUser) => {
              setCurrentUser(resetUser);
              setWellnessLogs(resetUser.logs || []);
            }}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Persistent Medical Disclaimer Footer */}
      <Footer onTriggerEmergency={() => handleTriggerEmergency()} />

      {/* High Priority Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        data={emergencyData}
      />

    </div>
  );
}
