// ═══════════════════════════════════════════════════════════════════════════════
// Intelligent Client-Side Skill Gap Analysis Engine
// Matches resume text against target role taxonomy, calculates readiness score,
// detects matched/missing skills, and suggests actionable next steps.
// ═══════════════════════════════════════════════════════════════════════════════

export const ROLE_SKILLS = {
  "Frontend Developer": [
    { skill: "React", importance_weight: 95, category: "technical", why_it_matters: "The dominant UI library in modern frontend; required in 80%+ of frontend JDs." },
    { skill: "TypeScript", importance_weight: 90, category: "technical", why_it_matters: "Production codebases rely on TypeScript for type safety and team scalability." },
    { skill: "CSS / Tailwind", importance_weight: 85, category: "technical", why_it_matters: "Pixel-perfect UI implementation is a core deliverable in frontend roles." },
    { skill: "JavaScript", importance_weight: 95, category: "technical", why_it_matters: "Foundational language for all web frontend work." },
    { skill: "REST APIs", importance_weight: 80, category: "technical", why_it_matters: "Frontend devs must integrate with backend services daily." },
    { skill: "Git", importance_weight: 85, category: "tool", why_it_matters: "Version control is non-negotiable in any team environment." },
    { skill: "Testing (Jest/RTL)", importance_weight: 70, category: "technical", why_it_matters: "Signals you write code others can trust and maintain." },
    { skill: "Performance Optimization", importance_weight: 65, category: "technical", why_it_matters: "Core Web Vitals directly impact product metrics; senior roles require this." },
    { skill: "Responsive Design", importance_weight: 80, category: "technical", why_it_matters: "Mobile-first is the default expectation in modern web engineering." },
    { skill: "State Management", importance_weight: 75, category: "technical", why_it_matters: "Complex apps require Redux, Zustand, or Context — interviewers test this explicitly." },
  ],
  "Backend Developer": [
    { skill: "Node.js", importance_weight: 90, category: "technical", why_it_matters: "Most common backend runtime for JS/TS stacks." },
    { skill: "Python", importance_weight: 85, category: "technical", why_it_matters: "Dominant language for backend services, automation, and microservices." },
    { skill: "REST API Design", importance_weight: 90, category: "technical", why_it_matters: "Designing clean, versioned APIs is the core output of a backend developer." },
    { skill: "SQL / PostgreSQL", importance_weight: 88, category: "technical", why_it_matters: "Relational databases underpin most production systems." },
    { skill: "Docker", importance_weight: 80, category: "tool", why_it_matters: "Containerisation is the deployment standard; expected at mid-level." },
    { skill: "Authentication / JWT", importance_weight: 85, category: "technical", why_it_matters: "Every product with users requires secure auth — it's a table-stakes skill." },
    { skill: "Git", importance_weight: 85, category: "tool", why_it_matters: "Version control is non-negotiable in any team environment." },
    { skill: "Testing (unit/integration)", importance_weight: 75, category: "technical", why_it_matters: "Reliable backends require test coverage; hiring managers check for this." },
    { skill: "Message Queues (Redis/RabbitMQ)", importance_weight: 65, category: "technical", why_it_matters: "Async processing patterns appear in almost every scaled system." },
    { skill: "System Design", importance_weight: 80, category: "technical", why_it_matters: "Mid-level+ backend roles interview heavily on system design." },
  ],
  "Full Stack Developer": [
    { skill: "React", importance_weight: 90, category: "technical", why_it_matters: "The dominant UI framework for full-stack roles." },
    { skill: "Node.js", importance_weight: 88, category: "technical", why_it_matters: "Unified JS runtime for frontend and backend reduces context switching." },
    { skill: "TypeScript", importance_weight: 85, category: "technical", why_it_matters: "Required in modern full-stack codebases for maintainability." },
    { skill: "SQL / PostgreSQL", importance_weight: 85, category: "technical", why_it_matters: "Data persistence is foundational for any full-stack application." },
    { skill: "REST APIs", importance_weight: 88, category: "technical", why_it_matters: "Full-stack devs build and consume APIs — both sides matter." },
    { skill: "Docker", importance_weight: 75, category: "tool", why_it_matters: "Containerised local dev and deployment is the current standard." },
    { skill: "Git", importance_weight: 88, category: "tool", why_it_matters: "Version control is non-negotiable." },
    { skill: "Authentication", importance_weight: 80, category: "technical", why_it_matters: "Every app with users needs secure auth." },
    { skill: "Cloud (AWS/GCP/Azure)", importance_weight: 70, category: "tool", why_it_matters: "Full-stack devs are expected to deploy and manage their own services." },
    { skill: "Testing", importance_weight: 72, category: "technical", why_it_matters: "Full-stack roles require confidence across the entire stack." },
  ],
  "Data Analyst": [
    { skill: "SQL", importance_weight: 98, category: "technical", why_it_matters: "SQL is the single most important skill for any data analyst." },
    { skill: "Python", importance_weight: 85, category: "technical", why_it_matters: "pandas, numpy, and matplotlib are the standard analysis toolkit." },
    { skill: "Data Visualization", importance_weight: 88, category: "technical", why_it_matters: "Communicating insights through charts is a core analyst deliverable." },
    { skill: "Excel / Google Sheets", importance_weight: 80, category: "tool", why_it_matters: "Still widely used in business analytics; expected at entry level." },
    { skill: "Statistics", importance_weight: 85, category: "technical", why_it_matters: "Understanding distributions, significance, and bias is essential." },
    { skill: "Power BI / Tableau", importance_weight: 78, category: "tool", why_it_matters: "BI tools are the primary reporting interface in most companies." },
    { skill: "A/B Testing", importance_weight: 72, category: "technical", why_it_matters: "Product and growth teams rely on analysts to interpret experiments." },
    { skill: "Data Cleaning / ETL", importance_weight: 82, category: "technical", why_it_matters: "80% of real-world analysis time is spent cleaning data." },
    { skill: "Business Acumen", importance_weight: 75, category: "soft", why_it_matters: "Translating data findings into business decisions." },
    { skill: "Communication", importance_weight: 80, category: "soft", why_it_matters: "Presenting findings to non-technical stakeholders." },
  ],
  "ML Engineer": [
    { skill: "Python", importance_weight: 98, category: "technical", why_it_matters: "Python is the de facto language of machine learning — non-negotiable." },
    { skill: "Machine Learning (scikit-learn)", importance_weight: 92, category: "technical", why_it_matters: "Core ML algorithms and pipelines are the foundation of the role." },
    { skill: "Deep Learning (PyTorch/TensorFlow)", importance_weight: 88, category: "technical", why_it_matters: "Neural networks underpin most modern ML products." },
    { skill: "Mathematics (Linear Algebra, Calculus, Stats)", importance_weight: 85, category: "technical", why_it_matters: "Understanding what models are doing requires mathematical intuition." },
    { skill: "Data Processing (pandas/numpy)", importance_weight: 90, category: "technical", why_it_matters: "ML is 80% data preparation." },
    { skill: "MLOps / Model Deployment", importance_weight: 80, category: "technical", why_it_matters: "Models that can't be deployed reliably create no business value." },
    { skill: "SQL", importance_weight: 75, category: "technical", why_it_matters: "Training data lives in databases; SQL is required to access it." },
    { skill: "Git", importance_weight: 80, category: "tool", why_it_matters: "Experiment tracking and code versioning are essential." },
    { skill: "LLMs / Prompt Engineering", importance_weight: 82, category: "technical", why_it_matters: "LLM integration is now a core expectation in most AI product teams." },
    { skill: "Cloud ML (AWS SageMaker/GCP Vertex)", importance_weight: 72, category: "tool", why_it_matters: "Production ML runs on cloud infrastructure." },
  ],
  "DevOps Engineer": [
    { skill: "Docker", importance_weight: 95, category: "tool", why_it_matters: "Containerisation is the baseline for modern infrastructure." },
    { skill: "Kubernetes", importance_weight: 90, category: "tool", why_it_matters: "Container orchestration at scale is the core DevOps competency." },
    { skill: "CI/CD (GitHub Actions/Jenkins)", importance_weight: 92, category: "tool", why_it_matters: "Automated delivery pipelines are the primary output of a DevOps role." },
    { skill: "Cloud (AWS/GCP/Azure)", importance_weight: 95, category: "tool", why_it_matters: "All modern infrastructure runs on cloud platforms." },
    { skill: "Linux / Shell Scripting", importance_weight: 90, category: "technical", why_it_matters: "Servers run Linux; shell scripting is how you automate them." },
    { skill: "Infrastructure as Code (Terraform)", importance_weight: 85, category: "tool", why_it_matters: "IaC is how you manage cloud infra reliably at scale." },
    { skill: "Monitoring (Prometheus/Grafana)", importance_weight: 80, category: "tool", why_it_matters: "You can't operate what you can't observe." },
    { skill: "Networking (DNS, Load Balancing)", importance_weight: 82, category: "technical", why_it_matters: "Understanding traffic routing is essential." },
    { skill: "Security (IAM, secrets management)", importance_weight: 78, category: "technical", why_it_matters: "DevSecOps practices are now expected at mid-level." },
    { skill: "Git", importance_weight: 85, category: "tool", why_it_matters: "Everything is code in DevOps — version control is fundamental." },
  ],
  "Product Manager": [
    { skill: "Product Roadmapping", importance_weight: 92, category: "soft", why_it_matters: "Defining and communicating what gets built and when." },
    { skill: "User Research / Interviews", importance_weight: 88, category: "soft", why_it_matters: "Good PMs build from evidence, not assumptions." },
    { skill: "Data Analysis / SQL", importance_weight: 80, category: "technical", why_it_matters: "Self-service data access lets PMs make faster, better decisions." },
    { skill: "A/B Testing", importance_weight: 82, category: "technical", why_it_matters: "Experiment-driven product development is the industry standard." },
    { skill: "Wireframing (Figma)", importance_weight: 78, category: "tool", why_it_matters: "PMs who can sketch flows communicate more precisely." },
    { skill: "Stakeholder Management", importance_weight: 88, category: "soft", why_it_matters: "Aligning engineering, design, marketing, and leadership." },
    { skill: "Agile / Scrum", importance_weight: 85, category: "soft", why_it_matters: "Most engineering teams run agile; PMs must speak the same language." },
    { skill: "PRD Writing", importance_weight: 85, category: "soft", why_it_matters: "Clear written specs prevent misbuilds and wasted engineering time." },
    { skill: "Metrics Definition (OKRs/KPIs)", importance_weight: 87, category: "soft", why_it_matters: "PMs are measured by outcomes, not outputs." },
    { skill: "Competitive Analysis", importance_weight: 72, category: "soft", why_it_matters: "Understanding the market landscape informs smarter prioritisation." },
  ],
  "UI/UX Designer": [
    { skill: "Figma", importance_weight: 98, category: "tool", why_it_matters: "The industry-standard design tool — required in virtually every design JD." },
    { skill: "User Research", importance_weight: 90, category: "soft", why_it_matters: "Design without research is guessing." },
    { skill: "Wireframing & Prototyping", importance_weight: 92, category: "technical", why_it_matters: "Core deliverables of every design role." },
    { skill: "Design Systems", importance_weight: 85, category: "technical", why_it_matters: "Scalable products require consistent component libraries." },
    { skill: "Usability Testing", importance_weight: 85, category: "soft", why_it_matters: "Validating designs before engineering builds them saves significant cost." },
    { skill: "Accessibility (WCAG)", importance_weight: 78, category: "technical", why_it_matters: "Inclusive design is essential in modern digital products." },
    { skill: "Visual Design (Typography, Color)", importance_weight: 88, category: "technical", why_it_matters: "Aesthetics drive conversion; visual polish is key." },
    { skill: "HTML / CSS basics", importance_weight: 65, category: "technical", why_it_matters: "Designers who understand implementation constraints make better handoffs." },
    { skill: "Information Architecture", importance_weight: 80, category: "technical", why_it_matters: "Navigation and content structure directly impact usability." },
    { skill: "Communication / Presentation", importance_weight: 82, category: "soft", why_it_matters: "Design decisions must be defended to stakeholders." },
  ],
  "Data Scientist": [
    { skill: "Python", importance_weight: 98, category: "technical", why_it_matters: "The primary language for data science work." },
    { skill: "Statistics & Probability", importance_weight: 95, category: "technical", why_it_matters: "Statistical reasoning is the foundation of credible data science." },
    { skill: "Machine Learning", importance_weight: 92, category: "technical", why_it_matters: "Building predictive models is the core output of data science." },
    { skill: "SQL", importance_weight: 88, category: "technical", why_it_matters: "Data lives in databases; SQL is required to access and explore it." },
    { skill: "Data Visualization", importance_weight: 85, category: "technical", why_it_matters: "Communicating findings clearly is as important as finding them." },
    { skill: "Feature Engineering", importance_weight: 85, category: "technical", why_it_matters: "Good features outperform fancy algorithms." },
    { skill: "Experimentation / A/B Testing", importance_weight: 82, category: "technical", why_it_matters: "Causal inference from experiments creates product impact." },
    { skill: "Deep Learning", importance_weight: 75, category: "technical", why_it_matters: "Unstructured data requires neural network approaches." },
    { skill: "Communication", importance_weight: 85, category: "soft", why_it_matters: "Insights that can't be communicated create no value." },
    { skill: "Business Acumen", importance_weight: 80, category: "soft", why_it_matters: "Understanding business context helps ask better questions." },
  ],
  "Cloud Architect": [
    { skill: "AWS / GCP / Azure", importance_weight: 98, category: "tool", why_it_matters: "Deep expertise in at least one cloud provider is the role's foundation." },
    { skill: "Networking (VPC, DNS, CDN)", importance_weight: 92, category: "technical", why_it_matters: "Architects design network topology — this is non-negotiable." },
    { skill: "Security & IAM", importance_weight: 90, category: "technical", why_it_matters: "Cloud security is critical; architects own it." },
    { skill: "Infrastructure as Code (Terraform/CDK)", importance_weight: 92, category: "tool", why_it_matters: "IaC is how architects encode reproducible systems." },
    { skill: "Kubernetes", importance_weight: 85, category: "tool", why_it_matters: "Container orchestration is the compute layer for modern cloud." },
    { skill: "Cost Optimisation", importance_weight: 80, category: "technical", why_it_matters: "Architects are accountable for the cloud budget." },
    { skill: "Microservices Architecture", importance_weight: 88, category: "technical", why_it_matters: "Distributed systems design is the dominant pattern." },
    { skill: "Databases (SQL + NoSQL)", importance_weight: 82, category: "technical", why_it_matters: "Choosing the right data store for each workload." },
    { skill: "Observability (logging, tracing)", importance_weight: 80, category: "technical", why_it_matters: "Complex distributed systems require deep observability." },
    { skill: "System Design", importance_weight: 95, category: "technical", why_it_matters: "Architects interview heavily on large-scale system design." },
  ],
  "Android Developer": [
    { skill: "Kotlin", importance_weight: 98, category: "technical", why_it_matters: "Google's preferred language for Android — required in every Android JD." },
    { skill: "Jetpack Compose", importance_weight: 90, category: "technical", why_it_matters: "The modern Android UI toolkit; legacy XML is being phased out." },
    { skill: "Android SDK", importance_weight: 95, category: "technical", why_it_matters: "Understanding Activities, Fragments, and lifecycle is table stakes." },
    { skill: "MVVM Architecture", importance_weight: 85, category: "technical", why_it_matters: "Clean architecture patterns are expected in production-grade Android apps." },
    { skill: "REST APIs / Retrofit", importance_weight: 85, category: "technical", why_it_matters: "Almost every app communicates with a backend." },
    { skill: "Coroutines / Flow", importance_weight: 82, category: "technical", why_it_matters: "Async programming in Android requires Kotlin Coroutines." },
    { skill: "Room Database", importance_weight: 75, category: "technical", why_it_matters: "Local persistence is required in most non-trivial apps." },
    { skill: "Git", importance_weight: 85, category: "tool", why_it_matters: "Version control is non-negotiable." },
    { skill: "Testing (JUnit/Espresso)", importance_weight: 70, category: "technical", why_it_matters: "Automated testing signals production-readiness." },
    { skill: "Play Store Publishing", importance_weight: 65, category: "tool", why_it_matters: "Understanding the release pipeline." },
  ],
  "iOS Developer": [
    { skill: "Swift", importance_weight: 98, category: "technical", why_it_matters: "Apple's primary language for iOS development." },
    { skill: "SwiftUI", importance_weight: 90, category: "technical", why_it_matters: "Apple's modern declarative UI framework." },
    { skill: "UIKit", importance_weight: 85, category: "technical", why_it_matters: "Most existing codebases use UIKit." },
    { skill: "Xcode", importance_weight: 92, category: "tool", why_it_matters: "The standard IDE for iOS development." },
    { skill: "REST APIs / URLSession", importance_weight: 85, category: "technical", why_it_matters: "Networking is a core skill for any app." },
    { skill: "Core Data / SwiftData", importance_weight: 75, category: "technical", why_it_matters: "Local persistence is required in most apps." },
    { skill: "MVVM / Clean Architecture", importance_weight: 82, category: "technical", why_it_matters: "Clean patterns separate junior and senior developers." },
    { skill: "Git", importance_weight: 85, category: "tool", why_it_matters: "Version control is non-negotiable." },
    { skill: "Testing (XCTest)", importance_weight: 70, category: "technical", why_it_matters: "Testing signals production-ready code quality." },
    { skill: "App Store Publishing", importance_weight: 65, category: "tool", why_it_matters: "Release process and certificates." },
  ],
  "Cybersecurity Analyst": [
    { skill: "Network Security", importance_weight: 95, category: "technical", why_it_matters: "Understanding how networks are defended is foundational." },
    { skill: "SIEM Tools (Splunk/QRadar)", importance_weight: 88, category: "tool", why_it_matters: "SOC work revolves around SIEM platforms." },
    { skill: "Penetration Testing", importance_weight: 85, category: "technical", why_it_matters: "Offensive security skills enhance defensive capabilities." },
    { skill: "Incident Response", importance_weight: 90, category: "technical", why_it_matters: "Responding to breaches quickly and accurately." },
    { skill: "Linux", importance_weight: 88, category: "technical", why_it_matters: "Most security tools run in Linux environments." },
    { skill: "Python / Scripting", importance_weight: 80, category: "technical", why_it_matters: "Automating threat hunting and analysis tasks." },
    { skill: "Vulnerability Assessment", importance_weight: 85, category: "technical", why_it_matters: "Identifying weaknesses proactively." },
    { skill: "Compliance (ISO 27001 / NIST)", importance_weight: 75, category: "technical", why_it_matters: "Enterprise security compliance frameworks." },
    { skill: "Threat Intelligence", importance_weight: 78, category: "technical", why_it_matters: "Enables proactive rather than reactive defence." },
    { skill: "Communication", importance_weight: 80, category: "soft", why_it_matters: "Presenting risk findings clearly to leadership." },
  ]
};

const SYNONYMS = {
  "javascript": ["js", "es6", "es2015", "ecmascript", "vanilla js"],
  "typescript": ["ts"],
  "python": ["py"],
  "react": ["react.js", "reactjs", "react js"],
  "node.js": ["node", "nodejs", "node js"],
  "sql / postgresql": ["sql", "postgres", "postgresql", "mysql", "database", "sqlite"],
  "sql": ["postgres", "postgresql", "mysql", "sqlite", "database queries", "queries"],
  "css / tailwind": ["css", "tailwind", "tailwindcss", "sass", "scss", "styled-components"],
  "rest apis": ["rest", "restful", "api", "http", "fetch", "axios", "endpoints"],
  "rest api design": ["rest", "restful api", "api design", "openapi", "swagger"],
  "git": ["github", "gitlab", "bitbucket", "version control"],
  "docker": ["containerisation", "containers", "dockerfile", "docker compose"],
  "kubernetes": ["k8s", "container orchestration"],
  "machine learning (scikit-learn)": ["machine learning", "ml", "scikit", "sklearn"],
  "deep learning (pytorch/tensorflow)": ["deep learning", "pytorch", "tensorflow", "keras", "neural network"],
  "data processing (pandas/numpy)": ["pandas", "numpy", "data processing"],
  "testing (jest/rtl)": ["jest", "testing", "unit test", "react testing library", "rtl"],
  "testing (unit/integration)": ["testing", "unit test", "integration test", "jest", "mocha", "pytest"],
  "cloud (aws/gcp/azure)": ["aws", "azure", "gcp", "cloud", "amazon web services", "google cloud"],
  "aws / gcp / azure": ["aws", "azure", "gcp", "cloud"],
  "ci/cd (github actions/jenkins)": ["ci/cd", "github actions", "jenkins", "cicd", "continuous integration"],
  "infrastructure as code (terraform)": ["terraform", "iac", "infrastructure as code", "cloudformation"],
  "infrastructure as code (terraform/cdk)": ["terraform", "iac", "cdk", "cloudformation"],
  "authentication / jwt": ["auth", "authentication", "jwt", "oauth", "sessions"],
  "authentication": ["auth", "jwt", "oauth", "oauth2", "session"],
  "state management": ["redux", "zustand", "context api", "recoil", "mobx"],
  "mathematics (linear algebra, calculus, stats)": ["linear algebra", "calculus", "statistics", "maths", "math"],
  "llms / prompt engineering": ["llm", "gpt", "openai", "langchain", "prompt engineering", "claude"],
  "data visualization": ["matplotlib", "seaborn", "plotly", "charts", "dashboards", "visualization"],
  "power bi / tableau": ["power bi", "tableau", "looker", "bi tools"],
  "linux / shell scripting": ["linux", "bash", "shell", "unix", "cli"],
  "linux": ["bash", "shell", "unix", "command line"],
  "kotlin": ["android", "kotlin language"],
  "swift": ["ios", "swift language"],
};

export function evaluateSkillGap(resumeText, role) {
  const roleRequirements = ROLE_SKILLS[role] || ROLE_SKILLS["Full Stack Developer"];
  const lowerResume = (resumeText || '').toLowerCase();

  const matched = [];
  const missing = [];

  for (const req of roleRequirements) {
    const skillNorm = req.skill.toLowerCase().trim();
    let isFound = lowerResume.includes(skillNorm);
    let matchedSnippet = '';

    if (!isFound) {
      const syns = SYNONYMS[skillNorm] || [];
      for (const syn of syns) {
        if (lowerResume.includes(syn)) {
          isFound = true;
          const idx = lowerResume.indexOf(syn);
          matchedSnippet = resumeText.slice(Math.max(0, idx - 20), Math.min(resumeText.length, idx + syn.length + 30)).trim();
          break;
        }
      }
    } else {
      const idx = lowerResume.indexOf(skillNorm);
      matchedSnippet = resumeText.slice(Math.max(0, idx - 20), Math.min(resumeText.length, idx + skillNorm.length + 30)).trim();
    }

    if (isFound) {
      matched.push({
        skill: req.skill,
        importance_weight: req.importance_weight,
        category: req.category,
        evidence: matchedSnippet || `Demonstrated knowledge of ${req.skill} mentioned in background.`,
      });
    } else {
      missing.push({
        skill: req.skill,
        importance_weight: req.importance_weight,
        category: req.category,
        why_it_matters: req.why_it_matters,
      });
    }
  }

  missing.sort((a, b) => b.importance_weight - a.importance_weight);

  const totalWeight = roleRequirements.reduce((s, r) => s + r.importance_weight, 0);
  const matchedWeight = matched.reduce((s, m) => s + m.importance_weight, 0);
  const readiness_score = Math.max(35, Math.min(96, Math.round((matchedWeight / totalWeight) * 100)));

  return {
    role,
    readiness_score,
    matched_skills: matched,
    missing_skills: missing,
    total_skills_required: roleRequirements.length,
  };
}

