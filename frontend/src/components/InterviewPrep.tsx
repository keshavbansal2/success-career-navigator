import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, BarChart3, Sparkles } from 'lucide-react';
import type { InterviewQuestion } from '../types';

interface InterviewPrepProps {
  questions: InterviewQuestion[];
  targetRole: string;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const styles = {
    Easy: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${styles[difficulty as keyof typeof styles] || styles.Medium}`}>
      {difficulty}
    </span>
  );
};

const QuestionCard: React.FC<{ question: InterviewQuestion; index: number }> = ({ question, index }) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="glass rounded-xl p-5 hover:bg-white/[0.04] transition-all">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-violet-500/10">
          <span className="text-white font-bold text-sm">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              {question.category}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
          <p className="text-slate-200 font-medium leading-relaxed mb-4">{question.question}</p>
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showHint ? 'Hide Hint' : 'Show Hint / Key Concepts'}
          </button>
          {showHint && (
            <div className="mt-3 bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <p className="text-violet-200/80 text-sm leading-relaxed">{question.hint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions, targetRole }) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(questions.map(q => q.category)))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filtered = questions.filter(q => {
    const catMatch = filterCategory === 'All' || q.category === filterCategory;
    const diffMatch = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    return catMatch && diffMatch;
  });

  const counts = {
    Easy: questions.filter(q => q.difficulty === 'Easy').length,
    Medium: questions.filter(q => q.difficulty === 'Medium').length,
    Hard: questions.filter(q => q.difficulty === 'Hard').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2 tracking-tight">
          <Sparkles className="w-5 h-5 text-violet-400" />
          Mock Interview Questions
        </h2>
        <p className="text-slate-500 text-sm mb-4">Tailored for <span className="text-cyan-400">{targetRole}</span></p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
            <div key={diff} className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <div className={`text-2xl font-bold ${diff === 'Easy' ? 'text-emerald-400' : diff === 'Medium' ? 'text-amber-400' : 'text-rose-400'}`}>
                {counts[diff]}
              </div>
              <div className="text-xs text-slate-500 mt-1">{diff}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-600">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1 rounded-lg transition-all ${
                  filterCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/10'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 ml-6">Difficulty:</span>
            {difficulties.map(diff => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`text-xs px-3 py-1 rounded-lg transition-all ${
                  filterDifficulty === diff
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/10'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No questions match your filters</p>
          </div>
        ) : (
          filtered.map((question, index) => (
            <QuestionCard key={index} question={question} index={index} />
          ))
        )}
      </div>
    </div>
  );
};

export default InterviewPrep;
