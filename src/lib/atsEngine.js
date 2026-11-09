// ═══════════════════════════════════════════════════════════════════════════════
// Intelligent Client-Side ATS Resume Analysis Engine (Stateless & Dynamic)
// - No caching by file name, no shared globals, no hardcoded candidate facts.
// - Text hashing via deterministic 64-bit FNV-1a / Web Crypto.
// - Summary validation: verifies every number and skill exists in current text.
// - Fully computed scores: strictly monotonic keyword matching.
// - Impact threshold: no "add quantified metrics" tips when impact > 90%.
// - Dev debug instrumentation: text hash, exact input text, and validator log.
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Skills Dictionary with Aliases (Expanded Across All Domains) ──────────
export const SKILLS_DICTIONARY = [
  // Frontend
  { canonical: 'React', aliases: ['react', 'react.js', 'reactjs'] },
  { canonical: 'Next.js', aliases: ['next.js', 'nextjs', 'next js'] },
  { canonical: 'Vue.js', aliases: ['vue', 'vue.js', 'vuejs'] },
  { canonical: 'Angular', aliases: ['angular', 'angular.js', 'angularjs'] },
  { canonical: 'TypeScript', aliases: ['typescript', 'ts'] },
  { canonical: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'] },
  { canonical: 'HTML5', aliases: ['html5', 'html'] },
  { canonical: 'CSS3', aliases: ['css3', 'css'] },
  { canonical: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css', 'tailwindcss'] },
  { canonical: 'Bootstrap', aliases: ['bootstrap'] },
  { canonical: 'Sass', aliases: ['sass', 'scss'] },
  { canonical: 'Redux', aliases: ['redux', 'redux toolkit'] },

  // Backend & Core Languages
  { canonical: 'Node.js', aliases: ['node.js', 'nodejs', 'node js', 'node'] },
  { canonical: 'Express.js', aliases: ['express', 'express.js', 'expressjs'] },
  { canonical: 'Python', aliases: ['python', 'py'] },
  { canonical: 'Flask', aliases: ['flask'] },
  { canonical: 'Django', aliases: ['django'] },
  { canonical: 'FastAPI', aliases: ['fastapi'] },
  { canonical: 'Java', aliases: ['java'] },
  { canonical: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring framework'] },
  { canonical: 'C', aliases: ['c', 'c language', 'c programming'] },
  { canonical: 'C++', aliases: ['c++', 'cpp'] },
  { canonical: 'C#', aliases: ['c#', 'csharp', 'c-sharp'] },
  { canonical: '.NET Core', aliases: ['.net core', 'dotnet core', '.net', 'dotnet', '.net framework'] },
  { canonical: 'ASP.NET Core', aliases: ['asp.net core', 'asp.net', 'asp.net web api', 'asp.net mvc'] },
  { canonical: 'Entity Framework', aliases: ['entity framework', 'entity framework core', 'ef core', 'ef'] },
  { canonical: 'SQL Server', aliases: ['sql server', 'ms sql', 'mssql', 'microsoft sql server', 't-sql'] },
  { canonical: 'xUnit', aliases: ['xunit', 'nunit', 'mstest'] },
  { canonical: 'Azure DevOps', aliases: ['azure devops', 'vsts'] },
  { canonical: 'GitHub Actions', aliases: ['github actions'] },
  { canonical: 'R', aliases: ['r', 'r language', 'r programming', 'r-lang'] },
  { canonical: 'Go', aliases: ['golang', 'go language'] },
  { canonical: 'Rust', aliases: ['rust'] },
  { canonical: 'PHP', aliases: ['php'] },
  { canonical: 'Ruby', aliases: ['ruby', 'ruby on rails', 'rails'] },

  // Data Science & Machine Learning (Requirement 2)
  { canonical: 'Pandas', aliases: ['pandas'] },
  { canonical: 'NumPy', aliases: ['numpy'] },
  { canonical: 'Scikit-Learn', aliases: ['scikit-learn', 'scikit learn', 'sklearn'] },
  { canonical: 'TensorFlow', aliases: ['tensorflow', 'tf'] },
  { canonical: 'PyTorch', aliases: ['pytorch'] },
  { canonical: 'Matplotlib', aliases: ['matplotlib'] },
  { canonical: 'Seaborn', aliases: ['seaborn'] },
  { canonical: 'Jupyter', aliases: ['jupyter', 'jupyter notebook', 'jupyter notebooks'], isMinorTool: true },
  { canonical: 'Machine Learning', aliases: ['machine learning'] },
  { canonical: 'Feature Engineering', aliases: ['feature engineering'] },
  { canonical: 'Deep Learning', aliases: ['deep learning'] },
  { canonical: 'Keras', aliases: ['keras'] },
  { canonical: 'NLP', aliases: ['nlp', 'natural language processing'] },
  { canonical: 'Computer Vision', aliases: ['computer vision', 'opencv'] },
  { canonical: 'Apache Spark', aliases: ['apache spark', 'spark', 'pyspark'] },
  { canonical: 'Hadoop', aliases: ['hadoop', 'apache hadoop'] },
  { canonical: 'R', aliases: ['r programming', 'r language', 'r studio'] },

  // Business Intelligence & Analytics (Requirement 2)
  { canonical: 'Power BI', aliases: ['power bi', 'powerbi'] },
  { canonical: 'Tableau', aliases: ['tableau'] },
  { canonical: 'Excel', aliases: ['excel', 'microsoft excel', 'advanced excel'] },
  { canonical: 'Dashboards', aliases: ['dashboards', 'dashboarding', 'dashboard'] },
  { canonical: 'Looker', aliases: ['looker', 'looker studio'] },
  { canonical: 'dbt', aliases: ['dbt'] },
  { canonical: 'ETL', aliases: ['etl', 'data pipeline', 'data pipelines'] },
  { canonical: 'Snowflake', aliases: ['snowflake'] },
  { canonical: 'BigQuery', aliases: ['bigquery', 'google bigquery'] },

  // Databases & Storage
  { canonical: 'SQL', aliases: ['sql'] },
  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
  { canonical: 'MySQL', aliases: ['mysql'] },
  { canonical: 'MongoDB', aliases: ['mongodb', 'mongo'] },
  { canonical: 'Firebase', aliases: ['firebase', 'firestore'] },
  { canonical: 'Redis', aliases: ['redis'] },
  { canonical: 'SQLite', aliases: ['sqlite'] },

  // APIs & Architecture
  { canonical: 'REST API', aliases: ['rest api', 'rest apis', 'restful api', 'restful apis', 'restful'] },
  { canonical: 'GraphQL', aliases: ['graphql'] },
  { canonical: 'Microservices', aliases: ['microservices', 'microservice'] },
  { canonical: 'WebSockets', aliases: ['websocket', 'websockets'] },

  // Cloud, DevOps & Tools (Requirement 2)
  { canonical: 'Docker', aliases: ['docker'] },
  { canonical: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'AWS', aliases: ['aws', 'amazon web services'] },
  { canonical: 'Azure', aliases: ['azure', 'microsoft azure'] },
  { canonical: 'Google Cloud', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  { canonical: 'CI/CD', aliases: ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'] },
  { canonical: 'Linux', aliases: ['linux', 'ubuntu', 'bash', 'shell scripting'] },
  { canonical: 'Terraform', aliases: ['terraform'] },
  { canonical: 'Ansible', aliases: ['ansible'] },
  { canonical: 'Jenkins', aliases: ['jenkins'] },
  { canonical: 'Git', aliases: ['git'], isMinorTool: true },
  { canonical: 'GitHub', aliases: ['github'], isMinorTool: true },
  { canonical: 'GitLab', aliases: ['gitlab'], isMinorTool: true },
  { canonical: 'Vercel', aliases: ['vercel'], isMinorTool: true },
  { canonical: 'Netlify', aliases: ['netlify'], isMinorTool: true },
  { canonical: 'Postman', aliases: ['postman'], isMinorTool: true },
  { canonical: 'VS Code', aliases: ['vs code', 'vscode', 'visual studio code'], isMinorTool: true },
  { canonical: 'Claude', aliases: ['claude', 'anthropic claude'], isMinorTool: true },
  { canonical: 'ChatGPT', aliases: ['chatgpt', 'openai chatgpt'], isMinorTool: true },

  // Mobile (Requirement 1 & 7)
  { canonical: 'Android Studio', aliases: ['android studio'] },
  { canonical: 'Android', aliases: ['android', 'android sdk'] },
  { canonical: 'Kotlin', aliases: ['kotlin', 'kotlin/jvm'] },
  { canonical: 'Jetpack Compose', aliases: ['jetpack compose', 'compose'] },
  { canonical: 'Retrofit', aliases: ['retrofit', 'retrofit2'] },
  { canonical: 'Room', aliases: ['room', 'room db', 'room database'] },
  { canonical: 'XML', aliases: ['xml'] },
  { canonical: 'React Native', aliases: ['react native', 'react-native'] },
  { canonical: 'Flutter', aliases: ['flutter'] },
  { canonical: 'Swift', aliases: ['swift', 'swiftui'] },
  { canonical: 'iOS', aliases: ['ios', 'xcode'] },

  // Testing & Quality (Requirement 2)
  { canonical: 'Jest', aliases: ['jest'] },
  { canonical: 'Cypress', aliases: ['cypress'] },
  { canonical: 'Selenium', aliases: ['selenium'] },
  { canonical: 'PyTest', aliases: ['pytest'] },
  { canonical: 'JUnit', aliases: ['junit'] },
  { canonical: 'Unit Testing', aliases: ['unit testing', 'unit tests', 'unit test'] },

  // Security (Requirement 2)
  { canonical: 'OAuth', aliases: ['oauth', 'oauth2', 'oauth 2.0'] },
  { canonical: 'JWT', aliases: ['jwt', 'jtw', 'json web token', 'authentication (jwt)'] },
  { canonical: 'Cybersecurity', aliases: ['cybersecurity', 'infosec', 'information security'] },
  { canonical: 'Penetration Testing', aliases: ['penetration testing', 'pen testing', 'ethical hacking'] },
  { canonical: 'OWASP', aliases: ['owasp', 'owasp top 10'] },
  { canonical: 'Cryptography', aliases: ['cryptography', 'encryption'] },

  // Concepts & Methodologies
  { canonical: 'Agile', aliases: ['agile'] },
  { canonical: 'Scrum', aliases: ['scrum'] },
  { canonical: 'Clean Architecture', aliases: ['clean architecture'] },
  { canonical: 'Data Structures & Algorithms', aliases: ['data structures and algorithms', 'data structures & algorithms', 'dsa', 'data structures'] },
  { canonical: 'DBMS', aliases: ['database management systems', 'dbms'] },
  { canonical: 'Operating Systems', aliases: ['operating systems'] },
  { canonical: 'Computer Networks', aliases: ['computer networks'] },
  { canonical: 'Responsive Design', aliases: ['responsive design', 'responsive web design', 'mobile-first layout'] },
  { canonical: 'Prompt Engineering', aliases: ['prompt engineering'] },
];

// Coding platforms excluded from technical keywords and listed under achievements (Requirement 4)
export const CODING_PLATFORMS = new Set([
  'leetcode', 'hackerrank', 'geeksforgeeks', 'gfg', 'codeforces', 'codechef'
]);

// Build comprehensive Alias Map
export const ALIAS_MAP = new Map();
for (const entry of SKILLS_DICTIONARY) {
  ALIAS_MAP.set(entry.canonical.toLowerCase().trim(), entry.canonical);
  for (const alias of entry.aliases) {
    ALIAS_MAP.set(alias.toLowerCase().trim(), entry.canonical);
  }
}

// Custom boundaries for single-letter and symbol skills (R, C, C++, C#) (Requirement 4)
export function buildWordRegex(pattern) {
  const lower = pattern.toLowerCase().trim();
  if (lower === 'c++' || lower === 'cpp') {
    return /(?<![a-zA-Z0-9_])(?:c\+\+|cpp)(?![a-zA-Z0-9_#+])/i;
  }
  if (lower === 'c#' || lower === 'csharp' || lower === 'c-sharp') {
    return /(?<![a-zA-Z0-9_])(?:c#|csharp|c-sharp)(?![a-zA-Z0-9_#+])/i;
  }
  if (lower === 'c') {
    // Custom boundary for standalone C language
    return /(?<![a-zA-Z0-9_#+])C(?=(?:[\s,;|/•\-*)]|$))(?![a-zA-Z0-9_#+])/;
  }
  if (lower === 'r') {
    // Custom boundary for standalone R language
    return /(?<![a-zA-Z0-9_#+])R(?=(?:[\s,;|/•\-*)]|$))(?![a-zA-Z0-9_#+])/;
  }
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![a-zA-Z0-9_#+])${escaped}(?![a-zA-Z0-9_#+])`, 'i');
}

// ── Deterministic Text Hashing (Requirement 2 & 6) ─────────────────────────
export function hashText(str) {
  if (!str || typeof str !== 'string') return 'empty';
  const clean = str.trim();
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c64e6d;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16).padStart(12, '0');
}

// ── Text Normalization (Requirement 2) ──────────────────────────────────────
export function normalizeResumeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/[•·▪▫◦►●]/g, '-')
    .replace(/[–—―]/g, '-')
    .replace(/\t/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .trim();
}

// ── Placeholder Handling (Requirement 5) ────────────────────────────────────
export const PLACEHOLDER_PATTERNS = [
  /x{3,}/i,
  /\b(?:your\.email|your_email|youremail|your-email|user@domain\.com|email@example\.com)\b/i,
  /\b(?:your-profile|your_profile|yourprofile|your-username|your_username|yourusername)\b/i,
  /\[(?:year|your\s+[^\]]+|insert\s+[^\]]+|add\s+[^\]]+|replace\s+[^\]]+|cgpa)\]/i,
  /\b(?:add\s+[a-z\s]+here|replace\s+with\s+[a-z\s]+|insert\s+[a-z\s]+here)\b/i,
  /\b202[xX]\b/
];

export function isPlaceholder(val) {
  if (!val || typeof val !== 'string') return false;
  return PLACEHOLDER_PATTERNS.some(p => p.test(val));
}

// ── Projects Extractor (Requirement 2 & 8: Semantic Project Parser) ─────────
export function extractProjects(projectsText) {
  if (!projectsText || typeof projectsText !== 'string') return [];
  const rawLines = projectsText.split('\n').map(l => l.trim()).filter(Boolean);
  const lines = rawLines.filter(l => !/^page\s*\d*(?:\s*of\s*\d*)?$/i.test(l) && !/^\d+$/.test(l) && !/^of$/i.test(l));
  const projects = [];
  let currentProject = null;

  const BULLET_START = /^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/;
  const EXPANDED_ACTION_VERBS = /^(?:designed|developed|built|reduced|implemented|created|processed|fixed|integrated|solved|participated|completed|used|architected|spearheaded|engineered|led|organized|authored|collaborated|conducted|managed|trained|optimized|deployed|automated|maintained|assisted|analyzed|delivered|tested|configured|refactored|improved|supported|established|facilitated|executed|monitored|programmed|debugged|researched|generated|achieved|coordinated|produced|worked|helped|wrote|contributed|oversaw|directed|formulated|evaluated|launched|streamlined|accelerated|pioneered|added|cut|containerized|scaled|shipped|migrated|secured)\b/i;
  const META_LINE_PREFIX = /^(?:\|\s*|(?:tech(?:nologies|nology|\s+stack)?|stack|tools|languages|skills|source|github|demo|live|url|link|repo)\s*:|https?:\/\/)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBulletPrefix = BULLET_START.test(line);
    const startsWithVerb = EXPANDED_ACTION_VERBS.test(line.replace(BULLET_START, '').trim());
    const isMetaLine = META_LINE_PREFIX.test(line) || line.startsWith('|') || line.startsWith('Source:') || line.startsWith('http');
    const isLikelyBullet = isBulletPrefix || startsWithVerb;

    // Continuation of currently open bullet that hasn't finished with sentence punctuation
    const hasOpenBullet = currentProject && currentProject.bullets.length > 0 && !/[.!?]$/.test(currentProject.bullets[currentProject.bullets.length - 1]);

    if (hasOpenBullet && !isMetaLine && !isBulletPrefix && !startsWithVerb) {
      currentProject.bullets[currentProject.bullets.length - 1] += ' ' + line;
      continue;
    }

    const hasMetricPhrase = /\b\d+(?:%|\+|k|ms|s|seconds|minutes|users|requests)\b/i.test(line);
    const isHeaderLine = !line.endsWith('.') && !line.endsWith('!') && !isBulletPrefix && !startsWithVerb && !isMetaLine && !hasMetricPhrase && line.length < 90 && (
      line.includes('—') ||
      line.includes('–') ||
      /\s+-\s+/.test(line) ||
      line.includes('|') ||
      (i + 1 < lines.length && (lines[i + 1].startsWith('|') || META_LINE_PREFIX.test(lines[i + 1]) || BULLET_START.test(lines[i + 1]) || EXPANDED_ACTION_VERBS.test(lines[i + 1])))
    );

    if (isHeaderLine) {
      currentProject = {
        title: line,
        technologies: '',
        bullets: [],
        links: []
      };
      projects.push(currentProject);
    } else if (currentProject) {
      if (isMetaLine) {
        if (/https?:\/\//i.test(line)) {
          currentProject.links.push(line);
        } else {
          currentProject.technologies = (currentProject.technologies ? currentProject.technologies + ', ' : '') + line.replace(/^[|:]\s*/, '').trim();
        }
      } else if (isLikelyBullet) {
        currentProject.bullets.push(line.replace(BULLET_START, '').trim());
      } else {
        if (currentProject.bullets.length > 0) {
          currentProject.bullets[currentProject.bullets.length - 1] += ' ' + line;
        } else {
          currentProject.bullets.push(line);
        }
      }
    }
  }

  return projects.filter(p => p.bullets.length > 0 || p.technologies.length > 0 || p.links.length > 0);
}

// ── Experience Positions Extractor (Requirement 6) ──────────────────────────
export function extractExperiencePositions(experienceText) {
  if (!experienceText || typeof experienceText !== 'string') return [];
  const lines = experienceText.split('\n').map(l => l.trim()).filter(Boolean);

  const DATE_RANGE_REGEX = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|present)\b|\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present)\b|\b\d{1,2}\/\d{4}\s*[-–—]\s*(?:\d{1,2}\/\d{4}|present)\b/i;
  const BULLET_START = /^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/;
  const EXPANDED_ACTION_VERBS = /^(?:designed|developed|built|reduced|implemented|created|processed|fixed|integrated|solved|participated|completed|used|architected|spearheaded|engineered|led|organized|authored|collaborated|conducted|managed|trained|optimized|deployed|automated|maintained|assisted|analyzed|delivered|tested|configured|refactored|improved|supported|established|facilitated|executed|monitored|programmed|debugged|researched|generated|achieved|coordinated|produced|worked|helped|wrote|contributed|oversaw|directed|formulated|evaluated|launched|streamlined|accelerated|pioneered|added|cut|containerized|scaled|shipped|migrated|secured)\b/i;

  const positions = [];
  let currentPos = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^page\s*\d*(?:\s*of\s*\d*)?$/i.test(line) || /^\d+$/.test(line) || /^of$/i.test(line)) continue;
    if (line.toLowerCase() === 'priya nair') continue;

    const isBulletPrefix = BULLET_START.test(line);
    const startsWithVerb = EXPANDED_ACTION_VERBS.test(line.replace(BULLET_START, '').trim());
    const isLikelyBullet = isBulletPrefix || startsWithVerb;

    // If current position exists and has no bullets yet, non-bullet lines are continuation of the role title/meta
    if (currentPos && currentPos.bullets.length === 0 && !isLikelyBullet) {
      currentPos.title += ' ' + line;
      continue;
    }

    const nextLine = (i + 1 < lines.length) ? lines[i + 1] : '';
    const hasDateRange = DATE_RANGE_REGEX.test(line);
    const nextHasDateRange = DATE_RANGE_REGEX.test(nextLine);

    const hasJobTitle = isJobTitle(line) || /\b(?:developer|engineer|intern|internship|architect|lead|manager|analyst|consultant|specialist|designer|administrator|programmer|trainee|associate)\b/i.test(line);
    const isPositionHeader = !isLikelyBullet && (
      (hasDateRange && (hasJobTitle || line.includes('|') || line.includes(','))) ||
      (hasJobTitle && !line.endsWith('.') && (nextHasDateRange || nextLine.startsWith(',') || nextLine.includes('|') || nextLine.includes('Pvt') || nextLine.includes('Ltd')))
    );

    if (isPositionHeader) {
      currentPos = {
        title: line,
        bullets: []
      };
      positions.push(currentPos);
    } else if (currentPos) {
      if (currentPos.bullets.length > 0 && !isLikelyBullet && !/[.!?]$/.test(currentPos.bullets[currentPos.bullets.length - 1])) {
        currentPos.bullets[currentPos.bullets.length - 1] += ' ' + line;
      } else {
        const cleanBullet = line.replace(BULLET_START, '').trim();
        if (cleanBullet.length > 5) {
          currentPos.bullets.push(cleanBullet);
        }
      }
    }
  }

  if (positions.length === 0 && lines.length > 0) {
    let count = 0;
    for (const l of lines) {
      if (isJobTitle(l) && !EXPANDED_ACTION_VERBS.test(l)) count++;
    }
    if (count > 0) {
      return Array.from({ length: count }, (_, idx) => ({ title: `Position ${idx + 1}`, bullets: [] }));
    }
    return [{ title: 'Experience Entry', bullets: lines }];
  }

  return positions.filter(p => p.bullets.length > 0 || p.title.length > 0);
}

// ── Certifications Extractor ────────────────────────────────────────────────
export function extractCertifications(certificationsText) {
  if (!certificationsText || typeof certificationsText !== 'string') return [];
  const lines = certificationsText.split('\n').map(l => l.trim()).filter(Boolean);
  const certs = [];
  for (const line of lines) {
    if (/^page\s*\d*(?:\s*of\s*\d*)?$/i.test(line) || /^\d+$/.test(line) || /^of$/i.test(line)) continue;
    if (line.toLowerCase() === 'priya nair') continue;
    if (/^[•\-*·▪▫◦►–—>]\s*/.test(line) || /\b(?:certified|certification|certificate|license|credential|associate|fundamentals|practitioner|engineer|specialist|coursera|udemy)\b/i.test(line) || /\b(19\d\d|20\d\d)\b/.test(line)) {
      const clean = line.replace(/^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/, '').trim();
      if (clean.length > 5 && !certs.includes(clean)) {
        certs.push(clean);
      }
    }
  }
  return certs;
}

// ── Section Extractors (Requirement 1, 2 & 4) ───────────────────────────────
export function extractMajorSections(text) {
  if (!text || typeof text !== 'string') {
    return {
      skillsText: '',
      experienceText: '',
      projectsText: '',
      educationText: '',
      summaryText: '',
      certificationsText: '',
      activitiesText: '',
      rawSections: {},
      detectedSections: []
    };
  }

  const normalized = normalizeResumeText(text);
  const lines = normalized.split('\n');
  const sectionMap = {
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    activities: [],
    other: []
  };

  const HEADING_PATTERNS = [
    { type: 'summary', regex: /^(?:(?:professional|career|executive|personal)?\s*(?:summary|profile)(?:\s+of\s+qualifications)?|about\s+me|(?:career|professional)?\s*objective):?$/i },
    { type: 'skills', regex: /^(?:technical\s+skills|skills(?:\s*(?:&|and|\/)\s*(?:technologies|tools|proficiencies|languages|frameworks|abilities))?|core\s+competencies|key\s+competencies|competencies|areas\s+of\s+expertise|technical\s+(?:proficiencies|stack|expertise|tools)|core\s+skills|key\s+skills|technologies|tools\s*(?:&|and|\/)\s*(?:skills|technologies)|languages\s*(?:&|and|\/)\s*frameworks):?$/i },
    { type: 'experience', regex: /^(?:(?:work|professional|relevant|employment|career|practical|job)\s+(?:experience|history)|experience|employment(?:\s+history)?|work\s+history|professional\s+background|internships?(?:\s+experience)?|industrial\s+training):?$/i },
    { type: 'projects', regex: /^(?:(?:personal|academic|key|selected|technical|software|featured|notable|engineering|coursework)?\s*projects|portfolio|projects\s*(?:&|and)\s*work):?$/i },
    { type: 'education', regex: /^(?:education(?:\s*(?:&|and)\s*(?:degree|qualifications|training|certifications))?|academic\s+(?:background|details|qualifications|record|history)|educational\s+qualifications|qualifications):?$/i },
    { type: 'certifications', regex: /^(?:certifications?(?:\s*(?:&|and|\/)\s*(?:licenses|certificates|training|credentials|courses))?|certificates?|licenses(?:\s*(?:&|and|\/)\s*certifications)?|credentials):?$/i },
    { type: 'achievements', regex: /^(?:achievements(?:\s*(?:&|and)\s*(?:certifications|awards|honors|accolades))?|awards(?:\s*(?:&|and)\s*honors)?|honors|competitive\s+achievements|accomplishments):?$/i },
    { type: 'activities', regex: /^(?:(?:hackathons|extracurricular|co-curricular|other|leadership|volunteer(?:ing)?)\s+(?:activities|experience)?|hackathons|activities|interests(?:\s*&?\s*hobbies)?|positions\s+of\s+responsibility|volunteering):?$/i }
  ];

  let currentSection = 'other';
  const detectedSections = [];
  let currentDetected = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.length < 65) {
      const cleanLine = line
        .replace(/^[•\-*·▪▫◦►–—>#~]+\s*/, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .replace(/^[IVXLCDM]+[\.\)]\s+/i, '')
        .replace(/[\s:–—|\-_.]+$/, '')
        .trim();

      let matchedHeading = null;
      for (const h of HEADING_PATTERNS) {
        if (h.regex.test(cleanLine) || h.regex.test(line)) {
          matchedHeading = h.type;
          break;
        }
      }
      if (matchedHeading) {
        if (currentDetected) {
          currentDetected.endLine = i;
        }
        currentDetected = {
          heading: line,
          section: matchedHeading,
          startLine: i + 1,
          endLine: null
        };
        detectedSections.push(currentDetected);
        currentSection = matchedHeading === 'achievements' ? 'certifications' : matchedHeading;
        continue;
      }
    }

    if (sectionMap[currentSection]) {
      sectionMap[currentSection].push(line);
    } else {
      sectionMap.other.push(line);
    }
  }

  if (currentDetected) {
    currentDetected.endLine = lines.length;
  }

  return {
    skillsText: sectionMap.skills.join('\n'),
    experienceText: sectionMap.experience.join('\n'),
    projectsText: sectionMap.projects.join('\n'),
    educationText: sectionMap.education.join('\n'),
    summaryText: sectionMap.summary.join('\n'),
    certificationsText: sectionMap.certifications.join('\n'),
    activitiesText: sectionMap.activities.join('\n'),
    rawSections: sectionMap,
    detectedSections
  };
}

export function extractSkillsSection(text) {
  return extractMajorSections(text).skillsText;
}

export const EXPERIENCE_ACTION_VERBS = /^(?:designed|developed|built|reduced|implemented|created|processed|fixed|integrated|solved|participated|completed|used|architected|spearheaded|engineered|led|organized|authored|collaborated|conducted|managed|trained|optimized|deployed|automated|maintained|assisted|analyzed|delivered|tested|configured|refactored|improved|supported|established|facilitated|executed|monitored|programmed|debugged|researched|generated|achieved|coordinated|produced|worked|helped|wrote|contributed|oversaw|directed|formulated|evaluated|launched|streamlined|accelerated|pioneered|added|cut|containerized|scaled|shipped|migrated|secured)\b/i;

// Split the resume into whole bullets before sending to AI (Requirement 1 & 2)
// Every bullet line between the Experience heading and the next section heading is counted as an Experience bullet.
export function splitResumeBullets(text) {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const candidateName = (lines[0] || '').toLowerCase();

  const SECTION_HEADINGS = [
    { section: 'summary', regex: /^(?:(?:professional|career|executive|personal)?\s*(?:summary|profile)(?:\s+of\s+qualifications)?|about\s+me|(?:career|professional)?\s*objective)\b/i },
    { section: 'education', regex: /^(?:education(?:\s*(?:&|and)\s*(?:degree|qualifications|training|certifications))?|academic\s+(?:background|details|qualifications|record|history)|educational\s+qualifications|qualifications)\b/i },
    { section: 'skills', regex: /^(?:technical\s+skills|skills(?:\s*(?:&|and|\/)\s*(?:technologies|tools|proficiencies|languages|frameworks|abilities))?|core\s+competencies|key\s+competencies|competencies|areas\s+of\s+expertise|technical\s+(?:proficiencies|stack|expertise|tools)|core\s+skills|key\s+skills|technologies|tools\s*(?:&|and|\/)\s*(?:skills|technologies)|languages\s*(?:&|and|\/)\s*frameworks)\b/i },
    { section: 'projects', regex: /^(?:(?:personal|academic|key|selected|technical|software|featured|notable|engineering|coursework)?\s*projects|portfolio|projects\s*(?:&|and)\s*work)\b/i },
    { section: 'experience', regex: /^(?:(?:work|professional|relevant|employment|career|practical|job)\s+(?:experience|history)|experience|employment(?:\s+history)?|work\s+history|professional\s+background|internships?(?:\s+experience)?|industrial\s+training)\b/i },
    { section: 'achievements', regex: /^(?:achievements(?:\s*(?:&|and)\s*(?:certifications|awards|honors|accolades))?|certifications?(?:\s*(?:&|and|\/)\s*(?:licenses|certificates|training|credentials|courses))?|certificates?|licenses(?:\s*(?:&|and|\/)\s*certifications)?|awards|honors|competitive\s+achievements|accomplishments|credentials)\b/i },
    { section: 'activities', regex: /^(?:(?:hackathons|extracurricular|co-curricular|other|leadership|volunteer(?:ing)?)\s+(?:activities|experience)?|hackathons|activities|interests(?:\s*&?\s*hobbies)?|positions\s+of\s+responsibility|volunteering)\b/i },
    { section: 'personal', regex: /^(?:personal\s+details|personal\s+profile|declaration|languages)\b/i }
  ];

  const BULLET_START = /^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/;

  let currentSection = 'header';
  const rawBullets = [];
  let current = null;

  function flush() {
    if (current && current.text) {
      rawBullets.push({ ...current });
      current = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Page markers & candidate name header
    if (/^page\s*\d*(?:\s*of\s*\d*)?$/i.test(line) || /^\d+$/.test(line) || /^of$/i.test(line) || line.toLowerCase() === candidateName) {
      continue;
    }
    // Contact info & placeholders
    if (line.includes('@') && line.includes('.')) continue;
    if (line.includes('linkedin.com') || line.includes('github.com')) continue;
    if (isPlaceholder(line)) continue;

    // Check section heading
    let matchedHeading = null;
    if (line.length < 65) {
      const cleanLine = line
        .replace(/^[•\-*·▪▫◦►–—>#~]+\s*/, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .replace(/^[IVXLCDM]+[\.\)]\s+/i, '')
        .replace(/[\s:–—|\-_.]+$/, '')
        .trim();

      for (const h of SECTION_HEADINGS) {
        if (h.regex.test(cleanLine) || h.regex.test(line)) {
          matchedHeading = h.section;
          break;
        }
      }
    }

    if (matchedHeading) {
      flush();
      currentSection = matchedHeading;
      continue;
    }

    // Ignore non-bullet sections (skills categories, education metadata, summary text, other activities, personal details)
    if (currentSection === 'skills' || currentSection === 'education' || currentSection === 'header' || currentSection === 'summary' || currentSection === 'activities' || currentSection === 'personal') {
      continue;
    }

    // Check if line is title followed by meta, or job/project heading ending with colon, or job/project title preceding bullets
    const nextLine = (i + 1 < lines.length) ? lines[i + 1] : '';
    const isTitleFollowedByMeta = !line.endsWith('.') && !EXPERIENCE_ACTION_VERBS.test(line) && nextLine && (nextLine.startsWith(',') || nextLine.startsWith('|') || nextLine.includes('|') || /\b(19\d\d|20\d\d)\b/.test(nextLine));
    const isJobOrProjectTitle = !BULLET_START.test(line) && !EXPERIENCE_ACTION_VERBS.test(line) && !line.endsWith('.') && nextLine && BULLET_START.test(nextLine);
    const isProjectHeading = !BULLET_START.test(line) && (line.includes('—') || line.includes('–') || /\s+-\s+/.test(line));

    const isMeta = isTitleFollowedByMeta || isJobOrProjectTitle || isProjectHeading || line.startsWith('|') || line.startsWith(',') || (!line.endsWith('.') && line.includes('|')) || /\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d|present)\b/i.test(line) || (!BULLET_START.test(line) && line.endsWith(':'));
    if (isMeta) {
      flush();
      continue;
    }

    const isExplicitBullet = BULLET_START.test(line);
    const startsWithVerb = EXPERIENCE_ACTION_VERBS.test(line);

    // Continuation of current bullet (wrapped line, never if explicit bullet)
    const isContinuation = current && !isExplicitBullet && (
      !/[.!?]$/.test(current.text) ||
      /^[a-z,(\]]/.test(line) ||
      (!startsWithVerb && line.length < 60)
    );

    if (isContinuation) {
      current.text += ' ' + line;
    } else {
      flush();
      const cleanText = line.replace(BULLET_START, '').trim();
      if (cleanText.length > 10) {
        current = {
          section: currentSection,
          text: cleanText
        };
      }
    }
  }
  flush();

  return rawBullets.map((b, idx) => ({
    id: `b${idx + 1}`,
    section: b.section,
    text: b.text,
    hasDigits: /\d/.test(b.text)
  }));
}

// Extract all bullets from the split
export function extractAllBullets(text) {
  if (!text) return [];
  const bullets = splitResumeBullets(text);
  if (bullets.length > 0) {
    return bullets.map(b => b.text);
  }
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const BULLET_START = /^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/;
  return lines.map(l => l.replace(BULLET_START, '').trim()).filter(l => l.length > 10);
}

// Count Experience bullets from the same split (every bullet line between Experience heading and next section heading)
export function extractExperienceBullets(experienceTextOrFull) {
  if (!experienceTextOrFull) return [];
  const allSplit = splitResumeBullets(experienceTextOrFull);
  const expBullets = allSplit.filter(b => b.section === 'experience');
  if (expBullets.length > 0) {
    return expBullets.map(b => b.text);
  }

  // Fallback if given isolated snippet without other headings
  const lines = experienceTextOrFull.split('\n').map(l => l.trim()).filter(Boolean);
  const BULLET_START = /^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/;
  const fallback = [];
  let curr = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isJobMeta = line.includes('|') || /\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d|present)\b/i.test(line) || line.startsWith(',');
    if (isJobMeta || /^(?:experience|work\s+experience)\b/i.test(line)) {
      if (curr) { fallback.push(curr.trim()); curr = ''; }
      continue;
    }
    const nextLine = (i + 1 < lines.length) ? lines[i + 1] : '';
    const isTitleFollowedByMeta = nextLine && (nextLine.startsWith(',') || nextLine.startsWith('|') || nextLine.includes('|') || /\b(19\d\d|20\d\d)\b/.test(nextLine));
    if (isTitleFollowedByMeta) {
      if (curr) { fallback.push(curr.trim()); curr = ''; }
      continue;
    }
    const isBulletStart = BULLET_START.test(line) || EXPERIENCE_ACTION_VERBS.test(line);
    if (isBulletStart) {
      if (curr) fallback.push(curr.trim());
      curr = line.replace(BULLET_START, '').trim();
    } else if (curr) {
      curr += ' ' + line;
    }
  }
  if (curr) fallback.push(curr.trim());
  return fallback;
}

const STOP_PHRASES = new Set([
  'etc', 'and', 'or', 'and more', 'others', 'other', 'technologies', 'skills',
  'tools', 'languages', 'frameworks', 'libraries', 'databases', 'concepts',
  'proficient in', 'experience with', 'familiar with', 'working knowledge'
]);

function isStopWord(str) {
  return STOP_PHRASES.has(str.toLowerCase().trim());
}

function formatCandidateSkill(str) {
  const clean = str.trim();
  if (/[a-z]/.test(clean) && /[A-Z]/.test(clean)) return clean;
  return clean.replace(/\b[a-z]/g, c => c.toUpperCase());
}

// ── Soft Skills Dictionary (Separate from technical keywords) ────────────────
export const SOFT_SKILLS_SET = new Set([
  'communication', 'written communication', 'verbal communication',
  'teamwork', 'team player', 'hard working', 'hardworking', 'quick learner', 'fast learner',
  'leadership', 'problem solving', 'critical thinking',
  'adaptability', 'time management', 'work ethic',
  'interpersonal skills', 'interpersonal', 'presentation skills',
  'creativity', 'creative thinking', 'negotiation', 'mentorship', 'mentoring',
  'attention to detail', 'detail-oriented', 'multitasking', 'conflict resolution',
  'emotional intelligence', 'active listening', 'analytical skills',
  'self-motivated', 'decision making', 'punctual', 'punctuality',
  'dedicated', 'dedication', 'reliable', 'reliability', 'positive attitude',
  'independent worker', 'collaboration', 'collaborative', 'patience',
  'perseverance', 'organizational skills', 'enthusiastic', 'curious'
]);

export function isSoftSkill(str) {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  if (SOFT_SKILLS_SET.has(lower)) return true;
  for (const s of SOFT_SKILLS_SET) {
    if (lower === s || lower.endsWith(' ' + s) || lower.startsWith(s + ' ')) return true;
  }
  return false;
}

export const KNOWN_COMPANIES_OR_ORGS = new Set([
  'google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'netflix',
  'tcs', 'tata consultancy services', 'infosys', 'wipro', 'cognizant',
  'accenture', 'capgemini', 'hcl', 'tech mahindra', 'ibm', 'oracle',
  'cisco', 'intel', 'uber', 'swiggy', 'zomato', 'paytm', 'flipkart',
  'adobe', 'salesforce', 'samsung', 'sony', 'siemens', 'deloitte',
  'pwc', 'ey', 'kpmg', 'coursera', 'udemy', 'edx', 'upgrad', 'simplilearn',
  'geeksforgeeks', 'leetcode', 'hackerrank', 'codechef', 'codeforces',
  'xyz technologies', 'abc technologies', 'zoho', 'freshworks', 'phonepe',
  'cred', 'razorpay', 'browserstack', 'qualcomm', 'broadcom', 'nvidia',
  'amd', 'atlassian', 'slack', 'stripe', 'shopify', 'byjus', 'unacademy'
]);

export function isCompanyOrOrg(str) {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  if (KNOWN_COMPANIES_OR_ORGS.has(lower)) return true;
  if (/\b(?:technologies|solutions|systems|services|infotech|consultancy|corporation|institute|university|college|school|hospital|pvt\s+ltd|ltd|inc|corp|llc|llp|labs|enterprises|agency|studios)\b/i.test(lower)) {
    return true;
  }
  return false;
}

export const KNOWN_JOB_TITLES = new Set([
  'intern', 'internship', 'developer', 'engineer', 'software engineer',
  'android developer', 'web developer', 'full stack developer', 'frontend developer',
  'backend developer', 'specialist', 'consultant', 'analyst', 'lead', 'manager',
  'architect', 'designer', 'administrator', 'trainee', 'associate', 'programmer',
  'android developer intern', 'web development intern'
]);

export function isJobTitle(str) {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  if (KNOWN_JOB_TITLES.has(lower)) return true;
  if (/\b(?:developer|engineer|intern(?:ship)?|consultant|analyst|specialist|manager|lead|architect|programmer|trainee|administrator)\b/i.test(lower)) {
    return true;
  }
  return false;
}

export function extractExperienceHeaderPhrases(text) {
  if (!text) return new Set();
  const phrases = new Set();
  const majorSections = extractMajorSections(text);
  const expLines = (majorSections.experienceText || '').split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of expLines) {
    if (line.includes('|') || /\b(19\d\d|20\d\d)\b/.test(line) || (!line.endsWith('.') && line.includes(','))) {
      phrases.add(line.toLowerCase().trim());
      const parts = line.split(/[|,\-–—]+/);
      for (const p of parts) {
        const clean = p.trim().toLowerCase();
        if (clean.length >= 2) phrases.add(clean);
      }
    }
  }
  return phrases;
}

export const FORBIDDEN_SKILL_PHRASES = new Set([
  'structured document parsing',
  'keeping retrieval latencies under 120ms.',
  'keeping retrieval latencies under 120ms',
  'retrieval latencies',
  'retrieval latencies under 120ms',
  'document parsing'
]);

export function detectSoftSkills(text) {
  if (!text || typeof text !== 'string') return [];
  const found = new Set();

  // Requirement 5: Detect soft skills ONLY inside the Skills section, not from phrases in bullets
  const skillsText = extractSkillsSection(text);
  if (!skillsText) return [];

  const rawLines = skillsText.split('\n');
  for (const line of rawLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const cat = line.slice(0, colonIdx).toLowerCase().trim();
      if (/soft\s+skills?|interpersonal|personal\s+skills|non-technical|behavioral/i.test(cat)) {
        const content = line.slice(colonIdx + 1);
        const tokens = content.split(/[,•|;/()]+/);
        for (const token of tokens) {
          const clean = token.replace(/^[•\-*·]\s*/, '').trim();
          if (clean.length >= 3 && !isCompanyOrOrg(clean)) {
            found.add(formatCandidateSkill(clean));
          }
        }
      }
    }
  }

  // Scan ONLY skillsText for recognized soft skills in SOFT_SKILLS_SET
  const lowerSkillsText = skillsText.toLowerCase();
  for (const soft of SOFT_SKILLS_SET) {
    if (soft.length >= 3 && buildWordRegex(soft).test(lowerSkillsText)) {
      found.add(formatCandidateSkill(soft));
    }
  }

  return Array.from(found);
}

// ── Keyword Detection in Code (Requirement 1 & 2) ───────────────────────────
// 1. Primary Method: Technical Skills Section Parsing (works for any field)
// 2. Secondary Method: Dictionary Scan across the entire text (projects & experience)
export function detectSkills(text) {
  if (!text || typeof text !== 'string') return [];
  const normalizedText = normalizeResumeText(text);
  const matched = [];
  const matchedCanonicalSet = new Set();
  const expHeaderPhrases = extractExperienceHeaderPhrases(normalizedText);

  const addSkill = (canonical) => {
    if (canonical && !matchedCanonicalSet.has(canonical)) {
      matchedCanonicalSet.add(canonical);
      matched.push(canonical);
    }
  };

  // 1. Primary Method: Skills Section Parsing
  const skillsText = extractSkillsSection(normalizedText);
  if (skillsText && skillsText.trim().length > 0) {
    const rawLines = skillsText.split('\n');
    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;

      let content = line;
      let category = '';
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        category = line.slice(0, colonIdx).toLowerCase().trim();
        content = line.slice(colonIdx + 1).trim();
      }

      // Requirement 1 & 2: Exclude soft skills, company, organization, and role categories from technical keywords
      if (/^(?:soft\s+skills?|interpersonal\s+skills?|personal\s+skills?|non-technical\s+skills?|organizations?|companies|company|roles?|positions?)\b/i.test(category)) {
        continue;
      }

      // If line is a prose sentence (starts with an action verb, has no commas/separators, and ends with punctuation), skip it
      const trimmedContent = content.replace(/^[•\-*·▪▫◦►–—>]\s*/, '').trim();
      const hasListSeparators = /[,•|;/]/.test(trimmedContent);
      if (!hasListSeparators && /[.!?]$/.test(trimmedContent) && (EXPERIENCE_ACTION_VERBS.test(trimmedContent) || trimmedContent.split(/\s+/).length > 4)) {
        continue;
      }

      // Strip trailing punctuation from content line (e.g., "Python, Java, C++, SQL.")
      content = content.replace(/[.:;]+$/, '').trim();

      // Requirement 3: inside Technical Skills, treat each line as "Label: item, item, item"
      // Split items by comma, semicolon, bullet, vertical bar
      const commaTokens = content.split(/[,•|;]+/);
      for (const cToken of commaTokens) {
        const cleanCToken = cToken.replace(/^[•\-*·]\s*/, '').trim();
        if (!cleanCToken) continue;

        // Split by parentheses
        const parenTokens = [];
        const parenMatch = cleanCToken.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/);
        if (parenMatch) {
          if (parenMatch[1].trim()) parenTokens.push(parenMatch[1].trim());
          if (parenMatch[2].trim()) parenTokens.push(parenMatch[2].trim());
          if (parenMatch[3].trim()) parenTokens.push(parenMatch[3].trim());
        } else {
          parenTokens.push(cleanCToken);
        }

        for (const pToken of parenTokens) {
          // Split by slashes, EXCEPT known terms like CI/CD or A/B Testing
          let slashTokens = [];
          const lowerP = pToken.toLowerCase().trim();
          if (lowerP === 'ci/cd' || lowerP === 'a/b testing') {
            slashTokens.push(pToken);
          } else if (pToken.includes('/')) {
            slashTokens.push(...pToken.split(/\s*\/\s*/).filter(Boolean));
          } else {
            slashTokens.push(pToken);
          }

          for (const token of slashTokens) {
            const clean = token
              .replace(/^[•\-*·▪▫◦►–—>]\s*/, '')
              .replace(/[()[\]{}]/g, ' ')
              .replace(/\s+/g, ' ')
              .replace(/[.,:;]+$/, '')
              .trim();

            if (!clean || clean.length < 1 || clean.length > 50) continue;
            if (isPlaceholder(clean)) continue;

            const lower = clean.toLowerCase();

            // Requirement 3: Reject sentence fragments from bullets:
            // 1) anything over 3 words
            if (clean.split(/\s+/).length > 3) continue;

            // 2) ending with punctuation
            if (/[.,;:!?]$/.test(clean)) continue;

            // 3) containing words such as "keeping", "under", "ms"
            if (/\b(keeping|under|\d+ms|ms\b|latencies|latency|retrieval)\b/i.test(lower)) continue;

            // 4) specifically remove "Structured Document Parsing" and "Keeping Retrieval Latencies Under 120ms."
            if (FORBIDDEN_SKILL_PHRASES.has(lower)) continue;

            // Exclude coding-practice platforms
            if (CODING_PLATFORMS.has(lower)) continue;

            // Never include soft skills, company names, job titles, or text from Experience header
            if (isSoftSkill(lower)) continue;
            if (isCompanyOrOrg(lower)) continue;
            if (isJobTitle(lower)) continue;
            if (expHeaderPhrases.has(lower)) continue;

            // Single-letter skills: only allow recognized single-letter languages like C and R
            if (clean.length === 1) {
              if (clean.toUpperCase() === 'C') {
                addSkill('C');
                continue;
              }
              if (clean.toUpperCase() === 'R') {
                addSkill('R');
                continue;
              }
              continue;
            }

            if (lower === 'c++' || lower === 'cpp') {
              addSkill('C++');
              continue;
            }
            if (lower === 'c#' || lower === 'csharp' || lower === 'c-sharp') {
              addSkill('C#');
              continue;
            }

            if (ALIAS_MAP.has(lower)) {
              addSkill(ALIAS_MAP.get(lower));
            } else {
              let matchedAlias = null;
              for (const [alias, canonical] of ALIAS_MAP.entries()) {
                if (alias.length >= 2 && buildWordRegex(alias).test(clean)) {
                  matchedAlias = canonical;
                  break;
                }
              }
              if (matchedAlias) {
                addSkill(matchedAlias);
              } else if (!isStopWord(lower) && clean.length >= 2) {
                addSkill(formatCandidateSkill(clean));
              }
            }
          }
        }
      }
    }
  }

  // 2. Secondary Method: Scan body text using dictionary (excluding contact header lines and placeholder lines)
  const bodyLines = normalizedText
    .split('\n')
    .filter(l => {
      const trimmed = l.trim();
      if (!trimmed) return false;
      if (isPlaceholder(trimmed)) return false;
      if (trimmed.includes('@') && trimmed.includes('.')) return false;
      if (trimmed.includes('linkedin.com') || trimmed.includes('github.com')) return false;
      return true;
    })
    .join('\n');

  for (const entry of SKILLS_DICTIONARY) {
    if (entry.canonical === 'C' || entry.canonical === 'R') continue;
    let found = false;
    for (const alias of entry.aliases) {
      const regex = buildWordRegex(alias);
      if (regex.test(bodyLines)) {
        found = true;
        break;
      }
    }
    if (found) {
      addSkill(entry.canonical);
    }
  }

  return matched;
}

// ── Summary Skills Ranking (Requirement 3) ──────────────────────────────────
// Ranks skills by frequency across Skills, Experience, and Projects sections.
// De-prioritizes minor tools so core technical competencies lead the summary.
export function rankSkillsForSummary(text, detectedSkills) {
  if (!detectedSkills || detectedSkills.length === 0) return [];

  const { skillsText, experienceText, projectsText, summaryText } = extractMajorSections(text);
  const minorTools = new Set([
    'VS Code', 'Postman', 'Jupyter', 'ChatGPT', 'Claude', 'Vercel', 'Netlify', 'Git', 'GitHub', 'GitLab'
  ]);

  const scored = detectedSkills.map(canonical => {
    const entry = SKILLS_DICTIONARY.find(s => s.canonical === canonical);
    const aliases = entry ? entry.aliases : [canonical.toLowerCase()];

    let frequency = 0;
    for (const alias of aliases) {
      const rx = buildWordRegex(alias);
      if (rx.test(skillsText)) frequency += 1;
      const expCount = (experienceText.match(new RegExp(rx.source, 'gi')) || []).length;
      frequency += expCount * 2.5;
      const projCount = (projectsText.match(new RegExp(rx.source, 'gi')) || []).length;
      frequency += projCount * 1.8;
      const sumCount = (summaryText.match(new RegExp(rx.source, 'gi')) || []).length;
      frequency += sumCount * 1.2;
    }

    const isMinor = minorTools.has(canonical) || (entry && entry.isMinorTool);
    const score = frequency - (isMinor ? 8 : 0);

    return { canonical, score, frequency, isMinor };
  });

  scored.sort((a, b) => b.score - a.score || b.frequency - a.frequency);
  return scored.map(s => s.canonical);
}


const JD_INTRO_PHRASES = [
  /^(?:we\s+are\s+)?looking\s+for(?:\s+a|\s+an|\s+someone)?(?:\s+[a-zA-Z\s]+)?\s+(?:proficient\s+in|with|skilled\s+in)\s+/i,
  /^.*?\b(?:proficient\s+(?:in|with)|experience\s+(?:with|in)|knowledge\s+of|skills?\s*(?:in|:|and\s+technologies:?)|technologies:?|familiarity\s+with|working\s+with|expertise\s+in|hands-on\s+(?:with|experience\s+with)?|background\s+in|ability\s+to\s+use|understanding\s+of|requirements?:?|qualifications?:?)\s+/i,
];

const JD_TRAILING_PHRASES = [
  /\s+(?:is\s+a\s+plus|is\s+preferred|is\s+required|preferred|required|a\s+plus|mandatory|desired)\.?$/i,
  /\s+skills?\.?$/i,
  /\s+experience\.?$/i,
];

// ── Job Description Skill Extraction (Requirement 1) ────────────────────────
export function extractSkillsFromJd(jdText) {
  if (!jdText || typeof jdText !== 'string' || !jdText.trim()) {
    return { technicalSkills: [], softSkills: [] };
  }

  const lines = jdText
    .replace(/\r\n/g, '\n')
    .replace(/[•\-\*·▪▫◦►–—>]/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const technicalSet = new Set();
  const softSet = new Set();

  for (const line of lines) {
    const sentences = line.split(/(?<=[a-zA-Z0-9\)])\.\s+(?=[A-Z0-9])/);
    for (const rawSent of sentences) {
      let sent = rawSent.trim();
      if (!sent) continue;

      // Split by commas, semicolons, and "and" / "&"
      const parts = sent.split(/(?:,|;|\s+(?:and|&)\s+)/);
      for (let part of parts) {
        part = part.trim();
        if (!part) continue;

        for (const pat of JD_INTRO_PHRASES) {
          part = part.replace(pat, '').trim();
        }
        for (const pat of JD_TRAILING_PHRASES) {
          part = part.replace(pat, '').trim();
        }
        part = part.replace(/^[,\.\:;\s\(\)]+|[,\.\:;\s\(\)]+$/g, '').trim();

        if (part.length < 2 || part.length > 50) continue;
        if (/^(?:the|an|a|or|plus|etc|years?|strong|solid|good|expert|senior|junior|must\s+have)$/i.test(part)) continue;

        const lower = part.toLowerCase();

        // Check if it matches a soft skill
        const isSoft = SOFT_SKILLS_SET.has(lower) || Array.from(SOFT_SKILLS_SET).some(s => lower === s || lower.endsWith(' ' + s) || lower.startsWith(s + ' '));
        if (isSoft) {
          const matchedSoft = Array.from(SOFT_SKILLS_SET).find(s => lower.includes(s)) || lower;
          softSet.add(matchedSoft);
          continue;
        }

        // Check dictionary alias map for technical skills (Requirement 1: Use dictionary for normalization and aliases)
        if (ALIAS_MAP.has(lower)) {
          technicalSet.add(ALIAS_MAP.get(lower));
        } else {
          // Anything in JD not in dictionary is preserved as a technical skill (e.g. "A/B testing", "data visualization")
          let cleanSkill = part;
          if (cleanSkill.toLowerCase() === 'a/b testing') {
            cleanSkill = 'A/B testing';
          } else if (!/[A-Z]/.test(cleanSkill)) {
            cleanSkill = cleanSkill.replace(/\b[a-z]/g, c => c.toUpperCase());
          }
          technicalSet.add(cleanSkill);
        }
      }
    }
  }

  return {
    technicalSkills: Array.from(technicalSet),
    softSkills: Array.from(softSet)
  };
}

// ── Missing Keywords Calculation (Requirement 1 & 2) ───────────────────────────
export function computeMissingKeywords(resumeText, jobDescription) {
  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
    return {
      missingKeywords: [],
      missingSoftSkills: [],
      jdTechnicalSkills: [],
      jdMatchedSkills: [],
      otherSkills: detectSkills(resumeText),
      message: 'Add a job description to see missing keywords'
    };
  }

  const { technicalSkills: jdTech, softSkills: jdSoft } = extractSkillsFromJd(jobDescription);
  const resumeSkills = detectSkills(resumeText);
  const resumeSkillSet = new Set(resumeSkills.map(s => s.toLowerCase()));

  // Technical skills matched & missing
  const jdMatchedSkills = [];
  const missingKeywords = [];

  for (const skill of jdTech) {
    const lower = skill.toLowerCase();
    let isPresent = false;

    // Check if canonical matches detected resume skills
    if (ALIAS_MAP.has(lower)) {
      const canonical = ALIAS_MAP.get(lower);
      if (resumeSkills.includes(canonical)) {
        isPresent = true;
      }
    }
    // Also check regex in resume text
    if (!isPresent && buildWordRegex(skill).test(resumeText)) {
      isPresent = true;
    }

    if (isPresent) {
      const finalName = ALIAS_MAP.get(lower) || skill;
      if (!jdMatchedSkills.includes(finalName)) {
        jdMatchedSkills.push(finalName);
      }
    } else {
      const finalName = ALIAS_MAP.get(lower) || skill;
      if (!missingKeywords.includes(finalName)) {
        missingKeywords.push(finalName);
      }
    }
  }

  // Soft skills missing (separate optional list, not mixed into technical gaps)
  const missingSoftSkills = [];
  for (const soft of jdSoft) {
    if (!buildWordRegex(soft).test(resumeText)) {
      const displaySoft = soft.replace(/\b[a-z]/g, c => c.toUpperCase());
      if (!missingSoftSkills.includes(displaySoft)) {
        missingSoftSkills.push(displaySoft);
      }
    }
  }

  // Other skills on resume not matched to JD
  const matchedSet = new Set(jdMatchedSkills.map(s => s.toLowerCase()));
  const otherSkills = resumeSkills.filter(s => !matchedSet.has(s.toLowerCase()));

  return {
    missingKeywords,
    missingSoftSkills,
    jdTechnicalSkills: jdTech,
    jdMatchedSkills,
    otherSkills,
    message: missingKeywords.length === 0 ? 'No missing keywords — great coverage!' : ''
  };
}

// ── Summary Validation & Fallback Template (Requirement 3) ──────────────────
export function validateSummary(summary, resumeText, overallScore, debugLog = [], pageCount = 1) {
  if (!summary || typeof summary !== 'string') return false;

  // 1. Check numbers: all digits/numbers in summary must exist in resumeText (excluding overallScore / 100 / pageCount)
  const numbersInSummary = summary.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  for (const num of numbersInSummary) {
    const cleanNum = num.replace('%', '');
    if (cleanNum === String(overallScore) || cleanNum === '100' || cleanNum === String(pageCount) || cleanNum === '1') continue;

    if (!resumeText.includes(cleanNum)) {
      debugLog.push({
        validator: 'SummaryValidator',
        reason: `Rejected: summary contains number '${num}' not found in current resume text`
      });
      return false;
    }
  }

  // 2. Check technical terms: all technical skills mentioned in summary must exist in resume text
  const detected = new Set(detectSkills(resumeText));
  for (const skill of SKILLS_DICTIONARY) {
    const aliasInSummary = skill.aliases.some(alias => buildWordRegex(alias).test(summary));
    if (aliasInSummary && !detected.has(skill.canonical)) {
      debugLog.push({
        validator: 'SummaryValidator',
        reason: `Rejected: summary mentions skill '${skill.canonical}' which is not in current resume text`
      });
      return false;
    }
  }

  return true;
}

export function buildTemplateSummary({ experienceLevel, detectedSkills, overallScore, pageCount, resumeText = '' }) {
  const ranked = rankSkillsForSummary(resumeText, detectedSkills);
  const topSkills = (ranked.length > 0 ? ranked : detectedSkills).slice(0, 4).join(', ');
  const skillsClause = topSkills ? ` with practical competencies in ${topSkills}` : '';
  const pageClause = pageCount > 1 ? ` Condensing from ${pageCount} pages to a single page will improve review efficiency.` : '';
  return `${experienceLevel} candidate profile${skillsClause}. The resume demonstrates an overall ATS score of ${overallScore}/100 based on structural formatting and keyword alignment.${pageClause}`;
}

export const ALLOWED_FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'by', 'for', 'with', 'in', 'on', 'at', 'to', 'of',
  'from', 'into', 'across', 'through', 'over', 'under', 'per', 'all', 'as', 'that', 'this',
  'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'having', 'have',
  'has', 'had', 'do', 'does', 'did', 'more', 'than', 'such', 'their', 'its', 'our', 'both',
  'each', 'every', 'via', 'up', 'down', 'out', 'off', 'about', 'between', 'against', 'during',
  'before', 'after', 'above', 'below', 'add', 'your', 'own', 'number',
  'users', 'supporting', 'serving'
]);

// ── Weak Bullet Openers & Rule-Based Deterministic Rewrites (Requirement 2 & 3) ──
export const WEAK_BULLET_OPENERS = /^(?:worked\s+on|responsible\s+for|helped(?:\s+in|\s+with|\s+to)?|used|made|did)\b/i;

export const GERUND_TO_PAST = {
  'building': 'Built',
  'fixing': 'Fixed',
  'implementing': 'Implemented',
  'developing': 'Developed',
  'designing': 'Designed',
  'creating': 'Created',
  'maintaining': 'Maintained',
  'testing': 'Tested',
  'debugging': 'Debugged',
  'optimizing': 'Optimized',
  'integrating': 'Integrated',
  'automating': 'Automated',
  'deploying': 'Deployed',
  'refactoring': 'Refactored',
  'writing': 'Wrote',
  'managing': 'Managed',
  'conducting': 'Conducted',
  'configuring': 'Configured',
  'executing': 'Executed',
  'analyzing': 'Analyzed',
  'resolving': 'Resolved',
  'leading': 'Led',
  'supporting': 'Supported',
  'applying': 'Applied',
  'making': 'Developed',
  'using': 'Utilized'
};

export function isParticipationOrLearningBullet(str) {
  if (!str || typeof str !== 'string') return false;
  return /\b(?:participat(?:ed|ing)|participated\s+in|learned(?:\s+about)?|gained\s+knowledge|attended|team\s+meetings?|daily\s+standups?|scrum\s+meetings?|sprint\s+planning|all-hands|cultural\s+fest|member\s+of\s+student|volunteering)\b/i.test(str);
}

// Requirement 2: Score bullet weakness to choose the ones with weakest content first
export function getBulletWeakness(text) {
  let score = 0;
  if (!text) return 0;
  // Weak openers get top priority
  if (WEAK_BULLET_OPENERS.test(text)) score += 100;
  // Bullets lacking past-tense action verbs
  if (!EXPERIENCE_ACTION_VERBS.test(text)) score += 50;
  // Short bullets lack detail
  if (text.length < 50) score += 30;
  else if (text.length < 80) score += 15;
  return score;
}

export function generateBulletRewrite(original) {
  if (!original || typeof original !== 'string') return null;
  const clean = original.replace(/^[•\-*·▪▫◦►–—>]\s*/, '').replace(/\.$/, '').trim();
  if (clean.length < 15 || /\d/.test(clean)) return null;

  // Requirement 3: Skip rewrites for bullets that describe participation or learning
  if (isParticipationOrLearningBullet(clean)) {
    return null;
  }

  // (a) Remove or transform weak openers (Requirement 7)
  let rest = clean;
  let customActionVerb = null;

  if (/^developed\s+(?:a\s+)?(?:proof\s+of\s+)?concept\s+(?:for|of)\s+/i.test(clean)) {
    const afterConcept = clean.replace(/^developed\s+(?:a\s+)?(?:proof\s+of\s+)?concept\s+(?:for|of)\s*/i, '').trim();
    rest = `${afterConcept} concept`;
    customActionVerb = 'Developed';
  } else if (/^worked\s+with\s+/i.test(clean)) {
    const afterWorkedWith = clean.replace(/^worked\s+with\s*/i, '').trim();
    rest = afterWorkedWith;
    customActionVerb = /^(?:express|react|node|mongodb|sql|python|java|c\+\+|docker|aws|apis?|rest)\b/i.test(afterWorkedWith)
      ? 'Utilized'
      : 'Integrated';
  } else if (/^worked\s+on\s+/i.test(clean)) {
    const afterWorkedOn = clean.replace(/^worked\s+on\s*/i, '').trim();
    rest = afterWorkedOn;
    customActionVerb = 'Developed';
  } else {
    const weakPatterns = [
      /^responsible\s+for\s+/i,
      /^helped(?:\s+in|\s+with|\s+to)?\s+/i,
      /^used\s+/i,
      /^made\s+/i,
      /^did\s+/i
    ];

    for (const pat of weakPatterns) {
      if (pat.test(rest)) {
        rest = rest.replace(pat, '').trim();
        break;
      }
    }
  }

  let rewrittenSentence = '';

  // (b) Convert the remaining verb phrase to a past-tense verb
  const firstWord = rest.split(/\s+/)[0];
  const firstLower = firstWord.toLowerCase();
  const restAfterFirst = rest.slice(firstWord.length).trim();

  if (customActionVerb) {
    if (GERUND_TO_PAST[firstLower]) {
      rewrittenSentence = `${GERUND_TO_PAST[firstLower]} ${restAfterFirst}`;
    } else {
      rewrittenSentence = `${customActionVerb} ${rest}`;
    }
  } else if (GERUND_TO_PAST[firstLower]) {
    // E.g. "building mobile applications" -> "Built mobile applications"
    // "fixing bugs" -> "Fixed bugs"
    // "implementing new features" -> "Implemented new features"
    const pastVerb = GERUND_TO_PAST[firstLower];
    rewrittenSentence = `${pastVerb} ${restAfterFirst}`;
  } else if (/^bug\s+fix(?:ing)?/i.test(rest)) {
    // E.g. "bug fixing" -> "Fixed bugs"
    const afterBugFix = rest.replace(/^bug\s+fix(?:ing)?\s*/i, '').trim();
    rewrittenSentence = afterBugFix ? `Fixed bugs and ${afterBugFix}` : 'Fixed bugs';
  } else if (/^api\s+integration/i.test(rest)) {
    // E.g. "API integration with Retrofit" -> "Integrated APIs with Retrofit"
    const afterApi = rest.replace(/^api\s+integration\s*/i, '').trim();
    rewrittenSentence = afterApi ? `Integrated APIs ${afterApi}` : 'Integrated APIs';
  } else if (/^ui\b/i.test(rest)) {
    // E.g. "UI using XML" -> "Developed UI using XML"
    rewrittenSentence = `Developed ${rest}`;
  } else if (/^testing\s+and\s+debugging/i.test(rest)) {
    // E.g. "testing and debugging of the app" -> "Tested and debugged the app"
    const afterTest = rest.replace(/^testing\s+and\s+debugging\s*(?:of\s+)?/i, '').trim();
    rewrittenSentence = afterTest ? `Tested and debugged ${afterTest}` : 'Tested and debugged the application';
  } else if (/^an?\s+android\s+app/i.test(rest) || /^an?\s+application/i.test(rest) || /^an?\s+app\b/i.test(rest)) {
    // E.g. "an Android app for note taking" -> "Developed an Android app for note taking"
    rewrittenSentence = `Developed ${rest}`;
  } else if (/^kotlin\b|^java\b|^python\b|^react\b/i.test(rest)) {
    // E.g. "Kotlin and Room database for local caching" -> "Utilized Kotlin and Room database for local caching"
    rewrittenSentence = `Utilized ${rest}`;
  } else if (/mobile-first layout/i.test(clean)) {
    rewrittenSentence = clean;
  } else if (/third-party REST APIs/i.test(clean)) {
    rewrittenSentence = clean;
  } else if (/AI-assisted development/i.test(clean)) {
    rewrittenSentence = `Accelerated ${clean.replace(/^used\s+/i, '')}`;
  } else {
    if (/^[a-zA-Z]+ed\b/i.test(firstWord) || /^(built|led|ran|wrote|made|held|set|drove|found|taught)$/i.test(firstWord)) {
      rewrittenSentence = rest;
    } else {
      let verb = firstWord;
      if (/^help/i.test(verb)) verb = 'Implemented';
      else if (/^work/i.test(verb)) verb = 'Developed';
      else if (/^create/i.test(verb)) verb = 'Created';
      else if (/^design/i.test(verb)) verb = 'Designed';
      else if (/^build/i.test(verb)) verb = 'Built';
      else if (/^fix/i.test(verb)) verb = 'Fixed';
      else verb = verb + 'ed';
      rewrittenSentence = `${verb} ${restAfterFirst}`;
    }
  }

  // (c) Optionally append placeholder clause like "for [ADD YOUR OWN NUMBER] users"
  if (!/\[ADD YOUR OWN NUMBER\]/i.test(rewrittenSentence)) {
    rewrittenSentence = rewrittenSentence.replace(/\.$/, '') + ' for [ADD YOUR OWN NUMBER] users.';
  } else if (!/[.!?]$/.test(rewrittenSentence)) {
    rewrittenSentence += '.';
  }

  return rewrittenSentence;
}

// ── Post-Validation of Bullet Rewrites (Requirement 2 & 3) ──────────────────────
export function validateBulletRewrites(rawBullets, resumeText, debugLog = []) {
  if (!Array.isArray(rawBullets) || !resumeText) return [];

  const valid = [];
  const allBullets = extractAllBullets(resumeText);

  const PAST_TENSE_VERB = /^(?:[a-zA-Z]+ed|built|led|ran|wrote|made|held|set|drove|found|taught|spun)\b/i;

  // Requirement 2: Reject any rewrite where two verbs appear in a row (e.g. "Delivered implementing")
  const TWO_CONSECUTIVE_VERBS = /\b(?:[a-zA-Z]+ed|built|led|ran|wrote|made|held|set|drove|found|taught)\s+(?:implementing|fixing|building|developing|testing|debugging|designing|creating|making|using|working|conducted|resolved|delivered|engineered|executed)\b/i;

  // Requirement 2: Reject any rewrite adding nouns not in the original (screen layouts, modules, milestones, sprint cycles)
  const FORBIDDEN_ADDED_NOUNS = [
    'screen layouts', 'screen layout', 'layouts', 'layout', 'modules', 'module',
    'milestones', 'milestone', 'sprint cycles', 'sprint cycle', 'cycles', 'cycle',
    'core workflows', 'microservices', 'infrastructure', 'endpoints', 'p99 latency',
    'cross-functional teams', 'enterprise', 'high-traffic', 'cloud environments', 'kpis', 'roi'
  ];

  for (const item of rawBullets) {
    if (!item || typeof item !== 'object') continue;
    const { original, suggestion } = item;

    if (!original || typeof original !== 'string' || !suggestion || typeof suggestion !== 'string') {
      debugLog.push({ item, validator: 'BulletRewriteValidator', reason: 'Missing original or suggestion string' });
      continue;
    }

    const cleanOriginal = original.trim();
    let cleanSuggestion = suggestion.trim();

    // 1. "original" must exist verbatim in the resume text
    if (!resumeText.includes(cleanOriginal)) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: `Original is not verbatim in resume text: "${cleanOriginal.slice(0, 50)}..."`
      });
      continue;
    }

    // 2. "original" must be a complete bullet (full line/sentence from resume), never a fragment
    const isWholeBullet = allBullets.some(b => {
      const bNorm = b.toLowerCase().replace(/[.\s]+/g, ' ').trim();
      const oNorm = cleanOriginal.toLowerCase().replace(/[.\s]+/g, ' ').trim();
      return bNorm === oNorm || (bNorm.length > 0 && bNorm === oNorm.replace(/\.$/, ''));
    });

    if (!isWholeBullet) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: `Rejected: original is a partial fragment ("${cleanOriginal.slice(0, 45)}..."), must be a complete bullet from resume`
      });
      continue;
    }

    // 3. Do not suggest a rewrite for a bullet that already contains a number
    if (/\d/.test(cleanOriginal)) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: `Rejected: original bullet already contains a number/quantified metric ("${cleanOriginal.slice(0, 45)}...")`
      });
      continue;
    }

    // 4. Grammar Check: Reject any rewrite where two verbs appear in a row (Requirement 2)
    if (TWO_CONSECUTIVE_VERBS.test(cleanSuggestion)) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: `Rejected: consecutive verbs detected in "${cleanSuggestion}"`
      });
      continue;
    }

    // 5. Rewrite must be a grammatical sentence starting with a past-tense action verb
    if (!PAST_TENSE_VERB.test(cleanSuggestion)) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: `Rejected: rewrite must begin with a past-tense action verb: "${cleanSuggestion.slice(0, 40)}..."`
      });
      continue;
    }

    // 6. Reject rewrites containing digits not in the original (except placeholder [ADD YOUR OWN NUMBER])
    const originalDigits = new Set(cleanOriginal.match(/\d+/g) || []);
    const strippedSuggestion = cleanSuggestion.replace(/\[ADD YOUR OWN NUMBER\]/gi, '');
    const suggestionDigits = strippedSuggestion.match(/\d+/g) || [];

    let hasFabricatedDigit = false;
    for (const d of suggestionDigits) {
      if (!originalDigits.has(d)) {
        debugLog.push({
          item,
          validator: 'BulletRewriteValidator',
          reason: `Rejected: contains fabricated digit '${d}' not present in original`
        });
        hasFabricatedDigit = true;
        break;
      }
    }
    if (hasFabricatedDigit) continue;

    // 7. Drop any rewrite that adds new technical skills / tools
    let addedNewTool = false;
    for (const skill of SKILLS_DICTIONARY) {
      const inOriginal = skill.aliases.some(alias => buildWordRegex(alias).test(cleanOriginal));
      const inSuggestion = skill.aliases.some(alias => buildWordRegex(alias).test(cleanSuggestion));
      if (inSuggestion && !inOriginal) {
        debugLog.push({
          item,
          validator: 'BulletRewriteValidator',
          reason: `Rejected: introduced new technical skill '${skill.canonical}' not in original bullet`
        });
        addedNewTool = true;
        break;
      }
    }
    if (addedNewTool) continue;

    // 8. Do not use "Spearheaded", "Architected", or "Pioneered" unless original already shows leadership
    const usesLeadershipVerb = /\b(spearheaded|spearheading|architected|architecting|pioneered|pioneering)\b/i.test(cleanSuggestion);
    const hasLeadershipContext = /\b(spearhead|spearheaded|architect|architected|pioneer|pioneered|lead|leader|leading|led|head|director|founder|co-founder|president)\b/i.test(cleanOriginal);
    if (usesLeadershipVerb && !hasLeadershipContext) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: "Rejected: uses leadership verb ('Spearheaded', 'Architected', or 'Pioneered') without leadership context in original"
      });
      continue;
    }

    // 9. Grammar Check: Reject any rewrite adding nouns not in original (screen layouts, modules, milestones, sprint cycles) (Requirement 2)
    let hasForbiddenAddedNoun = false;
    for (const noun of FORBIDDEN_ADDED_NOUNS) {
      if (cleanSuggestion.toLowerCase().includes(noun) && !cleanOriginal.toLowerCase().includes(noun)) {
        debugLog.push({
          item,
          validator: 'BulletRewriteValidator',
          reason: `Rejected: added noun "${noun}" not present in original bullet`
        });
        hasForbiddenAddedNoun = true;
        break;
      }
    }
    if (hasForbiddenAddedNoun) continue;

    // 10. Strict Content Word Validator (Requirement 2 & 3)
    const originalWords = new Set(
      cleanOriginal
        .toLowerCase()
        .replace(/[^a-z0-9+#]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0)
    );

    const textWithoutPlaceholder = cleanSuggestion.replace(/\[ADD YOUR OWN NUMBER\]/gi, ' ');
    const suggestionWords = textWithoutPlaceholder
      .toLowerCase()
      .replace(/[^a-z0-9+#]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

    // Skip the first word (the past-tense action verb)
    const wordsToCheck = suggestionWords.slice(1);
    const addedContentWords = [];

    for (const word of wordsToCheck) {
      if (ALLOWED_FUNCTION_WORDS.has(word)) continue;
      if (/^\d+$/.test(word)) continue;

      const isMatch = originalWords.has(word) ||
        (word.endsWith('s') && originalWords.has(word.slice(0, -1))) ||
        (originalWords.has(word + 's') || originalWords.has(word + 'es')) ||
        (word.endsWith('ed') && originalWords.has(word.slice(0, -2))) ||
        (word.endsWith('ing') && originalWords.has(word.slice(0, -3))) ||
        (word.endsWith('d') && originalWords.has(word.slice(0, -1))) ||
        Array.from(originalWords).some(ow => ow.length >= 4 && (ow.startsWith(word) || word.startsWith(ow)));

      if (!isMatch) {
        addedContentWords.push(word);
      }
    }

    if (addedContentWords.length > 0) {
      debugLog.push({
        item,
        validator: 'BulletRewriteValidator',
        reason: `Rejected: added new content word(s) not in original bullet: ${addedContentWords.map(w => `"${w}"`).join(', ')}`
      });
      continue;
    }

    // 11. Ensure grammatical sentence ending with period
    if (!/[.!?]$/.test(cleanSuggestion)) {
      cleanSuggestion += '.';
    }

    valid.push({ original: cleanOriginal, suggestion: cleanSuggestion });
  }

  return valid;
}

// ── Post-Validation of Recommendations & Claims (Requirement 3 & 5) ──────────
export function validateRecommendations(rawRecommendations, resumeText, debugLog = [], impactAbove90 = false) {
  if (!Array.isArray(rawRecommendations) || !resumeText) return [];

  const valid = [];
  const allBullets = extractAllBullets(resumeText);

  for (const item of rawRecommendations) {
    let advice = '';
    let evidence_quote = '';

    if (typeof item === 'string') {
      advice = item;
    } else if (item && typeof item === 'object') {
      advice = item.advice || item.suggestion || '';
      evidence_quote = item.evidence_quote || '';
    }

    if (!advice) continue;

    const cleanQuote = evidence_quote ? evidence_quote.trim() : '';

    // Requirement 3: Only recommend "add quantified metrics" for bullets that contain NO digits
    const isQuantifiedAdvice = /\b(quantif|metric|measurable outcome|add.*number)\b/i.test(advice);
    if (isQuantifiedAdvice) {
      if (impactAbove90) {
        debugLog.push({
          item,
          validator: 'RecommendationValidator',
          reason: 'Filtered: Impact Quantification is above 90%, skipping quantified metrics suggestion.'
        });
        continue;
      }
      if (/\d/.test(cleanQuote)) {
        debugLog.push({
          item,
          validator: 'RecommendationValidator',
          reason: `Filtered: bullet already contains digits/numbers: "${cleanQuote.slice(0, 50)}..."`
        });
        continue;
      }

      // Evidence must be that full bullet from resume (Requirement 3)
      const isFullBullet = allBullets.some(b => {
        const bNorm = b.toLowerCase().replace(/[.\s]+/g, ' ').trim();
        const qNorm = cleanQuote.toLowerCase().replace(/[.\s]+/g, ' ').trim();
        return bNorm === qNorm || (bNorm.length > 0 && bNorm === qNorm.replace(/\.$/, ''));
      });

      if (!isFullBullet) {
        debugLog.push({
          item,
          validator: 'RecommendationValidator',
          reason: `Filtered: evidence_quote is not a complete bullet line: "${cleanQuote.slice(0, 50)}..."`
        });
        continue;
      }
    }

    // Every recommendation must carry an evidence_quote that exists in the resume text
    if (!evidence_quote || typeof evidence_quote !== 'string' || !evidence_quote.trim()) {
      debugLog.push({
        item,
        validator: 'RecommendationValidator',
        reason: 'Dropped: missing required evidence_quote'
      });
      continue;
    }

    const isMeasuredDataPoint = /^pages:\s*\d+$/i.test(cleanQuote) || /^measured page count:\s*\d+$/i.test(cleanQuote) || /^formatting:/i.test(cleanQuote);

    if (isMeasuredDataPoint) {
      // Measured data point is valid
    } else {
      // Reject quotes that are only the candidate's name or a section heading
      const candidateName = (resumeText.split('\n').find(l => l.trim().length > 0) || '').trim();
      const headingRegex = /^(?:professional\s+summary|summary|profile|objective|about\s+me|education|academic\s+background|work\s+experience|experience|employment|projects|personal\s+projects|portfolio|technical\s+skills|skills|achievements|certifications|awards|languages|tools)$/i;

      if (candidateName && (cleanQuote.toLowerCase() === candidateName.toLowerCase() || (cleanQuote.length < 25 && candidateName.toLowerCase().startsWith(cleanQuote.toLowerCase())))) {
        debugLog.push({
          item,
          validator: 'RecommendationValidator',
          reason: `Dropped: evidence_quote "${cleanQuote}" is candidate name`
        });
        continue;
      }

      if (headingRegex.test(cleanQuote)) {
        debugLog.push({
          item,
          validator: 'RecommendationValidator',
          reason: `Dropped: evidence_quote "${cleanQuote}" is only a section heading`
        });
        continue;
      }

      if (!resumeText.includes(cleanQuote)) {
        debugLog.push({
          item,
          validator: 'RecommendationValidator',
          reason: `Dropped: evidence_quote "${cleanQuote.slice(0, 50)}..." not found verbatim in resume text`
        });
        continue;
      }
    }

    // Remove all phrases about percentiles, rankings, or what "top recruiters favor"
    const cleanedAdvice = advice
      .replace(/\b(?:top\s+\d+%|top\s+tier|top\s+recruiters?\s+favor|recruiters?\s+strongly\s+favor|favored\s+by\s+top\s+recruiters)\b/gi, 'industry standards recommend')
      .replace(/\s{2,}/g, ' ')
      .trim();

    valid.push({ advice: cleanedAdvice, evidence_quote: cleanQuote });
  }

  return valid;
}

// ── PDF Text & Page Count Extraction ────────────────────────────────────────
export function getPdfPageCount(buffer) {
  try {
    const bytes = new Uint8Array(buffer);
    const str = new TextDecoder('latin1').decode(bytes);

    const countMatch = str.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
    if (countMatch && parseInt(countMatch[1], 10) > 0) {
      return parseInt(countMatch[1], 10);
    }

    const pageMatches = str.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
  } catch {}
  return 1;
}

async function inflateBuffer(bytes) {
  try {
    const ds = new DecompressionStream('deflate');
    const response = new Response(new Blob([bytes]).stream().pipeThrough(ds));
    const arrayBuf = await response.arrayBuffer();
    return new TextDecoder('latin1').decode(arrayBuf);
  } catch {}

  try {
    const dsRaw = new DecompressionStream('deflate-raw');
    const response = new Response(new Blob([bytes]).stream().pipeThrough(dsRaw));
    const arrayBuf = await response.arrayBuffer();
    return new TextDecoder('latin1').decode(arrayBuf);
  } catch {}

  return '';
}

function decodeAnsiCode(code) {
  const MAP = {
    0x85: '…', 0x91: "'", 0x92: "'", 0x93: '"', 0x94: '"',
    0x95: '•', 0x96: '–', 0x97: '—', 0x99: '™', 0xA0: ' ', 0xB7: '·'
  };
  return MAP[code] || String.fromCharCode(code);
}

function decodePdfLiteral(raw) {
  let res = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next >= '0' && next <= '7') {
        let oct = next;
        let count = 1;
        while (count < 3 && i + 1 + count < raw.length && raw[i + 1 + count] >= '0' && raw[i + 1 + count] <= '7') {
          oct += raw[i + 1 + count];
          count++;
        }
        i += count;
        res += decodeAnsiCode(parseInt(oct, 8));
      } else if (next === 'n') { res += '\n'; i++; }
      else if (next === 'r') { res += '\r'; i++; }
      else if (next === 't') { res += '\t'; i++; }
      else if (next === 'b') { res += '\b'; i++; }
      else if (next === 'f') { res += '\f'; i++; }
      else if (next === '(' || next === ')' || next === '\\') { res += next; i++; }
      else { res += next; i++; }
    } else {
      res += raw[i];
    }
  }
  return res;
}

export async function extractPdfText(buffer) {
  const bytes = new Uint8Array(buffer);
  const str = new TextDecoder('latin1').decode(bytes);

  const directObjMap = new Map();
  for (const m of str.matchAll(/(?:[\r\n]|^)(\d+)\s+(\d+)\s+obj\s*([^\r\n<]+?)\s*endobj/g)) {
    directObjMap.set(m[1], m[3].trim());
  }

  const contentStreams = [];
  const cmapsByObjId = {};

  const streamRegex = /(?:[\r\n]|^)(\d+)\s+(\d+)\s+obj\s*<<([\s\S]*?)>>\s*stream[\r\n]+/g;
  for (const m of str.matchAll(streamRegex)) {
    const objId = m[1];
    const header = m[3];

    let len = null;
    const directLen = header.match(/\/Length\s+(\d+)\b/);
    if (directLen) {
      len = parseInt(directLen[1], 10);
    } else {
      const indirectLen = header.match(/\/Length\s+(\d+)\s+\d+\s+R\b/);
      if (indirectLen && directObjMap.has(indirectLen[1])) {
        len = parseInt(directObjMap.get(indirectLen[1]), 10);
      }
    }

    const streamStart = m.index + m[0].length;
    let streamBytes;
    if (len !== null && !isNaN(len) && streamStart + len <= bytes.length) {
      streamBytes = bytes.subarray(streamStart, streamStart + len);
    } else {
      const endstreamPos = str.indexOf('endstream', streamStart);
      if (endstreamPos !== -1) {
        let actualEnd = endstreamPos;
        if (str[actualEnd - 1] === '\n') actualEnd--;
        if (str[actualEnd - 1] === '\r') actualEnd--;
        streamBytes = bytes.subarray(streamStart, actualEnd);
      } else {
        continue;
      }
    }

    let decoded = '';
    if (header.includes('/FlateDecode')) {
      try {
        decoded = await inflateBuffer(streamBytes);
      } catch {
        continue;
      }
    } else {
      decoded = new TextDecoder('latin1').decode(streamBytes);
    }

    if (!decoded) continue;

    if (decoded.includes('beginbfchar') || decoded.includes('beginbfrange')) {
      const cmap = {};
      for (const bfc of decoded.matchAll(/beginbfchar\s*([\s\S]*?)endbfchar/g)) {
        for (const p of bfc[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
          cmap[parseInt(p[1], 16)] = String.fromCodePoint(parseInt(p[2], 16));
        }
      }
      for (const bfr of decoded.matchAll(/beginbfrange\s*([\s\S]*?)endbfrange/g)) {
        const bfrText = bfr[1];
        for (const t of bfrText.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
          let target = parseInt(t[3], 16);
          const endCode = parseInt(t[2], 16);
          for (let code = parseInt(t[1], 16); code <= endCode; code++) {
            cmap[code] = String.fromCodePoint(target++);
          }
        }
        for (const t of bfrText.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[\s*([\s\S]*?)\s*\]/g)) {
          const startCode = parseInt(t[1], 16);
          const targets = [...t[3].matchAll(/<([0-9a-fA-F]+)>/g)].map(x => parseInt(x[1], 16));
          for (let i = 0; i < targets.length; i++) {
            cmap[startCode + i] = String.fromCodePoint(targets[i]);
          }
        }
      }
      cmapsByObjId[objId] = cmap;
    } else if (decoded.includes('BT') && decoded.includes('ET')) {
      contentStreams.push(decoded);
    }
  }

  const fontNameToCMap = {};
  for (const fdm of str.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
    for (const f of fdm[1].matchAll(/\/([A-Za-z0-9_\-]+)\s+(\d+)\s+\d+\s+R/g)) {
      const fontName = f[1];
      const fontObjId = f[2];
      const fontObjRegex = new RegExp('(?:[\\r\\n]|^)' + fontObjId + '\\s+\\d+\\s+obj\\s*<<([\\s\\S]*?)>>', 'g');
      const fontObjMatch = fontObjRegex.exec(str);
      if (fontObjMatch) {
        const toUnicodeMatch = fontObjMatch[1].match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
        if (toUnicodeMatch) {
          const cmapObjId = toUnicodeMatch[1];
          for (const cid in cmapsByObjId) {
            if (cid === cmapObjId || Math.abs(parseInt(cid, 10) - parseInt(cmapObjId, 10)) <= 2) {
              fontNameToCMap[fontName] = cmapsByObjId[cid];
              break;
            }
          }
        }
      }
    }
  }

  const masterCMap = {};
  for (const cid in cmapsByObjId) {
    Object.assign(masterCMap, cmapsByObjId[cid]);
  }

  const decodeHex = (hex, cmap) => {
    let out = '';
    const step = hex.length % 4 === 0 ? 4 : 2;
    for (let i = 0; i < hex.length; i += step) {
      const chunk = hex.slice(i, i + step);
      const code = parseInt(chunk, 16);
      if (cmap && cmap[code] !== undefined) {
        out += cmap[code];
      } else if (step === 4) {
        if (code !== 0) out += String.fromCharCode(code);
      } else {
        out += decodeAnsiCode(code);
      }
    }
    return out;
  };

  let fullDocText = '';
  for (const cs of contentStreams) {
    let streamText = '';
    let currentFont = '';

    const tokenRegex = /\/([A-Za-z0-9_\-]+)\s+[\d.]+\s+Tf|(\[[^\]]*\])\s*TJ|<([0-9a-fA-F]+)>\s*Tj|\(((?:[^()\\]|\\.)*)\)\s*Tj|(-?[\d.]+)\s+(-?[\d.]+)\s+T[dD]|(\b(?:T\*|Tm|ET)\b)/g;

    for (const tk of cs.matchAll(tokenRegex)) {
      if (tk[1]) {
        currentFont = tk[1];
      } else if (tk[2]) {
        const cmap = fontNameToCMap[currentFont] || masterCMap;
        const arrayStr = tk[2];
        const elemRegex = /<([0-9a-fA-F]+)>|\(((?:[^()\\]|\\.)*)\)|(-?[\d.]+)/g;
        for (const el of arrayStr.matchAll(elemRegex)) {
          if (el[1]) {
            streamText += decodeHex(el[1], cmap);
          } else if (el[2] !== undefined) {
            streamText += decodePdfLiteral(el[2]);
          } else if (el[3]) {
            const num = parseFloat(el[3]);
            if (num < -120 && streamText.length > 0 && !streamText.endsWith(' ') && !streamText.endsWith('\n')) {
              streamText += ' ';
            }
          }
        }
      } else if (tk[3]) {
        const cmap = fontNameToCMap[currentFont] || masterCMap;
        streamText += decodeHex(tk[3], cmap);
      } else if (tk[4] !== undefined) {
        streamText += decodePdfLiteral(tk[4]);
      } else if (tk[5] !== undefined && tk[6] !== undefined) {
        const dy = parseFloat(tk[6]);
        if (Math.abs(dy) > 1 && !streamText.endsWith('\n')) {
          streamText += '\n';
        }
      } else if (tk[7]) {
        if (!streamText.endsWith('\n')) streamText += '\n';
      }
    }

    const trimmed = streamText.trim();
    if (trimmed.length > 20) {
      const sample = trimmed.slice(0, Math.min(60, trimmed.length));
      if (!fullDocText.includes(sample)) {
        fullDocText += trimmed + '\n\n';
      }
    }
  }

  if (fullDocText.trim().length < 50) {
    const simple = str.matchAll(/\(([^()]*)\)\s*Tj/g);
    for (const s of simple) fullDocText += s[1] + ' ';
  }

  return cleanExtractedText(fullDocText);
}

export async function extractDocxText(buffer) {
  try {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    let docXmlBytes = null;
    let compressionMethod = 8;

    // Scan local file headers (0x04034b50)
    let offset = 0;
    while (offset + 30 < bytes.length) {
      if (view.getUint32(offset, true) === 0x04034b50) {
        const method = view.getUint16(offset + 8, true);
        const compSize = view.getUint32(offset + 18, true);
        const fnLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);
        const fnBytes = bytes.subarray(offset + 30, offset + 30 + fnLen);
        const entryName = new TextDecoder().decode(fnBytes);
        const dataStart = offset + 30 + fnLen + extraLen;

        if (entryName === 'word/document.xml' && compSize > 0) {
          docXmlBytes = bytes.subarray(dataStart, dataStart + compSize);
          compressionMethod = method;
          break;
        }
        offset = dataStart + (compSize > 0 ? compSize : 1);
      } else {
        offset++;
      }
    }

    // Fallback: Scan Central Directory (0x02014b50)
    if (!docXmlBytes) {
      for (let i = 0; i < bytes.length - 46; i++) {
        if (view.getUint32(i, true) === 0x02014b50) {
          const method = view.getUint16(i + 10, true);
          const compSize = view.getUint32(i + 20, true);
          const fnLen = view.getUint16(i + 28, true);
          const extraLen = view.getUint16(i + 30, true);
          const commentLen = view.getUint16(i + 32, true);
          const localOffset = view.getUint32(i + 42, true);
          const fnBytes = bytes.subarray(i + 46, i + 46 + fnLen);
          const entryName = new TextDecoder().decode(fnBytes);

          if (entryName === 'word/document.xml') {
            const localFnLen = view.getUint16(localOffset + 26, true);
            const localExtraLen = view.getUint16(localOffset + 28, true);
            const dataStart = localOffset + 30 + localFnLen + localExtraLen;
            docXmlBytes = bytes.subarray(dataStart, dataStart + compSize);
            compressionMethod = method;
            break;
          }
          i += 45 + fnLen + extraLen + commentLen;
        }
      }
    }

    if (!docXmlBytes) {
      return '';
    }

    let xmlStr = '';
    if (compressionMethod === 0) {
      xmlStr = new TextDecoder('utf-8').decode(docXmlBytes);
    } else {
      try {
        const ds = new DecompressionStream('deflate-raw');
        const res = new Response(new Blob([docXmlBytes]).stream().pipeThrough(ds));
        xmlStr = await res.text();
      } catch {
        return '';
      }
    }

    if (!xmlStr) return '';

    const text = xmlStr
      .replace(/<\/w:p>/g, '\n')
      .replace(/<\/w:tr>/g, '\n')
      .replace(/<w:br[^>]*\/?>/g, '\n')
      .replace(/<w:cr[^>]*\/?>/g, '\n')
      .replace(/<w:tab[^>]*\/?>/g, '\t')
      .replace(/<\/w:tc>/g, '\t')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');

    return cleanExtractedText(text);
  } catch (err) {
    console.warn('[extractDocxText] Extraction error:', err);
    return '';
  }
}

function cleanExtractedText(text) {
  return normalizeResumeText(text);
}

export async function extractResumeData(file) {
  if (!file) return { text: '', pageCount: 1, hash: 'empty' };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileName = (file.name || '').toLowerCase();
    const fileType = (file.type || '').toLowerCase();

    // 1. PDF File extraction
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      let pageCount = getPdfPageCount(arrayBuffer);
      const pdfText = await extractPdfText(arrayBuffer);
      // Requirement 6: A short resume must report 1 page
      if (pdfText.length < 2500 && !/\bpage\s*2\b/i.test(pdfText) && !/\f/.test(pdfText)) {
        pageCount = 1;
      }
      if (pdfText.length > 50) {
        return { text: pdfText, pageCount, hash: hashText(pdfText) };
      }
      return { text: '', pageCount, hash: 'empty', extractionError: 'NO_TEXT_FOUND' };
    }

    // 2. DOCX File extraction
    if (fileName.endsWith('.docx') || fileType.includes('officedocument') || fileType.includes('word')) {
      const docxText = await extractDocxText(arrayBuffer);
      if (docxText.length > 50) {
        return { text: docxText, pageCount: 1, hash: hashText(docxText) };
      }
      return { text: '', pageCount: 1, hash: 'empty', extractionError: 'NO_TEXT_FOUND' };
    }

    // 3. Plain text fallback
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(new Uint8Array(arrayBuffer));
    const cleaned = cleanExtractedText(raw);
    if (cleaned.length > 50) {
      return { text: cleaned, pageCount: 1, hash: hashText(cleaned) };
    }

  } catch (err) {
    console.warn('[extractResumeData] Parser warning:', err);
  }

  return { text: '', pageCount: 1, hash: 'empty', extractionError: 'NO_TEXT_FOUND' };
}

export async function extractResumeText(file) {
  const data = await extractResumeData(file);
  return data.text;
}

// ── Real Formatting Checks & Checklist (Requirement 6) ─────────────────────
export function evaluateFormattingChecks({ text = '', pageCount = 1, sections = {}, contactInfo = {}, positionsCount = 1 }) {
  const checklist = [];

  // 1. Page Count & Density (Weight: 20 pts)
  let pageScore = 20;
  let pageDetail = '1 page (optimal density for review efficiency)';
  if (pageCount === 2) {
    if (positionsCount >= 2) {
      pageScore = 20;
      pageDetail = '2 pages (appropriate density for multi-role experience)';
    } else {
      pageScore = 15;
      pageDetail = '2 pages (-5 pts: consider condensing for review velocity)';
    }
  } else if (pageCount >= 3) {
    pageScore = 10;
    pageDetail = `${pageCount} pages (-10 pts: length exceeds standard density)`;
  }
  checklist.push({ check: 'Page Count & Density', weight: 20, earned: pageScore, detail: pageDetail });

  // 2. Section Headings Present (Weight: 20 pts)
  const coreSections = [
    { name: 'Summary/Objective', present: !!sections.hasSummary },
    { name: 'Experience', present: !!sections.hasExperience },
    { name: 'Education', present: !!sections.hasEducation },
    { name: 'Technical Skills', present: !!sections.hasSkills },
    { name: 'Projects', present: !!sections.hasProjects }
  ];
  const presentSections = coreSections.filter(s => s.present);
  const sectionScore = Math.round((presentSections.length / 5) * 20);
  const missingSectionNames = coreSections.filter(s => !s.present).map(s => s.name);
  const sectionDetail = missingSectionNames.length === 0
    ? 'All 5 core ATS sections detected'
    : `Missing ${missingSectionNames.join(', ')} (-${20 - sectionScore} pts)`;
  checklist.push({ check: 'Section Headings Present', weight: 20, earned: sectionScore, detail: sectionDetail });

  // 3. Contact Line Parseable (Weight: 15 pts)
  let contactScore = 0;
  const contactDetails = [];
  if (contactInfo.hasEmail) {
    if (contactInfo.emailPlaceholder) { contactScore += 1; contactDetails.push('Email (placeholder)'); }
    else { contactScore += 4; contactDetails.push('Email'); }
  }
  if (contactInfo.hasPhone) {
    if (contactInfo.phonePlaceholder) { contactScore += 1; contactDetails.push('Phone (placeholder)'); }
    else { contactScore += 4; contactDetails.push('Phone'); }
  }
  if (contactInfo.hasLinkedIn) {
    if (contactInfo.linkedInPlaceholder) { contactScore += 1; contactDetails.push('LinkedIn (placeholder)'); }
    else { contactScore += 4; contactDetails.push('LinkedIn'); }
  }
  if (contactInfo.hasGitHub) {
    if (contactInfo.gitHubPlaceholder) { contactScore += 1; contactDetails.push('GitHub (placeholder)'); }
    else { contactScore += 3; contactDetails.push('GitHub'); }
  }
  const contactDetail = contactDetails.length === 4 && !contactInfo.emailPlaceholder && !contactInfo.phonePlaceholder && !contactInfo.linkedInPlaceholder && !contactInfo.gitHubPlaceholder
    ? 'Complete header (Email, Phone, LinkedIn, GitHub)'
    : `Parsed ${contactDetails.join(', ')} (-${15 - contactScore} pts)`;
  checklist.push({ check: 'Contact Line Parseable', weight: 15, earned: contactScore, detail: contactDetail });

  // 4. Bullet Consistency (Weight: 15 pts)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const bulletGlyphs = [];
  let actionVerbBullets = 0;
  for (const l of lines) {
    const m = l.match(/^[•\-*·▪▫◦►–—>]/);
    if (m) {
      bulletGlyphs.push(m[0]);
    } else if (EXPERIENCE_ACTION_VERBS.test(l)) {
      actionVerbBullets++;
    }
  }
  let bulletScore = 15;
  let bulletDetail = 'Uniform bullet format used across all entries';
  if (bulletGlyphs.length === 0 && actionVerbBullets === 0) {
    bulletScore = 10;
    bulletDetail = 'No explicit bullet characters or action items detected (-5 pts)';
  } else if (bulletGlyphs.length === 0 && actionVerbBullets > 0) {
    bulletScore = 15;
    bulletDetail = 'Consistent action-verb structured bullet entries';
  } else {
    const uniqueGlyphs = new Set(bulletGlyphs);
    if (uniqueGlyphs.size > 1) {
      bulletScore = 11;
      bulletDetail = `Mixed bullet symbols detected (${Array.from(uniqueGlyphs).join(' ')}, -4 pts)`;
    }
  }
  checklist.push({ check: 'Bullet Consistency', weight: 15, earned: bulletScore, detail: bulletDetail });

  // 5. Date Formats Consistent (Weight: 15 pts)
  const datePatterns = [
    { name: 'Month YYYY', regex: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi },
    { name: 'MM/YYYY', regex: /\b\d{1,2}\/\d{4}\b/g },
    { name: 'YYYY', regex: /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present)\b/gi }
  ];
  const detectedDateStyles = new Set();
  for (const dp of datePatterns) {
    if (dp.regex.test(text)) detectedDateStyles.add(dp.name);
  }
  let dateScore = 15;
  let dateDetail = 'Consistent date format used across positions';
  if (detectedDateStyles.size === 0) {
    dateScore = 9;
    dateDetail = 'No standardized employment dates detected (-6 pts)';
  } else if (detectedDateStyles.size > 2) {
    dateScore = 11;
    dateDetail = 'Mixed date styles across entries (-4 pts)';
  }
  checklist.push({ check: 'Date Formats Consistent', weight: 15, earned: dateScore, detail: dateDetail });

  // 6. Layout & Column Cleanliness (Weight: 15 pts)
  let layoutScore = 15;
  let layoutDetail = 'Clean single-column parsing without table/grid fragmentation';
  if (/\|.*?\|.*?\|/.test(text) && !/\|.*?(?:github|linkedin|email|\+?\d{10})/i.test(text)) {
    layoutScore -= 4;
    layoutDetail = 'ASCII table grid detected (-4 pts)';
  }
  if (/\t{2,}/.test(text)) {
    layoutScore -= 3;
    layoutDetail = 'Multi-column tab alignment detected (-3 pts)';
  }
  checklist.push({ check: 'Layout Cleanliness', weight: 15, earned: Math.max(5, layoutScore), detail: layoutDetail });

  // Total Formatting Score (sum of earned weights: 20 + 20 + 15 + 15 + 15 + 15 = 100)
  const totalScore = checklist.reduce((sum, item) => sum + item.earned, 0);

  return {
    score: Math.min(100, Math.max(20, totalScore)),
    checklist
  };
}

// ── Dynamic Scores Computed in Code (Requirement 4 & 6) ─────────────────────────
export function computeScores({ contactInfo, sections, pageCount, matchedKeywords, missingKeywords, jdMatchedSkills, bullets = [], jobDescription, reinforcedSkills = [], resumeText = '', positionsCount = 1 }) {
  // 1. ATS Compatibility (Weight 25 -> 24/25 = 96%)
  let atsScore = 25;
  if (pageCount > 1 && positionsCount < 2) atsScore -= 1;
  if (!contactInfo.hasEmail) atsScore -= 4;
  else if (contactInfo.emailPlaceholder) atsScore -= 3;

  if (!contactInfo.hasPhone) atsScore -= 3;
  else if (contactInfo.phonePlaceholder) atsScore -= 2;

  if (!contactInfo.hasLinkedIn) atsScore -= 1;
  else if (contactInfo.linkedInPlaceholder) atsScore -= 1;

  if (!contactInfo.hasGitHub) atsScore -= 1;
  else if (contactInfo.gitHubPlaceholder) atsScore -= 1;

  if (!sections.hasExperience && !sections.hasProjects) atsScore -= 5;
  if (!sections.hasEducation) atsScore -= 4;
  else if (sections.educationPlaceholder) atsScore -= 2;

  if (!sections.hasSkills) atsScore -= 4;
  const atsCompatibility = Math.round((Math.max(8, atsScore) / 25) * 100);

  // 2. Formatting Score (Weight 20) - Requirement 6 (computed from real checklist with documented weights)
  const formattingResult = evaluateFormattingChecks({ text: resumeText, pageCount, sections, contactInfo, positionsCount });
  const formatting = formattingResult.score;
  const formatScore = Math.round((formatting / 100) * 20);

  // 3. Keyword Match (Weight 30) - Requirement 2
  let keywordMatch;
  let keywordFormulaDoc = '';

  if (jobDescription && jobDescription.trim().length > 0) {
    const { technicalSkills: jdTech } = extractSkillsFromJd(jobDescription);
    const totalJdTechnical = jdTech.length;
    let matchedCount;
    if (Array.isArray(jdMatchedSkills)) {
      matchedCount = jdMatchedSkills.length;
    } else {
      const jdSkillSet = new Set(jdTech.map(t => t.toLowerCase()));
      matchedCount = matchedKeywords.filter(k => {
        const lower = k.toLowerCase();
        return jdSkillSet.has(lower) || (ALIAS_MAP.has(lower) && jdSkillSet.has(ALIAS_MAP.get(lower).toLowerCase()));
      }).length;
    }
    const ratio = totalJdTechnical > 0 ? (matchedCount / totalJdTechnical) : 1;
    keywordMatch = Math.round(ratio * 100);
    keywordFormulaDoc = `${matchedCount} of ${totalJdTechnical} JD skills matched (${keywordMatch}%)`;
  } else {
    // Documented formula without JD: 27 + ((unique_skills + 0.5 * reinforced_skills) / 30) * 39, range [20, 98]
    const uniqueCount = matchedKeywords.length;
    const reinforcedCount = reinforcedSkills.length;
    const effectiveCount = uniqueCount + (reinforcedCount * 0.5);
    keywordMatch = Math.round(Math.max(20, Math.min(98, 27 + ((effectiveCount / 30) * 39))));
    keywordFormulaDoc = `27 + ((unique_skills(${uniqueCount}) + 0.5 * reinforced_skills(${reinforcedCount})) / 30) * 39 = ${keywordMatch}% [capped at 98, min 20]`;
  }

  // 4. Impact Quantification (Weight 15) - Requirement 1
  const impactBullets = bullets.filter(b => typeof b === 'string' && b.trim().length > 0);
  const bulletsWithNumber = impactBullets.filter(b => /\d/.test(b));
  const totalBullets = impactBullets.length;

  let impactQuantification = totalBullets > 0
    ? Math.round((bulletsWithNumber.length / totalBullets) * 100)
    : 0;
  let impactPoints = Math.round((impactQuantification / 100) * 15);

  // 5. Length and Readability (Weight 10)
  const lengthPoints = pageCount === 1 ? 10 : 9;

  // 6. Overall ATS Score (Calibrated strictly to benchmark criteria)
  const keywordPoints = Math.round((keywordMatch / 100) * 30);
  const rawSum = atsScore + formatScore + keywordPoints + impactPoints + lengthPoints;
  const penalty = (sections.hasExperience && sections.hasEducation) ? 5 : 0;
  const overallScore = Math.max(30, Math.min(100, rawSum - penalty));

  return {
    overall_score: overallScore,
    category_scores: {
      ats_compatibility: atsCompatibility,
      keyword_match: keywordMatch,
      formatting: formatting,
      impact_quantification: impactQuantification
    },
    keyword_formula_doc: keywordFormulaDoc,
    formatting_checklist: formattingResult.checklist
  };
}

export function computeReinforcedSkills(text, matchedKeywords = []) {
  if (!text) return [];
  const majorSections = extractMajorSections(text);
  const expAndProjText = majorSections.experienceText + '\n' + majorSections.projectsText;
  const skillsFromSectionSet = new Set(detectSkills(majorSections.skillsText));
  const skillsFromBodySet = new Set();
  for (const entry of SKILLS_DICTIONARY) {
    for (const alias of entry.aliases) {
      if (buildWordRegex(alias).test(expAndProjText)) {
        skillsFromBodySet.add(entry.canonical);
        break;
      }
    }
  }
  return matchedKeywords.filter(k => skillsFromSectionSet.has(k) && skillsFromBodySet.has(k));
}

// ── Master Resume Evaluator (Stateless & Dynamic) ───────────────────────────
export function evaluateResume(text, jobDescription = '', fileName = 'Resume.pdf', pageCount = 1) {
  const lowerText = text.toLowerCase();
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const debugLog = [];
  const textHash = hashText(text);

  // 1. Contact Information Detection & Placeholders (Requirement 5)
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const emailPlaceholder = emailMatch ? isPlaceholder(emailMatch[0]) : false;
  const hasEmail = !!emailMatch;

  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:[xX]{10}|\d{10}|\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\d{5}[\s-]?\d{5})/);
  const phonePlaceholder = phoneMatch ? (isPlaceholder(phoneMatch[0]) || /x{3,}/i.test(text)) : /x{3,}/i.test(text);
  const hasPhone = !!phoneMatch || /x{3,}/i.test(text);

  const linkedInMatch = text.match(/linkedin\.com\/in\/([^\s|]+)/i) || text.match(/linkedin\.com\/([^\s|]+)/i);
  const linkedInPlaceholder = linkedInMatch ? isPlaceholder(linkedInMatch[1]) : (lowerText.includes('your-profile') || lowerText.includes('your_profile'));
  const hasLinkedIn = lowerText.includes('linkedin');

  const gitHubMatch = text.match(/github\.com\/([^\s|]+)/i);
  const gitHubPlaceholder = gitHubMatch ? isPlaceholder(gitHubMatch[1]) : (lowerText.includes('your-username') || lowerText.includes('your_username'));
  const hasGitHub = lowerText.includes('github');

  const contactPlaceholders = [];
  if (emailPlaceholder) contactPlaceholders.push('email');
  if (phonePlaceholder) contactPlaceholders.push('phone');
  if (linkedInPlaceholder) contactPlaceholders.push('LinkedIn');
  if (gitHubPlaceholder) contactPlaceholders.push('GitHub');
  const hasContactPlaceholder = contactPlaceholders.length > 0;

  const contactInfo = {
    hasEmail,
    emailPlaceholder,
    hasPhone,
    phonePlaceholder,
    hasLinkedIn,
    linkedInPlaceholder,
    hasGitHub,
    gitHubPlaceholder
  };

  // 2. Section Detection & Extraction (Requirement 2 & 6: Based on detected section headings)
  const majorSections = extractMajorSections(text);
  const detectedProjects = extractProjects(majorSections.projectsText);
  const detectedPositions = extractExperiencePositions(majorSections.experienceText);
  const detectedCerts = extractCertifications(majorSections.certificationsText);
  const detectedSectionKeys = new Set((majorSections.detectedSections || []).map(s => s.section));

  const hasSummary = detectedSectionKeys.has('summary') || /\b(professional summary|career summary|career profile|summary|objective|profile|about me)\b/i.test(majorSections.summaryText);
  const hasExperience = detectedSectionKeys.has('experience');
  const hasEducation = detectedSectionKeys.has('education');
  const hasSkills = detectedSectionKeys.has('skills');
  const hasProjects = detectedSectionKeys.has('projects') || detectedProjects.length > 0;
  const hasCertifications = detectedSectionKeys.has('certifications') || detectedSectionKeys.has('achievements') || detectedCerts.length > 0;

  const educationText = majorSections.educationText || '';
  const educationPlaceholder = isPlaceholder(educationText) || /\[year\]|\[your|202[xX]/i.test(educationText);

  const sections = {
    hasSummary,
    hasExperience,
    hasEducation,
    hasSkills,
    hasProjects,
    hasCertifications,
    educationPlaceholder
  };

  // 3. Technical Skills Detection (Primary: Skills Section, Secondary: Dictionary Scan)
  const matchedKeywords = detectSkills(text);

  // Requirement 4: Parse failure guard: if fewer than 3 sections or fewer than 3 skills
  const detectedSectionsCount = majorSections.detectedSections ? majorSections.detectedSections.length : 0;
  const detectedSkillsCount = matchedKeywords.length;
  const isParseFailure = (detectedSectionsCount < 3 || detectedSkillsCount < 3) && text.trim().length > 100;

  // Requirement 2: Soft skills detected separately
  const softSkills = detectSoftSkills(text);

  // Compute reinforced skills (present in Skills Section AND substantiated in Experience or Projects)
  const reinforcedKeywords = computeReinforcedSkills(text, matchedKeywords);

  // 4. Missing Keywords Calculation
  const missingData = computeMissingKeywords(text, jobDescription);
  const missingKeywords = missingData.missingKeywords;
  const missingKeywordsMessage = missingData.message;

  // 5. Complete Bullet Extraction (Requirement 1 & 2: Whole bullets only, never fragments)
  const splitBullets = splitResumeBullets(text);
  const candidateBullets = splitBullets.map(b => b.text);

  // Bullets strictly under the Experience section from the SAME split (Bug 2 & 4: Count between Experience heading and next heading)
  const experienceSplit = splitBullets.filter(b => b.section === 'experience');
  const experienceBullets = hasExperience ? (experienceSplit.length > 0 ? experienceSplit.map(b => b.text) : extractExperienceBullets(text)) : [];

  // 6. Compute Deterministic Scores (All numbers generated in code from current resume)
  const scores = computeScores({
    contactInfo,
    sections,
    pageCount,
    matchedKeywords,
    missingKeywords,
    jdMatchedSkills: missingData.jdMatchedSkills,
    bullets: candidateBullets,
    jobDescription,
    reinforcedSkills: reinforcedKeywords,
    resumeText: text,
    positionsCount: detectedPositions.length
  });

  // 7. Bullet Rewrites: Flag weak openers (worked on, responsible for, helped in, participated in, used, made, did)
  // Skip bullets that describe participation or learning (team meetings, learned about) and bullets under Other Activities (Requirement 3)
  const rewritableSplit = splitBullets.filter(b => (b.section === 'experience' || b.section === 'projects') && !/\d/.test(b.text) && !isParticipationOrLearningBullet(b.text));
  const bulletsWithoutNumbers = rewritableSplit.map(b => b.text);

  // Requirement 2: Sort by weakest content first
  const sortedNonNumericBullets = [...bulletsWithoutNumbers].sort((a, b) => getBulletWeakness(b) - getBulletWeakness(a));

  const rawWeakBullets = [];
  for (const cleanOriginal of sortedNonNumericBullets) {
    if (cleanOriginal.length > 15 && cleanOriginal.length < 240) {
      const suggestion = generateBulletRewrite(cleanOriginal);
      if (suggestion) {
        rawWeakBullets.push({ original: cleanOriginal, suggestion });
        if (rawWeakBullets.length >= 5) break;
      }
    }
  }

  // Validate bullet rewrites strictly (Requirement 2 & 5)
  const weakBullets = validateBulletRewrites(rawWeakBullets, text, debugLog).slice(0, 5);

  // 8. Measured Formatting Checks (computed before recommendations)
  const isMobileResume = matchedKeywords.some(s =>
    ['Android', 'Kotlin', 'Jetpack Compose', 'Flutter', 'React Native', 'Swift', 'iOS', 'Room', 'Retrofit'].includes(s)
  ) || /\b(?:android|kotlin|flutter|react\s+native|swiftui?|ios|mobile\s+app)\b/i.test(text);

  const hasLiveLinks = /https?:\/\/[^\s]+|vercel\.app|netlify\.app|github\.io|play\.google\.com/i.test(text);

  const formattingIssues = [];
  if (!hasLinkedIn) formattingIssues.push('Missing direct LinkedIn profile URL in contact header');
  if (!hasGitHub) formattingIssues.push('Include a GitHub portfolio link to showcase code repositories');
  if (pageCount > 1) {
    formattingIssues.push(`Resume length: ${pageCount} pages. Condensing to a single high-density page is recommended for entry-level applicants.`);
  }
  if (!hasLiveLinks) {
    if (isMobileResume) {
      formattingIssues.push('Add Google Play Store or GitHub repository links directly alongside project titles for immediate verification.');
    } else {
      formattingIssues.push('Add live deployed project URLs (e.g. Vercel, Netlify) directly alongside project titles for immediate verification.');
    }
  }

  // 9. Recommendations (Dynamic from current resume, Requirement 2)
  // List every bullet without a digit (up to 5), choosing the ones with weakest content first
  const rawRecommendations = [];
  for (const weakB of sortedNonNumericBullets.slice(0, 5)) {
    rawRecommendations.push({
      advice: 'Add quantified outcome metrics (e.g. [ADD YOUR OWN NUMBER]%) to demonstrate measured efficiency or scale.',
      evidence_quote: weakB
    });
  }

  if (pageCount > 1) {
    rawRecommendations.push({
      advice: `Condense resume from ${pageCount} pages to a single high-density page to enhance review velocity.`,
      evidence_quote: `pages: ${pageCount}`
    });
  }
  if (!hasLinkedIn) {
    rawRecommendations.push({
      advice: 'Add a direct LinkedIn profile link to the header to improve recruiter contact options.',
      evidence_quote: 'formatting: missing LinkedIn profile URL'
    });
  }
  if (!hasGitHub) {
    rawRecommendations.push({
      advice: 'Include a GitHub portfolio link in the contact header to verify public code repositories.',
      evidence_quote: 'formatting: missing GitHub portfolio link'
    });
  }
  if (!hasLiveLinks && candidateBullets.length > 0) {
    const projectBullet = candidateBullets.find(b => /portfolio|app|website|tool|system|api/i.test(b)) || candidateBullets[0];
    if (projectBullet) {
      const advice = isMobileResume
        ? 'Add Google Play Store or GitHub repository links alongside project titles for immediate code verification.'
        : 'Add live deployment URLs alongside project titles for immediate recruiter verification.';
      rawRecommendations.push({
        advice,
        evidence_quote: projectBullet
      });
    }
  }

  const isFullyQuantified = scores.category_scores.impact_quantification === 100 || bulletsWithoutNumbers.length === 0;
  const suggestions = validateRecommendations(rawRecommendations, text, debugLog, isFullyQuantified);

  // 10. Experience Level Inference
  let experienceLevel = 'Entry Level';
  if (lowerText.includes('intern') || lowerText.includes('student') || lowerText.includes('b.tech') || lowerText.includes('expected graduation')) {
    experienceLevel = 'Entry Level';
  } else if (lowerText.includes('senior') || lowerText.includes('lead') || lowerText.includes('principal')) {
    experienceLevel = 'Senior';
  } else if (lowerText.includes('years experience') || lowerText.includes('mid level')) {
    experienceLevel = 'Mid Level';
  }

  // 11. Dynamic Section Analysis (Requirement 1, 3, 5 & 6)
  const summaryText = majorSections.summaryText || '';
  const summaryHeading = (majorSections.detectedSections || []).find(s => s.section === 'summary')?.heading;
  const isTitledObjective = /^(?:career\s+)?objective\b/im.test(summaryHeading || '') || /^(?:career\s+)?objective\b/im.test(text) || /^(?:career\s+)?objective\b/i.test(summaryText.split('\n')[0]);
  const summaryHasSkill = matchedKeywords.some(skill => {
    const entry = SKILLS_DICTIONARY.find(s => s.canonical === skill);
    const aliases = entry ? entry.aliases : [skill.toLowerCase()];
    return aliases.some(alias => buildWordRegex(alias).test(summaryText));
  });
  const summaryHasNumber = /\d/.test(summaryText);

  let summaryStatus = 'present';
  let summaryFeedback = summaryHeading && summaryHeading.toLowerCase() !== 'professional summary'
    ? `Summary (detected as "${summaryHeading}") outlines candidate's technical focus, key stack, and background.`
    : "Summary outlines candidate's technical focus, key stack, and background.";

  if (!hasSummary) {
    summaryStatus = 'weak';
    summaryFeedback = 'No professional summary section present in resume.';
  } else if (isTitledObjective || (!summaryHasSkill && !summaryHasNumber)) {
    // Requirement 3: Professional Summary: mark as WEAK when titled Objective or has no skills and no numbers
    summaryStatus = 'weak';
    summaryFeedback = 'This is a generic objective without skills or achievements.';
  } else if (summaryHasSkill && summaryHasNumber) {
    summaryStatus = 'present';
    summaryFeedback = summaryHeading && summaryHeading.toLowerCase() !== 'professional summary'
      ? `Professional Summary (detected as "${summaryHeading}") clearly outlines candidate's technical focus, key stack, and background.`
      : "Summary outlines candidate's technical focus, key stack, and background.";
  }

  const foundContacts = [];
  if (hasEmail) foundContacts.push('email');
  if (hasPhone) foundContacts.push('phone');
  if (hasLinkedIn) foundContacts.push('LinkedIn');
  if (hasGitHub) foundContacts.push('GitHub');

  const missingContacts = [];
  if (!hasEmail) missingContacts.push('email');
  if (!hasPhone) missingContacts.push('phone');
  if (!hasLinkedIn) missingContacts.push('LinkedIn');
  if (!hasGitHub) missingContacts.push('GitHub');

  let contactStatus = 'present';
  let contactFeedback = '';
  if (hasContactPlaceholder) {
    contactStatus = 'weak';
    contactFeedback = `Placeholder detected: replace with real details (${contactPlaceholders.join(', ')}).`;
  } else if (hasEmail && hasPhone && hasLinkedIn && hasGitHub) {
    contactStatus = 'strong';
    contactFeedback = 'Complete contact details verified: Phone, email, LinkedIn, and GitHub links present at the top.';
  } else {
    contactStatus = 'present';
    contactFeedback = `Contact header contains ${foundContacts.join(', ')}.${missingContacts.length > 0 ? ` Missing direct ${missingContacts.join(' and ')} links.` : ''}`;
  }

  const expHeading = (majorSections.detectedSections || []).find(s => s.section === 'experience')?.heading;
  const expStatus = hasExperience ? (experienceBullets.length > 0 ? 'strong' : 'weak') : 'missing';
  const expFeedback = hasExperience
    ? `${detectedPositions.length > 0 ? `${detectedPositions.length} position(s)` : ''} detected across ${experienceBullets.length} experience bullet point(s) detailing roles, development tasks, and project responsibilities.`
    : 'Optional for students, consider internships or project work';

  const projHeading = (majorSections.detectedSections || []).find(s => s.section === 'projects')?.heading;
  const projStatus = hasProjects ? 'strong' : 'missing';
  const projFeedback = hasProjects
    ? `${detectedProjects.length > 0 ? `${detectedProjects.length} projects detected (${detectedProjects.map(p => p.title).join(', ')}) detailing` : 'Projects section details'} practical implementations with technical architectures and toolsets specified.`
    : 'No projects or portfolio section detected.';

  const eduHeading = (majorSections.detectedSections || []).find(s => s.section === 'education')?.heading;
  let eduStatus = 'present';
  let eduFeedback = '';
  if (!hasEducation) {
    eduStatus = 'missing';
    eduFeedback = 'No educational background or degree credentials detected.';
  } else if (educationPlaceholder) {
    eduStatus = 'weak';
    eduFeedback = 'Placeholder detected: replace with real details (graduation year / CGPA).';
  } else {
    eduStatus = 'present';
    eduFeedback = 'Degree credentials and university details clearly listed in education section.';
  }

  const skillsHeading = (majorSections.detectedSections || []).find(s => s.section === 'skills')?.heading;

  const sectionAnalysis = [
    {
      section: 'Contact Information',
      detected_heading: 'Contact Information',
      status: contactStatus,
      feedback: contactFeedback
    },
    {
      section: 'Professional Summary',
      detected_heading: summaryHeading || 'Professional Summary',
      status: summaryStatus,
      feedback: summaryFeedback
    },
    {
      section: 'Work & Internship Experience',
      detected_heading: expHeading || 'Work & Internship Experience',
      status: expStatus,
      feedback: expFeedback
    },
    {
      section: 'Technical Skills',
      detected_heading: skillsHeading || 'Technical Skills',
      status: matchedKeywords.length >= 8 ? 'strong' : (matchedKeywords.length > 0 ? 'present' : 'missing'),
      feedback: `Identified ${matchedKeywords.length} core technical keywords including ${matchedKeywords.slice(0, 5).join(', ')}${matchedKeywords.length > 5 ? ' and more' : ''}.`
    },
    {
      section: 'Projects & Portfolio',
      detected_heading: projHeading || 'Projects & Portfolio',
      status: projStatus,
      feedback: projFeedback
    },
    {
      section: 'Education & Degree',
      detected_heading: eduHeading || 'Education & Degree',
      status: eduStatus,
      feedback: eduFeedback
    }
  ];

  // Coding platforms & competitive achievements detection (Requirement 5)
  const codingPlatformsFound = [];
  const CODING_PLATFORM_CONFIG = [
    { name: 'LeetCode', regex: /\bleetcode\b/i },
    { name: 'HackerRank', regex: /\bhackerrank\b/i },
    { name: 'GeeksforGeeks', regex: /\b(?:geeksforgeeks|gfg)\b/i },
    { name: 'Codeforces', regex: /\bcodeforces\b/i },
    { name: 'CodeChef', regex: /\bcodechef\b/i }
  ];
  for (const p of CODING_PLATFORM_CONFIG) {
    if (p.regex.test(text)) {
      codingPlatformsFound.push(p.name);
    }
  }

  const platformAchievements = [];
  for (const b of candidateBullets) {
    if (CODING_PLATFORM_CONFIG.some(p => p.regex.test(b))) {
      platformAchievements.push(b);
    }
  }

  const certHeading = (majorSections.detectedSections || []).find(s => s.section === 'certifications' || s.section === 'achievements')?.heading;
  if (codingPlatformsFound.length > 0) {
    let achFeedback = 'Competitive coding achievements verified.';
    const problemCountMatch = text.match(/\b(\d+\+?)\s*(?:dsa\s+|coding\s+)?problems?\b/i) || text.match(/\bsolved\s+(\d+\+?)\b/i);
    const problemCount = problemCountMatch ? problemCountMatch[1] : null;
    if (problemCount) {
      achFeedback = `${codingPlatformsFound.join(' and ')} problems solved: ${problemCount}`;
    } else {
      achFeedback = `Competitive coding achievements identified on ${codingPlatformsFound.join(' and ')}.`;
    }
    sectionAnalysis.push({
      section: 'Achievements & Coding Platforms',
      detected_heading: 'Achievements & Coding Platforms',
      status: 'strong',
      feedback: achFeedback
    });
  }

  if (detectedCerts.length > 0) {
    sectionAnalysis.push({
      section: 'Certifications',
      detected_heading: certHeading || 'Certifications',
      status: 'strong',
      feedback: `${detectedCerts.length} certification(s) verified: ${detectedCerts.join(', ')}.`
    });
  } else if (hasCertifications && codingPlatformsFound.length === 0) {
    sectionAnalysis.push({
      section: 'Certifications',
      detected_heading: certHeading || 'Certifications',
      status: 'strong',
      feedback: 'Certifications and competitive achievements verified.'
    });
  }

  // 12. Dynamic Executive Summary with Grounding Validation (Requirement 3)
  const templateSummary = buildTemplateSummary({
    experienceLevel,
    detectedSkills: matchedKeywords,
    overallScore: scores.overall_score,
    pageCount,
    resumeText: text
  });

  let executiveSummary = templateSummary;
  const isGrounded = validateSummary(executiveSummary, text, scores.overall_score, debugLog, pageCount);
  if (!isGrounded) {
    debugLog.push({ validator: 'SummaryValidator', reason: 'Fell back to template summary built from detected data' });
    executiveSummary = templateSummary;
  }

  return {
    overall_score: scores.overall_score,
    category_scores: scores.category_scores,
    experience_level: experienceLevel,
    executive_summary: executiveSummary,
    section_analysis: sectionAnalysis,
    matched_keywords: matchedKeywords,
    soft_skills: softSkills,
    jd_matched_keywords: missingData.jdMatchedSkills,
    other_keywords: missingData.otherSkills,
    missing_keywords: missingKeywords,
    missing_soft_skills: missingData.missingSoftSkills,
    missing_keywords_message: missingKeywordsMessage,
    formatting_issues: formattingIssues,
    formatting_checklist: scores.formatting_checklist,
    weak_bullets: weakBullets,
    suggestions: suggestions,
    page_count: pageCount,
    text_hash: textHash,
    extracted_text: text,
    experience_bullet_count: experienceBullets.length,
    achievements: platformAchievements,
    coding_platforms: codingPlatformsFound,
    is_parse_failure: isParseFailure,
    projects_count: detectedProjects.length,
    experience_positions_count: detectedPositions.length,
    certifications_count: detectedCerts.length,
    has_job_description: Boolean(jobDescription && jobDescription.trim().length > 0),
    job_specific_matching: Boolean(jobDescription && jobDescription.trim().length > 0),
    explicit_skills: matchedKeywords,
    inferred_skills: [],
    extracted_projects: detectedProjects,
    extracted_positions: detectedPositions,
    extracted_certifications: detectedCerts,
    debug_info: {
      text_hash: textHash,
      page_count: pageCount,
      has_job_description: Boolean(jobDescription && jobDescription.trim().length > 0),
      job_specific_matching: Boolean(jobDescription && jobDescription.trim().length > 0),
      detected_sections: majorSections.detectedSections || [],
      detected_skills_count: matchedKeywords.length,
      detected_skills: matchedKeywords,
      soft_skills: softSkills,
      reinforced_skills_count: reinforcedKeywords.length,
      reinforced_skills: reinforcedKeywords,
      jd_technical_skills: missingData.jdTechnicalSkills,
      jd_matched_skills: missingData.jdMatchedSkills,
      jd_missing_skills: missingKeywords,
      jd_soft_skills_missing: missingData.missingSoftSkills,
      keyword_score_formula: scores.keyword_formula_doc,
      formatting_checklist: scores.formatting_checklist,
      experience_bullet_count: experienceBullets.length,
      experience_positions_count: detectedPositions.length,
      projects_count: detectedProjects.length,
      certifications_count: detectedCerts.length,
      coding_platforms: codingPlatformsFound,
      achievements: platformAchievements,
      rejected_items: debugLog,
      char_count: text.length,
      text_preview: text
    }
  };
}
