import React from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface GapAnalysisProps {
  data: AnalysisResult;
  targetRole: string;
}

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const glowColor = score >= 70 ? 'rgba(16,185,129,0.3)' : score >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow ring */}
      <div
        className="absolute w-36 h-36 rounded-full animate-pulse-ring"
        style={{ boxShadow: `0 0 40px ${glowColor}` }}
      />
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
        <circle
          cx="70" cy="70" r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-white">{score}%</div>
        <div className="text-xs text-slate-500">Ready</div>
      </div>
    </div>
  );
};

const SkillBadge: React.FC<{ skill: string; variant: 'have' | 'critical' | 'important' | 'nice' }> = ({ skill, variant }) => {
  const styles = {
    have: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    critical: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    important: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    nice: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
  };
  return (
    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium ${styles[variant]}`}>
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
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-semibold text-slate-300 text-sm">{title}</h4>
        <span className="ml-auto text-xs text-slate-600">{skills.length} skills</span>
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
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle gradient decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-600/10 to-transparent rounded-bl-full" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <ScoreRing score={data.readiness_score} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Readiness for <span className="gradient-text">{targetRole}</span>
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">{data.summary}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-400">{totalCurrent} skills matched</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-slate-400">{totalRequired} skills required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Skills */}
      {data.current_skills && data.current_skills.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
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
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-400" />
          Skill Gaps to Fill
        </h3>
        <div className="space-y-4">
          <GapSection
            title="Critical — Must have for this role"
            skills={data.skill_gaps?.critical || []}
            variant="critical"
            icon={<XCircle className="w-4 h-4 text-rose-400" />}
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
            icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
          />
        </div>
      </div>

      {/* Required Skills Overview */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Full Skills Required for {targetRole}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['critical', 'important', 'nice_to_have'] as const).map((level) => {
            const skills = data.required_skills?.[level] || [];
            const labels = { critical: 'Critical', important: 'Important', nice_to_have: 'Nice to Have' };
            const colors = { critical: 'text-rose-400', important: 'text-amber-400', nice_to_have: 'text-cyan-400' };
            const currentSkillsLower = (data.current_skills || []).map(s => s.toLowerCase());
            return (
              <div key={level} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <h4 className={`font-medium text-sm mb-3 ${colors[level]}`}>{labels[level]}</h4>
                <div className="space-y-2">
                  {skills.map(skill => {
                    const have = currentSkillsLower.some(s => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s));
                    return (
                      <div key={skill} className="flex items-center gap-2 text-sm">
                        {have
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-rose-400/60 flex-shrink-0" />
                        }
                        <span className={have ? 'text-emerald-300 line-through opacity-70' : 'text-slate-400'}>{skill}</span>
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
