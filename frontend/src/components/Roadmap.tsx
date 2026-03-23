import React from 'react';
import { ExternalLink, Clock, BookOpen, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import type { RoadmapPhase } from '../types';

interface RoadmapProps {
  phases: RoadmapPhase[];
}

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
    type === 'free'
      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
  }`}>
    {type === 'free' ? 'Free' : 'Paid'}
  </span>
);

const PhaseCard: React.FC<{ phase: RoadmapPhase; index: number }> = ({ phase, index }) => {
  const [expanded, setExpanded] = React.useState(index === 0);

  const phaseColors = [
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-500',
  ];
  const color = phaseColors[index % phaseColors.length];

  return (
    <div className="relative">
      {/* Timeline connector */}
      {index > 0 && (
        <div className="absolute -top-6 left-6 w-px h-6 bg-gradient-to-b from-transparent to-white/10" />
      )}

      <div className="glass rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-5 text-left transition-colors"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <span className="text-white font-bold text-lg">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg leading-tight">{phase.phase}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {phase.skills_to_learn?.slice(0, 3).join(' · ')}
              {(phase.skills_to_learn?.length || 0) > 3 && ` +${phase.skills_to_learn.length - 3} more`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-slate-600 hidden sm:block">{phase.resources?.length || 0} resources</span>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 border-t border-white/5">
            {phase.skills_to_learn && phase.skills_to_learn.length > 0 && (
              <div className="pt-4 pb-4">
                <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Skills to Learn
                </h4>
                <div className="flex flex-wrap gap-2">
                  {phase.skills_to_learn.map(skill => (
                    <span key={skill} className="bg-violet-500/10 text-violet-300 border border-violet-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {phase.resources && phase.resources.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Resources
                </h4>
                {phase.resources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] hover:border-violet-500/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-slate-300 group-hover:text-violet-300 transition-colors text-sm">
                            {resource.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <TypeBadge type={resource.type} />
                          <span className="text-xs text-slate-500">{resource.platform}</span>
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {resource.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Roadmap: React.FC<RoadmapProps> = ({ phases }) => {
  if (!phases || phases.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No roadmap data available</p>
      </div>
    );
  }

  const totalResources = phases.reduce((sum, p) => sum + (p.resources?.length || 0), 0);
  const freeResources = phases.reduce(
    (sum, p) => sum + (p.resources?.filter(r => r.type === 'free').length || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Your Personalized Learning Roadmap</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="text-2xl font-bold text-cyan-400">{phases.length}</div>
            <div className="text-xs text-slate-500 mt-1">Phases</div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="text-2xl font-bold text-emerald-400">{freeResources}</div>
            <div className="text-xs text-slate-500 mt-1">Free Resources</div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="text-2xl font-bold text-violet-400">{totalResources}</div>
            <div className="text-xs text-slate-500 mt-1">Total Resources</div>
          </div>
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-6">
        {phases.map((phase, index) => (
          <PhaseCard key={index} phase={phase} index={index} />
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
