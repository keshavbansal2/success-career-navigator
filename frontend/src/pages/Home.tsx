import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Map, MessageSquare, TrendingUp, Zap, Shield } from 'lucide-react';

const features = [
  {
    icon: <TrendingUp className="w-6 h-6 text-indigo-400" />,
    title: 'Skill Gap Analysis',
    description: 'AI identifies exactly which skills you need to reach your target role, categorized by priority.',
  },
  {
    icon: <Map className="w-6 h-6 text-purple-400" />,
    title: 'Personalized Roadmap',
    description: 'Get a step-by-step learning plan with curated resources, time estimates, and milestones.',
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
    title: 'Mock Interviews',
    description: 'Practice with AI-generated technical interview questions tailored to your specific role.',
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: 'Instant Analysis',
    description: 'Paste your resume or fill a quick form. Get your full analysis in under 30 seconds.',
  },
  {
    icon: <Shield className="w-6 h-6 text-green-400" />,
    title: 'Free Resources First',
    description: 'We prioritize free courses (YouTube, Coursera, GitHub) so you can start learning today.',
  },
];

const roles = ['Cloud Engineer', 'ML Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Scientist'];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
<h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Navigate Your{' '}
            <span className="gradient-text">Career Path</span>
            {' '}with AI
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume or fill a quick profile. Get an instant AI-powered skill gap analysis,
            personalized learning roadmap, and mock interview questions — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-indigo-500/25"
            >
              Analyze My Career Gap
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg"
            >
              See How It Works
            </a>
          </div>

          {/* Role pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-slate-500 flex items-center mr-2">Works for:</span>
            {roles.map(role => (
              <span key={role} className="text-sm bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full">
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need to Level Up</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            From gap analysis to interview prep, we've got your entire career transition covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 transition-colors group"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload Your Profile', desc: 'Paste your resume or fill in your skills, education, and experience in our quick form.' },
            { step: '02', title: 'AI Analysis', desc: 'AI analyzes your profile against the requirements of your target role.' },
            { step: '03', title: 'Get Your Roadmap', desc: 'Receive a detailed skill gap report, learning roadmap, and mock interview questions.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-6xl font-bold text-slate-800 mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-indigo-500/25"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
