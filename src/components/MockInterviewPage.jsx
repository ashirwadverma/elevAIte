import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Info,
  LoaderCircle,
  Lock,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase.js';
import {
  getCourses,
  getEngineerTypesForCourse,
  selectFallbackQuestions,
  evaluateAnswerFallback,
  computeSessionSummary,
  DEFAULT_TIME_LIMIT_SEC,
  WARNING_TIME_SEC,
  MAX_ANSWER_CHARS,
  DIFFICULTIES,
  QUESTION_COUNTS,
} from '../lib/mockInterviewEngine.js';
import {
  saveMockInterviewSession,
  getMockInterviewStats,
  getStudentPreferredCourse,
  saveStudentPreferredCourse,
  FREE_MONTHLY_MOCK_INTERVIEW_LIMIT,
} from '../lib/db.js';

function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDurationReadable(totalSec) {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  return `${m}m ${rem}s`;
}

export default function MockInterviewPage({ onUsageUpdate, session, sessionLoading }) {
  const navigate = useNavigate();
  const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const edgeFnUrl = isSupabaseConfigured && envSupabaseUrl
    ? `${envSupabaseUrl}/functions/v1/mock-interview`
    : '';

  const courses = getCourses();

  // Setup state
  const [course, setCourse] = useState('');
  const [engineerType, setEngineerType] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);

  // Plan & profile integration state
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [isProPlan, setIsProPlan] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [streak, setStreak] = useState(0);

  // Interview runtime state ('empty' | 'question' | 'feedback' | 'summary')
  const [panelState, setPanelState] = useState('empty');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT_SEC);
  const [isPaused, setIsPaused] = useState(false);

  // Async & feedback state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [usingFallbackNotice, setUsingFallbackNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  // Refs to prevent stale closures on 0-second auto-submit
  const answerTextRef = useRef(answerText);
  answerTextRef.current = answerText;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const isSubmittingRef = useRef(false);

  const availableRoles = getEngineerTypesForCourse(course);
  const selectedRoleInfo = availableRoles.find(r => r.role === engineerType) || null;
  const isInterviewActive = panelState === 'question' || panelState === 'feedback';
  const isQuotaReached = !isProPlan && monthlyCount >= FREE_MONTHLY_MOCK_INTERVIEW_LIMIT;

  // Prefill student course from profile & load quota/stats (IR-4, IR-5)
  useEffect(() => {
    const preferred = getStudentPreferredCourse(session);
    if (preferred && courses.includes(preferred) && !course) {
      setCourse(preferred);
    }

    let cancelled = false;
    getMockInterviewStats(session).then((stats) => {
      if (cancelled) return;
      setMonthlyCount(stats.monthlyCount);
      setIsProPlan(stats.isPro);
      setRecentSessions(stats.sessions.slice(0, 3));
      setStreak(stats.streak);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [session]);

  const handleCourseChange = (newCourse) => {
    setCourse(newCourse);
    saveStudentPreferredCourse(newCourse);
    const allowed = getEngineerTypesForCourse(newCourse).map(r => r.role);
    if (engineerType && !allowed.includes(engineerType)) {
      setEngineerType('');
    }
    setErrorMsg('');
  };

  // Timer countdown effect (FR-6)
  useEffect(() => {
    if (panelState !== 'question' || isPaused || isEvaluating) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          // Trigger auto-submit at 0 on next tick safely
          setTimeout(() => {
            if (!isSubmittingRef.current) {
              handleSubmitAnswer({ autoSubmitted: true });
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [panelState, isPaused, isEvaluating, currentIndex]);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else if (session?.user?.id || session?.user?.email) {
      headers['x-student-session'] = session.user.id || session.user.email;
    }
    return headers;
  };

  const startInterview = async (overrideParams = null) => {
    const targetCourse = overrideParams?.course ?? course;
    const targetRole = overrideParams?.role ?? engineerType;
    const targetDiff = overrideParams?.difficulty ?? difficulty;
    const targetCount = overrideParams?.count ?? questionCount;

    if (!session) {
      setErrorMsg('Please sign in to your student account before starting an interview.');
      return;
    }
    if (!targetCourse || !targetRole) {
      setErrorMsg('Please choose both your course and target engineer role.');
      return;
    }
    if (isQuotaReached) {
      setErrorMsg(`You have reached the Free Plan limit of ${FREE_MONTHLY_MOCK_INTERVIEW_LIMIT} mock interviews this month. Upgrade to Pro for unlimited interviews.`);
      return;
    }

    setErrorMsg('');
    setUsingFallbackNotice('');
    setIsGenerating(true);
    setSummaryData(null);
    setCurrentFeedback(null);
    setEvaluatedAnswers([]);
    setAnswerText('');
    setIsPaused(false);
    isSubmittingRef.current = false;

    try {
      let generatedQuestions = null;

      if (edgeFnUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(edgeFnUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            signal: controller.signal,
            body: JSON.stringify({
              action: 'questions',
              course: targetCourse,
              role: targetRole,
              difficulty: targetDiff,
              count: targetCount,
            }),
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.questions) && data.questions.length > 0) {
              generatedQuestions = data.questions;
            }
          }
        } catch {
          // Graceful fallback to curated static question bank (FR-10)
        }
      }

      if (!generatedQuestions) {
        generatedQuestions = selectFallbackQuestions({
          course: targetCourse,
          role: targetRole,
          difficulty: targetDiff,
          count: targetCount,
        });
        setUsingFallbackNotice('Using offline campus question bank — AI server unavailable or unconfigured.');
      }

      if (!generatedQuestions || generatedQuestions.length === 0) {
        setErrorMsg('Could not load questions for this role. Please try another role.');
        return;
      }

      onUsageUpdate?.('mockInterview');
      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setTimeLeft(generatedQuestions[0]?.timeLimitSec || DEFAULT_TIME_LIMIT_SEC);
      setPanelState('question');
    } catch (err) {
      setErrorMsg(err?.message || 'Unable to start interview session. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = async ({ skipped = false, autoSubmitted = false } = {}) => {
    if (isSubmittingRef.current || panelState !== 'question') return;
    const activeQuestion = questions[currentIndex];
    if (!activeQuestion) return;

    isSubmittingRef.current = true;
    setIsEvaluating(true);
    setIsPaused(false);
    setErrorMsg('');

    const rawAnswer = skipped ? '' : (answerTextRef.current || '').slice(0, MAX_ANSWER_CHARS).trim();
    const limitSec = activeQuestion.timeLimitSec || DEFAULT_TIME_LIMIT_SEC;
    const elapsedSec = Math.max(1, limitSec - (timeLeftRef.current ?? 0));

    try {
      let evaluation = null;

      if (!skipped && rawAnswer.length > 0 && edgeFnUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);
          const res = await fetch(edgeFnUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            signal: controller.signal,
            body: JSON.stringify({
              action: 'evaluate',
              course,
              role: engineerType,
              difficulty,
              questionId: activeQuestion.id,
              questionText: activeQuestion.text,
              topic: activeQuestion.topic,
              answerText: rawAnswer,
            }),
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (typeof data?.score === 'number') {
              evaluation = data;
            }
          }
        } catch {
          // Graceful fallback to offline evaluator (FR-10)
        }
      }

      if (!evaluation) {
        evaluation = evaluateAnswerFallback({
          question: activeQuestion,
          answerText: rawAnswer,
          difficulty,
          skipped,
        });
      }

      const answerRecord = {
        questionId: activeQuestion.id,
        questionText: activeQuestion.text,
        topic: evaluation.topic || activeQuestion.topic,
        answerText: rawAnswer,
        score: Number(evaluation.score) || 0,
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
        gaps: Array.isArray(evaluation.gaps) ? evaluation.gaps : [],
        idealAnswer: evaluation.idealAnswer || activeQuestion.idealAnswer || '',
        timeTakenSec: elapsedSec,
        skipped,
        autoSubmitted,
      };

      setEvaluatedAnswers(prev => [...prev, answerRecord]);
      setCurrentFeedback(answerRecord);
      setPanelState('feedback');
    } catch (err) {
      setErrorMsg(err?.message || 'Evaluation failed. Please retry.');
    } finally {
      setIsEvaluating(false);
      isSubmittingRef.current = false;
    }
  };

  const finalizeSession = async (finalAnswers) => {
    const computed = computeSessionSummary({
      course,
      role: engineerType,
      difficulty,
      answers: finalAnswers,
    });

    const summaryObj = {
      ...computed,
      answers: finalAnswers,
    };

    setSummaryData(summaryObj);
    setPanelState('summary');

    // Save to account & localStorage history (FR-11, IR-6)
    await saveMockInterviewSession(summaryObj);
    try {
      const updatedStats = await getMockInterviewStats(session);
      setMonthlyCount(updatedStats.monthlyCount);
      setRecentSessions(updatedStats.sessions.slice(0, 3));
      setStreak(updatedStats.streak);
    } catch {}
  };

  const handleNextQuestion = async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      setAnswerText('');
      setCurrentFeedback(null);
      setIsPaused(false);
      setTimeLeft(questions[nextIdx]?.timeLimitSec || DEFAULT_TIME_LIMIT_SEC);
      setPanelState('question');
    } else {
      await finalizeSession(evaluatedAnswers);
    }
  };

  const handleEndEarly = async () => {
    if (evaluatedAnswers.length > 0) {
      await finalizeSession(evaluatedAnswers);
    } else {
      setPanelState('empty');
      setQuestions([]);
      setAnswerText('');
      setTimeLeft(DEFAULT_TIME_LIMIT_SEC);
      setIsPaused(false);
    }
  };

  const handleBuildRoadmap = () => {
    if (!summaryData) return;
    const targetSkills = summaryData.weakTopics.length > 0
      ? summaryData.weakTopics
      : getEngineerTypesForCourse(summaryData.course).find(r => r.role === summaryData.role)?.topics.slice(0, 4) || [];
    const params = new URLSearchParams({
      role: summaryData.role,
      skills: JSON.stringify(targetSkills),
    });
    navigate(`/learning-roadmap?${params.toString()}`);
  };

  const resetToSetup = () => {
    setPanelState('empty');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerText('');
    setCurrentFeedback(null);
    setEvaluatedAnswers([]);
    setSummaryData(null);
    setTimeLeft(DEFAULT_TIME_LIMIT_SEC);
    setIsPaused(false);
    setUsingFallbackNotice('');
    setErrorMsg('');
  };

  const activeQuestion = questions[currentIndex];
  const isWarningTime = panelState === 'question' && timeLeft < WARNING_TIME_SEC;
  const remainingFreeSessions = Math.max(0, FREE_MONTHLY_MOCK_INTERVIEW_LIMIT - monthlyCount);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 sm:p-8 backdrop-blur-2xl">
        {/* Header (PRD Section 8 Page 6) */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Student Interview</p>
            <h1 className="mt-2 font-['Poppins'] text-3xl sm:text-4xl font-semibold text-white">
              Practice under realistic pressure and improve fast
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {session && (
              <div className="rounded-full border border-indigo-200/80 bg-indigo-50/90 px-4 py-2 text-xs font-bold text-indigo-700">
                {isProPlan
                  ? 'Pro Plan • Unlimited'
                  : `Free Plan: ${remainingFreeSessions}/${FREE_MONTHLY_MOCK_INTERVIEW_LIMIT} left this month`}
              </div>
            )}
            <div
              data-testid="interview-timer-pill"
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                isWarningTime
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-700 animate-pulse'
                  : 'border-violet-400/30 bg-violet-400/10 text-violet-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Timer: {formatTimer(panelState === 'question' ? timeLeft : DEFAULT_TIME_LIMIT_SEC)}</span>
              {isPaused && panelState === 'question' && (
                <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] uppercase text-amber-800">
                  Paused
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Auth Guard (IR-2: Only signed-in students can use it) */}
        {!sessionLoading && !session && (
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[24px] border border-amber-300/60 bg-amber-50/90 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Sign in required for Student Mock Interviews</h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                  Sign in with your elevAIte student account to launch timed interviews, track streaks, and save session scores.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/login"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-extrabold text-white shadow-sm transition"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        )}

        {/* Two-column responsive layout (Setup left, Interview panel right) */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] items-start">
          {/* ── Left Card (Setup) ─────────────────────────────────────── */}
          <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-6 shadow-xs backdrop-blur-2xl">
            <h2 className="font-bold text-slate-900 text-lg">Set up your interview</h2>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Tailored strictly to your degree stream and target engineering role.
            </p>

            <div className="mt-5 space-y-4">
              {/* Course Selector (FR-2) */}
              <div>
                <label htmlFor="mi-course" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Course
                </label>
                <select
                  id="mi-course"
                  value={course}
                  disabled={isInterviewActive || isGenerating}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition"
                >
                  <option value="">Choose your course…</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Engineer Type Selector (FR-3: updates dynamically based on course) */}
              <div>
                <label htmlFor="mi-role" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Engineer Type
                </label>
                <select
                  id="mi-role"
                  value={engineerType}
                  disabled={!course || isInterviewActive || isGenerating}
                  onChange={(e) => {
                    setEngineerType(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition"
                >
                  <option value="">
                    {course ? 'Choose engineer role…' : 'Select a course first…'}
                  </option>
                  {availableRoles.map((r) => (
                    <option key={r.role} value={r.role}>{r.role}</option>
                  ))}
                </select>

                {selectedRoleInfo && (
                  <div className="mt-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5">
                      Core Topics Covered
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRoleInfo.topics.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty Selector */}
              <div>
                <span id="mi-diff-label" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Difficulty
                </span>
                <div role="radiogroup" aria-labelledby="mi-diff-label" className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((level) => {
                    const selected = difficulty === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={isInterviewActive || isGenerating}
                        onClick={() => setDifficulty(level)}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                          selected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number of Questions Selector */}
              <div>
                <span id="mi-count-label" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Number of Questions
                </span>
                <div role="radiogroup" aria-labelledby="mi-count-label" className="grid grid-cols-3 gap-2">
                  {QUESTION_COUNTS.map((cnt) => {
                    const selected = questionCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={isInterviewActive || isGenerating}
                        onClick={() => setQuestionCount(cnt)}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                          selected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        {cnt} Questions
                      </button>
                    );
                  })}
                </div>
              </div>

              {isQuotaReached && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                  <p className="font-bold">Monthly free limit reached ({FREE_MONTHLY_MOCK_INTERVIEW_LIMIT}/{FREE_MONTHLY_MOCK_INTERVIEW_LIMIT} sessions used)</p>
                  <Link to="/pricing" className="mt-1.5 inline-flex items-center gap-1 font-extrabold text-indigo-700 hover:underline">
                    Upgrade to Pro for unlimited interviews <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Start Interview Button (FR-4: disabled until course & engineerType chosen) */}
              <button
                type="button"
                onClick={() => startInterview()}
                disabled={!session || !course || !engineerType || isQuotaReached || isGenerating || isInterviewActive}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-7 py-3.5 font-extrabold text-white shadow-md shadow-purple-500/25 hover:shadow-lg transition disabled:opacity-45 disabled:cursor-not-allowed text-base cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Generating Interview…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Start Interview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right Card (Interview Panel: 4 States) ─────────────────── */}
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 min-h-[420px] flex flex-col justify-between">
            {/* State 1: Empty */}
            {panelState === 'empty' && (
              <div className="flex flex-1 flex-col justify-between gap-6">
                <div className="flex flex-1 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-white/20 p-10 text-center">
                  <div className="rounded-2xl border border-violet-300/40 bg-violet-400/10 p-4 text-violet-300 mb-4">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="text-base font-semibold text-white">
                    Select a course and role, then start your first interview.
                  </p>
                  <p className="mt-2 max-w-md text-xs text-slate-400">
                    Each question enforces a 03:00 countdown timer, scores your written answer out of 10, highlights missing concepts, and identifies weak topics to study next.
                  </p>
                </div>

                {session && recentSessions.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Recent Student Sessions</p>
                      {streak > 0 && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          {streak}-day practice streak
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {recentSessions.map((rs) => (
                        <div key={rs.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{rs.role} • {rs.difficulty}</p>
                            <p className="text-[11px] text-slate-500">{rs.course} • {new Date(rs.created_at || rs.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 font-extrabold ${
                            (rs.overall_score ?? rs.overallScore) >= 70
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : (rs.overall_score ?? rs.overallScore) >= 50
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {rs.overall_score ?? rs.overallScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* State 2: Active Question */}
            {panelState === 'question' && activeQuestion && (
              <div className="flex flex-1 flex-col justify-between space-y-5">
                <div>
                  {/* Progress & Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-violet-300">
                        Question {currentIndex + 1} of {questions.length}
                      </span>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                        {activeQuestion.topic}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        {difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPaused((p) => !p)}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        {isPaused ? <><Play className="h-3.5 w-3.5 text-emerald-600" /> Resume</> : <><Pause className="h-3.5 w-3.5 text-amber-600" /> Pause</>}
                      </button>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                          isWarningTime
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {formatTimer(timeLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  {/* Friendly Fallback Notice (FR-10) */}
                  {usingFallbackNotice && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/90 px-3 py-2 text-[11px] font-semibold text-indigo-800">
                      <Info className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                      <span>{usingFallbackNotice}</span>
                    </div>
                  )}

                  {isWarningTime && !isPaused && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Less than 30 seconds remaining — answer will auto-submit at 00:00.</span>
                    </div>
                  )}
                </div>

                {/* Question & Textarea (masked while paused) */}
                {isPaused ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/80 p-10 text-center my-4">
                    <Pause className="h-8 w-8 text-amber-600 mb-3" />
                    <h3 className="text-lg font-bold text-slate-900">Interview Paused</h3>
                    <p className="mt-1 text-xs text-slate-700 max-w-sm">
                      Your countdown timer is frozen at {formatTimer(timeLeft)}. Resume whenever you are ready to continue answering.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPaused(false)}
                      className="mt-5 flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm cursor-pointer"
                    >
                      <Play className="h-4 w-4" /> Resume Interview
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {activeQuestion.text}
                    </h3>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="mi-answer" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Your Answer
                        </label>
                        <span className={`text-[11px] font-bold ${answerText.length >= 1800 ? 'text-amber-700' : 'text-slate-500'}`}>
                          {answerText.length} / {MAX_ANSWER_CHARS} chars
                        </span>
                      </div>
                      <textarea
                        id="mi-answer"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value.slice(0, MAX_ANSWER_CHARS))}
                        maxLength={MAX_ANSWER_CHARS}
                        disabled={isEvaluating}
                        placeholder="Type your structured technical explanation here — include core definitions, why/how it works, and a concrete example..."
                        className="min-h-[180px] w-full rounded-[20px] border border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-y transition"
                      />
                    </div>
                  </div>
                )}

                {/* Action controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSubmitAnswer({ skipped: false })}
                      disabled={isPaused || isEvaluating || answerText.trim().length === 0}
                      className="flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm disabled:opacity-45 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      {isEvaluating ? (
                        <><LoaderCircle className="h-4 w-4 animate-spin" /> Scoring Answer…</>
                      ) : (
                        <>Submit Answer <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitAnswer({ skipped: true })}
                      disabled={isPaused || isEvaluating}
                      className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-45 cursor-pointer"
                    >
                      <SkipForward className="h-3.5 w-3.5" /> Skip Question
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleEndEarly}
                    disabled={isEvaluating}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  >
                    End Interview
                  </button>
                </div>
              </div>
            )}

            {/* State 3: Instant Feedback (FR-8) */}
            {panelState === 'feedback' && currentFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-1 flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                        Answer Evaluation • Question {currentIndex + 1} of {questions.length}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                          {currentFeedback.topic}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                          Time taken: {formatDurationReadable(currentFeedback.timeTakenSec)}
                        </span>
                        {currentFeedback.autoSubmitted && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            Auto-submitted on timer
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-baseline gap-1 rounded-2xl border px-4 py-2 font-extrabold ${
                        currentFeedback.score >= 7
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : currentFeedback.score >= 5
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-rose-300 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span className="text-2xl">{currentFeedback.score}</span>
                      <span className="text-xs opacity-75">/ 10</span>
                    </div>
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What Was Good
                      </p>
                      {currentFeedback.strengths.length > 0 ? (
                        <ul className="space-y-1.5 text-xs font-medium text-slate-800">
                          {currentFeedback.strengths.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600">No strengths recorded (question skipped or unanswered).</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                        <XCircle className="h-4 w-4 text-amber-600" /> What Was Missing
                      </p>
                      <ul className="space-y-1.5 text-xs font-medium text-slate-800">
                        {currentFeedback.gaps.map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Ideal Answer Outline */}
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1.5">
                      Short Ideal Answer Outline
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                      {currentFeedback.idealAnswer}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition cursor-pointer"
                  >
                    {currentIndex + 1 < questions.length ? (
                      <>Next Question <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <>Finish & View Result Summary <Trophy className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* State 4: Result Summary (FR-9, IR-6) */}
            {panelState === 'summary' && summaryData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-1 flex-col justify-between space-y-5"
              >
                <div className="space-y-5">
                  {/* Overall Score Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-white/90 p-5 shadow-xs">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Interview Complete</p>
                      <h3 className="mt-1 text-xl font-bold text-slate-900">
                        {summaryData.role} ({summaryData.difficulty})
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {summaryData.course} • {summaryData.totalAnswered} answered, {summaryData.skippedCount} skipped • Total time {formatDurationReadable(summaryData.totalTimeTakenSec)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className={`flex flex-col items-center justify-center rounded-2xl border px-5 py-3 ${
                          summaryData.overallScore >= 70
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : summaryData.overallScore >= 50
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-rose-300 bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span className="text-3xl font-extrabold">{summaryData.overallScore}%</span>
                        <span className="text-[11px] font-bold">{summaryData.averageScoreOutOf10} / 10 avg</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weak Topics */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/75 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                        Strong Topics ({summaryData.strongTopics.length})
                      </p>
                      {summaryData.strongTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {summaryData.strongTopics.map((t) => (
                            <span key={t} className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">
                              ✓ {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">Keep practicing to reach 7+/10 across core topics.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50/75 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
                        Weak Topics to Improve ({summaryData.weakTopics.length})
                      </p>
                      {summaryData.weakTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {summaryData.weakTopics.map((t) => (
                            <span key={t} className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-xs font-bold text-rose-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 font-semibold">Great job — no weak topics flagged this session!</p>
                      )}
                    </div>
                  </div>

                  {/* Per-question scores */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Question-by-Question Breakdown
                    </p>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {summaryData.answers.map((ans, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-indigo-700 mr-1.5">Q{idx + 1} ({ans.topic}):</span>
                              <span className="font-semibold text-slate-900">{ans.questionText}</span>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 font-extrabold ${
                                ans.score >= 7
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : ans.score >= 5
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {ans.score}/10
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {ans.skipped ? 'Skipped' : `Time taken: ${formatDurationReadable(ans.timeTakenSec)}`}
                            {ans.gaps?.[0] ? ` • Focus: ${ans.gaps[0]}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Steps & Action Buttons (IR-6, Page 6) */}
                <div className="space-y-3 pt-3 border-t border-slate-200/70">
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleBuildRoadmap}
                      className="flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Build Roadmap from Weak Topics
                    </button>
                    <Link
                      to="/skill-gap-analysis"
                      className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      <BarChart2 className="h-3.5 w-3.5" /> Skill Gap Analysis
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => startInterview({ course, role: engineerType, difficulty, count: questionCount })}
                      disabled={isQuotaReached || isGenerating}
                      className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-45 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </button>
                    <button
                      type="button"
                      onClick={resetToSetup}
                      className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> New Interview
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
