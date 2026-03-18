import React from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface GapAnalysisProps {
  data: AnalysisResult;
  targetRole: string;
}

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="#1e293b" strokeWidth="12" fill="none" />
        <circle
          cx="70" cy="70" r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-white">{score}%</div>
        <div className="text-xs text-slate-400">Ready</div>
      </div>
    </div>
  );
};

const SkillBadge: React.FC<{ skill: string; variant: 'have' | 'critical' | 'important' | 'nice' }> = ({ skill, variant }) => {
  const styles = {
    have: 'bg-green-900/40 text-green-300 border border-green-700/50',
    critical: 'bg-red-900/40 text-red-300 border border-red-700/50',
    important: 'bg-amber-900/40 text-amber-300 border border-amber-700/50',
    nice: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles[variant]}`}>
      {skill}
    </span>
  );
};

const GapSection: React.FC<{
  title: string;
  skills: string[];
  variant: 'critical' | 'important' | 'nice';
  icon: React.ReactNode;
}> = ({ title, skills, variant, icon }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-semibold text-slate-200 text-sm">{title}</h4>
        <span className="ml-auto text-xs text-slate-400">{skills.length} skills</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <SkillBadge key={skill} skill={skill} variant={variant} />
        ))}
      </div>
    </div>
  );
};

const GapAnalysis: React.FC<GapAnalysisProps> = ({ data, targetRole }) => {
  const totalCurrent = data.current_skills?.length || 0;
  const totalRequired = [
    ...(data.required_skills?.critical || []),
    ...(data.required_skills?.important || []),
    ...(data.required_skills?.nice_to_have || []),
  ].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <ScoreRing score={data.readiness_score} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">
              Readiness Score for <span className="text-indigo-400">{targetRole}</span>
            </h2>
            <p className="text-slate-300 leading-relaxed">{data.summary}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">{totalCurrent} skills you have</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">{totalRequired} skills required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Skills */}
      {data.current_skills && data.current_skills.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Your Current Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.current_skills.map(skill => (
              <SkillBadge key={skill} skill={skill} variant="have" />
            ))}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          Skill Gaps to Fill
        </h3>
        <div className="space-y-4">
          <GapSection
            title="Critical — Must have for this role"
            skills={data.skill_gaps?.critical || []}
            variant="critical"
            icon={<XCircle className="w-4 h-4 text-red-400" />}
          />
          <GapSection
            title="Important — Strongly recommended"
            skills={data.skill_gaps?.important || []}
            variant="important"
            icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
          />
          <GapSection
            title="Nice to Have — Will set you apart"
            skills={data.skill_gaps?.nice_to_have || []}
            variant="nice"
            icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
          />
        </div>
      </div>

      {/* Required Skills Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Full Skills Required for {targetRole}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['critical', 'important', 'nice_to_have'] as const).map((level) => {
            const skills = data.required_skills?.[level] || [];
            const labels = { critical: 'Critical', important: 'Important', nice_to_have: 'Nice to Have' };
            const currentSkillsLower = (data.current_skills || []).map(s => s.toLowerCase());
            return (
              <div key={level} className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <h4 className="font-medium text-slate-300 text-sm mb-3">{labels[level]}</h4>
                <div className="space-y-2">
                  {skills.map(skill => {
                    const have = currentSkillsLower.some(s => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s));
                    return (
                      <div key={skill} className="flex items-center gap-2 text-sm">
                        {have
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        }
                        <span className={have ? 'text-green-300 line-through' : 'text-slate-300'}>{skill}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GapAnalysis;
