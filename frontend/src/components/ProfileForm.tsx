import React, { useState } from 'react';
import { User, FileText, Github, Target, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { ProfileData } from '../types';

interface ProfileFormProps {
  onSubmit: (data: ProfileData) => void;
  isLoading: boolean;
  initialData?: ProfileData;
}

const SAMPLE_ROLES = [
  'Cloud Engineer',
  'ML Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Data Scientist',
  'Cybersecurity Analyst',
  'Mobile Developer',
  'Product Manager',
  'UI/UX Designer',
];

const SAMPLE_RESUME = `Name: Alex Johnson
Education: B.S. Computer Science, State University (2022)
Experience: 1 year as Junior Developer at TechCorp

Skills:
- Python (intermediate)
- JavaScript/React (beginner)
- SQL
- Git
- Linux basics
- Docker (basics)

Projects:
- Built a REST API with Flask
- Created a simple React todo app
- Automated some data processing scripts with Python

Certifications: None yet`;

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [inputMode, setInputMode] = useState<'resume' | 'form'>('resume');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<ProfileData>(initialData ?? {
    resume_text: '',
    target_role: '',
    github_url: '',
    name: '',
    education: '',
    experience: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_role.trim()) return;

    let resumeText = formData.resume_text;
    if (inputMode === 'form') {
      resumeText = [
        formData.name && `Name: ${formData.name}`,
        formData.education && `Education: ${formData.education}`,
        formData.experience && `Experience: ${formData.experience}`,
        formData.resume_text && `Additional Info: ${formData.resume_text}`,
      ].filter(Boolean).join('\n');
    }

    onSubmit({ ...formData, resume_text: resumeText || 'No profile provided - please analyze for a beginner.' });
  };

  const loadSample = () => {
    setFormData(prev => ({ ...prev, resume_text: SAMPLE_RESUME }));
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-white/5 rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setInputMode('resume')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'resume'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="inline w-4 h-4 mr-2" />
          Paste Resume
        </button>
        <button
          type="button"
          onClick={() => setInputMode('form')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'form'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="inline w-4 h-4 mr-2" />
          Fill Profile
        </button>
      </div>

      {/* Target Role */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Target className="inline w-4 h-4 mr-2 text-cyan-400" />
          Target Role <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          name="target_role"
          value={formData.target_role}
          onChange={handleChange}
          list="role-suggestions"
          placeholder="e.g., Cloud Engineer, ML Engineer, Frontend Developer"
          required
          className={inputClass}
        />
        <datalist id="role-suggestions">
          {SAMPLE_ROLES.map(role => <option key={role} value={role} />)}
        </datalist>
      </div>

      {inputMode === 'resume' ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-300">
              <FileText className="inline w-4 h-4 mr-2 text-cyan-400" />
              Resume / Profile Summary
            </label>
            <button
              type="button"
              onClick={loadSample}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Load sample profile
            </button>
          </div>
          <textarea
            name="resume_text"
            value={formData.resume_text}
            onChange={handleChange}
            rows={10}
            placeholder="Paste your resume text, list your skills, education, and experience here..."
            className={`${inputClass} resize-y`}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Alex Johnson" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Education</label>
            <input type="text" name="education" value={formData.education} onChange={handleChange} placeholder="B.S. Computer Science, University Name (Year)" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Experience & Skills</label>
            <textarea name="experience" value={formData.experience} onChange={handleChange} rows={4} placeholder="List your work experience, projects, and current skills..." className={`${inputClass} resize-y`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
            <textarea name="resume_text" value={formData.resume_text} onChange={handleChange} rows={3} placeholder="Certifications, side projects, etc." className={`${inputClass} resize-y`} />
          </div>
        </div>
      )}

      {/* Optional GitHub */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Optional: Add GitHub URL
        </button>
        {showAdvanced && (
          <div className="mt-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <Github className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                type="url"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                placeholder="https://github.com/yourusername"
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !formData.target_role.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 text-lg shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.01] flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        {isLoading ? 'Analyzing...' : 'Analyze My Career Gap'}
      </button>
    </form>
  );
};

export default ProfileForm;
