import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Star,
  BrainCircuit,
  Trophy,
  FileText,
  BarChart2,
  BookMarked,
  ArrowUpRight,
  Mail,
  Linkedin,
  Check,
  ShieldCheck,
  Target,
  Zap,
  GraduationCap
} from 'lucide-react';

export default function SerkoLandingPage({
  features = [],
  stats = [],
  testimonials = [],
  faqItems = [],
  faqOpen,
  setFaqOpen,
  darkMode = false,
  setDarkMode,
  session,
  onUsageUpdate
}) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-['Inter',sans-serif]"
      style={{
        background:
          'linear-gradient(180deg, #ffffff 0%, #ffffff 7%, #eff6ff 15%, #d4ebfd 25%, #9ecffd 37%, #74affb 49%, #8ea7fa 61%, #b095fc 73%, #c985f8 84%, #d77ef3 92%, #e084ed 100%)'
      }}
    >
      {/* ─── Ambient Atmospheric Lighting ──────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft luminous sky-blue bloom in the upper hero & stats region */}
        <div className="absolute top-[22%] left-1/2 h-[750px] w-[1300px] -translate-x-1/2 rounded-full bg-sky-300/30 blur-3xl" />
        
        {/* Ethereal light-purple/lavender bloom across mid & lower sections */}
        <div className="absolute top-[65%] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 rounded-full bg-purple-300/35 blur-3xl" />
        
        {/* Serko-style dusk warm horizon glow at the very bottom */}
        <div
          className="absolute bottom-0 inset-x-0 h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse 95% 65% at 50% 100%, rgba(244,114,182,0.3) 0%, rgba(192,132,252,0.35) 42%, transparent 78%)'
          }}
        />
      </div>

      {/* Main Full-Bleed Content Wrapper */}
      <div className="relative mx-auto w-full transition-all duration-300">
        
        {/* ─── Top StudyFlow-Style Sticky Navigation Bar ─────────────────────── */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            
            {/* Left: Logo & Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-xs">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <span className="font-['Poppins'] text-xl font-bold tracking-tight text-slate-900">
                elev<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>te
              </span>
            </Link>

            {/* Right: Navigation Links & Auth Buttons */}
            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
                <a href="#how-it-works" className="hover:text-slate-900 transition">How It Works</a>
                <a href="#features" className="hover:text-slate-900 transition">Features</a>
              </nav>

              <div className="flex items-center gap-2.5">
                {session ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="rounded-lg border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white transition shadow-xs"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem('elevAIte_session');
                        localStorage.removeItem('elevAIte_user_profile');
                        window.dispatchEvent(new Event('elevAIte_auth_change'));
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition shadow-xs"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="rounded-lg border border-slate-200/90 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white transition shadow-xs"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white transition shadow-sm"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* ─── Hero Section (White flowing into Light Blue) ─────────────────── */}
        <section className="relative px-6 pt-16 pb-20 sm:px-10 sm:pt-20 sm:pb-28 text-center overflow-hidden">
          
          {/* Category Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-1.5 text-xs font-medium text-blue-700 shadow-xs backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>AI-Powered Career Acceleration</span>
            </div>
          </div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08] font-['Poppins']"
          >
            The last career{' '}
            <span className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#fb7185] bg-clip-text text-transparent">
              agent
            </span>
            <br className="hidden sm:inline" /> you’ll ever need.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed font-normal"
          >
            elevAIte finds the best opportunities, optimizes your resume for ATS, learns how you interview, and guarantees you stay ahead with personalized career roadmaps.
          </motion.p>

          {/* Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition"
            >
              <span>Let's elevAIte</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-white transition"
            >
              <span>See How It Works ↓</span>
            </a>
          </motion.div>
        </section>

        {/* ─── Core Features & How It Works Section (Light Blue to Periwinkle) ─ */}
        <section id="features" className="scroll-mt-16 px-6 py-16 sm:px-12 sm:py-24 border-t border-slate-200/40 bg-transparent">
          <div id="how-it-works" className="scroll-mt-20" />
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
                Core features
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-['Poppins']">
                Everything you need to outshine the competition
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Comprehensive AI tools built to accelerate your career preparation from resume creation to salary negotiation.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature, idx) => {
                const links = [
                  '/resume-analyzer',
                  '/mock-interview',
                  '/skill-gap-analysis',
                  '/learning-roadmap'
                ];
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group rounded-3xl border border-white/70 bg-white/55 p-7 shadow-xs hover:bg-white/75 hover:shadow-xl backdrop-blur-md transition-all duration-300"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                        {idx === 0 && <FileText className="h-6 w-6" />}
                        {idx === 1 && <BrainCircuit className="h-6 w-6" />}
                        {idx === 2 && <BarChart2 className="h-6 w-6" />}
                        {idx === 3 && <BookMarked className="h-6 w-6" />}
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                        AI Powered
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 font-['Poppins']">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {feature.subtitle}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {feature.points.map((pt) => (
                        <span
                          key={pt}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white/75 border border-slate-200/60 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{pt}</span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200/50">
                      <Link
                        to={links[idx] || '/'}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition"
                      >
                        <span>Launch tool</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Premium Pro Section (Transition to Lavender) ──────────────────── */}
        <section className="px-6 py-16 sm:px-12 border-t border-slate-200/40 bg-transparent">
          <div className="mx-auto max-w-5xl rounded-[32px] border border-white/70 bg-white/60 p-8 sm:p-12 shadow-lg backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">
                  Premium unlock
                </span>
                <h2 className="mt-2 font-['Poppins'] text-3xl font-bold text-slate-900">
                  Internship recommendations are reserved for premium members
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Unlock the full AI career accelerator with mentor support, unlimited interviews, and internship opportunities curated for your profile.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-neutral-800 transition"
                  >
                    <span>Upgrade to Premium</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700/50 bg-slate-900/95 p-6 sm:p-8 text-white shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Premium status
                    </p>
                    <p className="mt-1 text-xl font-bold font-['Poppins']">Resume AI Pro</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    <Trophy className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  {[
                    'Unlimited interviews',
                    'Advanced AI resume insights',
                    'Dedicated analyst support',
                    'VIP internship alerts ($3 for 3 curated matches)'
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Testimonials Section (Soft Light Purple Zone) ─────────────────── */}
        <section className="px-6 py-16 sm:px-12 border-t border-purple-200/40 bg-transparent">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
                Testimonials
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-['Poppins']">
                Loved by ambitious students
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-3xl border border-white/70 bg-white/55 p-7 shadow-xs backdrop-blur-md hover:bg-white/75 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-base text-slate-700 italic leading-relaxed">
                    “{t.quote}”
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ Section (Dusk Lavender Zone) ──────────────────────────────── */}
        <section className="px-6 py-16 sm:px-12 border-t border-purple-200/40 bg-transparent">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
                FAQ
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 font-['Poppins']">
                Common questions, answered clearly
              </h2>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => {
                const isOpen = faqOpen === idx;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-xs backdrop-blur-md"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? -1 : idx)}
                      className="flex w-full items-center justify-between p-5 text-left font-semibold text-slate-900 transition hover:bg-white/80"
                    >
                      <span className="text-sm sm:text-base">{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-purple-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 pt-3">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Footer (Compact Pastel Glass Card) ─────────────────────────── */}
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

      </div>
    </div>
  );
}
