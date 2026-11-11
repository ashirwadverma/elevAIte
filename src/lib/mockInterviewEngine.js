import rolesConfig from '../config/mockInterviewRoles.json' with { type: 'json' };
import questionBank from '../config/mockInterviewQuestionBank.json' with { type: 'json' };

export const DEFAULT_TIME_LIMIT_SEC = 180; // 3:00 per question (PRD FR-6)
export const WARNING_TIME_SEC = 30;        // Red warning threshold (PRD FR-6)
export const MAX_ANSWER_CHARS = 2000;      // Cost-control cap (PRD Section 13)
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
export const QUESTION_COUNTS = [5, 10, 15];

export function getCourses() {
  return [...(rolesConfig.courses || [])];
}

export function getEngineerTypesForCourse(course) {
  const roleMap = rolesConfig.engineerTypes || {};
  const orderedNames = (course && rolesConfig.courseRoles?.[course])
    ? rolesConfig.courseRoles[course]
    : Object.keys(roleMap);

  return orderedNames
    .filter(name => roleMap[name])
    .map(name => ({
      role: name,
      topics: roleMap[name].topics || [],
      summary: roleMap[name].summary || ''
    }));
}

export function getTopicsForRole(role) {
  return rolesConfig.engineerTypes?.[role]?.topics || [];
}

function shuffleList(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Selects fallback questions strictly matching the selected role,
 * prioritizing the selected difficulty tier cleanly without cross-role leakage.
 */
export function selectFallbackQuestions({ course = '', role, difficulty = 'Intermediate', count = 5, deterministic = false }) {
  const bankForRole = Array.isArray(questionBank[role]) ? questionBank[role] : [];
  if (bankForRole.length === 0) return [];

  const targetCount = Math.min(15, Math.max(1, Number(count) || 5));

  const tierOrder = difficulty === 'Beginner'
    ? ['Beginner', 'Intermediate', 'Advanced']
    : difficulty === 'Advanced'
      ? ['Advanced', 'Intermediate', 'Beginner']
      : ['Intermediate', 'Beginner', 'Advanced'];

  const ordered = [];
  for (const tier of tierOrder) {
    const matches = bankForRole.filter(q => q.difficulty === tier);
    ordered.push(...(deterministic ? matches : shuffleList(matches)));
  }

  return ordered.slice(0, targetCount).map((q, idx) => ({
    id: q.id || `${role.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx + 1}`,
    order: idx + 1,
    role,
    course,
    text: q.text,
    topic: q.topic || 'Core Concepts',
    difficulty: q.difficulty || difficulty,
    timeLimitSec: q.timeLimitSec || DEFAULT_TIME_LIMIT_SEC,
    keyPoints: Array.isArray(q.keyPoints) ? q.keyPoints : [],
    idealAnswer: q.idealAnswer || ''
  }));
}

function pointMatchesAnswer(point, lowerAnswer) {
  if (!point || !lowerAnswer) return false;
  const pLower = point.toLowerCase().trim();
  if (lowerAnswer.includes(pLower)) return true;

  // Match meaningful sub-tokens for multi-word key points (e.g. "gradient clipping" or "step by step")
  const tokens = pLower.split(/[^a-z0-9+#/]+/).filter(t => t.length >= 3);
  if (tokens.length === 0) return false;
  if (tokens.length === 1) {
    return lowerAnswer.includes(tokens[0]);
  }
  const matchedTokens = tokens.filter(t => lowerAnswer.includes(t));
  return matchedTokens.length >= Math.ceil(tokens.length * 0.6);
}

/**
 * Fallback evaluator used when the AI backend is unavailable.
 * Evaluates student answer objectively against the question's expected keyPoints and depth.
 */
export function evaluateAnswerFallback({ question, answerText = '', difficulty = 'Intermediate', skipped = false }) {
  const topic = question?.topic || 'Core Concepts';
  const idealAnswer = question?.idealAnswer || 'Review fundamental definitions, practical trade-offs, and a concrete example.';
  const keyPoints = Array.isArray(question?.keyPoints) ? question.keyPoints : [];

  const trimmed = (answerText || '').slice(0, MAX_ANSWER_CHARS).trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];

  if (skipped || words.length === 0) {
    return {
      score: 0,
      strengths: [],
      gaps: [
        skipped ? 'Question was skipped.' : 'No answer was submitted before time expired.',
        ...(keyPoints.length > 0 ? [`Key concepts expected: ${keyPoints.slice(0, 4).join(', ')}.`] : [])
      ],
      idealAnswer,
      topic
    };
  }

  const lower = trimmed.toLowerCase();
  const matchedPoints = [];
  const missedPoints = [];

  for (const kp of keyPoints) {
    if (pointMatchesAnswer(kp, lower)) {
      matchedPoints.push(kp);
    } else {
      missedPoints.push(kp);
    }
  }

  // Short answers (< 5 words) cannot demonstrate real reasoning
  if (words.length < 5) {
    const score = matchedPoints.length > 0 ? 2 : 1;
    return {
      score,
      strengths: matchedPoints.length > 0 ? [`Recognized relevant term(s): ${matchedPoints.join(', ')}.`] : [],
      gaps: [
        'Answer is too brief — expand with a clear definition, why it works, and a brief example.',
        ...(missedPoints.length > 0 ? [`Missing key concepts: ${missedPoints.slice(0, 3).join(', ')}.`] : [])
      ],
      idealAnswer,
      topic
    };
  }

  const coverageRatio = keyPoints.length > 0 ? matchedPoints.length / keyPoints.length : Math.min(1, words.length / 40);
  let conceptPoints = Math.round(coverageRatio * 6); // up to 6 pts for concept coverage

  // Structure & reasoning signals
  const hasReasoning = /\b(?:because|therefore|since|so that|helps|prevents|reduces|improves|compared to|whereas|unlike)\b/i.test(lower);
  const hasExample = /\b(?:example|e\.g\.|for instance|like|such as|suppose|when)\b/i.test(lower);
  const sentenceCount = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 4).length;

  let depthPoints = 0;
  if (words.length >= 25) depthPoints += 1;
  if (words.length >= 45 && (sentenceCount >= 2 || hasReasoning)) depthPoints += 1;

  let clarityPoints = 0;
  if (hasReasoning) clarityPoints += 1;
  if (hasExample || words.length >= 60) clarityPoints += 1;

  // Give partial credit up to 3 even if exact keyPoints phrasing varied, provided substantive effort
  if (matchedPoints.length === 0 && words.length >= 20) {
    conceptPoints = 2;
  }

  let rawScore = conceptPoints + depthPoints + clarityPoints;

  // Strictness calibration for Advanced difficulty
  if (difficulty === 'Advanced' && matchedPoints.length < 2 && rawScore > 4) {
    rawScore -= 1;
  }

  // Cap single-line answers cleanly
  if (words.length < 15 && rawScore > 5) {
    rawScore = 5;
  }

  const score = Math.min(10, Math.max(1, Math.round(rawScore)));

  const strengths = [];
  if (matchedPoints.length > 0) {
    strengths.push(`Covered key concepts cleanly: ${matchedPoints.slice(0, 4).join(', ')}.`);
  }
  if (hasReasoning) {
    strengths.push('Explained underlying reasoning ("why / how") rather than listing buzzwords.');
  }
  if (hasExample) {
    strengths.push('Included a concrete scenario or example to anchor the explanation.');
  }
  if (strengths.length === 0) {
    strengths.push('Attempted a structured response to the prompt.');
  }

  const gaps = [];
  if (missedPoints.length > 0) {
    gaps.push(`Mention key points such as: ${missedPoints.slice(0, 4).join(', ')}.`);
  }
  if (!hasExample && score < 9) {
    gaps.push('Include one brief real-world or project example to stand out in campus interviews.');
  }
  if (words.length < 25) {
    gaps.push('Add slightly more technical detail on trade-offs or edge cases.');
  }
  if (gaps.length === 0) {
    gaps.push('Strong answer overall — keep practicing crisp delivery within the 3-minute timer.');
  }

  return {
    score,
    strengths,
    gaps,
    idealAnswer,
    topic
  };
}

/**
 * Computes end-of-interview Result Summary metrics & Weak Topics.
 */
export function computeSessionSummary({ course = '', role = '', difficulty = 'Intermediate', answers = [] }) {
  const questionCount = answers.length;
  const totalOutOf10 = answers.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
  const averageScoreOutOf10 = questionCount > 0 ? Number((totalOutOf10 / questionCount).toFixed(1)) : 0;
  const overallScore = Math.round(averageScoreOutOf10 * 10);

  const skippedCount = answers.filter(a => a.skipped).length;
  const totalAnswered = answers.filter(a => !a.skipped).length;
  const totalTimeTakenSec = answers.reduce((sum, a) => sum + (Number(a.timeTakenSec) || 0), 0);

  const topicMap = new Map();
  for (const a of answers) {
    const t = a.topic || 'Core Concepts';
    if (!topicMap.has(t)) topicMap.set(t, []);
    topicMap.get(t).push({ score: Number(a.score) || 0, skipped: Boolean(a.skipped) });
  }

  const weakTopics = [];
  const strongTopics = [];

  for (const [topic, entries] of topicMap.entries()) {
    const avg = entries.reduce((s, e) => s + e.score, 0) / entries.length;
    const anySkipped = entries.some(e => e.skipped);
    if (avg < 7 || anySkipped) {
      weakTopics.push({ topic, avgScore: Number(avg.toFixed(1)) });
    } else {
      strongTopics.push({ topic, avgScore: Number(avg.toFixed(1)) });
    }
  }

  weakTopics.sort((a, b) => a.avgScore - b.avgScore);
  strongTopics.sort((a, b) => b.avgScore - a.avgScore);

  return {
    course,
    role,
    difficulty,
    questionCount,
    overallScore,
    averageScoreOutOf10,
    totalAnswered,
    skippedCount,
    totalTimeTakenSec,
    weakTopics: weakTopics.map(w => w.topic),
    strongTopics: strongTopics.map(s => s.topic)
  };
}

export function calculateInterviewStreak(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) return 0;

  const toDayKey = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const daySet = new Set(sessions.map(s => toDayKey(s.created_at || s.createdAt)).filter(Boolean));
  if (daySet.size === 0) return 0;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const cursor = daySet.has(toDayKey(today))
    ? new Date(today)
    : (daySet.has(toDayKey(yesterday)) ? new Date(yesterday) : null);

  if (!cursor) return 0;

  let streak = 0;
  while (daySet.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
