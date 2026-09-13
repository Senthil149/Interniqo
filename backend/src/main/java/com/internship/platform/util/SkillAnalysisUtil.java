package com.internship.platform.util;

import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Utility for skill normalization, skill-gap analysis, and explainable AI recommendation logic.
 *
 * Grounding rules:
 * 1. Never hallucinate skills or matching reasons — derive strictly from actual student profile
 *    and actual internship postings.
 * 2. Normalizes common aliases (e.g. JS -> JavaScript, ReactJS -> React, Spring -> Spring Boot)
 *    so comparisons are accurate and resilient.
 * 3. Clearly differentiates:
 *    - Matching strengths (proven skills, academic alignment, projects, work mode)
 *    - Skill gaps (required skills absent in the student's profile)
 *    - Preference / constraint matches (location, mode, duration, stipend)
 */
public final class SkillAnalysisUtil {

    private SkillAnalysisUtil() {}

    /**
     * Skill aliases map: lowercase alias -> canonical display name.
     */
    private static final Map<String, String> ALIAS_MAP = new LinkedHashMap<>();

    /**
     * Precompiled regex patterns for multi-word or boundary-sensitive skill scanning.
     */
    private static final Map<String, Pattern> SKILL_PATTERNS = new LinkedHashMap<>();

    static {
        // Programming Languages
        registerSkill("Java", "\\bjava\\b(?!script)");
        registerSkill("JavaScript", "\\b(javascript|js|java script)\\b");
        registerSkill("TypeScript", "\\b(typescript|ts)\\b");
        registerSkill("Python", "\\b(python|py)\\b");
        registerSkill("C++", "\\b(c\\+\\+|cpp)\\b");
        registerSkill("C#", "\\b(c#|csharp|c-sharp)\\b");
        registerSkill("Go", "\\b(golang|go)\\b");
        registerSkill("Rust", "\\b(rust)\\b");
        registerSkill("PHP", "\\b(php)\\b");
        registerSkill("Ruby", "\\b(ruby|rails|ruby on rails)\\b");
        registerSkill("Swift", "\\b(swift)\\b");
        registerSkill("Kotlin", "\\b(kotlin)\\b");
        registerSkill("Scala", "\\b(scala)\\b");
        registerSkill("R", "\\b(r language|r programming)\\b");
        registerSkill("SQL", "\\b(sql)\\b");

        // Frameworks & Libraries
        registerSkill("Spring Boot", "\\b(spring boot|springboot|spring-boot|spring framework|spring)\\b");
        registerSkill("React", "\\b(react|react\\.js|reactjs)(?! native)\\b");
        registerSkill("React Native", "\\b(react native|react-native)\\b");
        registerSkill("Node.js", "\\b(node|node\\.js|nodejs)\\b");
        registerSkill("Express.js", "\\b(express|express\\.js|expressjs)\\b");
        registerSkill("Angular", "\\b(angular|angularjs|angular\\.js)\\b");
        registerSkill("Vue.js", "\\b(vue|vue\\.js|vuejs)\\b");
        registerSkill("Next.js", "\\b(next\\.js|nextjs)\\b");
        registerSkill("Django", "\\b(django)\\b");
        registerSkill("Flask", "\\b(flask)\\b");
        registerSkill("FastAPI", "\\b(fastapi|fast api)\\b");
        registerSkill("ASP.NET", "\\b(asp\\.net|dotnet|\\.net core|\\.net)\\b");

        // Databases & Storage
        registerSkill("MySQL", "\\b(mysql|my sql)\\b");
        registerSkill("PostgreSQL", "\\b(postgresql|postgres|psql)\\b");
        registerSkill("MongoDB", "\\b(mongodb|mongo)\\b");
        registerSkill("Redis", "\\b(redis)\\b");
        registerSkill("Oracle DB", "\\b(oracle db|oracle database)\\b");
        registerSkill("SQLite", "\\b(sqlite)\\b");

        // Cloud & DevOps
        registerSkill("Docker", "\\b(docker|containers|containerization)\\b");
        registerSkill("Kubernetes", "\\b(kubernetes|k8s)\\b");
        registerSkill("AWS", "\\b(aws|amazon web services)\\b");
        registerSkill("Google Cloud", "\\b(gcp|google cloud|google cloud platform)\\b");
        registerSkill("Azure", "\\b(azure|microsoft azure|ms azure)\\b");
        registerSkill("Git", "\\b(git|github|gitlab)\\b");
        registerSkill("CI/CD", "\\b(ci/cd|cicd|continuous integration|continuous deployment)\\b");
        registerSkill("Linux", "\\b(linux|unix)\\b");

        // Web & APIs
        registerSkill("REST API", "\\b(rest|rest api|rest apis|restful|restful api|restful apis)\\b");
        registerSkill("GraphQL", "\\b(graphql)\\b");
        registerSkill("HTML", "\\b(html|html5)\\b");
        registerSkill("CSS", "\\b(css|css3)\\b");
        registerSkill("Tailwind CSS", "\\b(tailwind|tailwindcss|tailwind css)\\b");

        // AI / ML / Data
        registerSkill("Machine Learning", "\\b(machine learning|ml)\\b");
        registerSkill("Deep Learning", "\\b(deep learning|dl)\\b");
        registerSkill("NLP", "\\b(nlp|natural language processing)\\b");
        registerSkill("Computer Vision", "\\b(computer vision|cv)\\b");
        registerSkill("PyTorch", "\\b(pytorch|torch)\\b");
        registerSkill("TensorFlow", "\\b(tensorflow|tf)\\b");
        registerSkill("Pandas", "\\b(pandas)\\b");
        registerSkill("NumPy", "\\b(numpy)\\b");
        registerSkill("Scikit-Learn", "\\b(scikit-learn|sklearn)\\b");

        // Blockchain
        registerSkill("Blockchain", "\\b(blockchain)\\b");
        registerSkill("Solidity", "\\b(solidity)\\b");
        registerSkill("Ethereum", "\\b(ethereum|eth)\\b");
        registerSkill("Smart Contracts", "\\b(smart contracts|smart contract)\\b");
        registerSkill("Web3", "\\b(web3|web3\\.js)\\b");

        // Direct alias mappings for fast O(1) canonical resolution
        registerAlias("js", "JavaScript");
        registerAlias("javascript", "JavaScript");
        registerAlias("java script", "JavaScript");
        registerAlias("reactjs", "React");
        registerAlias("react.js", "React");
        registerAlias("spring", "Spring Boot");
        registerAlias("springboot", "Spring Boot");
        registerAlias("spring-boot", "Spring Boot");
        registerAlias("k8s", "Kubernetes");
        registerAlias("psql", "PostgreSQL");
        registerAlias("postgres", "PostgreSQL");
        registerAlias("postgresql", "PostgreSQL");
        registerAlias("aws", "AWS");
        registerAlias("amazon web services", "AWS");
        registerAlias("gcp", "Google Cloud");
        registerAlias("google cloud", "Google Cloud");
        registerAlias("ts", "TypeScript");
        registerAlias("typescript", "TypeScript");
        registerAlias("py", "Python");
        registerAlias("python", "Python");
        registerAlias("golang", "Go");
        registerAlias("cpp", "C++");
        registerAlias("c#", "C#");
        registerAlias("csharp", "C#");
        registerAlias("docker", "Docker");
        registerAlias("mysql", "MySQL");
        registerAlias("my sql", "MySQL");
        registerAlias("git", "Git");
        registerAlias("github", "Git");
        registerAlias("gitlab", "Git");
        registerAlias("rest api", "REST API");
        registerAlias("rest", "REST API");
        registerAlias("restful api", "REST API");
    }

    private static void registerSkill(String canonical, String regex) {
        Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
        SKILL_PATTERNS.put(canonical, pattern);
        // Also register direct string alias
        ALIAS_MAP.put(canonical.toLowerCase(Locale.ROOT), canonical);
    }

    private static void registerAlias(String alias, String canonical) {
        ALIAS_MAP.put(alias.toLowerCase(Locale.ROOT), canonical);
    }

    /**
     * Normalize a single skill name to its canonical form if recognized,
     * or return capitalized/cleaned representation.
     */
    public static String normalizeSkill(String rawSkill) {
        if (rawSkill == null || rawSkill.isBlank()) {
            return "";
        }
        String trimmed = rawSkill.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);

        if (ALIAS_MAP.containsKey(lower)) {
            return ALIAS_MAP.get(lower);
        }

        // Test regex patterns for exact or close alias
        for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
            if (entry.getValue().matcher(trimmed).matches()) {
                return entry.getKey();
            }
        }

        // Clean punctuation and return capitalized token
        String cleaned = trimmed.replaceAll("^[^a-zA-Z0-9+#.]+|[^a-zA-Z0-9+#.]+$", "");
        if (cleaned.length() <= 3) {
            return cleaned.toUpperCase(Locale.ROOT);
        }
        return Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
    }

    /**
     * Extract a distinct ordered set of normalized skills from a delimiter-separated string.
     */
    public static Set<String> extractSkills(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptySet();
        }

        Set<String> result = new LinkedHashSet<>();
        // Split on commas, semicolons, bullets, newlines, or pipes
        String[] tokens = text.split("[,;\\n\\r•|]+");
        for (String token : tokens) {
            String trimmed = token.trim();
            if (!trimmed.isEmpty()) {
                String normalized = normalizeSkill(trimmed);
                if (!normalized.isEmpty()) {
                    result.add(normalized);
                }
            }
        }

        // Also scan for multi-word or embedded skills in case delimiters were missed
        for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
            Matcher m = entry.getValue().matcher(text);
            if (m.find()) {
                result.add(entry.getKey());
            }
        }

        return result;
    }

    /**
     * Qualitative fit level based on raw cosine similarity score.
     * Authoritative classification rule:
     * - >= 0.700: Best Match
     * - 0.500–0.699: Strong Match
     * - 0.300–0.499: Good Match
     * - < 0.300: Fair Match
     *
     * Note: This is an ordinal rating bucket, NOT a probability.
     */
    public static String getFitLevel(Double similarityScore) {
        if (similarityScore == null) {
            return "Fair Match";
        }
        if (similarityScore >= 0.70) {
            return "Best Match";
        }
        if (similarityScore >= 0.50) {
            return "Strong Match";
        }
        if (similarityScore >= 0.30) {
            return "Good Match";
        }
        return "Fair Match";
    }

    /**
     * Comprehensive result of explainability and skill-gap analysis.
     */
    public static class AnalysisResult {
        private final List<String> matchingStrengths;
        private final List<String> matchedSkills;
        private final List<String> missingSkills;
        private final List<String> preferenceMatches;
        private final String skillGapMessage;
        private final String fitLevel;

        public AnalysisResult(
                List<String> matchingStrengths,
                List<String> matchedSkills,
                List<String> missingSkills,
                List<String> preferenceMatches,
                String skillGapMessage,
                String fitLevel) {
            this.matchingStrengths = matchingStrengths;
            this.matchedSkills = matchedSkills;
            this.missingSkills = missingSkills;
            this.preferenceMatches = preferenceMatches;
            this.skillGapMessage = skillGapMessage;
            this.fitLevel = fitLevel;
        }

        public List<String> getMatchingStrengths() {
            return matchingStrengths;
        }

        public List<String> getMatchedSkills() {
            return matchedSkills;
        }

        public List<String> getMissingSkills() {
            return missingSkills;
        }

        public List<String> getPreferenceMatches() {
            return preferenceMatches;
        }

        public String getSkillGapMessage() {
            return skillGapMessage;
        }

        public String getFitLevel() {
            return fitLevel;
        }
    }

    /**
     * Analyze student profile against an internship opportunity and generate
     * explainability factors, skill-gap analysis, and compatibility signals.
     */
    public static AnalysisResult analyze(Student student, Internship internship, Double similarityScore) {
        String fitLevel = getFitLevel(similarityScore);

        if (student == null || internship == null) {
            return new AnalysisResult(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    "No profile or internship data available for analysis.",
                    fitLevel
            );
        }

        // 1. Gather student skills from explicit skills field + free text profile sections
        Set<String> studentSkills = new LinkedHashSet<>(extractSkills(student.getSkills()));

        String studentProfileText = String.join(" \n ",
                Optional.ofNullable(student.getSummary()).orElse(""),
                Optional.ofNullable(student.getProjects()).orElse(""),
                Optional.ofNullable(student.getExperience()).orElse(""),
                Optional.ofNullable(student.getCertifications()).orElse("")
        );

        // Augment student skills from free text
        if (!studentProfileText.isBlank()) {
            for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
                if (entry.getValue().matcher(studentProfileText).find()) {
                    studentSkills.add(entry.getKey());
                }
            }
        }

        // 2. Gather internship required/desired skills
        Set<String> requiredSkills = new LinkedHashSet<>(extractSkills(internship.getRequiredSkills()));
        if (requiredSkills.isEmpty() && internship.getDescription() != null) {
            for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
                if (entry.getValue().matcher(internship.getDescription()).find()) {
                    requiredSkills.add(entry.getKey());
                }
            }
        }

        // 3. Compute matched and missing skills
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String req : requiredSkills) {
            if (studentSkills.contains(req)) {
                matchedSkills.add(req);
            } else {
                missingSkills.add(req);
            }
        }

        // If internship requiredSkills had zero matches, check if any student skills match description
        if (matchedSkills.isEmpty() && internship.getDescription() != null) {
            for (String s : studentSkills) {
                Pattern pat = SKILL_PATTERNS.get(s);
                if (pat != null && pat.matcher(internship.getDescription()).find()) {
                    matchedSkills.add(s);
                }
            }
        }

        // 4. Build explainable matching strengths
        List<String> matchingStrengths = new ArrayList<>();

        // Skill matches
        for (String skill : matchedSkills) {
            matchingStrengths.add(skill + " matches required skills");
        }

        // Project alignment
        if (student.getProjects() != null && !student.getProjects().isBlank()) {
            String projText = student.getProjects();
            // Check if any matched skill or internship keywords appear in projects
            boolean hasRelevantProject = false;
            for (String skill : matchedSkills) {
                Pattern pat = SKILL_PATTERNS.get(skill);
                if (pat != null && pat.matcher(projText).find()) {
                    matchingStrengths.add("Relevant project experience with " + skill);
                    hasRelevantProject = true;
                    break;
                }
            }
            if (!hasRelevantProject) {
                matchingStrengths.add("Relevant project experience");
            }
        }

        // Experience alignment
        if (student.getExperience() != null && !student.getExperience().isBlank()) {
            matchingStrengths.add("Prior internship/work experience on profile");
        }

        // Education alignment
        if (student.getEducation() != null && !student.getEducation().isBlank()) {
            String edu = student.getEducation().trim();
            if (edu.matches("(?i).*(computer|engineering|science|software|technology|it|b\\.?tech|m\\.?tech|b\\.?s|m\\.?s).*")) {
                matchingStrengths.add("Relevant academic curriculum & background");
            } else {
                matchingStrengths.add("Academic qualifications documented");
            }
        }

        // 5. Constraint and preference compatibility
        List<String> preferenceMatches = new ArrayList<>();

        if (internship.getWorkMode() != null && !internship.getWorkMode().isBlank()) {
            if ("REMOTE".equalsIgnoreCase(internship.getWorkMode())) {
                preferenceMatches.add("Remote work mode matches preference");
            } else if ("HYBRID".equalsIgnoreCase(internship.getWorkMode())) {
                preferenceMatches.add("Hybrid work mode matches preference");
            } else {
                preferenceMatches.add(internship.getCountry() + " on-site work matches preference");
            }
        }

        if (internship.getCountry() != null && !internship.getCountry().isBlank()) {
            String loc = internship.getCountry();
            if (internship.getCity() != null && !internship.getCity().isBlank()) {
                loc += " (" + internship.getCity() + ")";
            }
            preferenceMatches.add(loc + " matches preference");
        }

        if (internship.getDuration() != null && !internship.getDuration().isBlank()) {
            preferenceMatches.add("Duration matches preference");
        }

        if (internship.getStipend() != null && internship.getStipend().doubleValue() > 0) {
            String curr = internship.getCurrency() != null ? internship.getCurrency() : "";
            preferenceMatches.add("Stipend matches preference (" + internship.getStipend() + " " + curr + "/mo)");
        }

        if (internship.getVisaInformation() != null && !internship.getVisaInformation().isBlank()) {
            preferenceMatches.add("Visa guidance matches preference");
        }

        // 6. Formulate personalized skill-gap message
        String skillGapMessage;
        if (missingSkills.isEmpty()) {
            skillGapMessage = "Your profile covers the key required skills for this internship.";
        } else {
            String skillsList = missingSkills.stream()
                    .limit(3)
                    .collect(Collectors.joining(" and "));

            if (missingSkills.size() <= 2) {
                skillGapMessage = "You're a strong match, but learning " + skillsList + " could further improve your suitability.";
            } else {
                skillGapMessage = "Several required skills are missing from your current profile. Strengthening these areas could improve your suitability.";
            }
        }

        return new AnalysisResult(
                matchingStrengths,
                matchedSkills,
                missingSkills,
                preferenceMatches,
                skillGapMessage,
                fitLevel
        );
    }
}
