import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, BarChart3 } from 'lucide-react';
import type { InterviewQuestion } from '../types';

interface InterviewPrepProps {
  questions: InterviewQuestion[];
  targetRole: string;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const styles = {
    Easy: 'bg-green-900/50 text-green-300 border border-green-700/50',
    Medium: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
    Hard: 'bg-red-900/50 text-red-300 border border-red-700/50',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[difficulty as keyof typeof styles] || styles.Medium}`}>
      {difficulty}
    </span>
  );
};

const QuestionCard: React.FC<{ question: InterviewQuestion; index: number }> = ({ question, index }) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-indigo-300 font-bold text-sm">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
              {question.category}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
          <p className="text-slate-100 font-medium leading-relaxed mb-4">{question.question}</p>
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showHint ? 'Hide Hint' : 'Show Hint / Key Concepts'}
          </button>
          {showHint && (
            <div className="mt-3 bg-indigo-950/50 border border-indigo-800/50 rounded-lg p-4">
              <p className="text-indigo-200 text-sm leading-relaxed">{question.hint}</p>
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
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          Mock Interview Questions
        </h2>
        <p className="text-slate-400 text-sm mb-4">AI-generated questions tailored for <span className="text-indigo-300">{targetRole}</span></p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
            <div key={diff} className="bg-slate-900 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${diff === 'Easy' ? 'text-green-400' : diff === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                {counts[diff]}
              </div>
              <div className="text-xs text-slate-400 mt-1">{diff}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Difficulty:</span>
            {difficulties.map(diff => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filterDifficulty === diff
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
          <div className="text-center py-12 text-slate-400">
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
