import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import { Zap, Shield, CheckCircle2, Flame, Trophy, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";

export default function GamificationHub() {
  const { user, authConfig } = useAuth();
  const [data, setData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [claiming, setClaiming] = useState(null);
  const [claimToast, setClaimToast] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [lesson, setLesson] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonError, setLessonError] = useState(false);
  const [currentConcept, setCurrentConcept] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [answerLoading, setAnswerLoading] = useState(false);
  const xpProgressPercent = data?.next_level_xp
    ? Math.min(100, ((data.current_level_progress ?? 0) / data.next_level_xp) * 100)
    : 100;

  const fetchGamificationData = useCallback(async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const res = await axios.get(`${API}/gamification/status`, authConfig());
      setData(res.data);
    } catch (err) {
      console.error("Error fetching gamification data:", err);
      setData(null);
      setStatusError(err.response?.data?.detail || "Quest progress could not be loaded. Please try again.");
    } finally {
      setStatusLoading(false);
    }
  }, [authConfig]);

  const fetchDailyLesson = useCallback(async () => {
    setLessonLoading(true);
    setLessonError(false);
    try {
      const res = await axios.get(`${API}/gamification/daily-lesson`, authConfig());
      setLesson(res.data);
      const firstUnanswered = res.data.terms.findIndex((term) => !term.quiz.answered);
      setCurrentConcept(firstUnanswered === -1 ? 3 : firstUnanswered);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    } catch (err) {
      console.error("Error fetching daily lesson:", err);
      setLesson(null);
      setLessonError(true);
    } finally {
      setLessonLoading(false);
    }
  }, [authConfig]);

  useEffect(() => {
    if (!user) {
      setStatusLoading(true);
      setData(null);
      setStatusError("");
      return;
    }
    fetchGamificationData();
    fetchDailyLesson();
  }, [user, fetchGamificationData, fetchDailyLesson]);

  const answerConcept = async () => {
    if (!lesson || selectedAnswer === null || answerLoading) return;
    setAnswerLoading(true);
    try {
      const res = await axios.post(`${API}/gamification/daily-lesson/answer`, {
        lesson_id: lesson.lesson_id,
        concept_index: currentConcept,
        answer_index: selectedAnswer,
      }, authConfig());
      setAnswerFeedback(res.data);
      setLesson((current) => ({
        ...current,
        terms: current.terms.map((term, index) => index === currentConcept ? {
          ...term,
          quiz: { ...term.quiz, answered: true, correct: res.data.correct },
        } : term),
        progress: {
          ...current.progress,
          answered: Math.max(current.progress.answered, currentConcept + 1),
          correct: current.progress.correct + (res.data.correct ? 1 : 0),
          xp_earned: res.data.xp_earned,
          completed: res.data.lesson_complete,
        },
      }));
      fetchGamificationData();
    } catch (err) {
      setAnswerFeedback({ error: err.response?.data?.detail || "This answer could not be recorded." });
    } finally {
      setAnswerLoading(false);
    }
  };

  const moveToNextConcept = () => {
    if (currentConcept < 3) {
      setCurrentConcept((index) => index + 1);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    }
  };

  const claimReward = async (quest) => {
    if (quest.id === "phone_bonus" || quest.id === "dob_bonus") {
      setActiveTask(quest);
      setTaskInput("");
      return;
    }

    try {
      setClaiming(quest.id);
      const res = await axios.post(`${API}/wallet/claim-task`, { task_id: quest.id }, authConfig());
      setClaimToast(res.data.message);
      window.dispatchEvent(new Event("stocksikh:wallet-updated"));
      fetchGamificationData();
      setTimeout(() => setClaimToast(null), 4000);
    } catch (err) {
      console.error("Error claiming reward:", err);
    } finally {
      setClaiming(null);
    }
  };

  const submitTask = async (event) => {
    event.preventDefault();
    if (!activeTask || !taskInput.trim()) return;

    try {
      setClaiming(activeTask.id);
      const payload = { task_id: activeTask.id };
      if (activeTask.id === "phone_bonus") payload.phone = taskInput;
      if (activeTask.id === "dob_bonus") payload.dob = taskInput;
      const res = await axios.post(`${API}/wallet/claim-task`, payload, authConfig());
      setClaimToast(res.data.message);
      window.dispatchEvent(new Event("stocksikh:wallet-updated"));
      setActiveTask(null);
      setTaskInput("");
      fetchGamificationData();
      setTimeout(() => setClaimToast(null), 4000);
    } catch (err) {
      setClaimToast(err.response?.data?.detail || "Unable to claim this reward right now.");
    } finally {
      setClaiming(null);
    }
  };

  const questsContext = data ? {
    page: "quests",
    total_xp: data.total_xp,
    tier_name: data.tier_name,
    tier_level: data.tier_level,
    login_streak_days: data.login_streak_days,
    current_level_progress: data.current_level_progress,
    next_level_xp: data.next_level_xp,
    next_unlock: data.next_unlock,
    xp_milestone: data.xp_milestone,
    quests: (data.quests || []).map((q) => ({
      title: q.title,
      xp_reward: q.xp_reward,
      paper_cash_reward: q.paper_cash_reward,
      completed: q.completed,
      claimed: q.claimed,
      can_claim: q.can_claim
    }))
  } : null;

  return (
    <div className="min-h-screen bg-[#07090E] text-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#00D09C]/10 text-[#00D09C] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Trader Progression & Quests
              </span>
              {data?.login_streak_days != null && (
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FFFBEB] text-[#F59E0B] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> {data.login_streak_days} Day Learning Streak
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-white">Trader Quest & Discipline Center</h1>
            <p className="text-sm text-slate-400 mt-1">
              Earn XP, level up your investor rank, and unlock discipline badges through smart risk management.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-[#0F172A]/70 p-3 rounded-2xl border border-white/[0.08] shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#00D09C]/10 flex items-center justify-center text-2xl">
              {statusLoading ? "..." : data?.tier_badge}
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">Current Rank</span>
              <span className="text-base font-black text-white">{statusLoading ? "Loading rank..." : data?.tier_name ?? "Unavailable"}</span>
              <span className="text-[10px] text-[#00D09C] font-bold block">{statusLoading ? "Loading XP..." : data ? `${data.total_xp} Total XP` : "XP unavailable"}</span>
            </div>
          </div>
        </div>

        {statusError && (
          <div className="mb-8 p-4 rounded-2xl bg-[#FDF2F0] border border-[#FADCD8] text-[#EB5B3C] text-sm font-semibold">
            {statusError}
          </div>
        )}

        {/* Level Progress Banner */}
        <div className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00D09C]" />
              <span className="text-base font-extrabold text-white">
                {statusLoading ? "Loading level..." : data ? `Level ${data.tier_level}: ${data.tier_name}` : "Level unavailable"}
              </span>
            </div>
            <span className="text-xs font-extrabold text-slate-400">
              {statusLoading ? "Loading progress..." : data ? `${data.current_level_progress} / ${data.next_level_xp} XP to Next Level (${xpProgressPercent.toFixed(0)}%)` : "Progress unavailable"}
            </span>
          </div>
          <div className="w-full bg-[#1E293B]/60 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#00D09C] h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${Math.min(
                  100,
                  statusLoading || !data ? 0 : xpProgressPercent
                )}%`
              }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center text-xs font-bold">
            <div className="col-span-2 sm:col-span-4 p-3 rounded-xl bg-[#00D09C]/10 text-[#00D09C]">Next Unlock: {statusLoading ? "Loading..." : data?.next_unlock ?? "Unavailable"}</div>
          </div>
        </div>

        <section className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">💰 Next Paper Money Reward</h2>
              <p className="text-sm font-bold text-slate-300 mt-1">Reach 1,000 XP</p>
              <p className="text-xs text-slate-400 mt-1">
                {statusLoading ? "Loading milestone progress..." : data?.xp_milestone?.claimed
                  ? "🎉 Milestone Unlocked · +₹1,000 Paper Money · Reward Credited ✅"
                  : data ? `${data.xp_milestone.current_xp} / 1,000 XP · ${data.xp_milestone.remaining_xp} XP remaining` : "Milestone progress unavailable"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-extrabold text-[#00D09C]">🎁 ₹1,000 Paper Money</div>
              {data?.xp_milestone?.claimed && <div className="text-xs font-bold text-[#00D09C] mt-1">₹1,000 Paper Money Claimed ✅</div>}
            </div>
          </div>
          <div className="w-full bg-[#1E293B]/60 rounded-full h-3 overflow-hidden mt-4">
            <div className="bg-[#00D09C] h-3 rounded-full transition-all duration-500" style={{ width: `${statusLoading || !data ? 0 : Math.min(100, (data.xp_milestone.current_xp / 1000) * 100)}%` }} />
          </div>
        </section>

          <section className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 mb-8 shadow-xs">
            <h2 className="text-lg font-black text-white">How you earn XP</h2>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <div className="p-4 rounded-2xl bg-[#07090E] border border-white/[0.08]"><div className="text-sm font-extrabold text-white">📚 Complete a daily concept</div><div className="text-xs font-bold text-[#00D09C] mt-1">+20 XP for a correct check</div></div>
              <div className="p-4 rounded-2xl bg-[#07090E] border border-white/[0.08]"><div className="text-sm font-extrabold text-white">🧠 Answer mini quizzes</div><div className="text-xs font-bold text-[#00D09C] mt-1">One answer per concept</div></div>
              <div className="p-4 rounded-2xl bg-[#07090E] border border-white/[0.08]"><div className="text-sm font-extrabold text-white">🎯 Complete all 4 concepts</div><div className="text-xs font-bold text-[#00D09C] mt-1">+40 XP once per lesson</div></div>
            </div>
          </section>

        <section className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00D09C]/10 text-[#00D09C] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#00D09C]">📚 Today's Learning</div>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white mt-1">{lesson?.topic || "Daily Market Concepts"}</h2>
                <p className="text-sm text-slate-400 mt-1">Learn 4 concepts with a quick understanding check after each one.</p>
              </div>
            </div>
            {lesson && (
              <span className="self-start px-3 py-1.5 rounded-full bg-[#1E293B]/60 text-slate-400 text-xs font-extrabold whitespace-nowrap">
                Day {lesson.day_number}
              </span>
            )}
          </div>

          {lessonLoading ? (
            <div className="min-h-40 flex items-center justify-center text-sm font-semibold text-slate-400">Loading today's lesson...</div>
          ) : lessonError ? (
            <div className="min-h-40 flex items-center justify-center text-sm font-semibold text-[#EB5B3C]">Today's lesson could not be loaded. Please try again.</div>
          ) : (
            <>
              {lesson.progress.completed ? (
                <div className="min-h-40 rounded-2xl bg-[#00D09C]/10 border border-[#A7F3D0] flex flex-col items-center justify-center text-center p-6">
                  <div className="text-2xl">🎉</div>
                  <h3 className="font-heading font-extrabold text-xl text-white mt-2">Today's Lesson Complete</h3>
                  <p className="text-sm text-slate-300 mt-1">4 / 4 concepts completed · 4 / 4 mini quizzes answered</p>
                  <p className="text-sm font-extrabold text-[#00D09C] mt-2">XP earned: +{lesson.progress.xp_earned}</p>
                </div>
              ) : (() => {
                const term = lesson.terms[currentConcept];
                const quiz = term.quiz;
                return (
                  <article key={term.name} className="rounded-2xl border border-white/[0.08] bg-[#07090E] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-extrabold text-[#00D09C]">Concept {currentConcept + 1} of 4</span>
                      <span className="px-2 py-1 rounded-lg bg-[#0F172A]/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Market Term</span>
                    </div>
                    <h3 className="font-heading font-extrabold text-lg text-white mt-3">{term.name}</h3>
                    <div className="mt-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Simple meaning</div>
                      <p className="text-sm text-slate-300 leading-relaxed mt-1">{term.simple_meaning}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Real-world example</div>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1">{term.example}</p>
                        {term.market_context && <p className="text-xs font-semibold text-[#387ED1] leading-relaxed mt-2">{term.market_context}</p>}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-white/[0.08]">
                      <div className="text-sm font-extrabold text-white">🧠 Quick Check</div>
                      <p className="text-sm text-slate-300 mt-2">{quiz.question}</p>
                      <div className="grid sm:grid-cols-2 gap-2 mt-3">
                        {quiz.options.map((option, optionIndex) => (
                          <button key={option} type="button" disabled={quiz.answered || answerLoading} onClick={() => setSelectedAnswer(optionIndex)} className={`text-left p-3 rounded-xl border text-sm transition-colors ${selectedAnswer === optionIndex ? "border-[#00A67D] bg-[#00D09C]/10" : "border-white/[0.08] bg-[#0F172A]/70 hover:border-[#94A3B8]"}`}>
                            <span className="font-extrabold mr-2">{String.fromCharCode(65 + optionIndex)}.</span>{option}
                          </button>
                        ))}
                      </div>
                      {!quiz.answered && !answerFeedback && <button type="button" onClick={answerConcept} disabled={selectedAnswer === null || answerLoading} className="mt-4 px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-extrabold disabled:opacity-50">{answerLoading ? "Checking..." : "Check Answer"}</button>}
                      {answerFeedback && !answerFeedback.error && <div className={`mt-4 p-3 rounded-xl text-sm font-bold ${answerFeedback.correct ? "bg-[#00D09C]/10 text-[#00D09C]" : "bg-[#FDF2F0] text-[#EB5B3C]"}`}>{answerFeedback.correct ? "✓ Correct! +20 XP" : "Not quite. Here's why..."}<div className="text-xs font-medium mt-1">{answerFeedback.explanation}</div></div>}
                      {answerFeedback?.error && <div className="mt-4 text-sm font-semibold text-[#EB5B3C]">{answerFeedback.error}</div>}
                      {answerFeedback && currentConcept < 3 && <button type="button" onClick={moveToNextConcept} className="mt-4 px-5 py-2.5 rounded-xl bg-[#00D09C] text-white text-xs font-extrabold">Next Concept →</button>}
                    </div>
                  </article>
                );
              })()}
              <div className="mt-5 pt-4 border-t border-white/[0.06] text-center text-xs font-bold text-slate-400">Today's lesson: 4 concepts · {lesson.progress.answered} / 4 answered</div>
            </>
          )}
        </section>

        {claimToast && (
          <div className="mb-6 p-4 rounded-2xl bg-[#00D09C]/10 border border-[#A7F3D0] text-[#00D09C] font-extrabold text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>{claimToast}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Quests (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Quests &amp; Rewards</span>
                <span className="text-xs font-bold text-slate-400">Backed by your account activity</span>
              </h2>
            </div>

            <div className="space-y-3">
              {data?.quests?.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-5 shadow-xs hover:border-white/[0.15] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        q.completed ? "bg-[#00D09C]/10 text-[#00D09C]" : "bg-[#1E293B]/60 text-slate-400"
                      }`}
                    >
                      {q.completed ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">{q.title}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1E293B]/60 text-slate-400 uppercase">
                          {q.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-extrabold">
                        <span className="text-[#00D09C]">+{q.xp_reward} XP</span>
                        <span className="text-[#F59E0B]">+₹{q.paper_cash_reward} Paper Money</span>
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <div>
                    {q.claimed ? (
                      <span className="px-4 py-2 rounded-xl bg-[#1E293B]/60 text-slate-500 text-xs font-bold block text-center">
                        Claimed ✅
                      </span>
                    ) : q.can_claim ? (
                      <button
                        onClick={() => claimReward(q)}
                        disabled={claiming === q.id}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00D09C] hover:bg-[#00B789] text-white text-xs font-extrabold shadow-md shadow-[#00D09C]/20 transition-all flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{claiming === q.id ? "Claiming..." : "Claim Reward"}</span>
                      </button>
                    ) : (
                      <span className="px-4 py-2 rounded-xl bg-[#07090E] border border-white/[0.08] text-slate-400 text-xs font-bold block text-center">
                        {q.completed ? "Not claimable yet" : "Not completed"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discipline Badges (1 col) */}
          <div>
            <h2 className="text-xl font-black text-white mb-4">Discipline Badges</h2>
            <div className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-5 shadow-xs space-y-3">
              {statusLoading ? <p className="text-xs text-slate-400">Loading badges...</p> : statusError ? null : data?.badges?.length ? data.badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    b.earned ? "bg-[#00D09C]/10 border-[#A7F3D0]" : "bg-[#07090E]/40 border-dashed border-white/[0.15] opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0 p-1.5 bg-[#0F172A]/70 rounded-xl shadow-xs">{b.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{b.name}</span>
                        {b.earned ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#00D09C]/10 text-[#00D09C]">
                            EARNED
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-slate-500">LOCKED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{b.description}</p>
                    </div>
                  </div>
                </div>
              )) : <p className="text-xs text-slate-400">No earned badges yet.</p>}
            </div>
          </div>
        </div>
      </main>

      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={submitTask} className="w-full max-w-sm bg-[#0F172A]/70 rounded-3xl p-6 space-y-4 border border-white/[0.08] shadow-2xl">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-white">{activeTask.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{activeTask.description}</p>
            </div>
            <input
              type={activeTask.id === "phone_bonus" ? "tel" : "date"}
              required
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder={activeTask.id === "phone_bonus" ? "Enter mobile number" : ""}
              className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white outline-none focus:border-[#00D09C]"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setActiveTask(null)} className="flex-1 py-2.5 rounded-xl bg-[#1E293B]/60 text-xs font-bold text-slate-400">Cancel</button>
              <button type="submit" disabled={claiming === activeTask.id} className="flex-1 py-2.5 rounded-xl bg-[#00D09C] text-white text-xs font-bold shadow-sm">{claiming === activeTask.id ? "Claiming..." : "Claim Reward"}</button>
            </div>
          </form>
        </div>
      )}

      <FlyingVidyaBot context={questsContext} />
    </div>
  );
}
