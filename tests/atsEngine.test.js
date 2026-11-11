import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  detectSkills,
  computeMissingKeywords,
  validateBulletRewrites,
  validateRecommendations,
  evaluateResume,
  extractResumeData,
  computeScores,
  validateSummary,
  buildTemplateSummary,
  hashText,
  rankSkillsForSummary,
  extractExperienceBullets,
  computeReinforcedSkills,
  extractAllBullets,
  splitResumeBullets,
  extractMajorSections,
  extractDocxText
} from '../src/lib/atsEngine.js';

const SAMPLE_RESUME_TEXT = `Rahul Sharma
Mathura, Uttar Pradesh | +91 98765 43210 | rahul.sharma@email.com | linkedin.com/in/rahulsharma | github.com/rahulsharma

Professional Summary
B.Tech Computer Science student with hands-on experience building full-stack web applications using React, Node.js, and MongoDB. Skilled in AI-assisted development, REST API design, and responsive UI. Seeking a Software Development Intern role to apply problem-solving skills and deliver production-quality code.

Education
Bachelor of Technology in Computer Science and Engineering, ABC Institute of Technology, Uttar Pradesh
Expected Graduation: June 2027 | CGPA: 8.2/10
Relevant Coursework: Data Structures and Algorithms, Database Management Systems, Operating Systems, Computer Networks, Object-Oriented Programming

Technical Skills
Languages: Python, JavaScript, Java, C++, SQL, HTML5, CSS3
Frameworks and Libraries: React.js, Node.js, Express.js, Tailwind CSS, Bootstrap
Databases: MongoDB, MySQL, Firebase
Tools and Platforms: Git, GitHub, VS Code, Postman, Vercel, Netlify, Claude, ChatGPT
Concepts: REST APIs, Authentication (JWT), Responsive Design, Agile, Prompt Engineering

Projects
Personal Portfolio Website | React, Tailwind CSS, Vercel
Designed and deployed a responsive portfolio website that showcases 5+ projects, achieving a Lighthouse performance score of 95+.
Reduced page load time by 40% through image optimization and lazy loading.
Used AI-assisted development to speed up UI prototyping and debugging.

Task Management Web App | React, Node.js, Express, MongoDB
Built a full-stack task manager with user authentication (JWT), CRUD operations, and category filters for 100+ test users.
Developed 12 RESTful API endpoints and tested them with Postman.
Implemented a mobile-first layout that works across all major screen sizes.

Resume Analyzer Tool | Python, Flask, NLP
Created a tool that extracts keywords from resumes and matches them against job descriptions, producing a match percentage.
Processed PDF and DOCX files using Python libraries, with 90% parsing accuracy on a sample set of 50 resumes.

Experience
Web Development Intern, XYZ Technologies (Remote) | June 2026 - August 2026
Developed 6 reusable React components, reducing duplicated code by 30%.
Fixed 25+ UI bugs and collaborated with a team of 4 developers using Git and GitHub pull requests.
Integrated third-party REST APIs to display live data on the company dashboard.

Achievements and Certifications
Solved 300+ problems on LeetCode and GeeksforGeeks.
Participated in Smart India Hackathon 2025 (college-level finalist).
Completed Full Stack Web Development certification on Coursera (2025).
Core member of the college coding club, organizing 3 technical workshops.
`;

test('1. Keyword Detection: absent keywords must NEVER appear in matched keywords', () => {
  const detected = detectSkills(SAMPLE_RESUME_TEXT);

  // Absent skills from the sample text
  const absentSkills = ['Go', 'Rust', 'Django', 'FastAPI', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'Angular', 'Vue.js'];
  for (const skill of absentSkills) {
    assert.strictEqual(
      detected.includes(skill),
      false,
      `Absent skill "${skill}" should NOT be detected in text`
    );
  }

  // Canonical deduplication: "React" and "React.js" should only count once as "React"
  const reactCount = detected.filter(s => s === 'React').length;
  assert.strictEqual(reactCount, 1, 'Canonical skill "React" should only appear once');

  // "Node.js" and "Node" should only count once as "Node.js"
  const nodeCount = detected.filter(s => s === 'Node.js').length;
  assert.strictEqual(nodeCount, 1, 'Canonical skill "Node.js" should only appear once');

  // Present skills must be properly detected
  const presentSkills = ['React', 'Node.js', 'Express.js', 'Python', 'Flask', 'MongoDB', 'SQL', 'REST API', 'Git', 'GitHub', 'C++'];
  for (const skill of presentSkills) {
    assert.strictEqual(
      detected.includes(skill),
      true,
      `Present skill "${skill}" should be detected`
    );
  }

  // Coding platforms must be excluded from technical keywords (Requirement 4)
  assert.strictEqual(detected.includes('LeetCode'), false, 'Coding platform LeetCode must NOT appear in technical keywords');
  assert.strictEqual(detected.includes('GeeksforGeeks'), false, 'Coding platform GeeksforGeeks must NOT appear in technical keywords');
});

test('2. Missing Keywords: computes (JD skills minus resume skills) or shows prompt if no JD', () => {
  // Test case A: No job description provided
  const noJdResult = computeMissingKeywords(SAMPLE_RESUME_TEXT, '');
  assert.strictEqual(noJdResult.missingKeywords.length, 0);
  assert.strictEqual(noJdResult.message, 'Add a job description to see missing keywords');

  // Test case B: Job description with skills candidate has AND skills candidate lacks
  const jdText = 'Looking for an engineer with React, Node.js, Docker, Kubernetes, and AWS experience.';
  const withJdResult = computeMissingKeywords(SAMPLE_RESUME_TEXT, jdText);

  // Candidate has React and Node.js, lacks Docker, Kubernetes, AWS
  assert.deepStrictEqual(withJdResult.missingKeywords.sort(), ['AWS', 'Docker', 'Kubernetes'].sort());
  assert.strictEqual(withJdResult.missingKeywords.includes('React'), false);
  assert.strictEqual(withJdResult.missingKeywords.includes('Node.js'), false);
});

test('3. Bullet Rewrites: rejects non-verbatim originals, fabricated digits, new tools, unauthorized verbs, and added content words', () => {
  const debugLog = [];

  const rawCandidateRewrites = [
    // Valid: verbatim, no new digits, no new tools, no Architected/Engineered, no added content words
    {
      original: 'Used AI-assisted development to speed up UI prototyping and debugging.',
      suggestion: 'Accelerated AI-assisted development to speed up UI prototyping and debugging by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid 1: original is not in resume text
    {
      original: 'Invented non-existent systems for imaginary tech company.',
      suggestion: 'Spearheaded non-existent systems with [ADD YOUR OWN NUMBER]% efficiency.'
    },
    // Invalid 2: contains fabricated digits not in original
    {
      original: 'Implemented a mobile-first layout that works across all major screen sizes.',
      suggestion: 'Implemented a mobile-first layout boosting user engagement by 45% across all major screen sizes.'
    },
    // Invalid 3: introduces new tools not in original bullet
    {
      original: 'Integrated third-party REST APIs to display live data on the company dashboard.',
      suggestion: 'Integrated third-party REST APIs and deployed Docker containers with Kubernetes.'
    },
    // Invalid 4: uses "Architected" when original does not describe architecture/design
    {
      original: 'Used AI-assisted development to speed up UI prototyping and debugging.',
      suggestion: 'Architected AI-assisted development tools to speed up UI prototyping and debugging.'
    },
    // Invalid 5: partial fragment, not a complete bullet line (Requirement 2)
    {
      original: 'speed up UI prototyping and debugging.',
      suggestion: 'Accelerated UI prototyping and debugging by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid 6: original bullet already contains a number (Requirement 2)
    {
      original: 'Reduced page load time by 40% through image optimization and lazy loading.',
      suggestion: 'Optimized page load time by [ADD YOUR OWN NUMBER]% through lazy loading.'
    },
    // Invalid 7: added new nouns like "core workflows" (Requirement 2)
    {
      original: 'Implemented a mobile-first layout that works across all major screen sizes.',
      suggestion: 'Structured a mobile-first layout across major screen sizes, improving core workflows by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid 8: added forbidden content words like "efficiency", "workflows", "operational" (Requirement 3)
    {
      original: 'Used AI-assisted development to speed up UI prototyping and debugging.',
      suggestion: 'Accelerated AI-assisted development workflows to speed up UI prototyping and debugging, improving operational efficiency by [ADD YOUR OWN NUMBER]%.'
    }
  ];

  const validated = validateBulletRewrites(rawCandidateRewrites, SAMPLE_RESUME_TEXT, debugLog);

  // Only the 1st valid bullet should pass
  assert.strictEqual(validated.length, 1);
  assert.strictEqual(validated[0].original, 'Used AI-assisted development to speed up UI prototyping and debugging.');

  // Check rejection reasons in debugLog
  assert.strictEqual(debugLog.some(r => r.reason.includes('not verbatim')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('fabricated digit')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('introduced new technical skill')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes("'Architected'")), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('partial fragment')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('already contains a number')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('core workflows') || r.reason.includes('content word')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('added new content word(s)')), true);
});

test('4. Recommendations: requires verbatim evidence_quote and strips ranking/percentile claims', () => {
  const debugLog = [];

  const rawRecommendations = [
    // Valid with verbatim quote
    {
      advice: 'Specify measured layout consistency across responsive viewports.',
      evidence_quote: 'Implemented a mobile-first layout that works across all major screen sizes.'
    },
    // Valid with quote, but contains "top recruiters favor" which must be sanitized
    {
      advice: 'Top recruiters favor adding live demo links.',
      evidence_quote: 'Personal Portfolio Website | React, Tailwind CSS, Vercel'
    },
    // Invalid: missing evidence_quote
    {
      advice: 'You should add more certifications.',
      evidence_quote: ''
    },
    // Invalid: evidence_quote not in resume
    {
      advice: 'Improve your cloud experience.',
      evidence_quote: 'Led cloud migration to AWS and Azure across 50 microservices.'
    }
  ];

  const validated = validateRecommendations(rawRecommendations, SAMPLE_RESUME_TEXT, debugLog);

  // Exactly 2 recommendations should pass
  assert.strictEqual(validated.length, 2);
  assert.strictEqual(validated[0].evidence_quote, 'Implemented a mobile-first layout that works across all major screen sizes.');
  assert.strictEqual(validated[1].advice.includes('Top recruiters favor'), false, 'Should strip "top recruiters favor"');

  // Check rejection log
  assert.strictEqual(debugLog.some(r => r.reason.includes('missing required evidence_quote')), true);
  assert.strictEqual(debugLog.some(r => r.reason.includes('not found verbatim')), true);
});

test('5. Formatting Checks: only shows page condensation tip when pageCount > 1', () => {
  const resPage1 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Resume.pdf', 1);
  assert.strictEqual(
    resPage1.formatting_issues.some(i => i.includes('Resume length: 1 pages')),
    false,
    'Should NOT show condense to 1 page tip when pageCount is 1'
  );

  const resPage2 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Resume.pdf', 2);
  assert.strictEqual(
    resPage2.formatting_issues.some(i => i.includes('Resume length: 2 pages')),
    true,
    'MUST show condense to 1 page tip when pageCount is 2'
  );
});

test('6. Consistency: analyzing the same file 5 times returns identical scores', () => {
  const scoresRun1 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.resume.pdf', 2);
  const scoresRun2 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.resume.pdf', 2);
  const scoresRun3 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.resume.pdf', 2);
  const scoresRun4 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.resume.pdf', 2);
  const scoresRun5 = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.resume.pdf', 2);

  const runs = [scoresRun1, scoresRun2, scoresRun3, scoresRun4, scoresRun5];

  for (let i = 1; i < runs.length; i++) {
    assert.strictEqual(runs[i].overall_score, runs[0].overall_score, `Run ${i+1} overall score must match Run 1`);
    assert.deepStrictEqual(runs[i].category_scores, runs[0].category_scores, `Run ${i+1} category scores must match Run 1`);
  }

  // Scores must be deterministic fixed numbers
  assert.strictEqual(scoresRun1.overall_score, 83);
  assert.strictEqual(scoresRun1.category_scores.ats_compatibility, 96);
  assert.strictEqual(scoresRun1.category_scores.formatting, 95);
  assert.strictEqual(scoresRun1.category_scores.keyword_match, 84);
  assert.strictEqual(scoresRun1.category_scores.impact_quantification, 73);
});

test('7. Real Reference PDF: extracts pageCount=2, detects 24+ canonical skills, evaluates correctly', async () => {
  const pdfPath = 'C:/Users/Ashirwad Verma/.gemini/antigravity/brain/5cacf15d-dd3e-472e-a59f-1ce6ddf4d718/.user_uploaded/media_1794212022808_03a86142.pdf';
  if (!fs.existsSync(pdfPath)) return;

  const buf = fs.readFileSync(pdfPath);
  const file = {
    name: 'Rahul_Sharma.resume.pdf',
    type: 'application/pdf',
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  };

  const { text, pageCount } = await extractResumeData(file);
  assert.strictEqual(pageCount, 2, 'Rahul Sharma PDF page count should be 2');
  assert.strictEqual(text.includes('Rahul Sharma'), true);
  assert.strictEqual(text.includes('linkedin.com/in/rahulsharma'), true);
  assert.strictEqual(text.includes('github.com/rahulsharma'), true);

  const result = evaluateResume(text, '', file.name, pageCount);
  assert.strictEqual(result.overall_score === 83 || result.overall_score === 84, true);
  assert.strictEqual(result.matched_keywords.includes('React'), true);
  assert.strictEqual(result.matched_keywords.includes('Go'), false);
  assert.strictEqual(result.matched_keywords.length >= 20, true);
});

test('8. Keyword Scoring Monotonicity: two different resumes must NOT return identical Keyword Match scores, and more skills scores higher', () => {
  const resumeFewSkills = `
    Jane Doe
    jane@example.com | 1234567890 | linkedin.com/in/janedoe
    Professional Summary
    Junior web designer proficient with HTML5 and CSS3.
    Experience
    Web Intern: Styled responsive web pages.
    Education
    B.S. in Design 2026.
    Skills: HTML5, CSS3, Git
  `;

  const resumeManySkills = `
    John Smith
    john@example.com | 1234567890 | linkedin.com/in/johnsmith | github.com/johnsmith
    Professional Summary
    Full-stack engineer with hands-on expertise across modern architectures.
    Experience
    Software Engineer: Built microservices and web apps.
    Education
    B.S. in Computer Science 2025.
    Skills: Python, JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Docker, Kubernetes, AWS, Redis, GraphQL, Git, CI/CD
  `;

  const skillsFew = detectSkills(resumeFewSkills);
  const skillsMany = detectSkills(resumeManySkills);
  assert.ok(skillsFew.length < skillsMany.length, 'Resume B must have more skills than Resume A');

  const evalFew = evaluateResume(resumeFewSkills, '', 'ResumeA.pdf', 1);
  const evalMany = evaluateResume(resumeManySkills, '', 'ResumeB.pdf', 1);

  assert.notStrictEqual(
    evalFew.category_scores.keyword_match,
    evalMany.category_scores.keyword_match,
    'Different resumes must not return identical Keyword Match scores'
  );

  assert.ok(
    evalMany.category_scores.keyword_match > evalFew.category_scores.keyword_match,
    `Resume with more skills (${skillsMany.length} skills -> score ${evalMany.category_scores.keyword_match}) must score higher than resume with fewer skills (${skillsFew.length} skills -> score ${evalFew.category_scores.keyword_match})`
  );
});

test('9. Impact Threshold: do not suggest "add quantified metrics" when Impact Quantification is above 90%', () => {
  const resumeHighImpact = `
    Alex Chen
    alex@example.com | 1234567890 | linkedin.com/in/alexchen | github.com/alexchen
    Professional Summary
    Full-stack engineer specialized in high-performance computing.
    Experience
    Senior Engineer:
    - Optimized PostgreSQL query execution by 45%, reducing p99 latency across 12 endpoints.
    - Scaled distributed caching infrastructure to support 500K+ concurrent users with 99.99% uptime.
    - Reduced AWS cloud expenditure by 38% via automated pod rightsizing.
    - Automated CI/CD pipeline achieving 94% test coverage across 8 microservices.
    Education
    B.S. Computer Science 2024.
    Skills: Go, Python, React, PostgreSQL, Docker, Kubernetes, AWS
  `;

  const evalHighImpact = evaluateResume(resumeHighImpact, '', 'Alex_Chen.pdf', 1);
  assert.ok(
    evalHighImpact.category_scores.impact_quantification >= 90,
    `Impact Quantification score should be >= 90% (actual: ${evalHighImpact.category_scores.impact_quantification}%)`
  );

  // Assert no recommendation contains "quantified outcome metrics" or "add quantified"
  const metricSuggestions = evalHighImpact.suggestions.filter(s => {
    const text = typeof s === 'string' ? s : s.advice;
    return /\b(quantif|metric|measurable outcome|add.*number)\b/i.test(text);
  });

  assert.strictEqual(
    metricSuggestions.length,
    0,
    'Should NOT suggest adding quantified metrics when Impact Quantification is above 90%'
  );
});

test('10. Summary Grounding & Stateless Text Hashing: rejects ungrounded numbers or alien skills, fallback to template', () => {
  const resumeText = `
    Sarah Connor
    sarah@example.com | 9876543210 | linkedin.com/in/sarah
    Education: B.Tech Computer Science 2026
    Skills: Python, JavaScript, React
    Projects:
    Built a personal web app using React and Python.
  `;

  const debugLog = [];

  // Summary with hallucinated numbers (e.g. 40%, 12 endpoints) not in Sarah's resume
  const hallucinatedSummary = 'Candidate achieved 40% latency reduction across 12 endpoints using React.';
  const isValidHallucinated = validateSummary(hallucinatedSummary, resumeText, 85, debugLog);
  assert.strictEqual(isValidHallucinated, false, 'Summary containing numbers not in resume must be rejected');

  // Summary with alien skills (e.g. Kubernetes, Go) not in Sarah's resume
  const alienSkillSummary = 'Experienced developer proficient in Kubernetes, Go, and React.';
  const isValidAlien = validateSummary(alienSkillSummary, resumeText, 85, debugLog);
  assert.strictEqual(isValidAlien, false, 'Summary containing technical skills absent from resume must be rejected');

  // Grounded template fallback
  const template = buildTemplateSummary({
    experienceLevel: 'Entry Level',
    detectedSkills: ['Python', 'JavaScript', 'React'],
    overallScore: 85,
    pageCount: 1
  });
  const isValidTemplate = validateSummary(template, resumeText, 85, [], 1);
  assert.strictEqual(isValidTemplate, true, 'Template summary built from detected data must pass validation');

  // Deterministic text hashing
  const hash1 = hashText(resumeText);
  const hash2 = hashText(resumeText);
  const hashDifferent = hashText(SAMPLE_RESUME_TEXT);
  assert.strictEqual(hash1, hash2, 'Hash of identical text must be strictly equal');
  assert.notStrictEqual(hash1, hashDifferent, 'Hash of different text must be different');
});

test('11. Data and ML Resume: detects pandas, numpy, scikit-learn, power bi, and machine learning', () => {
  const dataMlResume = `
    Aman Verma
    aman@example.com | +91 9123456789 | linkedin.com/in/amanverma | github.com/amanverma
    Professional Summary
    Data Scientist with experience designing predictive models and interactive dashboards.
    Experience
    Data Analyst Intern:
    - Built ETL data pipelines using Pandas and NumPy to clean 500K+ transactional records.
    - Developed customer churn classification models using Scikit-Learn with 89% precision.
    - Designed executive Power BI dashboards with real-time KPI tracking.
    Projects
    Predictive Sales Forecaster | Python, Machine Learning, Power BI
    - Applied feature engineering and trained Random Forest models using Scikit-Learn.
    Technical Skills
    Languages: Python, SQL, R
    Data & ML Libraries: Pandas, NumPy, Scikit-Learn, TensorFlow, Matplotlib, Seaborn
    BI & Visualization: Power BI, Tableau, Excel
    Core Concepts: Machine Learning, Feature Engineering, Data Modeling
  `;

  const detected = detectSkills(dataMlResume);
  const detectedLower = detected.map(s => s.toLowerCase());

  assert.ok(detectedLower.includes('pandas'), 'Must detect pandas');
  assert.ok(detectedLower.includes('numpy'), 'Must detect numpy');
  assert.ok(detectedLower.includes('scikit-learn'), 'Must detect scikit-learn');
  assert.ok(detectedLower.includes('power bi'), 'Must detect power bi');
  assert.ok(detectedLower.includes('machine learning'), 'Must detect machine learning');
});

test('12. Web-dev Resume: must NOT detect any skill missing from its text', () => {
  const webDevResume = `
    Rahul Sharma
    rahul@example.com | 9876543210 | linkedin.com/in/rahul
    Technical Skills
    Languages: JavaScript, HTML5, CSS3
    Frameworks: React.js, Node.js
    Databases: MongoDB
  `;

  const detected = detectSkills(webDevResume);

  // Missing data science, mobile, and devops skills must not be detected
  assert.strictEqual(detected.includes('Pandas'), false, 'Must not detect Pandas');
  assert.strictEqual(detected.includes('NumPy'), false, 'Must not detect NumPy');
  assert.strictEqual(detected.includes('Power BI'), false, 'Must not detect Power BI');
  assert.strictEqual(detected.includes('Go'), false, 'Must not detect Go');
  assert.strictEqual(detected.includes('Docker'), false, 'Must not detect Docker');
  assert.strictEqual(detected.includes('Kubernetes'), false, 'Must not detect Kubernetes');
});

test('13. Three Different Resumes: produce distinct Keyword Match scores', () => {
  const resume1 = `
    Candidate One
    one@example.com | 1111111111 | linkedin.com/in/one
    Technical Skills
    Languages: HTML5, CSS3, JavaScript
  `;

  const resume2 = `
    Candidate Two
    two@example.com | 2222222222 | linkedin.com/in/two
    Technical Skills
    Languages: JavaScript, TypeScript, Python
    Frameworks: React.js, Node.js, Express.js
    Databases: MongoDB, PostgreSQL
    Projects:
    Built web app with React and Node.js.
  `;

  const resume3 = `
    Candidate Three
    three@example.com | 3333333333 | linkedin.com/in/three
    Technical Skills
    Languages: Python, R, SQL, Java, C++, JavaScript
    Frameworks: React, Node.js, Django, FastAPI
    Data: Pandas, NumPy, Scikit-Learn, PyTorch, TensorFlow
    Cloud: Docker, Kubernetes, AWS, CI/CD, Linux
    BI: Power BI, Tableau
    Projects:
    Built ML microservices with Python, PyTorch, Docker, Kubernetes on AWS.
    Experience:
    Software Engineer: Deployed React, FastAPI, Docker, CI/CD pipelines.
  `;

  const eval1 = evaluateResume(resume1, '', 'One.pdf', 1);
  const eval2 = evaluateResume(resume2, '', 'Two.pdf', 1);
  const eval3 = evaluateResume(resume3, '', 'Three.pdf', 1);

  const score1 = eval1.category_scores.keyword_match;
  const score2 = eval2.category_scores.keyword_match;
  const score3 = eval3.category_scores.keyword_match;

  assert.notStrictEqual(score1, score2, `Score 1 (${score1}) must not equal Score 2 (${score2})`);
  assert.notStrictEqual(score2, score3, `Score 2 (${score2}) must not equal Score 3 (${score3})`);
  assert.notStrictEqual(score1, score3, `Score 1 (${score1}) must not equal Score 3 (${score3})`);
  assert.ok(score3 > score2 && score2 > score1, `Scores must scale with keyword coverage: ${score3} > ${score2} > ${score1}`);
});

test('14. Evidence Quotes Validator: rejects candidate name and headings, accepts "pages: 2" and verbatim text', () => {
  const resumeText = `Jane Doe
jane@example.com | 1234567890 | linkedin.com/in/janedoe

Technical Skills
Languages: Python, JavaScript

Experience
Software Developer:
- Built REST APIs and optimized database queries.`;

  const debugLog = [];
  const rawRecommendations = [
    { advice: 'Condense resume to 1 page', evidence_quote: 'pages: 2' },
    { advice: 'Improve summary presentation', evidence_quote: 'Jane Doe' }, // Candidate name -> reject
    { advice: 'Organize skills section', evidence_quote: 'Technical Skills' }, // Section heading -> reject
    { advice: 'Quantify database performance metrics', evidence_quote: 'Built REST APIs and optimized database queries.' }, // Verbatim -> keep
    { advice: 'Invented metric advice', evidence_quote: 'Architected microservices for 100M users' } // Not in text -> reject
  ];

  const valid = validateRecommendations(rawRecommendations, resumeText, debugLog);
  assert.strictEqual(valid.length, 2, 'Only valid evidence quotes must pass');
  assert.strictEqual(valid[0].evidence_quote, 'pages: 2');
  assert.strictEqual(valid[1].evidence_quote, 'Built REST APIs and optimized database queries.');
});

test('15. Experience Bullet Count: counts only bullets strictly under the Experience section', () => {
  const majorSections = {
    experienceText: `
      Software Engineer Intern
      • Built RESTful endpoints with Node.js and Express.
      • Optimized PostgreSQL queries, reducing latency by 35%.
      • Integrated CI/CD pipelines with GitHub Actions.
    `,
    projectsText: `
      Portfolio Website
      • Designed responsive UI with React and Tailwind CSS.
      • Deployed to Vercel with 95+ Lighthouse score.
    `
  };

  const expBullets = extractExperienceBullets(majorSections.experienceText);
  assert.strictEqual(expBullets.length, 3, 'Experience bullets must only count bullets under Experience');
});

test('16. Summary Skills Ranking: prioritizes substantiated core skills over minor tools', () => {
  const resumeText = `
    Rahul Sharma
    Technical Skills
    Languages: Python, JavaScript, HTML5, CSS3
    Frameworks: React.js, Node.js
    Tools: VS Code, Postman, ChatGPT, Claude
    Experience:
    Built web applications using React.js and Node.js. Developed Python backend APIs.
    Projects:
    Portfolio built with React.js and Node.js.
  `;

  const detected = detectSkills(resumeText);
  const ranked = rankSkillsForSummary(resumeText, detected);

  // Core skills React, Node.js, Python must appear before VS Code, Postman, ChatGPT
  const reactIdx = ranked.indexOf('React');
  const nodeIdx = ranked.indexOf('Node.js');
  const postmanIdx = ranked.indexOf('Postman');
  const chatGptIdx = ranked.indexOf('ChatGPT');

  assert.ok(reactIdx !== -1 && postmanIdx !== -1, 'Skills must be detected');
  assert.ok(reactIdx < postmanIdx, 'Core skill React must rank ahead of minor tool Postman');
  assert.ok(nodeIdx < chatGptIdx, 'Core skill Node.js must rank ahead of minor tool ChatGPT');
});

test('17. Fully Quantified Resume: "add quantified metrics" advice must NOT appear when every bullet has a number', () => {
  const fullyQuantifiedResume = `
    Aman Verma
    aman@example.com | +91 98765 43210 | linkedin.com/in/amanverma | github.com/amanverma

    Professional Summary
    Results-driven Software Engineer with proven track record of quantitative impact.

    Experience
    Software Engineer at Acme Corp | 2024 - Present
    • Designed and deployed 14 REST microservices, handling 250K requests daily.
    • Reduced p99 database query latency by 45% through Redis caching.
    • Mentored 5 junior developers and improved sprint velocity by 28%.

    Projects
    Distributed Task Queue | Go, Redis, Docker
    • Scaled background task processing to 10000 jobs per minute across 4 worker nodes.
    • Decreased task failure rate from 8% to 0.5% with automated retry queues.

    Education
    B.S. in Computer Science, 2024 | CGPA: 9.1/10

    Technical Skills
    Languages: Go, Python, SQL
    Tools: Docker, Redis, Git
  `;

  const result = evaluateResume(fullyQuantifiedResume, '', 'Aman_Verma.pdf', 1);

  // Assert no "add quantified metrics" advice in recommendations
  const metricAdvice = result.suggestions.filter(s => {
    const text = typeof s === 'string' ? s : s.advice;
    return /\b(quantif|metric|measurable outcome|add.*number)\b/i.test(text);
  });

  assert.strictEqual(
    metricAdvice.length,
    0,
    '"add quantified metrics" recommendation must NOT appear when every bullet has a number'
  );

  // Assert no bullet rewrites are suggested since every bullet already has numbers (Requirement 2)
  assert.strictEqual(
    result.weak_bullets.length,
    0,
    'No bullet rewrites should be suggested for bullets that already contain numbers'
  );
});

test('18. Skills: handles single-letter and symbol skills (R, C, C++, C#) and excludes coding platforms from technical keywords', () => {
  const multiFieldResume = `
    Alex Miller
    alex@example.com | 1234567890 | linkedin.com/in/alexmiller | github.com/alexmiller

    Professional Summary
    Polyglot systems developer with data science and competitive programming background.

    Technical Skills
    Languages: C, C++, C#, R, Python, SQL
    Tools: Git, Docker

    Experience
    Systems Engineer:
    - Built embedded drivers in C and high-performance algorithms in C++.
    - Created enterprise desktop applications with C# and .NET.
    - Analyzed statistical datasets using R and Python.

    Achievements and Certifications
    Solved 500+ problems on LeetCode and HackerRank.
    Achieved top 1% rating on GeeksforGeeks.
  `;

  const detected = detectSkills(multiFieldResume);

  // Assert single-letter and symbol skills are detected
  assert.ok(detected.includes('C'), 'Must detect single-letter skill C');
  assert.ok(detected.includes('C++'), 'Must detect symbol skill C++');
  assert.ok(detected.includes('C#'), 'Must detect symbol skill C#');
  assert.ok(detected.includes('R'), 'Must detect single-letter skill R');

  // Assert coding practice platforms are EXCLUDED from technical keywords
  assert.strictEqual(detected.includes('LeetCode'), false, 'LeetCode must be excluded from technical keywords');
  assert.strictEqual(detected.includes('HackerRank'), false, 'HackerRank must be excluded from technical keywords');
  assert.strictEqual(detected.includes('GeeksforGeeks'), false, 'GeeksforGeeks must be excluded from technical keywords');

  // Evaluate resume and verify coding platforms are listed under achievements
  const result = evaluateResume(multiFieldResume, '', 'Alex_Miller.pdf', 1);
  assert.ok(result.coding_platforms.includes('LeetCode'), 'LeetCode must be listed in coding_platforms');
  assert.ok(result.coding_platforms.includes('HackerRank'), 'HackerRank must be listed in coding_platforms');
  assert.ok(result.coding_platforms.includes('GeeksforGeeks'), 'GeeksforGeeks must be listed in coding_platforms');
  assert.ok(result.achievements.length >= 2, 'Competitive coding achievements must be listed under achievements');
});

test('19. Bullet splitting: splits whole bullets before AI, assigns ids, joins wrapped lines, prevents fragments', () => {
  const splitBullets = splitResumeBullets(SAMPLE_RESUME_TEXT);
  assert.ok(splitBullets.length >= 6, 'Should extract all candidate bullets');

  for (let i = 0; i < splitBullets.length; i++) {
    const b = splitBullets[i];
    assert.strictEqual(b.id, `b${i + 1}`, `Bullet index ${i} should have id 'b${i + 1}'`);
    assert.strictEqual(typeof b.text, 'string');
    assert.strictEqual(typeof b.hasDigits, 'boolean');
    assert.ok(b.text.length > 20, 'Each bullet must be a full statement, not a fragment');
    assert.strictEqual(/\n/.test(b.text), false, 'Wrapped lines should be joined without newlines');
  }

  // Verify specific full bullets are extracted intact
  const expectedBullets = [
    'Designed and deployed a responsive portfolio website that showcases 5+ projects, achieving a Lighthouse performance score of 95+.',
    'Reduced page load time by 40% through image optimization and lazy loading.',
    'Used AI-assisted development to speed up UI prototyping and debugging.',
    'Developed 6 reusable React components, reducing duplicated code by 30%.',
    'Fixed 25+ UI bugs and collaborated with a team of 4 developers using Git and GitHub pull requests.',
    'Integrated third-party REST APIs to display live data on the company dashboard.'
  ];

  for (const exp of expectedBullets) {
    const found = splitBullets.some(b => b.text === exp);
    assert.ok(found, `Expected bullet "${exp}" to be extracted intact as a complete bullet`);
  }
});

test('20. Empty rewrites & measurable results message: when all bullets have numbers, weak_bullets is empty', () => {
  const allNumberedResume = `
    Alex Miller
    alex@example.com | 1234567890 | linkedin.com/in/alexmiller | github.com/alexmiller

    Professional Summary
    Senior engineer with measurable outcomes.

    Experience
    - Deployed 12 microservices boosting throughput by 40%.
    - Resolved 50 critical bugs reducing latency by 25%.
    - Trained 8 junior engineers across 4 sprints.

    Projects
    - Built an analytics dashboard serving 1000 daily active users with 99.9% uptime.
  `;

  const result = evaluateResume(allNumberedResume, '', 'Alex.pdf', 1);
  assert.strictEqual(result.weak_bullets.length, 0, 'Must return empty weak_bullets when all bullets have numbers');

  // Must not suggest "add quantified metrics" when all bullets are already quantified
  const hasQuantAdvice = result.suggestions.some(s =>
    typeof s === 'object' && /\b(quantif|metric|measurable outcome|add.*number)\b/i.test(s.advice)
  );
  assert.strictEqual(hasQuantAdvice, false, 'Must NOT suggest adding quantified metrics when every bullet has numbers');
});

test('21. Rewrite validation: strictly rejects added content words (efficiency, workflows, operational, velocity)', () => {
  const debugLog = [];
  const testBullets = [
    // Valid: only initial action verb and [ADD YOUR OWN NUMBER] placeholder added
    {
      original: 'Integrated third-party REST APIs to display live data on the company dashboard.',
      suggestion: 'Integrated third-party REST APIs to display live data on the company dashboard by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid: adds "efficiency"
    {
      original: 'Integrated third-party REST APIs to display live data on the company dashboard.',
      suggestion: 'Integrated third-party REST APIs to display live data on the company dashboard, improving query efficiency by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid: adds "workflows"
    {
      original: 'Integrated third-party REST APIs to display live data on the company dashboard.',
      suggestion: 'Integrated third-party REST APIs into dashboard workflows by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid: adds "operational"
    {
      original: 'Integrated third-party REST APIs to display live data on the company dashboard.',
      suggestion: 'Integrated third-party REST APIs to display live data on the company dashboard for operational monitoring by [ADD YOUR OWN NUMBER]%.'
    },
    // Invalid: adds "velocity"
    {
      original: 'Integrated third-party REST APIs to display live data on the company dashboard.',
      suggestion: 'Integrated third-party REST APIs to display live data on the company dashboard, accelerating team velocity by [ADD YOUR OWN NUMBER]%.'
    }
  ];

  const validated = validateBulletRewrites(testBullets, SAMPLE_RESUME_TEXT, debugLog);
  assert.strictEqual(validated.length, 1, 'Only the rewrite with zero added content words must pass');
  assert.strictEqual(validated[0].original, 'Integrated third-party REST APIs to display live data on the company dashboard.');

  // Verify each forbidden word was caught in rejection reasons
  const reasons = debugLog.map(d => d.reason).join(' ');
  assert.ok(reasons.includes('efficiency'), 'debugLog should report rejected word efficiency');
  assert.ok(reasons.includes('workflows'), 'debugLog should report rejected word workflows');
  assert.ok(reasons.includes('operational'), 'debugLog should report rejected word operational');
  assert.ok(reasons.includes('velocity'), 'debugLog should report rejected word velocity');
});

test('22. Experience bullet count: counts every bullet line under the Experience heading', () => {
  const result = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.pdf', 2);
  assert.strictEqual(result.experience_bullet_count, 3, 'Sample resume must have exactly 3 experience bullets');

  const customExpResume = `
    Jane Doe
    jane@example.com | 1234567890 | linkedin.com/in/janedoe

    Work Experience
    Software Engineering Intern | ABC Corp | June 2025 - August 2025
    • Built automated testing suite covering 85% of core endpoints.
    - Optimized Postgres database queries for search indexing.
    Designed customer feedback onboarding workflow.
    Assisted with production deployments and monitoring.

    Education
    B.S. in Computer Science
  `;

  const expBullets = extractExperienceBullets(customExpResume);
  assert.strictEqual(expBullets.length, 4, 'Must count all 4 bullet lines under Experience heading');
});

test('23. Card descriptions: describe resume facts directly without repeating internal rules or instructions', () => {
  const result = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.pdf', 2);
  const cards = result.section_analysis;

  // 1. Achievements & Coding Platforms card must describe problems solved
  const achCard = cards.find(c => /achievements|coding/i.test(c.section));
  assert.ok(achCard, 'Achievements card must be present');
  assert.strictEqual(achCard.feedback, 'LeetCode and GeeksforGeeks problems solved: 300+');

  // 2. No card may repeat internal instructions or rules
  for (const card of cards) {
    assert.strictEqual(
      card.feedback.includes('Listed under achievements rather than technical keywords'),
      false,
      `Card "${card.section}" must not repeat internal instruction about achievements`
    );
    assert.strictEqual(
      card.feedback.includes('Categorize them into Languages'),
      false,
      `Card "${card.section}" must not repeat rule about categorizing into Languages`
    );
    assert.strictEqual(
      card.feedback.includes('Ensure your phone number'),
      false,
      `Card "${card.section}" must not repeat instruction "Ensure your phone number"`
    );
    assert.strictEqual(
      card.feedback.includes('Increase quantified business impact'),
      false,
      `Card "${card.section}" must not repeat instruction "Increase quantified business impact"`
    );
  }
});

test('24. Determinism: running the same resume 5 times produces strictly identical scores', () => {
  const runResults = [];
  for (let i = 0; i < 5; i++) {
    runResults.push(evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.pdf', 2));
  }

  const baseline = runResults[0];
  for (let i = 1; i < 5; i++) {
    assert.strictEqual(runResults[i].overall_score, baseline.overall_score, `Run ${i + 1} overall score must match Run 1`);
    assert.deepStrictEqual(runResults[i].category_scores, baseline.category_scores, `Run ${i + 1} category scores must match Run 1`);
    assert.strictEqual(runResults[i].matched_keywords.length, baseline.matched_keywords.length);
    assert.strictEqual(runResults[i].experience_bullet_count, baseline.experience_bullet_count);
  }
});

test('25. Job Description Parsing: extracts technical skills, multi-word terms, and separates soft skills', () => {
  const jdText = `
  We are looking for a Senior Analytics Engineer proficient in Python, SQL, A/B testing, data visualization, and Power BI.
  Experience with Snowflake and dbt is a plus.
  Must have strong communication and teamwork skills.
  `;

  const missingResult = computeMissingKeywords(SAMPLE_RESUME_TEXT, jdText);

  // Technical terms extracted from JD:
  // Candidate SAMPLE_RESUME_TEXT has Python and SQL.
  // Candidate lacks: A/B testing, data visualization, Power BI, Snowflake, dbt.
  assert.ok(missingResult.missingKeywords.includes('A/B testing'), 'Multi-word term "A/B testing" must be in missing technical keywords');
  assert.ok(missingResult.missingKeywords.includes('Data Visualization'), 'Multi-word term "Data Visualization" must be in missing technical keywords');
  assert.ok(missingResult.missingKeywords.includes('Power BI'), 'Normalized "Power BI" must be in missing technical keywords');
  assert.ok(missingResult.missingKeywords.includes('Snowflake'), 'Snowflake must be in missing technical keywords');
  assert.ok(missingResult.missingKeywords.includes('dbt'), 'dbt must be in missing technical keywords');

  // Python and SQL are on the resume, so they must NOT be in missingKeywords
  assert.strictEqual(missingResult.missingKeywords.includes('Python'), false, 'Python is on resume, must not be missing');
  assert.strictEqual(missingResult.missingKeywords.includes('SQL'), false, 'SQL is on resume, must not be missing');

  // Soft skills must NOT be mixed into technical missingKeywords
  assert.strictEqual(missingResult.missingKeywords.includes('communication'), false, 'Soft skill "communication" must NOT be in technical missingKeywords');
  assert.strictEqual(missingResult.missingKeywords.includes('teamwork'), false, 'Soft skill "teamwork" must NOT be in technical missingKeywords');

  // Soft skills must appear in missingSoftSkills (if not in resume text)
  // SAMPLE_RESUME_TEXT does not mention "teamwork"
  assert.ok(missingResult.missingSoftSkills.includes('Teamwork'), 'Teamwork must appear in missingSoftSkills');
});

test('26. Keyword Match with Job Description: matched JD skills / total JD skills with debug formula', () => {
  const jdText = `
  Requirements: React, Node.js, Express.js, MongoDB, JavaScript, Docker, Kubernetes, AWS, GraphQL, Redis
  `;

  // Candidate SAMPLE_RESUME_TEXT has: React, Node.js, Express.js, MongoDB, JavaScript (5 of 10)
  // Lacks: Docker, Kubernetes, AWS, GraphQL, Redis (5 of 10)
  const evalResult = evaluateResume(SAMPLE_RESUME_TEXT, jdText, 'Rahul.pdf', 1);

  // Matched = 5, Total = 10 -> Keyword Match should be 50%
  assert.strictEqual(evalResult.category_scores.keyword_match, 50, '5 of 10 JD skills matched must equal 50%');
  assert.ok(
    evalResult.debug_info.keyword_score_formula.includes('5 of 10 JD skills matched (50%)'),
    `Debug formula must document counts: ${evalResult.debug_info.keyword_score_formula}`
  );
});

test('27. Impact Quantification: (bullets with numbers / total bullets) mapped to score, >= 95% when fully quantified', () => {
  // Resume where EVERY bullet contains a number
  const fullyQuantifiedResume = `
  Jane Doe | jane@email.com | 123-456-7890 | linkedin.com/in/janedoe | github.com/janedoe
  Professional Summary
  Full-stack engineer with 5 years experience building cloud applications.
  Education
  BS Computer Science | GPA: 3.8/4.0
  Technical Skills
  Python, JavaScript, React, Docker, AWS, PostgreSQL
  Experience
  Software Engineer, Tech Corp
  • Increased system throughput by 35% through query optimization.
  • Deployed 15 microservices reducing release cycle time by 50%.
  • Mentored 4 junior engineers across 12 sprint cycles.
  Projects
  Analytics Platform | React, Python, PostgreSQL
  • Implemented 8 REST endpoints serving 5,000 requests per second.
  • Reduced memory usage by 40% with streaming data buffers.
  `;

  const evalResult = evaluateResume(fullyQuantifiedResume, '', 'Jane_Doe.pdf', 1);
  assert.ok(
    evalResult.category_scores.impact_quantification >= 95,
    `Fully quantified resume must score at least 95% on Impact Quantification (got ${evalResult.category_scores.impact_quantification}%)`
  );
  assert.strictEqual(evalResult.weak_bullets.length, 0, 'No weak bullets when every bullet has numbers');
});

test('28. Matched Keywords Splitting: splits into "Matches the job description" and "Other skills on your resume"', () => {
  const jdText = 'Looking for an engineer with React, Node.js, and Docker.';
  const evalResult = evaluateResume(SAMPLE_RESUME_TEXT, jdText, 'Rahul.pdf', 1);

  // Resume has React and Node.js (matches JD)
  assert.ok(evalResult.jd_matched_keywords.includes('React'), 'React must be in jd_matched_keywords');
  assert.ok(evalResult.jd_matched_keywords.includes('Node.js'), 'Node.js must be in jd_matched_keywords');
  assert.strictEqual(evalResult.jd_matched_keywords.includes('Docker'), false, 'Docker is not on resume, must not be in jd_matched_keywords');

  // Other skills on resume (e.g. Python, SQL, TypeScript) must be in other_keywords
  assert.ok(evalResult.other_keywords.includes('Python'), 'Python must be in other_keywords');
  assert.ok(evalResult.other_keywords.includes('SQL'), 'SQL must be in other_keywords');
  assert.strictEqual(evalResult.other_keywords.includes('React'), false, 'React matched JD, so not in other_keywords');
});

test('29. Weak Android Resume: Comprehensive fix verification for all 7 issues', () => {
  const WEAK_ANDROID_RESUME_TEXT = `Aman Verma
aman.verma@email.com | +91 91234 56789 | linkedin.com/in/amanverma

Objective
Seeking a challenging position as an Android Developer in a reputed IT organization to enhance my skills and contribute to organizational growth.

Education
Bachelor of Technology in Computer Science, ABC University
Expected Graduation: 2026 | CGPA: 7.5

Technical Skills
Languages: Java, Kotlin, XML
Tools & Platforms: Android Studio, Git
Databases: SQLite, Room
Soft Skills: Communication, Teamwork, Hard Working, Quick Learner
Organizations: XYZ Technologies Pvt Ltd

Experience
Android Developer Intern, XYZ Technologies Pvt Ltd | Jan 2026 - Present
• Worked on UI using XML
• Responsible for bug fixing
• Helped in API integration with Retrofit
• Participated in daily standups

Projects
Notes App | Kotlin, SQLite
• Made an Android app for note taking
• Used Kotlin and Room database for local caching
• Did testing and debugging of the app

Other Activities
• Participated in college annual cultural fest
• Member of student social club
`;

  const evalResult = evaluateResume(WEAK_ANDROID_RESUME_TEXT, '', 'Aman_Verma_Android.pdf', 1);

  // 1. Impact Quantification: score = bullets containing at least one digit / total bullets.
  // When no numeric bullets exist, score must be strictly below 15% (0%).
  assert.ok(
    evalResult.category_scores.impact_quantification < 15,
    `Resume with no numeric bullets must score below 15% on Impact Quantification (got ${evalResult.category_scores.impact_quantification}%)`
  );
  assert.strictEqual(evalResult.category_scores.impact_quantification, 0);

  // 2. Soft skills and company names must NEVER appear in Technical Keywords.
  // Soft skills must be returned separately.
  const technicalKeywords = evalResult.matched_keywords;
  const softSkills = evalResult.soft_skills;

  const forbiddenInTech = ['Communication', 'Teamwork', 'Hard Working', 'Quick Learner', 'XYZ Technologies Pvt Ltd', 'XYZ Technologies'];
  for (const item of forbiddenInTech) {
    assert.strictEqual(
      technicalKeywords.includes(item),
      false,
      `Item "${item}" must NOT appear in technical matched_keywords`
    );
  }
  assert.ok(softSkills.includes('Communication'), 'Communication must appear in soft_skills');
  assert.ok(softSkills.includes('Teamwork'), 'Teamwork must appear in soft_skills');
  assert.ok(softSkills.includes('Hard Working'), 'Hard Working must appear in soft_skills');
  assert.ok(softSkills.includes('Quick Learner'), 'Quick Learner must appear in soft_skills');

  // 3. Professional Summary: marked WEAK when titled Objective or lacking skills and numbers.
  // Exact comment: "This is a generic objective without skills or achievements."
  const summaryCard = evalResult.section_analysis.find(s => s.section && /summary|objective/i.test(s.section));
  assert.ok(summaryCard, 'Professional Summary / Objective card must exist');
  assert.strictEqual(summaryCard.status, 'weak', 'Objective card must be marked weak');
  assert.strictEqual(
    summaryCard.feedback,
    'This is a generic objective without skills or achievements.',
    'Objective card feedback must match verbatim'
  );

  // 4. Experience bullet count: count ONLY bullets between Experience heading and next section heading (4 bullets).
  // Other Activities bullets must NOT be counted.
  assert.strictEqual(
    evalResult.experience_bullet_count,
    4,
    `Experience bullet count must be 4, got ${evalResult.experience_bullet_count}`
  );

  // 5. Rewrites: flag bullets starting with weak openers (worked on, responsible for, helped in, used, made, did).
  // Up to 5 rewrites, strong past-tense action verb, sensible [ADD YOUR OWN NUMBER] position, NEVER append "by N%".
  // Skip participation/learning bullets and Other Activities (Requirement 3)
  assert.ok(evalResult.weak_bullets.length >= 4 && evalResult.weak_bullets.length <= 5, `Expected 4-5 rewrites, got ${evalResult.weak_bullets.length}`);
  assert.strictEqual(
    evalResult.weak_bullets.some(rw => rw.original.includes('daily standups')),
    false,
    'Participation bullet ("Participated in daily standups") must be skipped from rewrites'
  );
  assert.strictEqual(
    evalResult.weak_bullets.some(rw => rw.original.includes('cultural fest') || rw.original.includes('social club')),
    false,
    'Other Activities bullets must be skipped from rewrites'
  );

  for (const rw of evalResult.weak_bullets) {
    assert.ok(rw.original, 'Rewrite must have original bullet');
    assert.ok(rw.suggestion, 'Rewrite must have suggestion');
    assert.strictEqual(
      /by\s+(?:\[ADD YOUR OWN NUMBER\]|\d+)%/i.test(rw.suggestion),
      false,
      `Rewrite must NEVER append "by N%" to non-quantified bullet: "${rw.suggestion}"`
    );
    assert.ok(
      rw.suggestion.includes('[ADD YOUR OWN NUMBER]'),
      `Rewrite must contain [ADD YOUR OWN NUMBER] placeholder: "${rw.suggestion}"`
    );
    assert.ok(
      /^[A-Z][a-zA-Z]*(?:ed|built|led|ran|wrote|made|held)\b/.test(rw.suggestion),
      `Rewrite must start with strong past-tense action verb: "${rw.suggestion}"`
    );
  }

  // 6. Page count: short resume must report 1 page
  assert.strictEqual(evalResult.page_count, 1, 'Short resume must report 1 page');

  // 7. Canonical skill: "Android Studio" must be detected in full
  assert.ok(evalResult.matched_keywords.includes('Android Studio'), 'Android Studio must be detected in matched_keywords');

  // 8. Formatting score & checklist
  assert.ok(evalResult.formatting_checklist, 'formatting_checklist must exist in evaluateResume result');
  assert.ok(evalResult.debug_info.formatting_checklist, 'formatting_checklist must exist in debug_info');
  // Two different resumes must have different formatting scores:
  const rahulSharmaResult = evaluateResume(SAMPLE_RESUME_TEXT, '', 'Rahul_Sharma.pdf', 2);
  assert.notStrictEqual(
    evalResult.category_scores.formatting,
    rahulSharmaResult.category_scores.formatting,
    'Two different resumes must not both score identical formatting unless checks are identical'
  );

  // 9. Resume-type advice: mobile resume suggests Google Play Store or GitHub, NOT Vercel or Netlify
  for (const issue of evalResult.formatting_issues) {
    assert.strictEqual(
      issue.toLowerCase().includes('vercel') || issue.toLowerCase().includes('netlify'),
      false,
      `Mobile resume formatting issue must NOT mention Vercel or Netlify: "${issue}"`
    );
  }
  for (const sug of evalResult.suggestions) {
    assert.strictEqual(
      sug.advice.toLowerCase().includes('vercel') || sug.advice.toLowerCase().includes('netlify'),
      false,
      `Mobile resume recommendation must NOT mention Vercel or Netlify: "${sug.advice}"`
    );
  }
  const hasPlayOrGitHubAdvice = evalResult.formatting_issues.some(i => i.includes('Play Store') || i.includes('GitHub')) ||
                               evalResult.suggestions.some(s => s.advice.includes('Play Store') || s.advice.includes('GitHub'));
  assert.strictEqual(hasPlayOrGitHubAdvice, true, 'Mobile resume must recommend Google Play Store or GitHub repository links');
});

test('30. One-Page Well-Formatted Resume: Comprehensive verification of all 5 bugs', () => {
  // Resume with 10 bullets: 6 quantified (contain digits), 4 unquantified (no digits)
  // Skills section contains: Agile/Scrum, Unit Testing (Jest), Clean Architecture, and Soft Skills
  // Experience section contains bullet sentences with fragments like "Keeping retrieval latencies under 120ms."
  const resumeText = `
    Alex Rivera
    alex.rivera@example.com | (555) 234-5678 | linkedin.com/in/alexrivera | github.com/alexrivera
    https://alexrivera.dev

    Professional Summary
    Full-stack software engineer with 3+ years experience building web applications and microservices.

    Technical Skills
    Languages & Frameworks: TypeScript, React, Node.js, Python, Clean Architecture
    Methodologies & Testing: Agile/Scrum, Unit Testing (Jest), CI/CD
    Soft Skills: Teamwork, Problem Solving, Communication

    Work Experience
    Senior Software Engineer | CloudTech Solutions
    - Architected distributed caching layer serving 250000 daily active users with 99.9% uptime.
    - Optimized SQL queries and database indexes, reducing p99 response times by 42%.
    - Spearheaded migration to containerized microservices across 14 independent service clusters.
    - Maintained automated integration test suites achieving 88% overall test coverage.
    - Refactored legacy monolithic API endpoints for 6 customer-facing modules.
    - Decreased AWS cloud infrastructure expenses by 28% through autoscaling adjustments.
    - Worked on internal developer tooling to improve deployment efficiency.
    - Responsible for peer code reviews and mentoring junior developers.
    - Built responsive frontend component library using modern component design patterns.
    - Engineered data ingestion pipelines keeping retrieval latencies under 120ms.

    Education
    B.S. in Computer Science | University of California, Berkeley | 2021
  `;

  // 1. Impact Quantification:
  // Total bullets in Experience = 10.
  // 6 bullets contain digits (250000, 99.9%, 42%, 14, 88%, 6, 28%, 120ms -> wait:
  // "Engineered data ingestion pipelines keeping retrieval latencies under 120ms." has 120ms (contains digits)
  // Let's count digits in the 10 bullets:
  // Bullet 1: 250000, 99.9% -> digit (yes)
  // Bullet 2: 42% -> digit (yes)
  // Bullet 3: 14 -> digit (yes)
  // Bullet 4: 88% -> digit (yes)
  // Bullet 5: 6 -> digit (yes)
  // Bullet 6: 28% -> digit (yes)
  // Bullet 7: "Worked on internal developer tooling..." -> NO digit
  // Bullet 8: "Responsible for peer code reviews..." -> NO digit
  // Bullet 9: "Built responsive frontend component library..." -> NO digit
  // Bullet 10: "Participated in agile ceremonies and team planning meetings." -> NO digit (let's use an unquantified bullet)
  const resume10BulletsText = `
    Alex Rivera
    alex.rivera@example.com | (555) 234-5678 | linkedin.com/in/alexrivera | github.com/alexrivera
    https://alexrivera.dev

    Professional Summary
    Full-stack software engineer with 3 years experience building web applications and microservices.

    Technical Skills
    Languages & Frameworks: TypeScript, React, Node.js, Python, Clean Architecture
    Methodologies & Testing: Agile/Scrum, Unit Testing (Jest), CI/CD
    Soft Skills: Teamwork, Problem Solving, Communication

    Work Experience
    Senior Software Engineer | CloudTech Solutions
    - Architected distributed caching layer serving 250000 daily active users.
    - Optimized SQL queries and database indexes, reducing response times by 42%.
    - Spearheaded migration to containerized microservices across 14 services.
    - Maintained automated integration test suites achieving 88% test coverage.
    - Refactored legacy monolithic API endpoints for 6 customer-facing modules.
    - Decreased AWS infrastructure costs by 28% through automated rightsizing.
    - Worked on internal developer tooling for development workflows.
    - Responsible for peer code reviews and onboarding junior engineers.
    - Built responsive frontend component library using modern component design patterns.
    - Implemented cross-browser compatibility fixes across application views.

    Education
    B.S. in Computer Science | University of California, Berkeley | 2021
  `;

  const evalResult = evaluateResume(resume10BulletsText, '', 'Alex_Rivera.pdf', 1);

  // Requirement 1: Exactly 6 of 10 bullets have digits -> 60%
  assert.strictEqual(
    evalResult.category_scores.impact_quantification,
    60,
    `Resume with 6 of 10 quantified bullets must score 60% (got: ${evalResult.category_scores.impact_quantification})`
  );

  // Requirement 2: Recommendations and rewrites list bullets without digits (up to 5), weakest first
  assert.ok(evalResult.weak_bullets.length > 0, 'Weak bullets must contain rewrites for unquantified bullets');
  assert.ok(evalResult.weak_bullets.length <= 5, 'At most 5 rewrites');
  for (const rw of evalResult.weak_bullets) {
    assert.strictEqual(/\d/.test(rw.original), false, `Original bullet must have NO digits: "${rw.original}"`);
    assert.ok(rw.suggestion.includes('[ADD YOUR OWN NUMBER]'), `Rewrite must contain placeholder: "${rw.suggestion}"`);
  }

  // Recommendations: must list unquantified bullets (not empty when bullets lack digits)
  assert.ok(evalResult.suggestions.length > 0, 'Suggestions must not be empty when bullets lack digits');
  const metricSug = evalResult.suggestions.filter(s => /\b(quantif|metric|measurable outcome|add.*number)\b/i.test(s.advice));
  assert.ok(metricSug.length > 0, 'Must include quantified metrics recommendations');
  for (const ms of metricSug) {
    assert.strictEqual(/\d/.test(ms.evidence_quote), false, 'Evidence quote must be an unquantified bullet without digits');
  }

  // Requirement 4: Skills section parsing:
  // "Agile/Scrum" -> Agile and Scrum
  // "Unit Testing (Jest)" -> Unit Testing and Jest
  // "Clean Architecture" -> kept as one item
  assert.ok(evalResult.matched_keywords.includes('Agile'), 'Agile must be detected from Agile/Scrum');
  assert.ok(evalResult.matched_keywords.includes('Scrum'), 'Scrum must be detected from Agile/Scrum');
  assert.ok(evalResult.matched_keywords.includes('Unit Testing'), 'Unit Testing must be detected from Unit Testing (Jest)');
  assert.ok(evalResult.matched_keywords.includes('Jest'), 'Jest must be detected from Unit Testing (Jest)');
  assert.ok(evalResult.matched_keywords.includes('Clean Architecture'), 'Clean Architecture must be kept as one item');

  // Requirement 3: Reject sentence fragments from bullets & forbidden phrases
  assert.strictEqual(evalResult.matched_keywords.includes('Structured Document Parsing'), false);
  assert.strictEqual(evalResult.matched_keywords.includes('Keeping Retrieval Latencies Under 120ms.'), false);
  assert.strictEqual(evalResult.matched_keywords.includes('Keeping Retrieval Latencies Under 120ms'), false);
  for (const kw of evalResult.matched_keywords) {
    assert.ok(kw.split(/\s+/).length <= 3, `Keyword "${kw}" must not exceed 3 words`);
    assert.ok(!/[.,;:!?]$/.test(kw), `Keyword "${kw}" must not end with punctuation`);
    assert.ok(!/\b(keeping|under|\d+ms)\b/i.test(kw), `Keyword "${kw}" must not contain forbidden fragment words`);
  }

  // Requirement 5: Soft skills detected ONLY in Skills section, NOT from phrases in bullets
  assert.ok(evalResult.soft_skills.includes('Teamwork'), 'Teamwork must be in soft_skills');
  assert.ok(evalResult.soft_skills.includes('Communication'), 'Communication must be in soft_skills');
  // Ensure soft skills are NOT in technical matched_keywords
  assert.strictEqual(evalResult.matched_keywords.includes('Teamwork'), false);
  assert.strictEqual(evalResult.matched_keywords.includes('Communication'), false);
  assert.strictEqual(evalResult.matched_keywords.includes('Problem Solving'), false);

  // Requirement 1 & 2: A resume with 100% quantified bullets and no formatting issues
  const perfectResumeText = `
    Jordan Lee
    jordan.lee@example.com | (555) 345-6789 | linkedin.com/in/jordanlee | github.com/jordanlee
    https://jordanlee.dev

    Professional Summary
    Senior software engineer with 5 years experience scaling cloud applications.

    Technical Skills
    Languages: TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS

    Work Experience
    Lead Software Engineer | ScaleUp Corp
    - Optimized core database queries reducing p99 latency by 45%.
    - Scaled distributed backend infrastructure to serve 500000 active users.
    - Automated deployment pipelines achieving 95% automated test coverage.
    - Decreased cloud infrastructure costs by 30% via automated resource provisioning.

    Education
    B.S. in Computer Science | Stanford University | 2020
  `;
  const perfectResult = evaluateResume(perfectResumeText, '', 'Jordan_Lee.pdf', 1);
  assert.strictEqual(perfectResult.category_scores.impact_quantification, 100);
  assert.strictEqual(perfectResult.weak_bullets.length, 0);
  assert.strictEqual(perfectResult.formatting_issues.length, 0);
  assert.strictEqual(perfectResult.suggestions.length, 0, 'No recommendations when 100% quantified and no formatting issues');
});

test('31. Valid one-page resume PDF parsing, sections, placeholders, and scores', () => {
  const sample = `
Alex Smith
+91 XXXXXXXXXX | your.email@example.com | linkedin.com/in/your-profile | github.com/your-username

PROFESSIONAL SUMMARY
Aspiring Software Engineer seeking an internship role to apply programming knowledge and learn from senior developers.

TECHNICAL SKILLS
Languages: Python, C, C++, Java, JavaScript, TypeScript, SQL
Web Technologies: React, Node.js, Express, HTML/CSS, REST API
Developer Tools: Git

PROJECTS
E-Commerce Web Application — React, Node.js, REST API
• Developed concept for full-stack shopping portal with user authentication.
• Worked with Express REST APIs for data storage.

Task Management System — TypeScript, React
• Built responsive frontend for task tracking.
• Implemented state management using React hooks.

Weather Forecast App — Python, OpenWeather API
• Worked on weather forecasting application with location search.
• Integrated third-party REST APIs for weather updates.

Personal Portfolio Website — HTML/CSS, JavaScript
• Designed mobile-first responsive portfolio website.
• Deployed website with custom domain configuration.

EDUCATION
Bachelor of Technology in Computer Science | XYZ Institute | [Year]
CGPA: [Your CGPA] / 10.0 | Expected Graduation: 202X

HACKATHONS & ACTIVITIES
• Participated in college annual hackathon developing a smart campus concept.
• Member of Computer Science Student Society organizing coding workshops.

CERTIFICATIONS
• Full Stack Web Development Certificate
• Python Programming Specialization
`;

  const result = evaluateResume(sample, '', 'Alex_Smith.pdf', 1);

  // 1. Exactly 14 skills detected
  assert.strictEqual(result.matched_keywords.length, 14, 'Must detect exactly 14 skills');
  assert.ok(result.matched_keywords.includes('Python'));
  assert.ok(result.matched_keywords.includes('C'));
  assert.ok(result.matched_keywords.includes('C++'));
  assert.ok(result.matched_keywords.includes('REST API'));
  assert.ok(result.matched_keywords.includes('HTML5'));
  assert.ok(result.matched_keywords.includes('CSS3'));

  // 2. Summary status of WEAK (not missing) with generic objective comment
  const summarySec = result.section_analysis.find(s => s.section === 'Professional Summary');
  assert.ok(summarySec, 'Summary section analysis must exist');
  assert.strictEqual(summarySec.status, 'weak');
  assert.strictEqual(summarySec.feedback, 'This is a generic objective without skills or achievements.');

  // 3. 4 projects detected
  assert.strictEqual(result.projects_count, 4, 'Must detect 4 projects');
  const projSec = result.section_analysis.find(s => s.section === 'Projects & Portfolio');
  assert.ok(projSec.feedback.includes('4 projects detected'));

  // 4. Education status of WEAK because of placeholders
  const eduSec = result.section_analysis.find(s => s.section === 'Education & Degree');
  assert.ok(eduSec, 'Education section analysis must exist');
  assert.strictEqual(eduSec.status, 'weak');
  assert.ok(eduSec.feedback.includes('Placeholder detected: replace with real details'));

  // 5. Work & Internship Experience status = 'missing' with student advisory note
  const expSec = result.section_analysis.find(s => s.section === 'Work & Internship Experience');
  assert.ok(expSec, 'Experience section analysis must exist');
  assert.strictEqual(expSec.status, 'missing');
  assert.strictEqual(expSec.feedback, 'Optional for students, consider internships or project work');

  // 6. Contact info has placeholders
  const contactSec = result.section_analysis.find(s => s.section === 'Contact Information');
  assert.ok(contactSec, 'Contact section analysis must exist');
  assert.strictEqual(contactSec.status, 'weak');
  assert.ok(contactSec.feedback.includes('Placeholder detected: replace with real details'));

  // 7. Overall score between 50 and 62
  assert.ok(result.overall_score >= 50 && result.overall_score <= 62, `Overall score ${result.overall_score} must be between 50 and 62`);

  // 8. Rewrites generated for weak bullets starting with "Worked on", "Worked with", "Developed ... concept"
  assert.ok(result.weak_bullets.length >= 3, 'Must generate rewrites for non-quantified bullets');
  for (const b of result.weak_bullets) {
    assert.ok(/\[ADD YOUR OWN NUMBER\]/i.test(b.suggestion));
    assert.strictEqual(b.suggestion.endsWith('.'), true);
  }
});

test('32. Heading Variations and Periods in Skills Section: must NOT fail parsing and must detect all sections & skills', () => {
  const resumeWithVariations = `Alex Smith
alex.smith@email.com | +1 555-0199 | linkedin.com/in/alexsmith | github.com/alexsmith

Profile
Senior full-stack engineer with 4+ years of hands-on experience architecting scalable distributed systems and cloud backends.

Core Competencies
Languages: Python, Java, C++, SQL.
Frameworks & Libraries: React, Node.js, Express.js, Tailwind CSS.
Databases: PostgreSQL, MongoDB, Redis.
Cloud & Tools: Docker, Kubernetes, AWS, Git.

Employment History
Senior Software Engineer | Acme Corporation | 2022 - Present
• Designed and deployed 8 cloud microservices using Node.js and Docker, handling 50,000+ daily active users.
• Reduced API response latency by 35% through Redis caching and query indexing in PostgreSQL.
• Led sprint planning and code reviews for a team of 6 engineers.

Personal Projects
Open Source Cloud Monitor | React, Go, Docker
• Built an open-source container monitoring dashboard used by 200+ developers.
• Published 12 REST API endpoints with automated unit testing.

Academic Background
Bachelor of Science in Computer Science | State University | Graduated 2021
GPA: 3.8 / 4.0

Certificates
• AWS Certified Solutions Architect (Associate)
• Certified Kubernetes Administrator (CKA)
`;

  // 1. Section detection
  const sections = extractMajorSections(resumeWithVariations);
  assert.ok(sections.detectedSections.length >= 6, `Expected at least 6 sections detected, got ${sections.detectedSections.length}`);
  const sectionTypes = sections.detectedSections.map(s => s.section);
  assert.ok(sectionTypes.includes('summary'), 'Profile should be recognized as summary');
  assert.ok(sectionTypes.includes('skills'), 'Core Competencies should be recognized as skills');
  assert.ok(sectionTypes.includes('experience'), 'Employment History should be recognized as experience');
  assert.ok(sectionTypes.includes('projects'), 'Personal Projects should be recognized as projects');
  assert.ok(sectionTypes.includes('education'), 'Academic Background should be recognized as education');
  assert.ok(sectionTypes.includes('certifications'), 'Certificates should be recognized as certifications');

  // 2. Skills extraction when lines end with periods
  const skills = detectSkills(resumeWithVariations);
  assert.ok(skills.includes('Python'), 'Python must be detected');
  assert.ok(skills.includes('SQL'), 'SQL must be detected despite trailing period on line');
  assert.ok(skills.includes('PostgreSQL'), 'PostgreSQL must be detected');
  assert.ok(skills.includes('Redis'), 'Redis must be detected despite trailing period on line');
  assert.ok(skills.includes('Docker'), 'Docker must be detected');
  assert.ok(skills.includes('AWS'), 'AWS must be detected despite trailing period on line');
  assert.ok(skills.length >= 12, `Expected at least 12 skills, got ${skills.length}`);

  // 3. evaluateResume must NOT trigger parse failure
  const evalResult = evaluateResume(resumeWithVariations, '', 'Alex_Smith.pdf', 1);
  assert.strictEqual(evalResult.is_parse_failure, false, 'Valid resume with heading variations must NEVER trigger parse failure');
  assert.ok(evalResult.overall_score >= 70, `Overall score should be strong (>= 70), got ${evalResult.overall_score}`);
  assert.strictEqual(evalResult.experience_bullet_count, 3, 'Should count 3 bullets under Employment History');
});

test('33. DOCX Text Extraction: decompresses word/document.xml and extracts formatted text', async () => {
  // Synthesize an in-memory DOCX (ZIP archive containing word/document.xml)
  const zlib = await import('node:zlib');
  const filename = 'word/document.xml';
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Morgan Taylor</w:t></w:r></w:p>
    <w:p><w:r><w:t>morgan@example.com | 555-0100 | linkedin.com/in/morgantaylor</w:t></w:r></w:p>
    <w:p><w:r><w:t>Professional Summary</w:t></w:r></w:p>
    <w:p><w:r><w:t>Experienced Full-Stack Developer with 5 years building scalable web services.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Technical Skills</w:t></w:r></w:p>
    <w:p><w:r><w:t>Languages: Python, JavaScript, TypeScript, Go</w:t></w:r></w:p>
    <w:p><w:r><w:t>Frameworks: React, Express.js, Docker</w:t></w:r></w:p>
    <w:p><w:r><w:t>Work Experience</w:t></w:r></w:p>
    <w:p><w:r><w:t>Lead Developer at FinTech Co (2021 - Present)</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Engineered automated payment reconciliation pipeline processing $5M daily.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Scaled cloud infrastructure on AWS reducing outages by 40%.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Education</w:t></w:r></w:p>
    <w:p><w:r><w:t>B.S. in Computer Engineering, Stanford University, 2020</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  const compressed = zlib.deflateRawSync(Buffer.from(xmlContent, 'utf8'));
  const fnBuf = Buffer.from(filename, 'utf8');

  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8); // method 8 = deflate
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(0, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(xmlContent.length, 22);
  header.writeUInt16LE(fnBuf.length, 26);
  header.writeUInt16LE(0, 28);

  const docxBuffer = Buffer.concat([header, fnBuf, compressed]);

  const extractedDocx = await extractDocxText(docxBuffer.buffer);
  assert.ok(extractedDocx.includes('Morgan Taylor'), 'Extracted DOCX text must contain candidate name');
  assert.ok(extractedDocx.includes('Professional Summary'), 'Must contain section headings');
  assert.ok(extractedDocx.includes('Technical Skills'), 'Must contain Technical Skills');
  assert.ok(extractedDocx.includes('Python'), 'Must contain skills');

  const file = {
    name: 'Morgan_Taylor.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    arrayBuffer: async () => docxBuffer.buffer
  };

  const resumeData = await extractResumeData(file);
  assert.ok(resumeData.text.length > 100, 'extractResumeData must extract complete DOCX text');
  const docxEval = evaluateResume(resumeData.text, '', file.name, 1);
  assert.strictEqual(docxEval.is_parse_failure, false, 'DOCX resume must evaluate cleanly without parse failure');
  assert.ok(docxEval.matched_keywords.includes('Python'));
  assert.ok(docxEval.matched_keywords.includes('React'));
});

test('34. Scanned Image / Corrupt File Guard: returns meaningful error state and does not hallucinate', async () => {
  // Empty or non-text PDF
  const emptyPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46]);
  const file = {
    name: 'Scanned_Receipt.pdf',
    type: 'application/pdf',
    arrayBuffer: async () => emptyPdfBuffer.buffer
  };

  const result = await extractResumeData(file);
  assert.strictEqual(result.text, '', 'Text must be empty when PDF contains no selectable text');
  assert.strictEqual(result.extractionError, 'NO_TEXT_FOUND', 'Must specify NO_TEXT_FOUND error code');
});

test('35. Priya Nair.pdf real reference evaluation: all 7 requirements verified', async () => {
  const pdfPath = 'Priya Nair.pdf';
  if (!fs.existsSync(pdfPath)) return;

  const buf = fs.readFileSync(pdfPath);
  const file = {
    name: 'Priya Nair.pdf',
    type: 'application/pdf',
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  };

  const { text, pageCount } = await extractResumeData(file);
  assert.strictEqual(pageCount, 2, 'Priya Nair PDF measured page count should be 2');
  assert.ok(text.includes('Priya Nair'), 'Extracted text must include candidate name');

  const evalResult = evaluateResume(text, '', file.name, pageCount);

  // 1. Professional Summary = Present (detected as Career Profile)
  const summaryCard = evalResult.section_analysis.find(s => s.section === 'Professional Summary');
  assert.ok(summaryCard, 'Professional Summary card must be present');
  assert.strictEqual(summaryCard.status, 'present', 'Summary status must be present');
  assert.strictEqual(summaryCard.detected_heading, 'Career Profile', 'Detected heading must be Career Profile');
  assert.ok(summaryCard.feedback.includes('Career Profile'), 'Feedback must cite Career Profile');

  // 2. Projects = Exactly 2 (Online Course Marketplace API, Log Analyzer CLI)
  assert.strictEqual(evalResult.projects_count, 2, 'Projects count must be exactly 2');
  const projCard = evalResult.section_analysis.find(s => s.section === 'Projects & Portfolio');
  assert.ok(projCard, 'Projects card must be present');
  assert.strictEqual(projCard.detected_heading, 'Key Projects', 'Detected heading must be Key Projects');
  assert.ok(projCard.feedback.includes('2 projects detected'), 'Feedback must report 2 projects');
  assert.ok(projCard.feedback.includes('Online Course Marketplace API'), 'Feedback must name project 1');
  assert.ok(projCard.feedback.includes('Log Analyzer CLI'), 'Feedback must name project 2');

  // 3. Work Experience = 2 positions
  assert.strictEqual(evalResult.experience_positions_count, 2, 'Experience positions count must be exactly 2');
  assert.strictEqual(evalResult.experience_bullet_count, 6, 'Experience bullets count must be exactly 6');
  const expCard = evalResult.section_analysis.find(s => s.section === 'Work & Internship Experience');
  assert.ok(expCard, 'Experience card must be present');
  assert.strictEqual(expCard.detected_heading, 'Work History', 'Detected heading must be Work History');
  assert.ok(expCard.feedback.includes('2 position(s) detected'), 'Feedback must report 2 positions');

  // 4. Education = Present (detected as Academic Background)
  const eduCard = evalResult.section_analysis.find(s => s.section === 'Education & Degree');
  assert.ok(eduCard, 'Education card must be present');
  assert.strictEqual(eduCard.status, 'present', 'Education status must be present');
  assert.strictEqual(eduCard.detected_heading, 'Academic Background', 'Detected heading must be Academic Background');

  // 5. Certifications = 2
  assert.strictEqual(evalResult.certifications_count, 2, 'Certifications count must be exactly 2');
  const certCard = evalResult.section_analysis.find(s => s.section === 'Certifications');
  assert.ok(certCard, 'Certifications card must be present');
  assert.strictEqual(certCard.detected_heading, 'Certifications', 'Detected heading must be Certifications');
  assert.ok(certCard.feedback.includes('AZ-900'), 'Cert feedback must mention AZ-900');
  assert.ok(certCard.feedback.includes('AZ-204'), 'Cert feedback must mention AZ-204');

  // 6. Technical Skills = extracted from PDF (contains canonical skills like C#, .NET Core, ASP.NET Core, SQL Server, etc.)
  assert.ok(evalResult.matched_keywords.includes('C#'), 'C# must be extracted');
  assert.ok(evalResult.matched_keywords.includes('.NET Core'), '.NET Core must be extracted');
  assert.ok(evalResult.matched_keywords.includes('ASP.NET Core'), 'ASP.NET Core must be extracted');
  assert.ok(evalResult.matched_keywords.includes('SQL Server'), 'SQL Server must be extracted');
  assert.ok(evalResult.matched_keywords.includes('Docker'), 'Docker must be extracted');
  assert.ok(evalResult.matched_keywords.includes('Kubernetes'), 'Kubernetes must be extracted');
  assert.ok(evalResult.matched_keywords.includes('JWT'), 'JWT must be extracted');
  assert.strictEqual(evalResult.matched_keywords.includes('JTW'), false, 'JTW typo must never be present');

  // 7. Missing JD keywords = display prompt for JD
  assert.strictEqual(evalResult.missing_keywords.length, 0, 'Missing keywords must be empty when no JD is provided');
  assert.strictEqual(evalResult.missing_keywords_message, 'Add a job description to see missing keywords');
  assert.strictEqual(evalResult.has_job_description, false, 'has_job_description must be false');
  assert.strictEqual(evalResult.job_specific_matching, false, 'job_specific_matching must be false');
});

test('36. Rahul Sharma.resume.pdf accuracy: 3 projects, 1 cert, achievements separate, N/A keyword match', async () => {
  const pdfPath = fs.existsSync('Rahul Sharma.resume.pdf')
    ? 'Rahul Sharma.resume.pdf'
    : 'C:/Users/Ashirwad Verma/.gemini/antigravity/brain/5cacf15d-dd3e-472e-a59f-1ce6ddf4d718/.user_uploaded/media_1794212022808_03a86142.pdf';

  if (!fs.existsSync(pdfPath)) return;

  const buf = fs.readFileSync(pdfPath);
  const file = {
    name: 'Rahul Sharma.resume.pdf',
    type: 'application/pdf',
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  };

  const { text, pageCount } = await extractResumeData(file);
  assert.strictEqual(pageCount, 2, 'Measured page count must be 2');
  assert.ok(text.includes('Rahul Sharma'), 'Extracted text must include candidate name');

  // Evaluate without Job Description
  const evalResult = evaluateResume(text, '', file.name, pageCount);

  // 1. Projects = Exactly 3 (not 2, page-break across Page 1 & 2 handled)
  assert.strictEqual(evalResult.projects_count, 3, 'Must detect exactly 3 projects');
  const projectTitles = evalResult.extracted_projects.map(p => p.title);
  assert.ok(projectTitles.some(t => t.includes('Personal Portfolio Website')), 'Must detect Personal Portfolio Website');
  assert.ok(projectTitles.some(t => t.includes('Task Management Web App')), 'Must detect Task Management Web App');
  assert.ok(projectTitles.some(t => t.includes('Resume Analyzer Tool')), 'Must detect Resume Analyzer Tool');

  // 2. Certifications = Exactly 1 (Hackathon and Coding Club classified as achievements/activities)
  assert.strictEqual(evalResult.certifications_count, 1, 'Must detect exactly 1 certification');
  assert.ok(evalResult.extracted_certifications[0].includes('Coursera'), 'Certification must be Full Stack Web Development from Coursera');
  assert.ok(!evalResult.extracted_certifications[0].includes('Hackathon'), 'Hackathon must NOT be in certifications');
  assert.ok(!evalResult.extracted_certifications[0].includes('coding club'), 'Coding club must NOT be in certifications');

  // 3. Achievements & Activities classified separately
  assert.ok(evalResult.achievements.some(a => a.includes('Smart India Hackathon')), 'Hackathon must be in achievements');
  assert.ok(evalResult.achievements.some(a => a.includes('coding club')), 'Coding club must be in achievements');
  assert.ok(evalResult.achievements.some(a => a.includes('LeetCode')), 'LeetCode must be in achievements');

  // 4. Experience: 1 position, 3 bullets
  assert.strictEqual(evalResult.experience_positions_count, 1, 'Must detect 1 experience position');
  assert.strictEqual(evalResult.experience_bullet_count, 3, 'Must detect exactly 3 experience bullet points');

  // 5. Sections: Professional Summary and Education detected
  const sumCard = evalResult.section_analysis.find(s => s.section === 'Professional Summary');
  assert.ok(sumCard, 'Summary card must be present');
  assert.strictEqual(sumCard.status, 'present', 'Summary status must be present');

  const eduCard = evalResult.section_analysis.find(s => s.section === 'Education & Degree');
  assert.ok(eduCard, 'Education card must be present');
  assert.strictEqual(eduCard.status, 'present', 'Education status must be present');

  // 6. Job keyword matching when no JD is uploaded
  assert.strictEqual(evalResult.has_job_description, false, 'has_job_description must be false');
  assert.strictEqual(evalResult.job_keyword_match, 'N/A', 'job_keyword_match must be N/A');
  assert.strictEqual(evalResult.keyword_match_display, 'N/A', 'keyword_match_display must be N/A');
  assert.strictEqual(evalResult.missing_keywords.length, 0, 'No missing keywords invented when no JD');
  assert.strictEqual(evalResult.missing_keywords_message, 'Add a job description to see missing keywords');

  // 7. Technical skills extracted separately
  assert.ok(evalResult.matched_keywords.length >= 25, 'Extracted technical skills should be 25+');
  assert.ok(evalResult.matched_keywords.includes('React'), 'React must be detected');
  assert.ok(evalResult.matched_keywords.includes('Node.js'), 'Node.js must be detected');
  assert.ok(evalResult.matched_keywords.includes('Python'), 'Python must be detected');

  // 8. Bullet Rewriting: verified metrics are preserved
  for (const b of evalResult.weak_bullets) {
    assert.ok(!/\d/.test(b.original), 'Original bullet must not contain digits');
  }

  // 9. Formatting: does not automatically recommend 1-page resume
  assert.strictEqual(
    evalResult.suggestions.some(s => s.advice.toLowerCase().includes('condense resume from 2 pages to a single')),
    false,
    'Must not automatically recommend 1 page for this 2-page resume'
  );

  // 10. Evaluate WITH a Job Description
  const targetJd = `Looking for a Software Engineer proficient in React, Node.js, Python, Docker, Kubernetes, and AWS.`;
  const jdResult = evaluateResume(text, targetJd, file.name, pageCount);
  assert.strictEqual(jdResult.has_job_description, true);
  assert.strictEqual(typeof jdResult.job_keyword_match, 'number');
  assert.ok(jdResult.jd_matched_keywords.includes('React'));
  assert.ok(jdResult.jd_matched_keywords.includes('Node.js'));
  assert.ok(jdResult.jd_matched_keywords.includes('Python'));
  assert.ok(jdResult.missing_keywords.includes('Docker'));
  assert.ok(jdResult.missing_keywords.includes('Kubernetes'));
  assert.ok(jdResult.missing_keywords.includes('AWS'));
});






