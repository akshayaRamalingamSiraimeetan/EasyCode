# EasyCode: High-Level Design (HLD)

## 🎯 Vision & Roadmap

**EasyCode** is a scalable Online Judge and DSA Learning Platform built for users ranging from absolute beginners to competitive programmers. It is designed to scale across five distinct phases:

* **V1 (Core OJ):** Secure code execution, problem checking, and basic profiles.
* **V2 (Learning):** Structured DSA roadmaps, guided paths, and progress gamification.
* **V3 (Community):** Contests, Elo-based ratings, peer discussions, and user-made content.
* **V4 (AI Mentor):** Automated code reviews, personalized dynamic hints, and mock interviews.
* **V5 (Enterprise):** B2B features for universities and recruiters (anti-plagiarism, auto-grading).

---

## 🛠️ Technical Stack & Architecture

### Tech Stack

* **Frontend:** React, React Router, Monaco Editor, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB & Mongoose
* **Judge Sandbox:** Docker
* **Infrastructure:** AWS 


> **Design Choice:** Separating the **Judge Service** into an isolated worker system from day one ensures that heavy compilation tasks won't crash the main user API, making future horizontal scaling straightforward.

---

## 🗂️ Core Functional Blocks (V1 - V5)

### 1. Code Execution Pipeline (The Judge)

When a user submits code, it passes through a secured execution pipeline:
Frontend Submission -> API Gateway -> Judge -> Secured Docker Container

* **Verdicts Issued:** Accepted (AC), Wrong Answer (WA), Compilation Error (CE), Runtime Error (RTE), Time Limit Exceeded (TLE), Memory Limit Exceeded (MLE).

### 2. Learning Ecosystem & Gamification

* **Roadmaps:** A linear progression track spanning from basic syntax up to Advanced Dynamic Programming and Graph algorithms.
* **Editorials:** Multi-tier solutions for problems mapping out *Brute Force -> Better -> Optimal* approaches with space/time complexity bounds.
* **Engagement Engine:** Daily streaks, XP, level unlocks, and badges to incentivize consistent practice.

### 3. Competitions & Community

* **Contest Engine:** Support for custom-timed public/private contests with a live leaderboard and dynamic Elo-like ranking shifts.
* **Social Layer:** Upvotable discussion forums embedded inside each problem and customizable public developer profiles.

### 4. AI & Enterprise Adaptations

* **AI Hint Engine:** Delivers progressive pseudocode hints and code quality analysis without directly spoiling solutions.
* **B2B Tools:** Virtual classrooms for schools, automated code plagiarism checks, and candidate screening templates for tech recruiters.

---

## 📈 Non-Functional Requirements (NFRs)

* **Performance:** API response times under **300 ms** (excluding background evaluation runtimes).
* **Security:** Cryptographic password hashing (`bcrypt`), JWT-driven access control, and complete execution isolation.
* **Maintainability:** Standardized MVC code architecture with centralized logging and automated Docker health checks.