// Lightweight, deterministic skill extraction from resume text.
// Keeps uploads fast and independent of the AI provider. Add/remove entries as needed.

const SKILL_VOCABULARY = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby",
  "Golang", "Rust", "Swift", "Kotlin", "Dart", "Scala", "Perl", "R",
  // Frontend
  "React", "React.js", "Next.js", "Vue.js", "Angular", "Svelte", "Redux",
  "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "Material UI",
  "React Native", "Flutter",
  // Backend
  "Node.js", "Express.js", "NestJS", "Django", "Flask", "FastAPI",
  "Spring Boot", "Laravel", "Ruby on Rails", ".NET", "ASP.NET",
  "GraphQL", "REST API", "WebSockets", "Microservices", "Serverless",
  // Databases
  "MongoDB", "MySQL", "PostgreSQL", "SQLite", "SQL", "Redis", "Firebase",
  "Elasticsearch", "Prisma", "Mongoose",
  // Cloud / DevOps
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform",
  "Ansible", "Jenkins", "CI/CD", "Nginx", "Linux", "Git", "GitHub",
  "GitLab", "Prometheus", "Grafana",
  // Testing / tooling
  "Jest", "Cypress", "Playwright", "Selenium", "Postman", "Webpack",
  "Vite", "Babel", "Jira", "Figma",
  // Auth / messaging
  "OAuth", "JWT", "Kafka", "RabbitMQ",
  // Data / AI
  "Machine Learning", "Deep Learning", "Data Analysis", "Pandas", "NumPy",
  "TensorFlow", "PyTorch", "OpenAI", "LLM",
  // Practices / soft skills
  "Agile", "Scrum", "Project Management", "Leadership", "Communication",
  "Teamwork", "Problem Solving", "Object-Oriented Programming",
  "Data Structures", "Algorithms", "MERN", "MEAN", "LAMP",
] as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Longest first so "React Native" wins over "React", "Tailwind CSS" over "CSS", etc.
const MATCHERS = SKILL_VOCABULARY.map((skill) => ({
  skill,
  regex: new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(skill)}(?![A-Za-z0-9])`, "i"),
})).sort((a, b) => b.skill.length - a.skill.length);

export function extractSkills(text: string): string[] {
  const found: string[] = [];

  for (const { skill, regex } of MATCHERS) {
    if (!regex.test(text)) continue;

    // Skip a shorter skill already covered by a longer match (e.g. "React" vs "React.js").
    const covered = found.some((match) => match.toLowerCase().includes(skill.toLowerCase()));
    if (!covered) found.push(skill);
  }

  return found;
}
