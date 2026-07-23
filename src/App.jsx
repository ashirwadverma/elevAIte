import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Cpu,
  Download,
  FileText,
  GraduationCap,
  LoaderCircle,
  Menu,
  MessageCircleMore,
  Moon,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  TrendingUp,
  Trophy,
  UploadCloud,
  UserCircle2,
  X
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const features = [
  {
    title: 'AI Resume ATS Checker',
    subtitle: 'Optimize every resume for recruiter screens.',
    points: ['ATS Score', 'Keyword Match', 'Formatting', 'Missing Skills', 'Suggestions']
  },
  {
    title: 'AI Mock Interview',
    subtitle: 'Practice technical, HR, and behavioral rounds.',
    points: ['Technical', 'HR', 'Behavioral', 'System Design', 'Coding']
  },
  {
    title: 'Skill Gap Analysis',
    subtitle: 'Compare your current skills with target roles.',
    points: ['Skill Match %', 'Missing Technologies', 'Difficulty', 'Learning Time']
  },
  {
    title: 'Personalized Roadmaps',
    subtitle: 'Follow a week-by-week plan with projects and resources.',
    points: ['Weekly Plan', 'Practice Questions', 'Videos', 'Projects']
  }
];

const stats = [
  { value: '50K+', label: 'Students' },
  { value: '5K+', label: 'Resumes Reviewed' },
  { value: '92%', label: 'Interview Success' },
  { value: '100+', label: 'Career Paths' }
];

const testimonials = [
  {
    quote: 'The resume analyzer helped me land interviews at top product companies.',
    name: 'Aisha Rao',
    role: 'Computer Science @ IIT Delhi',
    rating: 5
  },
  {
    quote: 'The mock interviews felt real and dramatically improved my confidence.',
    name: 'Rohan K.',
    role: 'Design @ NIFT',
    rating: 5
  }
];

const faqItems = [
  { question: 'What does CareerPilot AI include?', answer: 'Resume analysis, mock interview coaching, skill gap insights, personalized roadmaps, and premium internship recommendations.' },
  { question: 'Is it suitable for students?', answer: 'Yes, it is designed for students and early-career professionals who want to accelerate their job search.' },
  { question: 'Can I use it for free?', answer: 'A free plan includes resume and roadmap support, while premium unlocks interviews and advanced recommendations.' }
];

const roadmapData = [
  { week: 'Week 1', topics: 'Core fundamentals', resources: 'Videos + Notes', projects: 'Mini portfolio', progress: 70 },
  { week: 'Week 2', topics: 'Practical implementation', resources: 'Articles + Labs', projects: 'Case study', progress: 45 },
  { week: 'Week 3', topics: 'Interview preparation', resources: 'Mock drills', projects: 'Live project', progress: 25 },
  { week: 'Week 4', topics: 'Portfolio polish', resources: 'Review guides', projects: 'Final demo', progress: 10 }
];

const analyticsData = [
  { name: 'Mon', score: 72 },
  { name: 'Tue', score: 78 },
  { name: 'Wed', score: 81 },
  { name: 'Thu', score: 79 },
  { name: 'Fri', score: 88 },
  { name: 'Sat', score: 92 },
  { name: 'Sun', score: 90 }
];

const commandItems = [
  { label: 'Go to Home', path: '/' },
  { label: 'Open Resume Analyzer', path: '/resume-analyzer' },
  { label: 'Start Mock Interview', path: '/mock-interview' },
  { label: 'View Pricing', path: '/pricing' }
];

function LogoMark() {
  return (
    <motion.div
      initial={{ scale: 0.95, y: 0 }}
      animate={{ scale: [0.95, 1.04, 0.98, 1], y: [0, -3, 0, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-cyan-400/25 via-cyan-300/20 to-fuchsia-500/30 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
    >
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <TrendingUp className="relative h-5 w-5 text-cyan-200" />
    </motion.div>
  );
}

const radarData = [
  { subject: 'React', value: 88 },
  { subject: 'DSA', value: 74 },
  { subject: 'System Design', value: 68 },
  { subject: 'Communication', value: 82 },
  { subject: 'AI Fluency', value: 90 }
];

const STORAGE_KEY = 'elevAIte-usage';
const defaultUsage = {
  resumeAnalyzer: 1,
  mockInterview: 1,
  skillGapRoadmap: 1,
  internshipRecommendation: 0
};

function readUsage() {
  if (typeof window === 'undefined') return defaultUsage;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultUsage, ...JSON.parse(stored) } : defaultUsage;
  } catch {
    return defaultUsage;
  }
}

function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [faqOpen, setFaqOpen] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [usageMetrics, setUsageMetrics] = useState(readUsage);
  const location = useLocation();

  const navItems = ['Home', 'Resume Analyzer', 'Mock Interview', 'Skill Gap Analysis', 'Learning Roadmap', 'Dashboard', 'Pricing', 'About', 'Contact'];

  const bumpUsage = (key) => {
    setUsageMetrics((prev) => {
      const next = { ...prev, [key]: prev[key] + 1 };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const handleMove = (event) => setCursorPos({ x: event.clientX, y: event.clientY });
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#060816] text-slate-100 transition-colors duration-300">
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
          <div className="absolute h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" style={{ transform: `translate(${cursorPos.x - 128}px, ${cursorPos.y - 128}px)` }} />
        </div>

        <div className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-xl items-center justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#060816]/80 px-3 py-2 text-sm text-slate-300 shadow-soft backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>AI-powered career acceleration is live</span>
          </div>
        </div>

        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-[#060816]/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
              <LogoMark />
              <span className="font-['Poppins'] text-white">elevAIte</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
              {navItems.map((item) => {
                const to = `/${item.toLowerCase().replace(/ /g, '-')}`;
                const path = to === '/' ? '/' : to;
                return (
                  <NavLink key={item} to={path === '/' ? '/' : path} className={({ isActive }) => `transition hover:text-cyan-300 ${isActive ? 'text-cyan-300' : ''}`}>
                    {item}
                  </NavLink>
                );
              })}
            </nav>
            <div className="hidden items-center gap-3 lg:flex">
              <button onClick={() => setCommandOpen(true)} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200">⌘K Search</button>
              <button onClick={() => setDarkMode(!darkMode)} className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-200">
                {darkMode ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link to="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm">Login</Link>
              <Link to="/signup" className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">Sign Up</Link>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-white/10 bg-white/10 p-2 lg:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="border-t border-white/10 bg-[#060816]/95 px-4 py-4 lg:hidden">
              <div className="flex flex-col gap-3 text-sm text-slate-300">
                {navItems.map((item) => {
                  const to = `/${item.toLowerCase().replace(/ /g, '-')}`;
                  return <NavLink key={item} to={to === '/' ? '/' : to} onClick={() => setMenuOpen(false)} className="hover:text-cyan-300">{item}</NavLink>;
                })}
              </div>
            </div>
          )}
        </header>

        <AnimatePresence>
          {commandOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-start justify-center bg-[#02040d]/70 px-4 pt-24 backdrop-blur-md">
              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="w-full max-w-xl rounded-[24px] border border-white/10 bg-[#090d20]/95 p-4 shadow-2xl">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <input autoFocus className="w-full bg-transparent text-sm text-white outline-none" placeholder="Search pages or features" />
                </div>
                <div className="mt-3 space-y-2">
                  {commandItems.map((item) => (
                    <Link key={item.label} to={item.path} onClick={() => setCommandOpen(false)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300 hover:text-white">
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4 text-cyan-300" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Routes>
                <Route path="/" element={<HomePage faqOpen={faqOpen} setFaqOpen={setFaqOpen} />} />
                <Route path="/resume-analyzer" element={<ResumeAnalyzerPage onUsageUpdate={bumpUsage} />} />
                <Route path="/mock-interview" element={<MockInterviewPage onUsageUpdate={bumpUsage} />} />
                <Route path="/skill-gap-analysis" element={<SkillGapAnalysisPage onUsageUpdate={bumpUsage} />} />
                <Route path="/learning-roadmap" element={<RoadmapPage />} />
                <Route path="/dashboard" element={<DashboardPage usageMetrics={usageMetrics} />} />
                <Route path="/pricing" element={<PricingPage onUsageUpdate={bumpUsage} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<AuthPage type="login" />} />
                <Route path="/signup" element={<AuthPage type="signup" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setChatOpen(!chatOpen)} className="fixed bottom-6 right-6 z-40 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-400 to-violet-500 p-4 text-white shadow-soft">
          <MessageCircleMore className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-24 right-6 z-40 w-[320px] rounded-[24px] border border-white/10 bg-[#090d20]/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">CareerPilot Assistant</p>
                  <p className="text-xs text-slate-400">Ask anything about your path</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="rounded-full border border-white/10 p-2 text-slate-300"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                “I can help you review your resume, prep for interviews, and suggest next steps.”
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">
                <BrainCircuit className="h-4 w-4" /> Start AI Chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="border-t border-white/10 bg-black/20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 p-2">
                  <BrainCircuit className="h-5 w-5 text-cyan-300" />
                </div>
                <span className="font-['Poppins'] text-lg text-white">elevAIte</span>
              </div>
              <p className="text-sm text-slate-400">A premium AI career accelerator for students and professionals.</p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-white">Quick Links</h3>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <Link to="/resume-analyzer" className="hover:text-cyan-300">Resume Analyzer</Link>
                <Link to="/mock-interview" className="hover:text-cyan-300">Mock Interviews</Link>
                <Link to="/pricing" className="hover:text-cyan-300">Pricing</Link>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-white">Support</h3>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <a href="mailto:hello@careerpilot.ai" className="hover:text-cyan-300">hello@careerpilot.ai</a>
                <a href="https://linkedin.com" className="hover:text-cyan-300">LinkedIn</a>
                <a href="https://github.com" className="hover:text-cyan-300">GitHub</a>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-white">Newsletter</h3>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <input placeholder="Email address" className="w-full rounded-xl border border-white/10 bg-[#050814] px-3 py-2 text-sm text-white outline-none" />
                <button className="mt-3 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold">Subscribe <Send className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-4 py-6 text-center text-sm text-slate-500">© 2026 elevAIte. Crafted for ambitious builders.</div>
        </footer>
      </div>
    </div>
  );
}

function HomePage({ faqOpen, setFaqOpen }) {
  return (
    <div>
      <section className="relative isolate mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              <Sparkles className="h-4 w-4" /> AI Career Accelerator
            </div>
            <h1 className="max-w-3xl font-['Poppins'] text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
              Accelerate Your Career with AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Analyze your resume, master interviews, identify skill gaps, generate personalized learning roadmaps, and land your dream internship with AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-white shadow-soft">Get Started <ArrowRight className="h-4 w-4" /></Link>
              <a href="#features" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 font-semibold text-white">Watch Demo <Play className="h-4 w-4" /></a>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cyan-500/30 via-violet-600/20 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
              <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-cyan-400/30" />
              <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-300">AI Copilot Ready</p>
                    <h3 className="mt-1 text-xl font-semibold">Career acceleration engine</h3>
                  </div>
                  <div className="rounded-full bg-cyan-400/10 p-3 text-cyan-300"><Cpu className="h-6 w-6" /></div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-cyan-400/20 p-3 text-cyan-300"><GraduationCap className="h-6 w-6" /></div>
                    <div>
                      <p className="text-sm text-slate-400">Launch readiness</p>
                      <p className="text-lg font-semibold text-white">94% profile match</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Resume score</p>
                    <p className="mt-1 text-2xl font-semibold text-white">88</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Mock interview</p>
                    <p className="mt-1 text-2xl font-semibold text-white">91</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Core features</p>
          <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold sm:text-4xl">Everything you need to outshine the competition</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }} className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-300"><Sparkles className="h-5 w-5" /></div>
                <div className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">AI Powered</div>
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{feature.subtitle}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> {point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8 shadow-soft backdrop-blur-2xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Premium unlock</p>
              <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold">Internship recommendations are reserved for premium members</h2>
              <p className="mt-4 max-w-xl text-slate-400">Unlock the full AI career accelerator with mentor support, unlimited interviews, and internship opportunities curated for your profile.</p>
              <Link to="/pricing" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-white">Upgrade to Premium <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Premium status</p>
                  <p className="text-lg font-semibold text-white">CareerPilot Pro</p>
                </div>
                <div className="rounded-full bg-violet-500/20 p-3 text-violet-200"><Trophy className="h-6 w-6" /></div>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-300">
                {['Unlimited interviews', 'Advanced AI resume insights', 'Dedicated analyst support', 'VIP internship alerts'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Testimonials</p>
          <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold sm:text-4xl">Loved by ambitious students</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item, index) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.08 }} className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-1 text-amber-400">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-5 text-lg text-slate-200">“{item.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 font-semibold">{item.name[0]}</div>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">FAQ</p>
            <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold">Common questions, answered clearly</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={item.question} className="rounded-2xl border border-white/10 bg-[#090d20] p-4">
                <button onClick={() => setFaqOpen(index === faqOpen ? -1 : index)} className="flex w-full items-center justify-between text-left">
                  <span className="font-semibold text-white">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 text-cyan-300 transition ${index === faqOpen ? 'rotate-180' : ''}`} />
                </button>
                {index === faqOpen && <p className="mt-3 text-sm text-slate-400">{item.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ResumeAnalyzerPage({ onUsageUpdate }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const steps = [
    'Uploading Resume',
    'Extracting Text',
    'Reading Resume',
    'Checking ATS Compatibility',
    'Finding Missing Keywords',
    'Analyzing Skills',
    'Generating Suggestions',
    'Preparing Final Report'
  ];

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const acceptedExtensions = ['.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    const isAccepted = allowedTypes.includes(file.type) || acceptedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAccepted) {
      setError('Only PDF and DOCX resumes are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Files must be 10 MB or smaller.');
      return;
    }

    const uploadTime = new Date().toLocaleString();
    const fileType = fileName.endsWith('.pdf') ? 'PDF' : 'DOCX';

    setUploadedFile({
      name: file.name,
      type: fileType,
      size: file.size,
      sizeLabel: formatFileSize(file.size),
      uploadedAt: uploadTime
    });
    setError('');
    setShowAnalysis(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingStep(0);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const triggerPicker = () => fileInputRef.current?.click();

  const startAnalysis = () => {
    if (!uploadedFile) return;
    onUsageUpdate('resumeAnalyzer');
    setIsProcessing(true);
    setShowAnalysis(false);
    setProgress(0);
    setProcessingStep(0);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setError('');
    setShowAnalysis(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingStep(0);
  };

  useEffect(() => {
    if (!isProcessing) return;

    let currentIndex = 0;
    const interval = window.setInterval(() => {
      currentIndex += 1;
      setProcessingStep(currentIndex);
      setProgress(Math.round((currentIndex / steps.length) * 100));

      if (currentIndex >= steps.length) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          setProgress(100);
          setShowAnalysis(true);
          setIsProcessing(false);
        }, 500);
      }
    }, 850);

    return () => window.clearInterval(interval);
  }, [isProcessing]);

  const analysisStats = [
    { label: 'ATS Score', value: '92/100', accent: 'text-cyan-200' },
    { label: 'Resume Score', value: '88/100', accent: 'text-violet-200' },
    { label: 'Keyword Match', value: '84%', accent: 'text-emerald-200' },
    { label: 'Grammar', value: '9.1/10', accent: 'text-amber-200' }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">AI Resume Analyzer</p>
        <h1 className="mt-4 font-['Poppins'] text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Upload your resume and receive a premium ATS review
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Get AI-powered feedback on ATS compatibility, missing keywords, skill gaps, and resume improvement suggestions in minutes.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-[0_0_80px_rgba(14,165,233,0.12)] backdrop-blur-2xl sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%)]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Upload Resume</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Drag & drop your resume</h2>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">PDF / DOCX • 10 MB max</div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-8 rounded-[28px] border p-8 text-center transition-all duration-300 sm:p-10 ${isDragging ? 'border-cyan-300 bg-cyan-400/15 shadow-[0_0_38px_rgba(34,211,238,0.22)]' : 'border-dashed border-cyan-400/30 bg-cyan-400/10'}`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                <UploadCloud className="h-8 w-8" />
              </div>
              <p className="mt-6 text-xl font-semibold text-white">Drop your resume here</p>
              <p className="mt-2 text-sm text-slate-400">or browse files to upload a PDF or DOCX document.</p>
              <button onClick={triggerPicker} className="mt-6 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.2)]">Browse Files</button>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
              <p className="mt-5 text-sm text-slate-400">Supported formats: PDF • DOCX</p>
            </motion.div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
          {!uploadedFile && !isProcessing && !showAnalysis && (
            <div className="rounded-[32px] border border-white/10 bg-[#090d20]/90 p-6 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-violet-400/30 bg-violet-400/10 p-3 text-violet-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">Ready to review</p>
                  <p className="mt-1 text-lg font-semibold text-white">Your AI analysis will be instant and actionable.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {['ATS optimization checks', 'Keyword gap insights', 'Skills recommendations', 'Formatting feedback'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">{item}</div>
                ))}
              </div>
            </div>
          )}

          {uploadedFile && !isProcessing && !showAnalysis && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-emerald-400/25 bg-[#09111e]/90 p-6 shadow-[0_0_40px_rgba(52,211,153,0.12)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" /> Uploaded successfully
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{uploadedFile.name}</h3>
                </div>
                <button onClick={resetUpload} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm text-slate-400">File Type</p>
                  <p className="mt-1 font-semibold text-white">{uploadedFile.type}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm text-slate-400">File Size</p>
                  <p className="mt-1 font-semibold text-white">{uploadedFile.sizeLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
                  <p className="text-sm text-slate-400">Upload Date & Time</p>
                  <p className="mt-1 font-semibold text-white">{uploadedFile.uploadedAt}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={triggerPicker} className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-200">
                  <RefreshCw className="h-4 w-4" /> Replace Resume
                </button>
                <button onClick={startAnalysis} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-5 py-2.5 font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.2)]">
                  Analyze Resume with AI <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-cyan-400/25 bg-[#09111e]/90 p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-200">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Processing...</p>
                  <p className="mt-1 text-lg font-semibold text-white">Your AI report is being generated</p>
                </div>
              </div>

              <div className="mt-6 h-2.5 rounded-full bg-white/10">
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500" />
              </div>

              <div className="mt-4 text-sm text-slate-400">Estimated processing time: ~20 seconds</div>

              <div className="mt-6 space-y-3">
                {steps.map((step, index) => {
                  const active = index <= processingStep;
                  return (
                    <div key={step} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${active ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                      <span>{step}</span>
                      {active ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-white/20" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {showAnalysis && uploadedFile && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-[#090d20]/95 p-6 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Resume Analysis</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{uploadedFile.name}</h3>
                </div>
                <button className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                  <Download className="h-4 w-4" /> Download PDF Report
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {analysisStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className={`mt-2 text-2xl font-semibold ${item.accent}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Strengths</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {['Strong project ownership', 'Clear technical stack', 'Leadership and collaboration'].map((item) => (
                      <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Weaknesses</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {['Missing measurable impact', 'Limited AI/ML keywords', 'Formatting can be tightened'].map((item) => (
                      <li key={item} className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-violet-300" /> {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Missing Skills</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['LangChain', 'MLOps', 'System Design', 'Prompt Engineering'].map((item) => (
                      <span key={item} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">AI Recommendations</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {['Add quantified results to bullet points', 'Highlight cloud and AI experience', 'Use a cleaner layout for ATS parsing'].map((item) => (
                      <li key={item} className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-300" /> {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MockInterviewPage({ onUsageUpdate }) {
  const [started, setStarted] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Mock interview</p>
            <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Practice under realistic pressure and improve fast</h1>
          </div>
          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">Timer: 03:00</div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
            <h3 className="font-semibold text-white">Choose interview type</h3>
            <div className="mt-4 space-y-3">
              {['Technical', 'HR', 'Behavioral', 'System Design', 'Coding'].map((type) => (
                <button key={type} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-300">
                  {type} <ChevronDown className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button onClick={() => {
              onUsageUpdate('mockInterview');
              setStarted(true);
            }} className="mt-6 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-white">Start Interview</button>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-6">
            {started ? (
              <div>
                <p className="text-sm text-cyan-300">Question 1</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Explain a scalable architecture for a real-time chat system.</h3>
                <p className="mt-4 text-slate-400">Record your answer and receive feedback on communication, confidence, and technical depth.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-200">Record Answer</button>
                  <button className="rounded-full border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white">End Interview</button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-white/10 p-10 text-center text-slate-400">
                Select a mode and start your first interview session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillGapAnalysisPage({ onUsageUpdate }) {
  const [skills, setSkills] = useState('React, Node.js, SQL');
  const [role, setRole] = useState('AI Engineer');
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Skill gap analysis</p>
          <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Compare your skills against the role you want</h1>
          <div className="mt-8 space-y-4">
            <input value={skills} onChange={(event) => setSkills(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Current Skills: React, Node, SQL" />
            <input value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Desired Role: AI Engineer" />
            <button onClick={() => onUsageUpdate('skillGapRoadmap')} className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-white">Generate Analysis</button>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-[#090d20] p-8 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300">Skill Match</p>
              <p className="text-3xl font-semibold text-white">84%</p>
            </div>
            <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">AI Comparison</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {['Missing Technologies: LangChain, FastAPI', 'Estimated Time: 4 weeks', 'Learning Resources: Coursera, YouTube', 'Difficulty: Moderate'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Learning roadmap</p>
        <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">A personalized, week-by-week plan for your next move</h1>
      </div>
      <div className="space-y-5">
        {roadmapData.map((week) => (
          <div key={week.week} className="rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{week.week}</p>
                <p className="mt-1 text-sm text-slate-400">{week.topics}</p>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">{week.progress}% complete</div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#090d20] p-4"><p className="text-sm text-slate-400">Resources</p><p className="mt-1 text-sm text-white">{week.resources}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#090d20] p-4"><p className="text-sm text-slate-400">Projects</p><p className="mt-1 text-sm text-white">{week.projects}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#090d20] p-4"><p className="text-sm text-slate-400">Progress</p><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${week.progress}%` }} /></div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardPage({ usageMetrics }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
          <h3 className="font-semibold text-white">Dashboard</h3>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            {['Dashboard', 'Resume', 'Interviews', 'Roadmaps', 'Analytics', 'Settings'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3">{item}</div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Resume Analyzer', `${usageMetrics.resumeAnalyzer} uses`], ['Mock Interview', `${usageMetrics.mockInterview} runs`], ['Skill Gap Roadmap', `${usageMetrics.skillGapRoadmap} analyses`], ['Internship Recommendations', `${usageMetrics.internshipRecommendation} requests`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Weekly activity</h3>
                <div className="text-sm text-cyan-300">+12%</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={analyticsData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
              <h3 className="font-semibold text-white">Achievements</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {['Resume Master', 'Interview Ready', 'Roadmap Finisher'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#090d20] px-3 py-3"><Trophy className="h-4 w-4 text-cyan-300" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingPage({ onUsageUpdate }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Pricing</p>
        <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Choose the plan that matches your ambition</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <h3 className="text-2xl font-semibold text-white">Free</h3>
          <p className="mt-2 text-slate-400">Great for first steps and foundational preparation.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            {['Resume Analysis', 'Roadmaps', 'Skill Analysis'].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> {item}</div>
            ))}
          </div>
          <button className="mt-8 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white">Try Free</button>
        </div>
        <div className="rounded-[28px] border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-8 shadow-soft backdrop-blur-2xl">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Premium</div>
          <h3 className="mt-4 text-2xl font-semibold text-white">Resume AI Pro</h3>
          <p className="mt-2 text-slate-300">Unlock unlimited interviews, mentor support, and internship recommendations tailored to your profile.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-200">
            {['Unlimited Interviews', 'Internship Recommendations for $3 for 3 curated matches', 'Career Mentor', 'Certificates'].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> {item}</div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#090d20]/70 p-4">
            <p className="text-sm font-semibold text-white">UPI Payment</p>
            <p className="mt-2 text-sm text-slate-400">Scan the QR code to pay $3 for 3 internship recommendations.</p>
            <img src="/UPI.qr.jpeg" alt="UPI payment QR code" className="mt-4 h-40 w-40 rounded-2xl border border-cyan-400/30 object-cover" />
          </div>
          <button onClick={() => onUsageUpdate('internshipRecommendation')} className="mt-8 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-white">Request Internship Match</button>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">About us</p>
        <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">elevAIte is built for ambitious students who want a smarter career edge</h1>
        <p className="mt-4 max-w-3xl text-slate-400">
          elevAIte brings together AI-powered resume analysis, mock interviews, skill-gap guidance, and career roadmaps in one polished experience. Our goal is simple: help learners turn potential into opportunity with practical, actionable insights that feel premium, personal, and fast.
        </p>
        <p className="mt-4 max-w-3xl text-slate-400">
          Whether you are preparing for internships, fresher roles, or a career switch, elevAIte helps you sharpen your profile and present yourself with clarity and confidence.
        </p>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Contact</p>
          <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Let’s shape your next move together</h1>
          <p className="mt-4 text-slate-400">Reach out for product questions, partnerships, or feedback.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p className="flex items-center gap-2"><MessageCircleMore className="h-4 w-4 text-cyan-300" /> Ashirwadvermabtech25-29@liet.in</p>
            <p className="flex items-center gap-2"><MessageCircleMore className="h-4 w-4 text-cyan-300" /> ckr142004@gmail.com</p>
            <p className="flex items-center gap-2"><Compass className="h-4 w-4 text-cyan-300" /> India • Available for support and collaboration</p>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-[#090d20] p-8 shadow-soft">
          <div className="space-y-4">
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Email" />
            <textarea className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Message" />
            <button className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-white">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ type }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-soft backdrop-blur-2xl lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">{type === 'login' ? 'Login' : 'Sign up'}</p>
          <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">{type === 'login' ? 'Welcome back to your AI career workspace' : 'Create your future-ready career profile'}</h1>
          <div className="mt-8 space-y-4">
            {type === 'signup' && <input className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Name" />}
            <input className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Email" />
            <input className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Password" />
            {type === 'signup' && <input className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Confirm Password" />}
            {type === 'signup' && <div className="grid gap-4 sm:grid-cols-2"><input className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="College" /><input className="w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white outline-none" placeholder="Degree" /></div>}
            <button className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-white">{type === 'login' ? 'Login' : 'Create Account'}</button>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
          <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 p-6 text-center">
            <BrainCircuit className="mx-auto h-10 w-10 text-cyan-300" />
            <h3 className="mt-4 text-xl font-semibold text-white">AI career acceleration</h3>
            <p className="mt-3 text-sm text-slate-400">Access resume insights, interview mastery, and career roadmaps from one beautiful workspace.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm">Google</button>
              <button className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm">GitHub</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;