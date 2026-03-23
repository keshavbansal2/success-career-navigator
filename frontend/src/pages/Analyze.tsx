import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Map, MessageSquare, RefreshCw, AlertTriangle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';
import GapAnalysis from '../components/GapAnalysis';
import Roadmap from '../components/Roadmap';
import InterviewPrep from '../components/InterviewPrep';
import LoadingSpinner from '../components/LoadingSpinner';
import type { AnalysisResult, InterviewResult, ProfileData } from '../types';

const API_BASE = 'http://localhost:8001';

type Tab = 'gap' | 'roadmap' | 'interview';

const Analyze: React.FC = () => {
  const [step, setStep] = useState<'form' | 'results' | 'edit'>('form');
  const [activeTab, setActiveTab] = useState<Tab>('gap');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [interview, setInterview] = useState<InterviewResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const handleAnalyze = async (data: ProfileData) => {
    setIsAnalyzing(true);
    setError(null);
    setProfile(data);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
      setStep('results');
      setActiveTab('gap');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Could not connect to the backend. Make sure the server is running on port 8001.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadInterviewQuestions = async () => {
    if (!profile || !analysis) return;
    setIsLoadingInterview(true);
    setActiveTab('interview');

    try {
      const allGaps = [
        ...(analysis.skill_gaps?.critical || []),
        ...(analysis.skill_gaps?.important || []),
      ];

      const response = await fetch(`${API_BASE}/api/interview-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: profile.resume_text,
          target_role: profile.target_role,
          skill_gaps: allGaps.slice(0, 6),
        }),
      });

      if (!response.ok) throw new Error('Failed to load interview questions');
      const result: InterviewResult = await response.json();
      setInterview(result);
    } catch (err) {
      console.error('Interview questions failed:', err);
      setInterview({
        questions: [
          { category: 'Technical', difficulty: 'Medium', question: `Explain the core concepts required for a ${profile?.target_role || 'this'} role.`, hint: 'Focus on the fundamental architecture and key tools in the field.' },
          { category: 'System Design', difficulty: 'Hard', question: 'Design a scalable, fault-tolerant system for a high-traffic application.', hint: 'Discuss load balancing, redundancy, monitoring, and disaster recovery.' },
          { category: 'Behavioral', difficulty: 'Easy', question: 'Tell me about a challenging technical problem you solved.', hint: 'Use the STAR method: Situation, Task, Action, Result.' },
        ],
      });
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setAnalysis(null);
    setInterview(null);
    setProfile(null);
    setError(null);
    setActiveTab('gap');
  };

  const handleEditProfile = () => {
    setStep('edit');
    setError(null);
  };

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <LoadingSpinner message="Analyzing your profile..." />
      </div>
    );
  }

  if (step === 'form' || step === 'edit') {
    const isEditMode = step === 'edit';
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          {isEditMode ? (
            <button
              onClick={() => setStep('results')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Results
            </button>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          )}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isEditMode ? 'Edit Your Profile' : 'Analyze Your Career Gap'}
          </h1>
          <p className="text-slate-500">
            {isEditMode
              ? 'Update your details and re-run the analysis.'
              : 'Fill in your profile and target role to get personalized analysis.'}
          </p>
        </div>

        {error && (
          <div className="glass bg-rose-950/30 border-rose-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-200 text-sm">{error}</p>
          </div>
        )}

        <div className="glass rounded-2xl p-6 md:p-8">
          <ProfileForm
            onSubmit={handleAnalyze}
            isLoading={isAnalyzing}
            initialData={isEditMode ? profile ?? undefined : undefined}
          />
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Results: <span className="gradient-text">{profile?.target_role}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Smart career gap analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEditProfile}
            className="flex items-center gap-2 glass hover:bg-white/10 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 glass hover:bg-white/10 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </div>

      {error && (
        <div className="glass bg-rose-950/30 border-rose-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-rose-200 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-2xl p-1.5 mb-6">
        <button
          onClick={() => setActiveTab('gap')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'gap'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Gap Analysis</span>
          <span className="sm:hidden">Gaps</span>
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'roadmap'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Map className="w-4 h-4" />
          <span className="hidden sm:inline">Learning Roadmap</span>
          <span className="sm:hidden">Roadmap</span>
        </button>
        <button
          onClick={() => {
            if (!interview) {
              handleLoadInterviewQuestions();
            } else {
              setActiveTab('interview');
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'interview'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Interview Prep</span>
          <span className="sm:hidden">Interview</span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'gap' && analysis && (
        <GapAnalysis data={analysis} targetRole={profile?.target_role || ''} />
      )}
      {activeTab === 'roadmap' && analysis && (
        <Roadmap phases={analysis.roadmap} />
      )}
      {activeTab === 'interview' && (
        isLoadingInterview
          ? <LoadingSpinner message="Generating interview questions..." />
          : interview
            ? <InterviewPrep questions={interview.questions} targetRole={profile?.target_role || ''} />
            : null
      )}
    </div>
  );
};

export default Analyze;
