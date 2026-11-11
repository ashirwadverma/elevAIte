import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCourses,
  getEngineerTypesForCourse,
  getTopicsForRole,
  selectFallbackQuestions,
  evaluateAnswerFallback,
  computeSessionSummary,
  calculateInterviewStreak,
  DEFAULT_TIME_LIMIT_SEC,
  WARNING_TIME_SEC,
  MAX_ANSWER_CHARS,
} from '../src/lib/mockInterviewEngine.js';

test('1. Course & Engineer Type config covers all PRD Section 6.1 & 6.2 options with dynamic ordering', () => {
  const courses = getCourses();
  assert.ok(courses.some(c => c.includes('B.Tech')), 'Must include B.Tech courses');
  assert.ok(courses.includes('BCA'), 'Must include BCA');
  assert.ok(courses.includes('MCA'), 'Must include MCA');
  assert.ok(courses.includes('B.Sc (CS / IT)'), 'Must include B.Sc (CS / IT)');
  assert.ok(courses.includes('M.Tech'), 'Must include M.Tech');
  assert.ok(courses.includes('Diploma (CS / IT)'), 'Must include Diploma (CS / IT)');

  const aiRoles = getEngineerTypesForCourse('B.Tech / B.E. (AI & ML)');
  assert.strictEqual(aiRoles[0].role, 'AI Engineer', 'B.Tech AI & ML must show AI Engineer first');
  assert.strictEqual(aiRoles[1].role, 'Machine Learning Engineer', 'B.Tech AI & ML must show ML Engineer second');

  const eceRoles = getEngineerTypesForCourse('B.Tech / B.E. (ECE)');
  assert.strictEqual(eceRoles[0].role, 'Embedded / IoT Engineer', 'B.Tech ECE must prioritize Embedded / IoT Engineer');

  // Verify all 11 PRD roles have core topics configured
  const expectedRoles = [
    'AI Engineer',
    'Machine Learning Engineer',
    'Data Scientist / Analyst',
    'Full Stack Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Mobile App Engineer',
    'DevOps / Cloud Engineer',
    'Cybersecurity Engineer',
    'QA / Test Engineer',
    'Embedded / IoT Engineer',
  ];
  for (const role of expectedRoles) {
    const topics = getTopicsForRole(role);
    assert.ok(topics.length >= 3, `Role ${role} must define core topics`);
  }
});

test('2. Fallback question selection strictly matches role and requested count (5, 10, 15) with 3:00 timer', () => {
  for (const count of [5, 10, 15]) {
    const aiQs = selectFallbackQuestions({
      course: 'B.Tech / B.E. (AI & ML)',
      role: 'AI Engineer',
      difficulty: 'Intermediate',
      count,
    });
    assert.strictEqual(aiQs.length, count, `Must return exact count=${count}`);
    const allowedTopics = new Set(getTopicsForRole('AI Engineer').map(t => t.toLowerCase()));
    for (const q of aiQs) {
      assert.strictEqual(q.role, 'AI Engineer');
      assert.strictEqual(q.timeLimitSec, DEFAULT_TIME_LIMIT_SEC);
      assert.ok(allowedTopics.has(q.topic.toLowerCase()), `Unexpected topic '${q.topic}' leaked into AI Engineer`);
      assert.ok(!/css box model|flexbox|dom bubbling/i.test(q.text), 'AI Engineer must never see frontend-only questions');
    }
  }
  assert.strictEqual(DEFAULT_TIME_LIMIT_SEC, 180);
  assert.strictEqual(WARNING_TIME_SEC, 30);
  assert.strictEqual(MAX_ANSWER_CHARS, 2000);
});

test('3. Answer evaluator scores substantive technical answers higher than vague/skipped answers', () => {
  const qs = selectFallbackQuestions({
    role: 'AI Engineer',
    difficulty: 'Intermediate',
    count: 5,
    deterministic: true,
  });
  const targetQ = qs[1]; // RAG pipeline question or LLM hallucination question

  const skippedEval = evaluateAnswerFallback({
    question: targetQ,
    answerText: '',
    difficulty: 'Intermediate',
    skipped: true,
  });
  assert.strictEqual(skippedEval.score, 0, 'Skipped question must score 0');
  assert.ok(skippedEval.gaps.length >= 1, 'Skipped evaluation must note gap');

  const briefEval = evaluateAnswerFallback({
    question: targetQ,
    answerText: 'Yes I use it.',
    difficulty: 'Intermediate',
  });
  assert.ok(briefEval.score <= 2, `Brief non-technical answer must score low, got ${briefEval.score}`);

  const strongAnswer = `To answer this clearly: ${targetQ.keyPoints.join(', ')}. Because grounding outputs and retrieving relevant context prevents errors, for example splitting documents cleanly before querying embeddings ensures accuracy.`;
  const strongEval = evaluateAnswerFallback({
    question: targetQ,
    answerText: strongAnswer,
    difficulty: 'Intermediate',
  });
  assert.ok(strongEval.score >= 8, `Comprehensive technical answer must score >= 8/10, got ${strongEval.score}`);
  assert.ok(strongEval.strengths.length >= 1);
  assert.ok(strongEval.idealAnswer.length > 20);
});

test('4. Session summary aggregates overall score, weak topics, and strong topics cleanly', () => {
  const summary = computeSessionSummary({
    course: 'B.Tech / B.E. (CSE / IT)',
    role: 'Backend Engineer',
    difficulty: 'Intermediate',
    answers: [
      { questionId: 1, questionText: 'REST Q', topic: 'APIs', answerText: '...', score: 8, timeTakenSec: 60, skipped: false },
      { questionId: 2, questionText: 'DB Q', topic: 'Databases', answerText: '...', score: 4, timeTakenSec: 90, skipped: false },
      { questionId: 3, questionText: 'Auth Q', topic: 'Authentication', answerText: '', score: 0, timeTakenSec: 15, skipped: true },
    ],
  });

  assert.strictEqual(summary.overallScore, 40, 'Average (8+4+0)/3 = 4.0 -> 40%');
  assert.strictEqual(summary.averageScoreOutOf10, 4.0);
  assert.strictEqual(summary.totalAnswered, 2);
  assert.strictEqual(summary.skippedCount, 1);
  assert.strictEqual(summary.totalTimeTakenSec, 165);
  assert.deepStrictEqual(summary.strongTopics, ['APIs']);
  assert.ok(summary.weakTopics.includes('Authentication'));
  assert.ok(summary.weakTopics.includes('Databases'));
});

test('5. Streak calculator accurately counts consecutive practice days', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);

  const streak3 = calculateInterviewStreak([
    { createdAt: today.toISOString() },
    { createdAt: yesterday.toISOString() },
    { createdAt: twoDaysAgo.toISOString() },
    { createdAt: fiveDaysAgo.toISOString() },
  ]);
  assert.strictEqual(streak3, 3, 'Should count consecutive days today, yesterday, twoDaysAgo = 3');

  const brokenStreak = calculateInterviewStreak([
    { createdAt: fiveDaysAgo.toISOString() },
  ]);
  assert.strictEqual(brokenStreak, 0, 'Session 5 days ago must reset active streak to 0');
});
