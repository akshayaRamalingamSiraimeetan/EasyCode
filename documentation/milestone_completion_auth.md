# Milestone 1: Authentication Module (Completed)

Backend
✔ Express
✔ MongoDB Atlas
✔ UUID-based User Model
✔ Register API
✔ Login API
✔ JWT Authentication
✔ Protected Middleware
✔ GET /auth/me

Frontend
✔ React + Vite
✔ React Router
✔ Auth Context
✔ Axios Interceptors
✔ Register
✔ Login
✔ Dashboard
✔ Protected Routes
✔ Public Routes
✔ Logout

## Objective

Implement a secure authentication system for the EasyCode Online Judge platform, enabling user registration, login, session management, and route protection. This module serves as the foundation for all subsequent features such as Problem Management, Compiler, Submissions, and User Profiles.

---

## Backend Implementation

### Database

* MongoDB Atlas configured as the primary database.
* Mongoose used as the ODM.
* User model designed using UUIDs instead of MongoDB ObjectIds for public identification.

### User Schema

| Field        | Type          | Description                |
| ------------ | ------------- | -------------------------- |
| id           | String (UUID) | Public unique identifier   |
| username     | String        | Unique username            |
| email        | String        | Unique email address       |
| passwordHash | String        | BCrypt hashed password     |
| createdAt    | Date          | Account creation timestamp |

---

### Authentication APIs

#### POST `/api/auth/register`

Registers a new user.

Validation performed:

* All required fields are present
* Username uniqueness
* Email uniqueness

Processing:

* Password hashed using BCrypt (10 salt rounds)
* User stored in MongoDB

Response:

```json
{
  "success": true,
  "message": "Registration successful. Please login."
}
```

---

#### POST `/api/auth/login`

Authenticates an existing user.

Validation performed:

* Email exists
* Password verification using BCrypt

Processing:

* JWT generated with 7-day expiry
* UUID and email embedded in JWT payload

Response:

```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "...",
    "username": "...",
    "email": "..."
  }
}
```

---

#### GET `/api/auth/me`

Protected endpoint used to retrieve the currently authenticated user.

Authentication:

* JWT required in Authorization header

Processing:

* JWT verification
* User lookup using UUID
* Password hash excluded from response

Response:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "createdAt": "..."
  }
}
```

---

### JWT Authentication Middleware

Implemented reusable authentication middleware.

Responsibilities:

* Read Authorization header
* Validate Bearer token
* Verify JWT signature
* Decode JWT payload
* Attach authenticated user information to `req.user`
* Reject unauthorized requests with HTTP 401

---

### Password Security

* BCrypt hashing
* Password hashes stored instead of plaintext passwords
* Password verification performed using BCrypt compare

---

## Frontend Implementation

### Technology Stack

* React
* Vite
* React Router
* Axios
* Context API

---

### Authentication Pages

Implemented:

* Register Page
* Login Page
* Dashboard

Registration Flow:

```
Register
    ↓
Backend Validation
    ↓
MongoDB
    ↓
Redirect to Login
```

Login Flow:

```
Login
    ↓
JWT Issued
    ↓
Stored in AuthContext
    ↓
Redirect to Dashboard
```

---

### Authentication Context

Implemented a global authentication provider using React Context.

Responsibilities:

* Store JWT
* Store authenticated user
* Restore session on application startup
* Expose login/logout methods
* Maintain authentication state across the application

Exposed values:

```
token

user

loading

isAuthenticated

login()

logout()
```

---

### Axios Configuration

Configured a centralized Axios instance.

Features:

* Base API URL configuration
* Automatic JWT attachment using Axios request interceptors
* Eliminates manual Authorization header management

---

### Route Protection

Implemented reusable route guards.

#### ProtectedRoute

Restricts access to authenticated users.

Protected routes:

* Dashboard

Behavior:

```
Authenticated
        ↓
Access Granted

Unauthenticated
        ↓
Redirect to Login
```

---

#### PublicRoute

Restricts access to authentication pages after login.

Protected pages:

* Register
* Login

Behavior:

```
Authenticated
        ↓
Redirect to Dashboard

Unauthenticated
        ↓
Access Granted
```

---

### Session Management

Implemented persistent login sessions.

Mechanism:

* JWT stored in browser Local Storage
* Session restored on application initialization
* Current user fetched using `/api/auth/me`
* Invalid tokens automatically removed

---

### Logout

Implemented complete logout flow.

Processing:

* Remove JWT
* Clear authenticated user
* Update authentication context
* Redirect to Login

---

## Current Authentication Features

* User Registration
* User Login
* BCrypt Password Hashing
* JWT Authentication
* Protected Backend APIs
* Current User API (`/me`)
* React Authentication Context
* Persistent Sessions
* Automatic Token Injection
* Protected Frontend Routes
* Public Route Handling
* Logout Functionality

---

## Future Authentication Enhancements

The following features are intentionally deferred beyond the MVP:

* Email verification
* Password reset
* Refresh tokens
* OAuth (Google/GitHub)
* Role-Based Access Control (Admin, Problem Setter, User)
* Multi-factor authentication
* Account lockout and rate limiting
* Secure HTTP-only cookie authentication
* Session management across multiple devices

---

## Status

**Milestone 1: Authentication — Completed**

This milestone establishes the security and identity management foundation for the EasyCode Online Judge platform. All subsequent modules (Problem Management, Compiler, Submissions, Contests, and User Profiles) will build upon this authentication infrastructure.
