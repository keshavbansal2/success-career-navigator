import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Map, MessageSquare, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';
import GapAnalysis from '../components/GapAnalysis';
import Roadmap from '../components/Roadmap';
import InterviewPrep from '../components/InterviewPrep';
import LoadingSpinner from '../components/LoadingSpinner';
import type { AnalysisResult, InterviewResult, ProfileData } from '../types';

const API_BASE = 'http://localhost:8000';

type Tab = 'gap' | 'roadmap' | 'interview';

const Analyze: React.FC = () => {
  const [step, setStep] = useState<'form' | 'results'>('form');
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
      setError('Could not connect to the backend. Make sure the server is running on port 8000. Showing demo data instead.');
      // Use mock data as fallback
      const mockResponse = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, resume_text: '' }),
      }).catch(() => null);

      if (mockResponse?.ok) {
        setAnalysis(await mockResponse.json());
      } else {
        // Hardcoded fallback
        setAnalysis({
          readiness_score: 62,
          current_skills: ['Python', 'Linux', 'Git', 'SQL', 'Bash scripting', 'Docker basics'],
          required_skills: {
            critical: ['AWS/GCP/Azure', 'Kubernetes', 'Terraform', 'CI/CD pipelines'],
            important: ['Monitoring & Observability', 'Networking fundamentals', 'Security best practices'],
            nice_to_have: ['ArgoCD', 'Service Mesh (Istio)', 'FinOps'],
          },
          skill_gaps: {
            critical: ['Kubernetes', 'Terraform', 'AWS certifications', 'CI/CD (GitHub Actions)'],
            important: ['Prometheus/Grafana', 'VPC/Subnet design', 'IAM & Security'],
            nice_to_have: ['ArgoCD', 'Istio', 'Cost optimization'],
          },
          roadmap: [
            {
              phase: 'Phase 1: Foundation (Weeks 1-2)',
              skills_to_learn: ['AWS Core Services', 'Linux deep dive', 'Networking basics'],
              resources: [
                { title: 'AWS Cloud Practitioner Essentials', url: 'https://aws.amazon.com/training/digital/', type: 'free', time: '6 hours', platform: 'AWS Training' },
                { title: 'Linux Command Line Crash Course', url: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', type: 'free', time: '5 hours', platform: 'YouTube' },
              ],
            },
            {
              phase: 'Phase 2: Core Cloud Skills (Month 1)',
              skills_to_learn: ['AWS EC2, S3, VPC', 'Terraform basics', 'Docker advanced'],
              resources: [
                { title: 'HashiCorp Terraform Associate Course', url: 'https://www.youtube.com/watch?v=SLB_c_ayRMo', type: 'free', time: '13 hours', platform: 'YouTube' },
                { title: 'AWS Solutions Architect Associate', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', type: 'paid', time: '27 hours', platform: 'Udemy' },
              ],
            },
          ],
          summary: 'You have a solid programming foundation. Focus on cloud infrastructure and Kubernetes to land a Cloud Engineer role.',
        });
      }
      setStep('results');
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

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <LoadingSpinner message="Analyzing your profile..." />
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Analyze Your Career Gap</h1>
          <p className="text-slate-400">Fill in your profile and target role to get personalized AI analysis.</p>
        </div>

        {error && (
          <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8">
          <ProfileForm onSubmit={handleAnalyze} isLoading={isAnalyzing} />
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
          <h1 className="text-2xl font-bold text-white">
            Results: <span className="text-indigo-400">{profile?.target_role}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-powered career gap analysis</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {error && (
        <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('gap')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'gap' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Gap Analysis</span>
          <span className="sm:hidden">Gaps</span>
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'roadmap' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'interview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
