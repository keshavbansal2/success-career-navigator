import React from 'react';
import { ExternalLink, Clock, BookOpen, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import type { RoadmapPhase } from '../types';

interface RoadmapProps {
  phases: RoadmapPhase[];
}

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
    type === 'free'
      ? 'bg-green-900/50 text-green-300 border border-green-700/50'
      : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
  }`}>
    {type === 'free' ? 'Free' : 'Paid'}
  </span>
);

const PhaseCard: React.FC<{ phase: RoadmapPhase; index: number }> = ({ phase, index }) => {
  const [expanded, setExpanded] = React.useState(index === 0);

  const phaseColors = [
    'from-indigo-600 to-blue-600',
    'from-purple-600 to-indigo-600',
    'from-pink-600 to-purple-600',
    'from-emerald-600 to-teal-600',
  ];
  const color = phaseColors[index % phaseColors.length];

  return (
    <div className="relative">
      {/* Timeline connector */}
      {index > 0 && (
        <div className="absolute -top-6 left-6 w-0.5 h-6 bg-slate-700" />
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-750 transition-colors"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <span className="text-white font-bold text-lg">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg leading-tight">{phase.phase}</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {phase.skills_to_learn?.slice(0, 3).join(' · ')}
              {(phase.skills_to_learn?.length || 0) > 3 && ` +${phase.skills_to_learn.length - 3} more`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-slate-400 hidden sm:block">{phase.resources?.length || 0} resources</span>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 border-t border-slate-700">
            {/* Skills to learn */}
            {phase.skills_to_learn && phase.skills_to_learn.length > 0 && (
              <div className="pt-4 pb-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Skills to Learn
                </h4>
                <div className="flex flex-wrap gap-2">
                  {phase.skills_to_learn.map(skill => (
                    <span key={skill} className="bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-3 py-1 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {phase.resources && phase.resources.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Resources
                </h4>
                {phase.resources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-indigo-500/50 hover:bg-slate-850 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors text-sm">
                            {resource.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <TypeBadge type={resource.type} />
                          <span className="text-xs text-slate-400">{resource.platform}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
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
      <div className="text-center py-12 text-slate-400">
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
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h2 className="text-xl font-bold text-white mb-4">Your Personalized Learning Roadmap</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-900 rounded-xl p-3">
            <div className="text-2xl font-bold text-indigo-400">{phases.length}</div>
            <div className="text-xs text-slate-400 mt-1">Phases</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-400">{freeResources}</div>
            <div className="text-xs text-slate-400 mt-1">Free Resources</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-3">
            <div className="text-2xl font-bold text-purple-400">{totalResources}</div>
            <div className="text-xs text-slate-400 mt-1">Total Resources</div>
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
