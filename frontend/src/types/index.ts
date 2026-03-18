export interface Resource {
  title: string;
  url: string;
  type: 'free' | 'paid';
  time: string;
  platform: string;
}

export interface RoadmapPhase {
  phase: string;
  skills_to_learn: string[];
  resources: Resource[];
}

export interface SkillCategories {
  critical: string[];
  important: string[];
  nice_to_have: string[];
}

export interface AnalysisResult {
  readiness_score: number;
  current_skills: string[];
  required_skills: SkillCategories;
  skill_gaps: SkillCategories;
  roadmap: RoadmapPhase[];
  summary: string;
}

export interface InterviewQuestion {
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  hint: string;
}

export interface InterviewResult {
  questions: InterviewQuestion[];
}

export interface ProfileData {
  resume_text: string;
  target_role: string;
  github_url?: string;
  name?: string;
  education?: string;
  experience?: string;
}
