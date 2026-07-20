# Running EasyCode

## Prerequisites

Install the following:

- Node.js (18 or later)
- npm
- Docker Desktop
- MongoDB (Local or Atlas)

---

# Clone the Repository

```bash
git clone <repository-url>
cd EasyCode
```

---

# Install Dependencies

### Server

```bash
cd server
npm install
```

### Client

```bash
cd ../client
npm install
```

### AI Service

```bash
cd ../ai
npm install
```

---

# Environment Variables

## server/.env

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:6000
```

## ai/.env

```env
PORT=6000
GEMINI_API_KEY=your_gemini_api_key
MODEL=gemini-flash-latest
```

---

# Build the Docker Sandbox

Run this once from the project root.

```bash
docker build -t easycode-runner -f docker/Dockerfile .
```

Verify the image exists.

```bash
docker images easycode-runner
```

If the image is missing, build it again.

---

# Start Docker

Docker Desktop must be running before starting the server.

Verify Docker is ready:

```bash
docker info
```

---

# Run the Project

Open **three terminals**.

## Terminal 1 — Server

```bash
cd server
npm run dev
```

Runs on:

```
http://localhost:5000
```

---

## Terminal 2 — AI Service

```bash
cd ai
npm run dev
```

Runs on:

```
http://localhost:6000
```

---

## Terminal 3 — Client

```bash
cd client
npm run dev
```

Runs on:

```
http://localhost:5173
```

Open the client URL in your browser.

---

# Startup Order

Always start the services in this order:

1. Docker Desktop
2. Server
3. AI Service
4. Client

---

# Docker Cleanup

Old stopped containers may remain after testing.

Remove them using:

```bash
docker container prune
```

---

# How Code Execution Works

1. User submits code.
2. The React client sends the request to the Express server.
3. The server creates a temporary Docker container.
4. The code is compiled and executed.
5. Test cases are evaluated.
6. The container is removed.
7. Results are returned to the client.

Each container runs with:

- No network access
- 256 MB memory limit
- 1 CPU
- 5 second execution limit
- 1 MB output limit

---

# Ports

| Service | Port |
|----------|------|
| React Client | 5173 |
| Express Server | 5000 |
| AI Service | 6000 |