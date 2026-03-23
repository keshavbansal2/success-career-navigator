import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Map, MessageSquare, TrendingUp, Zap, Shield, Sparkles, Target, Rocket } from 'lucide-react';

const features = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-cyan-500 to-blue-500',
    glow: 'group-hover:shadow-cyan-500/20',
    title: 'Skill Gap Analysis',
    description: 'Identifies exactly which skills you need for your target role, categorized by priority.',
  },
  {
    icon: <Map className="w-6 h-6" />,
    color: 'from-violet-500 to-purple-500',
    glow: 'group-hover:shadow-violet-500/20',
    title: 'Personalized Roadmap',
    description: 'Step-by-step learning plan with curated resources, time estimates, and milestones.',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-500',
    glow: 'group-hover:shadow-pink-500/20',
    title: 'Mock Interviews',
    description: 'Practice with AI-generated technical interview questions tailored to your role.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-500',
    glow: 'group-hover:shadow-amber-500/20',
    title: 'Instant Analysis',
    description: 'Paste your resume or fill a quick form. Get your full analysis in seconds.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    color: 'from-emerald-500 to-green-500',
    glow: 'group-hover:shadow-emerald-500/20',
    title: 'Free Resources First',
    description: 'Prioritizes free courses from YouTube, Coursera, and official docs.',
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    color: 'from-indigo-500 to-violet-500',
    glow: 'group-hover:shadow-indigo-500/20',
    title: '12+ Roles Supported',
    description: 'From Cloud Engineer to Data Scientist, ML Engineer, and beyond.',
  },
];

const roles = ['Cloud Engineer', 'ML Engineer', 'Frontend Dev', 'Backend Dev', 'DevOps', 'Data Scientist', 'Full Stack', 'Cybersecurity'];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Extra decorative elements */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute top-32 right-20 w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-slate-300">AI-Powered Career Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            Navigate Your
            <br />
            <span className="gradient-text">Career Path</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Upload your resume, get an instant skill gap analysis, personalized learning
            roadmap, and mock interview questions — all powered by smart matching.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/analyze"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 text-lg shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
            >
              Analyze My Career Gap
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 glass hover:bg-white/10 text-slate-200 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 text-lg hover:scale-[1.02]"
            >
              See How It Works
            </a>
          </div>

          {/* Role pills */}
          <div className="mt-14 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-slate-600 flex items-center mr-1">
              <Target className="w-3.5 h-3.5 mr-1" />
              Supports:
            </span>
            {roles.map(role => (
              <span
                key={role}
                className="text-sm glass text-slate-400 px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors cursor-default"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Everything You Need to{' '}
            <span className="gradient-text">Level Up</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            From gap analysis to interview prep — your entire career transition, covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group glass rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-xl ${feature.glow}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload Your Profile', desc: 'Paste your resume or fill in your skills, education, and experience.', color: 'text-cyan-500', border: 'border-cyan-500/20' },
            { step: '02', title: 'Smart Analysis', desc: 'Our engine analyzes your profile against real requirements for your target role.', color: 'text-violet-500', border: 'border-violet-500/20' },
            { step: '03', title: 'Get Your Roadmap', desc: 'Receive a detailed gap report, learning roadmap, and mock interview questions.', color: 'text-pink-500', border: 'border-pink-500/20' },
          ].map((item) => (
            <div key={item.step} className="text-center group">
              <div className={`text-7xl font-bold ${item.color} opacity-20 mb-4 group-hover:opacity-40 transition-opacity`}>{item.step}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-16">
          <Link
            to="/analyze"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 text-lg shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
