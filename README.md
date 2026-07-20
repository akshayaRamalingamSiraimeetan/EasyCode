# EasyCode

EasyCode is a full-stack Online Judge and DSA Learning Platform designed for learners ranging from beginners to competitive programmers.

The platform allows users to solve coding problems, execute code securely inside Docker containers, receive AI-powered progressive hints, and track their progress through an interactive learning interface.

---

## Features

- Secure online code execution using Docker
- Support for Python, C, C++, and Java
- AI-powered multi-level hint system using Gemini
- User authentication
- Problem management
- Test case validation
- Submission history
- Responsive React interface

---

## Architecture

```
EasyCode/
├── client/      React frontend
├── server/      Express backend + Online Judge
├── ai/          Gemini AI microservice
└── docker/      Docker sandbox image
```

The Online Judge runs inside the Express server. Every submission is executed inside an isolated Docker container for security.

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- CSS

### Backend

- Node.js
- Express
- MongoDB
- JWT Authentication

### AI Service

- Google Gemini API

### Sandbox

- Docker

---

## Supported Languages

| Language | Runtime |
|----------|---------|
| Python | Python 3 |
| C | GCC |
| C++ | G++ (C++17) |
| Java | OpenJDK 21 |

---

## Repository Structure

```
client/
    React application
