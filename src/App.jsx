import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { saveRoadmap, getSavedRoadmaps, updateRoadmap, deleteRoadmap, getUsageMetrics, bumpUsageMetric, saveResumeAnalysis, getResumeAnalyses, updateResumeAnalysisFileName } from './lib/db.js';
import { supabase, isSupabaseConfigured } from './lib/supabase.js';
import { extractResumeText, extractResumeData, evaluateResume, detectSkills, detectSoftSkills, buildWordRegex, computeMissingKeywords, validateBulletRewrites, validateRecommendations, computeScores, validateSummary, buildTemplateSummary, computeReinforcedSkills, extractExperienceBullets, extractMajorSections, extractAllBullets, splitResumeBullets } from './lib/atsEngine.js';
import { evaluateSkillGap } from './lib/skillGapEngine.js';
import SerkoLandingPage from './components/SerkoLandingPage.jsx';
import SerkoAuthPage from './components/SerkoAuthPage.jsx';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Cpu,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Linkedin,
  LoaderCircle,
  Mail,
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
  X,
  BookMarked,
  Trash2,
  Pencil,
  PlusCircle,
  Eye,
  EyeOff,
  BarChart2,
  Clock,
  MapPin,
  LogOut
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
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#7c6cf6]/40 bg-gradient-to-br from-[#7c6cf6]/25 via-[#c084fc]/20 to-[#8b5cf6]/30 shadow-[0_0_30px_rgba(124,108,246,0.28)]"
    >
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <TrendingUp className="relative h-5 w-5 text-violet-200" />
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

function resolveUserName(session) {
  if (session?.user?.user_metadata?.full_name) {
    return session.user.user_metadata.full_name;
  }
  if (session?.user?.user_metadata?.name) {
    return session.user.user_metadata.name;
  }
  try {
    const profile = JSON.parse(localStorage.getItem('elevAIte_user_profile') || '{}');
    if (profile.name || profile.full_name) {
      return profile.name || profile.full_name;
    }
  } catch {}
  try {
    const email = session?.user?.email;
    if (email) {
      const users = JSON.parse(localStorage.getItem('elevAIte_registered_users') || '[]');
      const match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (match?.name) return match.name;
    }
  } catch {}
  return 'Ashirwad Verma';
}

function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [faqOpen, setFaqOpen] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [usageMetrics, setUsageMetrics] = useState(readUsage);
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarTimeoutRef = useRef(null);
  const location = useLocation();

  const handleSidebarEnter = () => {
    if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
    setSidebarOpen(true);
  };

  const handleSidebarLeave = () => {
    if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
    sidebarTimeoutRef.current = setTimeout(() => {
      setSidebarOpen(false);
    }, 180);
  };

  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const checkLocal = () => {
      try {
        const stored = localStorage.getItem('elevAIte_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSession(parsed);
          setSessionLoading(false);
          return true;
        }
      } catch {}
      return false;
    };

    checkLocal();

    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSession(session);
        setSessionLoading(false);
      }).catch(() => {
        setSessionLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSession(session);
        } else {
          checkLocal();
        }
      });

      const handleAuthChange = () => checkLocal();
      window.addEventListener('elevAIte_auth_change', handleAuthChange);

      return () => {
        subscription?.unsubscribe?.();
        window.removeEventListener('elevAIte_auth_change', handleAuthChange);
      };
    } catch {
      setSessionLoading(false);
    }
  }, []);

  const sidebarNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Resume Analyzer', path: '/resume-analyzer', icon: FileText },
    { label: 'Mock Interview', path: '/mock-interview', icon: BrainCircuit },
    { label: 'Skill Gap Analysis', path: '/skill-gap-analysis', icon: BarChart2 },
    { label: 'Learning Roadmap', path: '/learning-roadmap', icon: Compass },
    { label: 'My Roadmaps', path: '/my-roadmaps', icon: BookMarked },
    { label: 'Pricing', path: '/pricing', icon: CircleDollarSign },
  ];

  const currentUserName = resolveUserName(session);

  const bumpUsage = (key) => {
    // Update local state immediately for instant UI feedback
    setUsageMetrics((prev) => {
      const next = { ...prev, [key]: (prev[key] || 0) + 1 };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    // Persist to Supabase in the background
    const fieldMap = {
      resumeAnalyzer: 'resume_analyzer_count',
      mockInterview: 'mock_interview_count',
      skillGapRoadmap: 'skill_gap_count',
      internshipRecommendation: 'internship_count',
    };
    const field = fieldMap[key];
    if (field) {
      bumpUsageMetric(field).catch(err => console.error('[bumpUsage] Supabase error:', err));
    }
  };

  useEffect(() => {
    const handleMove = (event) => setCursorPos({ x: event.clientX, y: event.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';

  return (
    <div
      className="serko-theme min-h-screen w-full relative font-['Inter',sans-serif] overflow-x-hidden"
      style={{
        background:
          'linear-gradient(180deg, #ffffff 0%, #ffffff 7%, #eff6ff 15%, #d4ebfd 25%, #9ecffd 37%, #74affb 49%, #8ea7fa 61%, #b095fc 73%, #c985f8 84%, #d77ef3 92%, #e084ed 100%)'
      }}
    >
      {/* ─── Ambient Atmospheric Lighting ──────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[18%] left-1/2 h-[750px] w-[1300px] -translate-x-1/2 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute top-[65%] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 rounded-full bg-purple-300/35 blur-3xl" />
        <div
          className="absolute bottom-0 inset-x-0 h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse 95% 65% at 50% 100%, rgba(244,114,182,0.3) 0%, rgba(192,132,252,0.35) 42%, transparent 78%)'
          }}
        />
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {!isLandingPage && !isAuthPage && (
          <>
            {/* Left Edge Hover Trigger Area & Floating Indicator */}
            <div
              onMouseEnter={handleSidebarEnter}
              onMouseLeave={handleSidebarLeave}
              className="hidden lg:block fixed inset-y-0 left-0 w-5 z-40 group cursor-pointer"
            >
              {/* Floating mini handle on left edge */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center h-20 w-4 rounded-r-xl border border-l-0 border-indigo-200/80 bg-white/90 shadow-md backdrop-blur-md text-slate-500 hover:text-indigo-600 transition-all ${
                  sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-85 hover:opacity-100 hover:w-5'
                }`}
                title="Hover cursor here to open navigation"
              >
                <ChevronRight className="h-3.5 w-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Desktop Left Vertical Navbar (Slides in on hover) */}
            <aside
              onMouseEnter={handleSidebarEnter}
              onMouseLeave={handleSidebarLeave}
              className={`hidden lg:flex fixed inset-y-0 left-0 w-64 z-50 flex-col justify-between border-r border-slate-200/80 bg-white/95 backdrop-blur-2xl p-4 shadow-2xl transition-transform duration-300 ease-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex flex-col flex-1 min-h-0">
                {/* Logo & Brand Header */}
                <div className="flex items-center justify-between gap-2.5 px-2 py-3 border-b border-slate-200/60">
                  <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-xs">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-['Poppins'] text-xl font-bold tracking-tight text-slate-900">
                      elev<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>te
                    </span>
                  </Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Close navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Vertical Navigation Items */}
                <div className="mt-5 flex-1 overflow-y-auto space-y-1 pr-1">
                  <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Navigation
                  </p>
                  {sidebarNavItems.map(({ label, path, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Bottom Profile & Session Section */}
              <div className="pt-4 border-t border-slate-200/60">
                {session ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 border border-slate-200/80 p-2.5 shadow-2xs">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-xs">
                        {currentUserName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUserName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{session.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to="/"
                        onClick={() => setSidebarOpen(false)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition px-2 py-1"
                      >
                        ← Home
                      </Link>
                      <button
                        onClick={() => {
                          supabase.auth.signOut().catch(() => {});
                          localStorage.removeItem('elevAIte_session');
                          localStorage.removeItem('elevAIte_user_profile');
                          setSession(null);
                          setSidebarOpen(false);
                          window.dispatchEvent(new Event('elevAIte_auth_change'));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition shadow-2xs"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setSidebarOpen(false)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white transition shadow-xs"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </aside>

            {/* Mobile Sticky Top Header */}
            <div className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-['Poppins'] text-lg font-bold tracking-tight text-slate-900">
                  elev<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>te
                </span>
              </Link>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Drawer */}
            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
                />
                <aside className="fixed inset-y-0 left-0 w-72 z-50 bg-white shadow-2xl p-4 flex flex-col justify-between lg:hidden">
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-xs">
                          <Sparkles className="h-4.5 w-4.5" />
                        </div>
                        <span className="font-['Poppins'] text-xl font-bold tracking-tight text-slate-900">
                          elev<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>te
                        </span>
                      </Link>
                      <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-500">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-5 flex-1 overflow-y-auto space-y-1">
                      {sidebarNavItems.map(({ label, path, icon: Icon }) => (
                        <NavLink
                          key={path}
                          to={path}
                          onClick={() => setMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                          <span>{label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    {session ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-2.5 border border-slate-200">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white uppercase">
                            {currentUserName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{currentUserName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{session.user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            supabase.auth.signOut().catch(() => {});
                            localStorage.removeItem('elevAIte_session');
                            localStorage.removeItem('elevAIte_user_profile');
                            setSession(null);
                            setMenuOpen(false);
                            window.dispatchEvent(new Event('elevAIte_auth_change'));
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to="/login"
                          onClick={() => setMenuOpen(false)}
                          className="block text-center rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700"
                        >
                          Log In
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setMenuOpen(false)}
                          className="block text-center rounded-xl bg-[#2563eb] py-2.5 text-xs font-semibold text-white"
                        >
                          Get Started
                        </Link>
                      </div>
                    )}
                  </div>
                </aside>
              </>
            )}
          </>
        )}

        <main className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Routes>
                <Route path="/" element={<SerkoLandingPage features={features} stats={stats} testimonials={testimonials} faqItems={faqItems} faqOpen={faqOpen} setFaqOpen={setFaqOpen} darkMode={darkMode} setDarkMode={setDarkMode} session={session} onUsageUpdate={bumpUsage} />} />
                <Route path="/resume-analyzer" element={<ResumeAnalyzerPage onUsageUpdate={bumpUsage} />} />
                <Route path="/mock-interview" element={<MockInterviewPage onUsageUpdate={bumpUsage} />} />
                <Route path="/skill-gap-analysis" element={<SkillGapAnalysisPage onUsageUpdate={bumpUsage} />} />
                <Route path="/learning-roadmap" element={<RoadmapPage />} />
                <Route path="/dashboard" element={<DashboardPage usageMetrics={usageMetrics} />} />
                <Route path="/my-roadmaps" element={<SavedRoadmapsPage />} />
                <Route path="/pricing" element={<PricingPage onUsageUpdate={bumpUsage} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<SerkoAuthPage initialType="login" />} />
                <Route path="/signup" element={<SerkoAuthPage initialType="signup" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {!isLandingPage && !isAuthPage && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setChatOpen(!chatOpen)}
              className="fixed bottom-6 right-6 z-40 rounded-full border border-indigo-400/30 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg"
            >
              <MessageCircleMore className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {chatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="fixed bottom-24 right-6 z-40 w-[320px] rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">CareerPilot Assistant</p>
                      <p className="text-xs text-slate-500">Ask anything about your path</p>
                    </div>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 text-sm text-slate-600">
                    “I can help you review your resume, prep for interviews, and suggest next steps.”
                  </div>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition">
                    <BrainCircuit className="h-4 w-4" /> Start AI Chat
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <footer className="w-full px-4 sm:px-6 lg:px-8 pb-8 pt-4">
              <div className="mx-auto max-w-4xl rounded-[24px] border border-purple-200/60 bg-white/60 p-6 sm:p-7 shadow-sm backdrop-blur-xl">
                {/* 2-Column Layout (Navigation Removed) */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  {/* Left Side: Brand & Description */}
                  <div className="max-w-md">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="font-['Poppins'] text-xl font-bold tracking-tight text-slate-900">
                        elev<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>te
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Turn course syllabi and career ambitions into balanced preparation. AI-powered resume screening, interview mastery, and skill-gap analysis.
                    </p>
                  </div>

                  {/* Right Side: DEVELOPER & CONTACT */}
                  <div className="shrink-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2.5">
                      DEVELOPER & CONTACT
                    </p>
                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                      <a
                        href="mailto:aashirwadverma88@gmail.com"
                        className="flex items-center gap-2 hover:text-black transition"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>aashirwadverma88@gmail.com</span>
                      </a>

                      <a
                        href="https://www.linkedin.com/in/ashirwad-verma-98445837b"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-blue-600 transition mt-0.5"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#0077b5] text-white">
                          <Linkedin className="h-3 w-3 fill-current" />
                        </div>
                        <span>LinkedIn Profile</span>
                        <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="mt-5 border-t border-purple-200/50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <p>© 2026 elevAIte. All rights reserved.</p>
                  <p>Built for students who are aiming for top tech careers.</p>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function HomePage({ faqOpen, setFaqOpen }) {
  return (
    <div>
      <section className="relative isolate mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c6cf6]/18 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-[#7c6cf6]/20 to-[#8b5cf6]/10 blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" /> AI Career Accelerator
            </div>
            <h1 className="max-w-3xl font-['Poppins'] text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
              Accelerate Your Career with AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Analyze your resume, master interviews, identify skill gaps, generate personalized learning roadmaps, and land your dream internship with AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 px-6 py-3 font-semibold text-white shadow-soft">Get Started <ArrowRight className="h-4 w-4" /></Link>
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
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-violet-500/30 via-violet-600/20 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl">
              <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-violet-400/30" />
              <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-violet-300">AI Copilot Ready</p>
                    <h3 className="mt-1 text-xl font-semibold">Career acceleration engine</h3>
                  </div>
                  <div className="rounded-full bg-violet-400/10 p-3 text-violet-300"><Cpu className="h-6 w-6" /></div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-violet-500/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-violet-400/20 p-3 text-violet-300"><GraduationCap className="h-6 w-6" /></div>
                    <div>
                      <p className="text-sm text-slate-400">Launch readiness</p>
                      <p className="text-lg font-semibold text-white">94% profile match</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-violet-400 to-violet-500" />
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Core features</p>
          <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold sm:text-4xl">Everything you need to outshine the competition</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }} className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full border border-violet-400/30 bg-violet-400/10 p-3 text-violet-300"><Sparkles className="h-5 w-5" /></div>
                <div className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">AI Powered</div>
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{feature.subtitle}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-violet-300" /> {point}</li>
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
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Premium unlock</p>
              <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold">Internship recommendations are reserved for premium members</h2>
              <p className="mt-4 max-w-xl text-slate-400">Unlock the full AI career accelerator with mentor support, unlimited interviews, and internship opportunities curated for your profile.</p>
              <Link to="/pricing" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 px-5 py-3 font-semibold text-white">Upgrade to Premium <ArrowRight className="h-4 w-4" /></Link>
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
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3"><CheckCircle2 className="h-4 w-4 text-violet-300" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Testimonials</p>
          <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold sm:text-4xl">Loved by ambitious students</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item, index) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.08 }} className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-1 text-amber-400">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-5 text-lg text-slate-200">“{item.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-500 font-semibold">{item.name[0]}</div>
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">FAQ</p>
            <h2 className="mt-3 font-['Poppins'] text-3xl font-semibold">Common questions, answered clearly</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={item.question} className="rounded-2xl border border-white/10 bg-[#090d20] p-4">
                <button onClick={() => setFaqOpen(index === faqOpen ? -1 : index)} className="flex w-full items-center justify-between text-left">
                  <span className="font-semibold text-white">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 text-violet-300 transition ${index === faqOpen ? 'rotate-180' : ''}`} />
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns Tailwind color class based on 0-100 score */
function scoreColor(score) {
  if (score >= 80) return 'text-emerald-300';
  if (score >= 60) return 'text-amber-300';
  if (score >= 40) return 'text-orange-400';
  return 'text-rose-400';
}

/** Returns a label and color for a score band */
function scoreBand(score) {
  if (score >= 80) return { label: 'Excellent', ring: 'stroke-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200' };
  if (score >= 60) return { label: 'Good', ring: 'stroke-amber-400', bg: 'bg-amber-400/10 border-amber-400/30 text-amber-200' };
  if (score >= 40) return { label: 'Fair', ring: 'stroke-orange-400', bg: 'bg-orange-400/10 border-orange-400/30 text-orange-200' };
  return { label: 'Needs Work', ring: 'stroke-rose-400', bg: 'bg-rose-400/10 border-rose-400/30 text-rose-200' };
}

/** SVG ring / gauge for the overall score */
function ScoreRing({ score }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const band = scoreBand(score);
  return (
    <div className="relative flex items-center justify-center">
      <svg width="136" height="136" viewBox="0 0 136 136" className="-rotate-90">
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="10" />
        <circle
          cx="68" cy="68" r={r} fill="none"
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${band.ring} transition-all duration-700`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
        <span className={`mt-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${band.bg}`}>{band.label}</span>
      </div>
    </div>
  );
}

/** Mini horizontal bar for category score */
function CategoryBar({ label, value }) {
  const band = scoreBand(value);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${scoreColor(value)}`}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${band.ring.replace('stroke-', 'bg-')}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const SECTION_STATUS_STYLE = {
  present: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  strong:  'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  weak:    'border-amber-400/30 bg-amber-400/10 text-amber-300',
  missing: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    executive_summary: { type: 'STRING' },
    experience_level: { type: 'STRING' },
    overall_score: { type: 'INTEGER' },
    category_scores: {
      type: 'OBJECT',
      properties: {
        ats_compatibility: { type: 'INTEGER' },
        keyword_match: { type: 'INTEGER' },
        formatting: { type: 'INTEGER' },
        impact_quantification: { type: 'INTEGER' },
      },
      required: ['ats_compatibility', 'keyword_match', 'formatting', 'impact_quantification'],
    },
    section_analysis: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          section: { type: 'STRING' },
          status: { type: 'STRING' },
          feedback: { type: 'STRING' },
        },
        required: ['section', 'status', 'feedback'],
      },
    },
    matched_keywords: { type: 'ARRAY', items: { type: 'STRING' } },
    missing_keywords: { type: 'ARRAY', items: { type: 'STRING' } },
    formatting_issues: { type: 'ARRAY', items: { type: 'STRING' } },
    weak_bullets: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { original: { type: 'STRING' }, suggestion: { type: 'STRING' } },
        required: ['original', 'suggestion'],
      },
    },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['executive_summary', 'experience_level', 'overall_score', 'category_scores', 'section_analysis', 'matched_keywords', 'missing_keywords', 'formatting_issues', 'weak_bullets', 'suggestions'],
};

const GEMINI_SYSTEM_PROMPT = `You are a technical recruiter and ATS evaluation engine.
Evaluate resumes strictly against facts in the text.
Rules:
1. No percentile or ranking claims (no "top 5%", "top tier", "top recruiters favor").
2. Bullet rewrites: "original" MUST be an exact verbatim quote from resume text. Do NOT fabricate numbers or add new tools. Use [ADD YOUR OWN NUMBER] where metrics are absent. Do not use "Architected" or "Engineered" unless original describes design/engineering work.
3. Every recommendation MUST carry an "evidence_quote" from resume text.
4. Missing keywords: suggest only if in target job description and absent from resume.
Always respond ONLY with valid JSON matching the schema.`;

// ─── ResumeAnalyzerPage ──────────────────────────────────────────────────────

function ResumeAnalyzerPage({ onUsageUpdate }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (showAnalysis && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showAnalysis]);

  const [jobDescription, setJobDescription] = useState('');
  const isDevDebugEnabled = Boolean(
    import.meta.env.VITE_DEV_DEBUG === 'true' ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('elevAIte_dev_debug') === 'true')
  );

  // Supabase Edge Function used when online and properly configured; otherwise fallback client-side engine runs instantly
  const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const edgeFunctionUrl = (isSupabaseConfigured && supabaseProjectUrl)
    ? `${supabaseProjectUrl}/functions/v1/analyze-resume`
    : '';
  const [analysisResult, setAnalysisResult] = useState(null);

  const steps = [
    'Uploading Resume',
    'Extracting Text',
    'Reading Resume',
    'Checking ATS Compatibility',
    'Finding Missing Keywords',
    'Analyzing Skills',
    'Generating Suggestions',
    'Preparing Final Report',
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
      uploadedAt: uploadTime,
      rawFile: file
    });
    setError('');
    setShowAnalysis(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingStep(0);
    setAnalysisResult(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const triggerPicker = () => fileInputRef.current?.click();

  const startAnalysis = async () => {
    if (!uploadedFile) return;

    onUsageUpdate('resumeAnalyzer');
    setIsProcessing(true);
    setShowAnalysis(false);
    setProgress(0);
    setProcessingStep(0);
    setError('');

    let currentStep = 0;
    const interval = window.setInterval(() => {
      currentStep = Math.min(currentStep + 1, steps.length - 2);
      setProcessingStep(currentStep);
      setProgress(Math.round((currentStep / steps.length) * 90));
    }, 700);

    try {
      let reportData = null;
      const { text: resumeText, pageCount, hash: textHash } = await extractResumeData(uploadedFile.rawFile);

      if (!resumeText || resumeText.trim().length < 50) {
        window.clearInterval(interval);
        setIsProcessing(false);
        setError("Could not extract readable text from this file. If it's a PDF, make sure it is not a scanned image (try selecting and copying text in the PDF to confirm). If it's a DOCX, try re-saving it from Microsoft Word or Google Docs.");
        return;
      }

      // 1. If edgeFunctionUrl is available and online, attempt Supabase Edge Function with timeout
      if (edgeFunctionUrl) {
        try {
          const formData = new FormData();
          formData.append('file', uploadedFile.rawFile);
          formData.append('job_description', jobDescription);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

          const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json().catch(() => null);
            if (data && (data.executive_summary || data.section_analysis)) {
              reportData = data;
            }
          }
        } catch (networkErr) {
          console.warn('[ResumeAnalyzer] Cloud Edge function unreachable, activating intelligent client-side ATS engine.');
        }
      }

      // If edge function returned data, strictly post-validate and calculate all scores in code:
      if (reportData) {
        let effectivePageCount = pageCount;
        if (resumeText.length < 3200 && !/\bpage\s*2\b/i.test(resumeText) && !/\f/.test(resumeText)) {
          effectivePageCount = 1;
        }
        // Master evaluateResume engine ensures 100% deterministic scores, section analysis, placeholders, and debug info
        reportData = evaluateResume(resumeText, jobDescription, uploadedFile.name, effectivePageCount);
      } else {
        // 2. Intelligent Client-Side ATS Engine fallback (resilient against DNS & offline errors)
        reportData = evaluateResume(resumeText, jobDescription, uploadedFile.name, pageCount);
      }

      window.clearInterval(interval);
      setProcessingStep(steps.length - 1);
      setProgress(100);
      setAnalysisResult(reportData);

      // Persist analysis to database & local storage keyed by text hash (Requirement 2)
      saveResumeAnalysis(uploadedFile.name, reportData, reportData.text_hash || textHash).catch(() => {});

      setTimeout(() => {
        setShowAnalysis(true);
        setIsProcessing(false);
      }, 500);

    } catch (err) {
      window.clearInterval(interval);
      setIsProcessing(false);
      setError(err.message || 'An unexpected error occurred during analysis.');
      console.error('[ResumeAnalyzer]', err);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setJobDescription('');
    setError('');
    setShowAnalysis(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingStep(0);
    setAnalysisResult(null);
    setShowDebugPanel(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const r = analysisResult;
    const lines = [
      'elevAIte — AI Resume ATS Analysis Report',
      '═'.repeat(50),
      `Resume      : ${uploadedFile.name}`,
      `Analyzed at : ${new Date().toLocaleString()}`,
      `Experience  : ${r.experience_level || 'N/A'}`,
      '',
      '── Overall Score ───────────────────────────────',
      `  ${r.overall_score}/100  (${scoreBand(r.overall_score).label})`,
      '',
      '── Category Scores ─────────────────────────────',
      `  ATS Compatibility    : ${r.category_scores?.ats_compatibility ?? 'N/A'}%`,
      `  Keyword Match        : ${r.category_scores?.keyword_match ?? 'N/A'}%`,
      `  Formatting           : ${r.category_scores?.formatting ?? 'N/A'}%`,
      `  Impact Quantification: ${r.category_scores?.impact_quantification ?? 'N/A'}%`,
      '',
      '── Executive Summary ───────────────────────────',
      `  ${r.executive_summary || 'N/A'}`,
      '',
      '── Section Analysis ────────────────────────────',
      ...(r.section_analysis?.map((s) => `  [${s.status.toUpperCase().padEnd(7)}] ${s.section}: ${s.feedback}`) ?? ['  N/A']),
      '',
      '── Matched Keywords ────────────────────────────',
      `  ${r.matched_keywords?.join(', ') || 'None'}`,
      '',
      ...(r.coding_platforms?.length ? [
        '── Coding Practice & Achievements ───────────────',
        `  Platforms: ${r.coding_platforms.join(', ')}`,
        ...(r.achievements?.length ? r.achievements.map((a, n) => `  ${n + 1}. ${a}`) : []),
        '',
      ] : []),
      '── Missing Keywords ────────────────────────────',
      ...(r.missing_keywords_message ? [`  ${r.missing_keywords_message}`] : [`  ${r.missing_keywords?.join(', ') || 'None'}`]),
      '',
      '── Formatting Issues ───────────────────────────',
      ...(r.formatting_issues?.length ? r.formatting_issues.map((i, n) => `  ${n + 1}. ${i}`) : ['  None detected.']),
      '',
      '── AI Recommendations ──────────────────────────',
      ...(r.suggestions?.map((s, n) => `  ${n + 1}. ${typeof s === 'string' ? s : s.advice + (s.evidence_quote ? ` (Evidence: "${s.evidence_quote}")` : '')}`) ?? ['  None.']),
      '',
      '── Bullet Point Rewrites ───────────────────────',
      ...(r.weak_bullets?.length
        ? r.weak_bullets.flatMap((b, n) => [
            `  ${n + 1}. Original : "${b.original}"`,
            `     Improved: "${b.suggestion}"`,
            '',
          ])
        : ['  All bullets already include measurable results.']),
      '═'.repeat(50),
      'Generated by elevAIte — AI Career Accelerator',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${uploadedFile.name.replace(/\.[^/.]+$/, '')}_ATS_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // fallback for environments without clipboard API
    }
  };

  const categoryScores = [
    { label: 'ATS Compatibility', key: 'ats_compatibility' },
    { label: 'Keyword Match', key: 'keyword_match' },
    { label: 'Formatting', key: 'formatting' },
    { label: 'Impact Quantification', key: 'impact_quantification' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-violet-300">AI Resume Analyzer</p>
        <h1 className="mt-4 font-['Poppins'] text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Upload your resume and receive a premium ATS review
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Get AI-powered feedback on ATS compatibility, missing keywords, skill gaps, and resume improvement suggestions in minutes.
        </p>
      </motion.div>

      <div className={showAnalysis ? "mt-8" : "mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"}>
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-[0_0_80px_rgba(139,92,246,0.12)] backdrop-blur-2xl sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_35%)]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Upload Resume</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Drag & drop your resume</h2>
              </div>
              <div className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-sm text-violet-200">PDF / DOCX • 10 MB max</div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-8 rounded-[28px] border p-8 text-center transition-all duration-300 sm:p-10 ${isDragging ? 'border-violet-300 bg-violet-400/15 shadow-[0_0_38px_rgba(139,92,246,0.22)]' : 'border-dashed border-violet-400/30 bg-violet-400/10'}`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-200">
                <UploadCloud className="h-8 w-8" />
              </div>
              <p className="mt-6 text-xl font-bold text-slate-900">Drop your resume here</p>
              <p className="mt-2 text-sm font-medium text-slate-700">or <span className="font-extrabold text-blue-600">browse files</span> to upload a PDF or DOCX document.</p>
              <button onClick={triggerPicker} className="mt-6 rounded-full bg-blue-600 hover:bg-blue-700 px-7 py-3.5 font-extrabold text-white shadow-md shadow-blue-500/25 hover:shadow-lg transition text-base">Browse Files</button>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <p className="mt-5 text-sm font-bold text-slate-700">Supported formats: PDF • DOCX</p>
            </motion.div>

            {/* Job Description */}
            <div className="mt-6 text-left">
              <label className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">Target Job Description <span className="normal-case font-normal text-slate-500">(Optional — improves keyword analysis)</span></label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to check how well your resume matches the role requirements..."
                className="mt-3 min-h-[140px] w-full rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[#8b5cf6]/50 transition-colors"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                <X className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {!showAnalysis && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
            {!uploadedFile && !isProcessing && (
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

            {uploadedFile && !isProcessing && (
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
                  <button onClick={triggerPicker} className="flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 font-semibold text-violet-200">
                    <RefreshCw className="h-4 w-4" /> Replace Resume
                  </button>
                  <button onClick={startAnalysis} className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-3 font-extrabold text-white shadow-md shadow-blue-500/25 transition text-sm">
                    Analyze Resume with AI <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-violet-400/25 bg-[#09111e]/90 p-6 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-violet-400/30 bg-violet-400/10 p-3 text-violet-200">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Processing…</p>
                    <p className="mt-1 text-lg font-semibold text-white">Your AI report is being generated</p>
                  </div>
                </div>

                <div className="mt-6 h-2.5 rounded-full bg-white/10">
                  <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className="h-2.5 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-fuchsia-500" />
                </div>
                <div className="mt-2 text-right text-xs text-slate-500">{progress}%</div>

                <div className="mt-6 space-y-3">
                  {steps.map((step, index) => {
                    const done = index < processingStep;
                    const active = index === processingStep;
                    return (
                      <div key={step} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all ${done ? 'border-emerald-400/25 bg-emerald-400/8 text-emerald-200' : active ? 'border-violet-400/30 bg-violet-400/10 text-violet-100' : 'border-white/10 bg-white/5 text-slate-500'}`}>
                        <span>{step}</span>
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : active ? <LoaderCircle className="h-4 w-4 animate-spin text-violet-300" /> : <div className="h-4 w-4 rounded-full border border-white/20" />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Analysis Complete Section: Placed BELOW Upload Resume */}
      {showAnalysis && analysisResult && (
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-12 space-y-6"
        >
          {analysisResult.is_parse_failure ? (
            /* Parse Failure Guard (Requirement 4) */
            <div className="rounded-[32px] border border-amber-400/30 bg-[#090d20]/95 p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-white">We couldn't read this PDF reliably</h3>
              <p className="mx-auto mt-3 max-w-xl text-base text-slate-300">
                Fewer than 3 standard resume sections or technical skills could be extracted from this document. To ensure an accurate review instead of misleading scores, please retry or upload your resume in standard PDF or DOCX format.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={resetUpload} className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-7 py-3 font-extrabold text-white shadow-md shadow-blue-500/25 transition">
                  <RefreshCw className="h-4 w-4" /> Try Uploading Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header + score ring + category bars */}
              <div className="rounded-[32px] border border-white/10 bg-[#090d20]/95 p-6 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-2xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Analysis Complete</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{uploadedFile.name}</h3>
                    {analysisResult.experience_level && (
                      <span className="mt-2 inline-block rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                        {analysisResult.experience_level}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={resetUpload} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition">
                      <RefreshCw className="h-4 w-4" /> New
                    </button>
                    <button onClick={downloadReport} className="flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-400/20 transition">
                      <Download className="h-4 w-4" /> Download Report
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="shrink-0">
                    <ScoreRing score={analysisResult.overall_score} />
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    {categoryScores.map(({ label, key }) => (
                      <CategoryBar key={key} label={label} value={analysisResult.category_scores?.[key] ?? 0} />
                    ))}
                  </div>
                </div>

                {analysisResult.executive_summary && (
                  <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300 mb-2">Recruiter Summary</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.executive_summary}</p>
                  </div>
                )}
              </div>

              {/* Section Analysis */}
              {analysisResult.section_analysis?.length > 0 && (
                <div className="rounded-[28px] border border-white/10 bg-[#090d20]/90 p-5 sm:p-6 backdrop-blur-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300 mb-4">Section Analysis</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {analysisResult.section_analysis.map((s) => (
                      <div key={s.section} className={`rounded-2xl border p-3 text-sm ${SECTION_STATUS_STYLE[s.status] || SECTION_STATUS_STYLE.weak}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{s.section}</span>
                          <span className="text-[10px] uppercase font-bold opacity-70">{s.status}</span>
                        </div>
                        {s.detected_heading && s.detected_heading.toLowerCase() !== s.section.toLowerCase() && (
                          <div className="text-[10px] text-slate-400 font-mono mb-1">
                            Detected as: <span className="text-violet-300 font-semibold">{s.detected_heading}</span>
                          </div>
                        )}
                        <p className="text-xs opacity-80 leading-snug">{s.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300 mb-4">
                    Matched Keywords ({jobDescription && jobDescription.trim().length > 0 && analysisResult.jd_matched_keywords ? (analysisResult.jd_matched_keywords.length + (analysisResult.other_keywords?.length || 0)) : (analysisResult.matched_keywords?.length || 0)})
                  </p>
                  {jobDescription && jobDescription.trim().length > 0 && analysisResult.jd_matched_keywords ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Matches the job description ({analysisResult.jd_matched_keywords.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.jd_matched_keywords.length > 0 ? (
                            analysisResult.jd_matched_keywords.map((kw) => (
                              <span key={kw} className="rounded-full border border-emerald-400/60 bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">No JD-matched technical skills found.</span>
                          )}
                        </div>
                      </div>

                      {analysisResult.other_keywords && analysisResult.other_keywords.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <p className="text-xs font-semibold text-slate-400 mb-2">
                            Other skills on your resume ({analysisResult.other_keywords.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.other_keywords.map((kw) => (
                              <span key={kw} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.matched_keywords?.length > 0 ? (
                        analysisResult.matched_keywords.map((kw) => (
                          <span key={kw} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{kw}</span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No matched keywords found.</span>
                      )}
                    </div>
                  )}

                  {/* Soft skills displayed separately (Requirement 5: readable label and high-contrast chips) */}
                  {analysisResult.soft_skills && analysisResult.soft_skills.length > 0 && (
                    <div className="pt-3 border-t border-white/10 mt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-2">
                        Soft skills ({analysisResult.soft_skills.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.soft_skills.map((s) => (
                          <span key={s} className="rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-100 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-300 mb-4">Missing Keywords</p>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missing_keywords_message ? (
                        <span className="text-xs text-slate-400">{analysisResult.missing_keywords_message}</span>
                      ) : analysisResult.missing_keywords?.length > 0 ? (
                        analysisResult.missing_keywords.map((kw) => (
                          <span key={kw} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs text-rose-200">{kw}</span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-400">No missing technical keywords — great coverage!</span>
                      )}
                    </div>

                    {analysisResult.missing_soft_skills?.length > 0 && (
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs font-semibold text-amber-300/90 mb-2">
                          Soft Skills (Optional gaps from job description):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.missing_soft_skills.map((s) => (
                            <span key={s} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Formatting Issues & Recommendations */}
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300 mb-4">Formatting Issues</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {analysisResult.formatting_issues?.length > 0 ? (
                      analysisResult.formatting_issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ArrowUpRight className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> No formatting issues detected.
                      </li>
                    )}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300 mb-4">AI Recommendations</p>
                  <ul className="space-y-3 text-sm text-slate-300">
                    {analysisResult.suggestions?.length > 0 ? (
                      analysisResult.suggestions.map((item, idx) => {
                        const adviceText = typeof item === 'string' ? item : item.advice;
                        const quoteText = typeof item === 'object' ? item.evidence_quote : null;
                        return (
                          <li key={idx} className="space-y-1 group">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-violet-300 shrink-0 mt-0.5" />
                                <span>{adviceText}</span>
                              </div>
                              <button onClick={() => copyToClipboard(adviceText, idx)} title="Copy" className="ml-1 shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition">
                                {copiedIdx === idx ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            {quoteText && (
                              <div className="ml-6 pl-2 border-l border-violet-400/30 text-xs text-slate-400 italic">
                                Evidence: "{quoteText}"
                              </div>
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-slate-400">No recommendations available.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Bullet Point Rewrites */}
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">AI Bullet Point Rewrites</p>
                <p className="mt-1 text-xs text-slate-400">Replace weak statements with quantified, action-oriented achievements.</p>
                {analysisResult.weak_bullets?.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {analysisResult.weak_bullets.map((bullet, idx) => (
                      <div key={idx} className="rounded-2xl border border-white/5 bg-black/25 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">Original</span>
                            <p className="mt-2 text-sm text-slate-400 italic">"{bullet.original}"</p>
                          </div>
                          <div className="hidden md:flex items-center text-slate-500 font-bold shrink-0 pt-5">→</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Suggested</span>
                              <button onClick={() => copyToClipboard(bullet.suggestion, `bullet-${idx}`)} className="text-[10px] rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-slate-400 hover:text-white transition">
                                {copiedIdx === `bullet-${idx}` ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="mt-2 text-sm text-white font-medium">"{bullet.suggestion}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : analysisResult.category_scores?.impact_quantification === 100 ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-300">
                    All bullets already include measurable results.
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-300">
                    Review your experience bullets to add quantified metrics and measurable outcomes.
                  </div>
                )}
              </div>

              {/* Dev Debug Inspector (Requirement 5: dev flag only, hidden by default) */}
              {isDevDebugEnabled && analysisResult.debug_info && (
                <div className="rounded-[24px] border border-cyan-500/20 bg-cyan-950/20 p-5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Dev Only</span>
                      <h4 className="text-sm font-semibold text-cyan-200">ATS Engine Debug Inspector</h4>
                    </div>
                    <button
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20 transition"
                    >
                      {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
                    </button>
                  </div>

                  {showDebugPanel && (
                    <div className="mt-4 space-y-4 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-1">Resume Text Hash</span>
                          <span className="font-mono text-cyan-300 text-sm truncate block" title={analysisResult.debug_info.text_hash || analysisResult.text_hash}>
                            {analysisResult.debug_info.text_hash || analysisResult.text_hash || 'N/A'}
                          </span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-1">Measured Page Count</span>
                          <span className="font-mono text-cyan-300 text-sm">{analysisResult.debug_info.page_count} page(s)</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-1">Detected Skills</span>
                          <span className="font-mono text-cyan-300 text-sm">{analysisResult.debug_info.detected_skills_count} canonical</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-1">Positions & Bullets</span>
                          <span className="font-mono text-cyan-300 text-sm">{analysisResult.debug_info.experience_positions_count ?? analysisResult.experience_positions_count ?? 'N/A'} pos ({analysisResult.debug_info.experience_bullet_count ?? 'N/A'} b)</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-1">Actual Projects</span>
                          <span className="font-mono text-cyan-300 text-sm">{analysisResult.debug_info.projects_count ?? analysisResult.projects_count ?? 'N/A'} project(s)</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-1">Certifications</span>
                          <span className="font-mono text-cyan-300 text-sm">{analysisResult.debug_info.certifications_count ?? analysisResult.certifications_count ?? 'N/A'} verified</span>
                        </div>
                      </div>

                      {analysisResult.debug_info.keyword_score_formula && (
                        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-3">
                          <span className="text-slate-400 block mb-1 font-medium">Documented Keyword Score Formula:</span>
                          <code className="font-mono text-cyan-300 text-[11px] block whitespace-pre-wrap">{analysisResult.debug_info.keyword_score_formula}</code>
                        </div>
                      )}

                      {/* Requirement 6: Formatting Checklist in Debug Panel */}
                      {(analysisResult.debug_info.formatting_checklist || analysisResult.formatting_checklist) && (
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <span className="text-slate-400 block mb-2 font-medium">
                            Formatting Score Checklist ({analysisResult.category_scores?.formatting ?? 0}/100):
                          </span>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            {(analysisResult.debug_info.formatting_checklist || analysisResult.formatting_checklist).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                                <div>
                                  <span className="font-semibold text-cyan-300">{item.check}</span>
                                  <span className="text-slate-400 text-[10px] ml-2">({item.detail})</span>
                                </div>
                                <span className="font-bold text-emerald-400 shrink-0 ml-2">{item.earned}/{item.weight} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <span className="text-slate-400 block mb-2 font-medium">Canonical Detected Skills ({analysisResult.debug_info.detected_skills_count || 0}):</span>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                          {analysisResult.debug_info.detected_skills?.map(s => {
                            const isReinforced = analysisResult.debug_info.reinforced_skills?.includes(s);
                            return (
                              <span key={s} className={`rounded px-2 py-0.5 border ${isReinforced ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-300 font-semibold' : 'bg-cyan-900/50 border-cyan-500/30 text-cyan-200'}`}>
                                {s} {isReinforced && '★'}
                              </span>
                            );
                          })}
                        </div>
                        {analysisResult.debug_info.reinforced_skills?.length > 0 && (
                          <p className="mt-2 text-[10px] text-emerald-400">★ = Reinforced (present in Technical Skills and substantiated in Experience or Projects)</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <span className="text-slate-400 block mb-2 font-medium">Detected Section Headings & Line Ranges ({analysisResult.debug_info.detected_sections?.length || 0}):</span>
                        {analysisResult.debug_info.detected_sections?.length > 0 ? (
                          <div className="grid gap-1.5 sm:grid-cols-2 font-mono text-[11px]">
                            {analysisResult.debug_info.detected_sections.map((sec, i) => (
                              <div key={i} className="flex items-center justify-between rounded bg-white/5 px-2.5 py-1.5 border border-white/10">
                                <span className="font-semibold text-violet-300">{sec.heading}</span>
                                <span className="text-slate-400 text-[10px]">Lines {sec.startLine}–{sec.endLine} ({sec.section})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-400 font-mono text-[11px]">No standardized section headings detected.</span>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <span className="text-slate-400 block mb-2 font-medium">Validator Rejections:</span>
                        {analysisResult.debug_info.rejected_items?.length > 0 ? (
                          <ul className="space-y-1.5 font-mono text-[11px]">
                            {analysisResult.debug_info.rejected_items.map((rej, i) => (
                              <li key={i} className="text-rose-300 bg-rose-950/30 rounded p-1.5 border border-rose-500/20">
                                <span className="font-bold text-rose-400">[{rej.validator || 'Validator'}]</span> {rej.reason}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-400 font-mono text-[11px]">✓ All candidate items passed verbatim and content validation rules.</span>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <span className="text-slate-400 block mb-2 font-medium">Raw Extracted Text (with line numbers):</span>
                        <pre className="font-mono text-[11px] text-slate-300 bg-black/60 p-3 rounded-lg overflow-x-auto max-h-60 border border-white/5 space-y-0.5">
                          {(analysisResult.extracted_text || analysisResult.debug_info.text_preview || '').split('\n').map((line, idx) => (
                            <div key={idx} className="flex gap-3">
                              <span className="text-slate-600 select-none w-8 text-right shrink-0">{idx + 1}</span>
                              <span className="whitespace-pre">{line || ' '}</span>
                            </div>
                          ))}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Mock interview</p>
            <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Practice under realistic pressure and improve fast</h1>
          </div>
          <div className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">Timer: 03:00</div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-lg">Choose interview type</h3>
            <div className="mt-4 space-y-3">
              {['Technical', 'HR', 'Behavioral', 'System Design', 'Coding'].map((type) => (
                <button key={type} className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition">
                  {type} <ChevronDown className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button onClick={() => {
              onUsageUpdate('mockInterview');
              setStarted(true);
            }} className="mt-6 w-full sm:w-auto rounded-full bg-purple-600 hover:bg-purple-700 px-7 py-3.5 font-extrabold text-white shadow-md shadow-purple-500/25 hover:shadow-lg transition text-base">Start Interview</button>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-6">
            {started ? (
              <div>
                <p className="text-sm text-violet-300">Question 1</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Explain a scalable architecture for a real-time chat system.</h3>
                <p className="mt-4 text-slate-400">Record your answer and receive feedback on communication, confidence, and technical depth.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 font-semibold text-violet-200">Record Answer</button>
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

// ─── Skill Gap Analysis Page ─────────────────────────────────────────────────

const ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Analyst', 'Data Scientist', 'ML Engineer', 'AI/ML Research Engineer',
  'DevOps Engineer', 'Cloud Architect', 'Android Developer', 'iOS Developer',
  'UI/UX Designer', 'Product Manager', 'Cybersecurity Analyst',
];

const PRIORITY = (w) => {
  if (w >= 85) return { label: 'High', cls: 'border-rose-400/30 bg-rose-400/10 text-rose-300' };
  if (w >= 70) return { label: 'Medium', cls: 'border-amber-400/30 bg-amber-400/10 text-amber-300' };
  return { label: 'Low', cls: 'border-slate-400/30 bg-slate-400/10 text-slate-400' };
};

const CAT_COLOR = {
  technical: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  tool: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  soft: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
};

function ReadinessRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171';
  const label = score >= 70 ? 'Job Ready' : score >= 45 ? 'Getting There' : 'Needs Work';
  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          stroke={color} className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-900">{score}%</span>
        <span className="mt-0.5 text-[11px] font-semibold" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

function SkillSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-16 rounded-2xl bg-white/5 border border-white/10" />
      ))}
    </div>
  );
}

function SkillGapAnalysisPage({ onUsageUpdate }) {
  const navigate = useNavigate();
  const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const edgeFnUrl = (isSupabaseConfigured && envSupabaseUrl) ? `${envSupabaseUrl}/functions/v1/skill-gap-analysis` : '';

  const [selectedRole, setSelectedRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredRoles = ROLES.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const analyze = async () => {
    if (!selectedRole) { setError('Please select a target role.'); return; }
    if (resumeText.trim().length < 50) { setError('Please paste your resume text (minimum 50 characters).'); return; }

    onUsageUpdate('skillGapRoadmap');
    setIsAnalyzing(true);
    setResult(null);
    setError('');

    try {
      let gapData = null;

      if (edgeFnUrl) {
        try {
          const res = await fetch(edgeFnUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume_text: resumeText, role: selectedRole }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.readiness_score !== undefined) {
              gapData = data;
            }
          }
        } catch {}
      }

      if (!gapData) {
        // Fast, reliable client-side evaluator fallback
        await new Promise(r => setTimeout(r, 600));
        gapData = evaluateSkillGap(resumeText, selectedRole);
      }

      setResult(gapData);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goToRoadmap = () => {
    if (!result) return;
    const params = new URLSearchParams({
      role: result.role,
      skills: JSON.stringify(result.missing_skills.map(s => s.skill)),
    });
    navigate(`/learning-roadmap?${params.toString()}`);
  };

  const radarChartData = result ? [
    { subject: 'ATS / Format', value: result.readiness_score },
    { subject: 'Technical', value: Math.round((result.matched_skills.filter(s => s.category === 'technical').length / Math.max(1, result.total_skills_required)) * 100) },
    { subject: 'Tools', value: Math.round((result.matched_skills.filter(s => s.category === 'tool').length / Math.max(1, (result.matched_skills.filter(s=>s.category==='tool').length + result.missing_skills.filter(s=>s.category==='tool').length))) * 100) },
    { subject: 'Soft Skills', value: Math.round((result.matched_skills.filter(s => s.category === 'soft').length / Math.max(1, (result.matched_skills.filter(s=>s.category==='soft').length + result.missing_skills.filter(s=>s.category==='soft').length))) * 100) },
    { subject: 'Overall', value: result.readiness_score },
  ] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-violet-300">Skill Gap Analysis</p>
        <h1 className="mt-4 font-['Poppins'] text-4xl font-semibold leading-tight text-white sm:text-5xl">
          See exactly what's standing between you and your dream role
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Paste your resume, pick a target role, and get a ranked list of missing skills — each with a clear reason why it matters.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* ── Input Panel ─────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(139,92,246,0.1)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_50%)]" />
          <div className="relative space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Step 1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Select your target role</h2>
              <label className="mt-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Target Role</label>

              {/* Searchable dropdown */}
              <div className="relative mt-2" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(o => !o)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-left text-sm text-white transition focus:border-violet-500 focus:outline-none">
                  <span className={selectedRole ? 'text-white' : 'text-slate-500'}>{selectedRole || 'Choose a role…'}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#0a0e1a] shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/10">
                      <input autoFocus value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
                        placeholder="Search roles…"
                        className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {filteredRoles.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No roles found</p>}
                      {filteredRoles.map(r => (
                        <button key={r} onClick={() => { setSelectedRole(r); setDropdownOpen(false); setRoleSearch(''); }}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition hover:bg-violet-500/10 hover:text-white ${selectedRole === r ? 'bg-violet-500/15 text-violet-200' : 'text-slate-300'}`}>
                          {selectedRole === r && <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Step 2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Paste your resume text</h2>
              <p className="mt-1 text-xs text-slate-500">Copy all text from your resume PDF and paste it here.</p>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here — work experience, skills, education, projects…"
                className="mt-3 min-h-[220px] w-full rounded-[20px] border border-white/10 bg-[#090d20] p-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-colors resize-none" />
              <p className="mt-1 text-right text-[11px] text-slate-600">{resumeText.length} / 8000 chars</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            <button onClick={analyze} disabled={isAnalyzing || !selectedRole || resumeText.trim().length < 50}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-6 py-3.5 font-extrabold text-white shadow-md shadow-purple-500/25 hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-base">
              {isAnalyzing
                ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Analyzing your profile…</>
                : <><Sparkles className="h-4 w-4" /> Analyze Skill Gap</>}
            </button>
          </div>
        </motion.div>

        {/* ── Results Panel ────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-5">

          {/* Empty state */}
          {!isAnalyzing && !result && (
            <div className="rounded-[32px] border border-white/10 bg-[#090d20]/90 p-8 backdrop-blur-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-full border border-violet-400/30 bg-violet-400/10 p-3 text-violet-200">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">Ready to analyse</p>
                  <p className="text-base font-semibold text-white mt-0.5">Your results will appear here</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Readiness score', 'Matched skills with evidence', 'Missing skills ranked by priority', 'Why each skill matters', 'One-click roadmap builder'].map(item => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-violet-300 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isAnalyzing && (
            <div className="rounded-[32px] border border-violet-400/20 bg-[#090d20]/90 p-8 backdrop-blur-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-full border border-violet-400/30 bg-violet-400/10 p-3 text-violet-200">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Analysing…</p>
                  <p className="text-base font-semibold text-white mt-0.5">Extracting skills from your resume</p>
                </div>
              </div>
              <SkillSkeleton />
            </div>
          )}

          {/* Results */}
          {result && !isAnalyzing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Score card */}
              <div className="rounded-[32px] border border-white/10 bg-[#090d20]/95 p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(139,92,246,0.12)]">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <ReadinessRing score={result.readiness_score} />
                  <div className="flex-1 w-full">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300 mb-1">Target Role</p>
                    <h3 className="text-2xl font-semibold text-white">{result.role}</h3>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-300">{result.matched_skills.length}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Matched</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                        <p className="text-2xl font-bold text-rose-300">{result.missing_skills.length}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Missing</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                        <p className="text-2xl font-bold text-violet-300">{result.total_skills_required}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Required</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Radar chart */}
              <div className="rounded-[28px] border border-white/10 bg-[#090d20]/90 p-5 backdrop-blur-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300 mb-4">Skill Profile</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarChartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.12)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Missing skills */}
              {result.missing_skills.length > 0 && (
                <div className="rounded-[28px] border border-white/10 bg-[#090d20]/90 p-5 backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-300">Missing Skills</p>
                    <span className="text-xs text-slate-500">sorted by importance</span>
                  </div>
                  <div className="space-y-3">
                    {result.missing_skills.map((s, i) => {
                      const pri = PRIORITY(s.importance_weight);
                      const cat = CAT_COLOR[s.category] || CAT_COLOR.technical;
                      return (
                        <motion.div key={s.skill} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="rounded-2xl border border-white/8 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-semibold text-white text-sm">{s.skill}</span>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${pri.cls}`}>{pri.label}</span>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${cat}`}>{s.category}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{s.why_it_matters}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-xs font-bold text-slate-400">{s.importance_weight}</span>
                              <p className="text-[10px] text-slate-600">/ 100</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matched skills */}
              {result.matched_skills.length > 0 && (
                <div className="rounded-[28px] border border-white/10 bg-[#090d20]/90 p-5 backdrop-blur-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300 mb-4">Matched Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map(s => (
                      <div key={s.skill} title={s.evidence}
                        className="group relative rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 cursor-default">
                        <CheckCircle2 className="inline h-3 w-3 mr-1.5 text-emerald-400" />{s.skill}
                        {s.evidence && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl border border-white/10 bg-[#0a0e1a] p-2.5 text-[11px] text-slate-300 leading-snug opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 shadow-2xl">
                            {s.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA — Build Roadmap */}
              <motion.button whileHover={{ scale: 1.02 }} onClick={goToRoadmap}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-fuchsia-500 px-6 py-4 font-semibold text-white shadow-[0_0_32px_rgba(139,92,246,0.3)] transition">
                <GraduationCap className="h-5 w-5" />
                Build my Learning Roadmap
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              {/* Retry */}
              <button onClick={() => { setResult(null); setResumeText(''); setSelectedRole(''); }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white transition">
                <RefreshCw className="h-4 w-4" /> Analyse a different role
              </button>

            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Resource map per skill category
const RESOURCE_MAP = {
  technical: { platform: 'freeCodeCamp / MDN / official docs', type: 'Guided practice + documentation' },
  tool: { platform: 'Official docs + YouTube tutorials', type: 'Hands-on project setup' },
  soft: { platform: 'Coursera / LinkedIn Learning', type: 'Video course + exercises' },
};

const DIFFICULTY_MAP = (w) => w >= 85 ? 'Hard' : w >= 65 ? 'Moderate' : 'Beginner-friendly';
const WEEKS_MAP = (w) => w >= 85 ? '3–4 weeks' : w >= 65 ? '1–2 weeks' : '3–5 days';

function RoadmapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const roleParam = params.get('role') || '';
  let skillsParam = [];
  try { skillsParam = JSON.parse(params.get('skills') || '[]'); } catch { skillsParam = []; }

  const hasSkillData = skillsParam.length > 0;
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [savedId, setSavedId] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [showTitleModal, setShowTitleModal] = useState(false);

  // Build dynamic weeks from missing skills (group into batches of 2)
  const dynamicWeeks = [];
  if (hasSkillData) {
    for (let i = 0; i < skillsParam.length; i += 2) {
      const batch = skillsParam.slice(i, i + 2);
      dynamicWeeks.push({
        week: `Week ${Math.floor(i / 2) + 1}`,
        skills: batch,
        focus: batch.join(' + '),
      });
    }
  }

  const weeksToShow = hasSkillData ? dynamicWeeks : roadmapData.map(w => ({ ...w, skills: [], focus: w.topics }));

  const handleSave = async () => {
    const title = titleInput.trim() || `${roleParam} Roadmap`;
    setSaveState('saving');
    setShowTitleModal(false);
    try {
      const saved = await saveRoadmap({
        title,
        role: roleParam,
        skills: skillsParam,
        weeks: weeksToShow,
      });
      if (saved) {
        setSavedId(saved.id);
        setSaveState('saved');
      } else {
        setSaveState('error');
      }
    } catch (e) {
      console.error(e);
      setSaveState('error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Learning Roadmap</p>
        <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold sm:text-4xl">
          {roleParam ? `Your roadmap to ${roleParam}` : 'A personalized, week-by-week plan for your next move'}
        </h1>
        {hasSkillData && (
          <p className="mt-3 text-slate-400">
            {skillsParam.length} missing skills · {weeksToShow.length} week{weeksToShow.length !== 1 ? 's' : ''} plan
          </p>
        )}
        {hasSkillData && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {saveState === 'saved' ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-200">
                <BookMarked className="h-4 w-4" /> Roadmap Saved!
                <button onClick={() => navigate('/my-roadmaps')} className="ml-2 underline text-violet-300 hover:text-violet-200">View all</button>
              </div>
            ) : (
              <button
                onClick={() => setShowTitleModal(true)}
                disabled={saveState === 'saving'}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.25)] disabled:opacity-50 transition">
                {saveState === 'saving'
                  ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><BookMarked className="h-4 w-4" /> Save this Roadmap</>}
              </button>
            )}
            {saveState === 'error' && (
              <p className="text-xs text-rose-300">Save failed — check your connection and try again.</p>
            )}
          </div>
        )}
        {showTitleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0a0e1a] p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-1">Name your roadmap</h3>
              <p className="text-sm text-slate-400 mb-4">Give it a name so you can find it later.</p>
              <input
                autoFocus
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={`${roleParam} Roadmap`}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-violet-500 text-sm"
              />
              <div className="mt-4 flex gap-3">
                <button onClick={handleSave} className="flex-1 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 py-2.5 text-sm font-semibold text-white">Save Roadmap</button>
                <button onClick={() => setShowTitleModal(false)} className="flex-1 rounded-full border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Skills to learn pill row */}
      {hasSkillData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8 rounded-[24px] border border-violet-400/20 bg-violet-400/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300 mb-3">Skills to Master</p>
          <div className="flex flex-wrap gap-2">
            {skillsParam.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-400/20 text-[9px] font-bold text-violet-300">{i + 1}</span>
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Week cards */}
      <div className="space-y-5">
        {weeksToShow.map((week, idx) => (
          <motion.div key={week.week}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-bold text-white">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">{week.week}</p>
                    <p className="text-sm text-slate-400">{week.focus}</p>
                  </div>
                </div>

                {/* Skill chips for this week */}
                {week.skills?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {week.skills.map(s => (
                      <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {hasSkillData && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    {WEEKS_MAP(90 - idx * 10)}
                  </span>
                  <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-300">
                    {DIFFICULTY_MAP(90 - idx * 10)}
                  </span>
                </div>
              )}

              {!hasSkillData && (
                <div className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-sm text-violet-200 shrink-0">
                  {week.progress}% complete
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#090d20] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Resources</p>
                <p className="text-sm text-white">{hasSkillData ? RESOURCE_MAP[idx % 2 === 0 ? 'technical' : 'tool'].platform : week.resources}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#090d20] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Practice</p>
                <p className="text-sm text-white">{hasSkillData ? `Build a project using ${week.skills?.[0] || 'this skill'}` : week.projects}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#090d20] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Progress</p>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                    style={{ width: hasSkillData ? `${Math.max(5, 100 - idx * 20)}%` : `${week.progress}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{hasSkillData ? `${Math.max(5, 100 - idx * 20)}% avg completion` : `${week.progress}%`}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA back to skill gap */}
      {hasSkillData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-8 rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-6 text-center">
          <p className="text-sm font-semibold text-violet-200">Want to re-analyse with a different role?</p>
          <Link to="/skill-gap-analysis"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white">
            <RefreshCw className="h-4 w-4" /> Back to Skill Gap Analysis
          </Link>
        </motion.div>
      )}
    </div>
  );
}

function SavedRoadmapsPage() {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await getSavedRoadmaps();
    setRoadmaps(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    await deleteRoadmap(id);
    setRoadmaps(prev => prev.filter(r => r.id !== id));
    setDeletingId(null);
  };

  const handleUpdateNotes = async (id) => {
    await updateRoadmap(id, { notes: editNotes });
    setRoadmaps(prev => prev.map(r => r.id === id ? { ...r, notes: editNotes } : r));
    setEditingId(null);
  };

  const handleUpdateProgress = async (id, pct) => {
    await updateRoadmap(id, { progress_pct: pct });
    setRoadmaps(prev => prev.map(r => r.id === id ? { ...r, progress_pct: pct } : r));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-violet-300">My Roadmaps</p>
            <h1 className="mt-2 font-['Poppins'] text-4xl font-semibold text-white">Saved Learning Roadmaps</h1>
            <p className="mt-2 text-slate-400">Track, update, and revisit your personalized learning plans.</p>
          </div>
          <Link to="/skill-gap-analysis" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white">
            <PlusCircle className="h-4 w-4" /> New Roadmap
          </Link>
        </div>
      </motion.div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-[28px] bg-white/5 border border-white/10" />)}
        </div>
      )}

      {!loading && roadmaps.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-[32px] border border-white/10 bg-white/5 p-16 text-center backdrop-blur-2xl">
          <BookMarked className="mx-auto h-12 w-12 text-violet-400/40 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No saved roadmaps yet</h3>
          <p className="text-slate-400 mb-6">Run a Skill Gap Analysis and save your roadmap to see it here.</p>
          <Link to="/skill-gap-analysis"
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-purple-500/25 transition">
            <PlusCircle className="h-4 w-4" /> Start Skill Gap Analysis
          </Link>
        </motion.div>
      )}

      <div className="space-y-6">
        {roadmaps.map((rm, idx) => (
          <motion.div key={rm.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
            className="rounded-[28px] border border-white/10 bg-[#090d20]/90 p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(139,92,246,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold text-white">{rm.title}</h3>
                  <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-xs font-semibold text-violet-300">{rm.role}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(rm.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {rm.skills?.length || 0} skills</span>
                  <span className="flex items-center gap-1"><BarChart2 className="h-3 w-3" /> {Array.isArray(rm.weeks) ? rm.weeks.length : 0} weeks</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/learning-roadmap?role=${encodeURIComponent(rm.role)}&skills=${encodeURIComponent(JSON.stringify(rm.skills || []))}`)}
                  className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-400/20 transition">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button
                  onClick={() => { setEditingId(rm.id); setEditNotes(rm.notes || ''); }}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition">
                  <Pencil className="h-3.5 w-3.5" /> Notes
                </button>
                <button
                  onClick={() => handleDelete(rm.id)}
                  disabled={deletingId === rm.id}
                  className="flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-400/15 transition disabled:opacity-40">
                  {deletingId === rm.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Overall Progress</span>
                <span className="text-xs font-semibold text-violet-300">{rm.progress_pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                handleUpdateProgress(rm.id, Math.min(100, Math.max(0, pct)));
              }}>
                <div className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all duration-300"
                  style={{ width: `${rm.progress_pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-slate-600">Click the bar to update progress</p>
            </div>

            {/* Skills pills */}
            {rm.skills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {rm.skills.slice(0, 8).map(s => (
                  <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">{s}</span>
                ))}
                {rm.skills.length > 8 && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-500">+{rm.skills.length - 8} more</span>}
              </div>
            )}

            {/* Notes editor */}
            {editingId === rm.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 border-t border-white/5 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Notes</p>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add notes, links, or reminders for this roadmap…"
                  className="w-full min-h-[100px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 resize-none"
                />
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleUpdateNotes(rm.id)} className="rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white">Save Notes</button>
                  <button onClick={() => setEditingId(null)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-400">Cancel</button>
                </div>
              </motion.div>
            )}

            {/* Show existing notes if not editing */}
            {rm.notes && editingId !== rm.id && (
              <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-3 text-xs text-slate-400 leading-relaxed">
                {rm.notes}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DashboardPage({ usageMetrics: localMetrics }) {
  const navigate = useNavigate();
  const [dbMetrics, setDbMetrics] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [savedRoadmapsCount, setSavedRoadmapsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [session, setSession] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savedFeedbackId, setSavedFeedbackId] = useState(null);

  const startEditing = (analysis) => {
    setEditingId(analysis.id);
    setEditingName(analysis.file_name || '');
  };

  const handleSaveRename = async (id) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    const newName = editingName.trim();
    setRecentAnalyses(prev => prev.map(item => item.id === id ? { ...item, file_name: newName } : item));
    setEditingId(null);
    await updateResumeAnalysisFileName(id, newName);
    setSavedFeedbackId(id);
    setTimeout(() => setSavedFeedbackId(null), 2500);
  };

  useEffect(() => {
    let cancelled = false;
    const checkLocal = () => {
      try {
        const stored = localStorage.getItem('elevAIte_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!cancelled) setSession(parsed);
          return true;
        }
      } catch {}
      return false;
    };
    checkLocal();

    try {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!cancelled && s) setSession(s);
      }).catch(() => {});
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
        if (!cancelled) {
          if (s) setSession(s);
          else checkLocal();
        }
      });
      return () => {
        cancelled = true;
        subscription?.unsubscribe?.();
      };
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [metrics, analyses, roadmaps] = await Promise.all([
        getUsageMetrics(),
        getResumeAnalyses(5),
        getSavedRoadmaps(),
      ]);
      setDbMetrics(metrics);
      setRecentAnalyses(analyses);
      setSavedRoadmapsCount(roadmaps.length);
      setLoading(false);
    };
    load();
  }, [session]);

  const resumeCount = dbMetrics?.resume_analyzer_count ?? localMetrics.resumeAnalyzer;
  const mockCount = dbMetrics?.mock_interview_count ?? localMetrics.mockInterview;
  const skillGapCount = dbMetrics?.skill_gap_count ?? localMetrics.skillGapRoadmap;
  const internshipCount = dbMetrics?.internship_count ?? localMetrics.internshipRecommendation;

  const statCards = [
    { label: 'Resume Analyses', value: resumeCount, icon: FileText, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', link: '/resume-analyzer' },
    { label: 'Mock Interviews', value: mockCount, icon: BrainCircuit, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', link: '/mock-interview' },
    { label: 'Skill Gap Analyses', value: skillGapCount, icon: BarChart2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', link: '/skill-gap-analysis' },
    { label: 'Saved Roadmaps', value: savedRoadmapsCount, icon: BookMarked, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', link: '/my-roadmaps' },
  ];

  const avgScore = recentAnalyses.length > 0
    ? Math.round(recentAnalyses.reduce((s, a) => s + (a.overall_score || 0), 0) / recentAnalyses.length)
    : null;

  const scoreChartData = recentAnalyses
    .slice()
    .reverse()
    .map((a, i) => ({ name: `#${i + 1}`, score: a.overall_score || 0 }));

  const userName = resolveUserName(session);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-indigo-700">Dashboard</p>
            <h1 className="mt-2 font-['Poppins'] text-4xl font-bold text-slate-900">
              {session ? `Welcome back, ${userName}` : 'Your Activity'}
            </h1>
            <p className="mt-1.5 text-slate-700 text-sm font-semibold">
              {session ? 'Your data is saved to your account across all devices.' : 'Sign in to sync your data across devices.'}
            </p>
          </div>
          {!session && (
            <Link to="/login" className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white self-start shadow-sm hover:bg-slate-800 transition">
              Sign in to sync data
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, link }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => navigate(link)}
            className="cursor-pointer rounded-[24px] border border-slate-200/80 bg-white/85 p-5 backdrop-blur-2xl hover:border-indigo-300 hover:shadow-md transition group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</p>
                <p className={`mt-2 text-4xl font-extrabold ${color}`}>
                  {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-slate-200" /> : value}
                </p>
              </div>
              <div className={`rounded-xl border p-2.5 ${bg} shadow-2xs`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 transition flex items-center gap-1">
              Go to feature <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5 rounded-2xl bg-white/80 border border-slate-200/90 p-1.5 w-fit shadow-xs backdrop-blur-md">
        {['overview', 'resume history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-5 py-2 text-sm font-bold capitalize transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Resume score chart */}
          <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Resume Score History</h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">Your last {recentAnalyses.length} analyses</p>
              </div>
              {avgScore !== null && (
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-600">Avg score</p>
                  <p className={`text-2xl font-extrabold ${avgScore >= 70 ? 'text-emerald-700' : avgScore >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>{avgScore}</p>
                </div>
              )}
            </div>
            {loading ? (
              <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ) : scoreChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreChartData}>
                  <CartesianGrid stroke="rgba(203, 213, 225, 0.6)" />
                  <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
                <FileText className="h-8 w-8 text-indigo-500 mb-2" />
                <p className="text-slate-800 text-sm font-bold">No resume analyses yet</p>
                <Link to="/resume-analyzer" className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">Analyse your first resume →</Link>
              </div>
            )}
          </div>

          {/* Quick actions + profile */}
          <div className="space-y-5">
            {session && (
              <div className="rounded-[24px] border border-indigo-200/80 bg-white/85 p-5 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">Account</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white uppercase shadow-sm">
                    {userName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{session.user.email}</p>
                    <p className="text-[11px] font-semibold text-slate-500">Joined {new Date(session.user.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Quick Actions</p>
              <div className="space-y-2">
                {[
                  { label: 'Analyse a Resume', link: '/resume-analyzer', icon: FileText },
                  { label: 'Skill Gap Analysis', link: '/skill-gap-analysis', icon: BarChart2 },
                  { label: 'My Roadmaps', link: '/my-roadmaps', icon: BookMarked },
                  { label: 'Mock Interview', link: '/mock-interview', icon: BrainCircuit },
                ].map(({ label, link, icon: Icon }) => (
                  <Link key={label} to={link}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-indigo-600" /> {label}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resume history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-[24px] bg-white/5 border border-white/10" />)}
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-violet-400/40 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">No resume analyses yet</h3>
              <p className="text-slate-400 text-sm mb-5">Upload your first resume to see your analysis history here.</p>
              <Link to="/resume-analyzer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition">
                Analyse a Resume
              </Link>
            </div>
          ) : (
            recentAnalyses.map((a, idx) => {
              const score = a.overall_score || 0;
              const scoreColor = score >= 70 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700';
              const scoreBg = score >= 70 ? 'border-emerald-300 bg-emerald-50' : score >= 50 ? 'border-amber-300 bg-amber-50' : 'border-rose-300 bg-rose-50';
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-xs backdrop-blur-2xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl font-extrabold ${scoreBg} ${scoreColor}`}>
                        {score}
                      </div>
                      <div className="min-w-0">
                        {editingId === a.id ? (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(a.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="rounded-lg border border-indigo-400 bg-white px-2.5 py-1 text-sm font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              placeholder="Resume file name"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(a.id)}
                              title="Save changes"
                              aria-label="Save changes"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              title="Cancel"
                              aria-label="Cancel"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <p className="font-bold text-slate-900 truncate">{a.file_name}</p>
                            <button
                              type="button"
                              onClick={() => startEditing(a)}
                              title="Rename resume"
                              aria-label="Rename resume"
                              className="rounded-md p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {savedFeedbackId === a.id && (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <Check className="h-3 w-3" /> Saved!
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {a.experience_level && (
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">{a.experience_level}</span>
                          )}
                          {a.ats_compatibility != null && (
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">ATS: {a.ats_compatibility}%</span>
                          )}
                          {a.keyword_match != null && (
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">Keywords: {a.keyword_match}%</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Link to="/resume-analyzer"
                      className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shrink-0">
                      Re-analyse <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  {a.executive_summary && (
                    <p className="mt-3 text-xs font-semibold text-slate-700 leading-relaxed border-t border-slate-200/70 pt-3">{a.executive_summary}</p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function PricingPage({ onUsageUpdate }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Pricing</p>
        <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Choose the plan that matches your ambition</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <h3 className="text-2xl font-semibold text-white">Free</h3>
          <p className="mt-2 text-slate-400">Great for first steps and foundational preparation.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            {['Resume Analysis', 'Roadmaps', 'Skill Analysis'].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-violet-300" /> {item}</div>
            ))}
          </div>
          <button className="mt-8 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white">Try Free</button>
        </div>
        <div className="rounded-[28px] border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-violet-500/15 p-8 shadow-soft backdrop-blur-2xl">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">Premium</div>
          <h3 className="mt-4 text-2xl font-semibold text-white">Resume AI Pro</h3>
          <p className="mt-2 text-slate-300">Unlock unlimited interviews, mentor support, and internship recommendations tailored to your profile.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-200">
            {['Unlimited Interviews', 'Internship Recommendations for $3 for 3 curated matches', 'Career Mentor', 'Certificates'].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-violet-300" /> {item}</div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#090d20]/70 p-4">
            <p className="text-sm font-semibold text-white">UPI Payment</p>
            <p className="mt-2 text-sm text-slate-400">Scan the QR code to pay $3 for 3 internship recommendations.</p>
            <img src="/UPI.qr.jpeg" alt="UPI payment QR code" className="mt-4 h-40 w-40 rounded-2xl border border-violet-400/30 object-cover" />
          </div>
          <button onClick={() => onUsageUpdate('internshipRecommendation')} className="mt-8 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 px-5 py-3 font-semibold text-white">Request Internship Match</button>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">About us</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Contact</p>
          <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">Let’s shape your next move together</h1>
          <p className="mt-4 text-slate-400">Reach out for product questions, partnerships, or feedback.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Primary Email</p>
              <p className="mt-2 flex items-center gap-2"><MessageCircleMore className="h-4 w-4 text-violet-300" /> Ashirwadvermabtech25-29@liet.in</p>
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Support Email</p>
              <p className="mt-2 flex items-center gap-2"><MessageCircleMore className="h-4 w-4 text-violet-300" /> ckr142004@gmail.com</p>
            </div>
            <p className="flex items-center gap-2"><Compass className="h-4 w-4 text-violet-300" /> India • Available for support and collaboration</p>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-[#090d20] p-8 shadow-soft">
          <div className="space-y-4">
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Email" />
            <textarea className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Message" />
            <button className="rounded-full bg-gradient-to-r from-violet-400 to-violet-500 px-5 py-3 font-semibold text-white">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ type }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputClass = "w-full rounded-2xl border border-white/10 bg-[#090d20] px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-violet-500 transition text-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (type === 'signup') {
      if (!email || !password || !confirmPassword) { setError('All fields are required.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    } else {
      if (!email || !password) { setError('Email and password are required.'); return; }
    }

    setLoading(true);
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="grid w-full gap-8 rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-soft backdrop-blur-2xl lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">{type === 'login' ? 'Login' : 'Sign up'}</p>
          <h1 className="mt-3 font-['Poppins'] text-3xl font-semibold">
            {type === 'login' ? 'Welcome back to your AI career workspace' : 'Create your future-ready career profile'}
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {type === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                placeholder="Full name"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              placeholder="Email address"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass + ' pr-11'}
                placeholder="Password (min 6 characters)"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {type === 'signup' && (
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Confirm password"
              />
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{success}</span>
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 px-5 py-3 font-semibold text-white disabled:opacity-50 transition">
              {loading
                ? <><LoaderCircle className="h-4 w-4 animate-spin" /> {type === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : type === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            {type === 'login'
              ? <>Don't have an account? <Link to="/signup" className="text-violet-300 hover:text-violet-200 transition">Sign up</Link></>
              : <>Already have an account? <Link to="/login" className="text-violet-300 hover:text-violet-200 transition">Login</Link></>}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#090d20] p-6">
          <div className="rounded-[20px] border border-violet-400/20 bg-violet-400/10 p-6 text-center">
            <BrainCircuit className="mx-auto h-10 w-10 text-violet-300" />
            <h3 className="mt-4 text-xl font-semibold text-white">AI career acceleration</h3>
            <p className="mt-3 text-sm text-slate-400">Access resume insights, interview mastery, and career roadmaps from one beautiful workspace.</p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {['Resume ATS analysis', 'Skill gap reports', 'Saved roadmaps', 'Progress tracking'].map(item => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left">
                  <CheckCircle2 className="h-4 w-4 text-violet-300 shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MainLayout;