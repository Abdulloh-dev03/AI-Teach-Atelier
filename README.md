# AI Teach Atelier  🌐Live https://ai-teach-atelier.vercel.app

AI Teach Atelier is a full-stack AI learning platform for coding practice. It combines AI-generated programming challenges, an in-browser coding workspace, code execution and judging, and a persistent AI chat assistant into a single workflow. Users can sign up, generate unique problems by language and difficulty, solve them in the browser, review submissions, and chat with Friday AI for guidance.

## 🚀 What This Project Does

AI Teach Atelier is built to solve a common problem in coding education: static problem sets and fragmented learning tools. Instead of relying on the same recycled exercises, the platform generates fresh algorithm problems, validates them before saving, and gives users a place to run code, submit solutions, and interact with an AI assistant in the same product.

At a high level, the app works like this:

1. A user signs up or signs in with cookie-based authentication.
2. The dashboard and problems area let the user generate and browse saved coding challenges.
3. Each challenge opens in a workspace with a code editor, visible sample cases, run/submit actions, and submission history.
4. The backend judges code against test cases and stores results.
5. The chat area provides persistent AI conversations, including multi-session chat and image-assisted prompts.

## 🧠 Features

- AI-generated coding problems with language and difficulty selection
- Daily problem generation limit tracking in the user profile response
- Validation of AI-generated problems before saving them to the database
- Hidden and visible test-case workflow for realistic challenge evaluation
- In-browser coding workspace with Monaco editor
- Run code against visible sample tests before full submission
- Full submission judging with stored verdicts, runtime, and per-test results
- Persistent chat sessions with dynamic routes like `/chat/[id]`
- AI chat message editing and response regeneration
- Image upload support for chat prompts via Cloudinary
- Cookie-based authentication with protected backend APIs
- Profile page with avatar upload support
- Redux Toolkit Query data layer for frontend API state management

## 🛠 Tech Stack

### Frontend

- Next.js 16 with App Router
- React 19
- TypeScript
- Redux Toolkit + RTK Query
- Tailwind CSS 4
- Radix UI / shadcn-style UI primitives
- Monaco Editor
- Sonner for toasts

### Backend

- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod validation
- JWT authentication via cookies
- Winston + Morgan logging

### AI / Execution / Media

- Hugging Face Inference API for problem generation, feedback, and chat
- Judge0 API for Python execution
- Local Node execution for JavaScript and TypeScript
- Cloudinary for chat image uploads and profile pictures

## 📁 Folder Structure

```text
AI Teach Atelier/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/            # Logger and language configuration
│   │   ├── controllers/       # Express route handlers
│   │   ├── lib/               # Prisma client setup
│   │   ├── middleware/        # Auth and upload middleware
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Auth, AI, chat, judge, problem logic
│   │   ├── types/             # Shared backend types
│   │   ├── utils/             # JWT, cookies, formatting, Cloudinary
│   │   ├── validations/       # Zod schemas
│   │   ├── app.ts             # Express app + middleware registration
│   │   ├── server.ts          # HTTP server bootstrap
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Sign-in and sign-up pages
│   │   │   ├── (protected)/   # Dashboard, chat, problems, profile
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx       # Landing page
│   │   ├── components/
│   │   │   ├── chat/          # Chat layout, input, sidebar, messages
│   │   │   └── ui/            # Shared UI primitives
│   │   ├── hooks/             # Auto-scroll, textarea resize
│   │   ├── store/             # RTK Query API slices and Redux store
│   │   ├── lib/
│   │   ├── types/
│   │   └── proxy.ts           # Route redirection for auth-aware pages
│   └── package.json
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "AI Teach Atelier"
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure environment variables

Create these files:

- `backend/.env`
- `frontend/.env`

Use the variables listed below.

### 4. Prepare the database

From the `backend` folder:

```bash
npx prisma generate
npx prisma db push
```

If you prefer Prisma migrations in your own workflow, you can use `prisma migrate` instead.

## 🔐 Environment Variables

### Backend: `backend/.env`

```env
PORT=4000
LOG_LEVEL=info
NODE_ENV=development
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1w
DATABASE_URL=your_postgresql_connection_string
HF_TOKEN=your_huggingface_token
FRONTEND_URL=http://localhost:3000
PRIMARY_API=https://ce.judge0.com/submissions?base64_encoded=false&wait=true
SECONDARY_API=https://ce.judge0.com/submissions?base64_encoded=false&wait=true
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend: `frontend/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## ▶️ How to Run the Project

Start the backend first:

```bash
cd backend
npm run dev
```

Then start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`

## 📌 API Overview

### Auth

- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `GET /api/auth/profile`

### Problems

- `POST /api/problems/generate`
- `GET /api/problems/my`
- `GET /api/problems/:id`
- `POST /api/problems/:id/submit`
- `DELETE /api/problems/:id`
- `DELETE /api/problems/delete-all`

### Submissions

- `GET /api/submissions`
- `GET /api/submissions/:id`

### Code Execution

- `POST /api/run`

### Chat

- `POST /api/chat`
- `GET /api/chat`
- `GET /api/chat/:sessionId`
- `PUT /api/chat/messages/:messageId`
- `POST /api/chat/sessions/:sessionId/regenerate`
- `DELETE /api/chat/:sessionId`

### User / Uploads

- `PUT /api/user/profile-pic`
- `GET /api/cloudinary/signature`

## ✨ Notes on Architecture

- The frontend is a Next.js App Router application using RTK Query for all server communication.
- The backend is organized by controllers, routes, services, middleware, and validations.
- Authentication is handled with an HTTP-only token cookie plus backend auth middleware.
- Problem generation and chat both rely on Hugging Face inference models.
- JavaScript and TypeScript execution run locally through Node child processes.
- Python execution is routed through Judge0.
- A Docker executor exists in the codebase for future sandbox-based execution, but it is currently not the main runtime path.

## 🔮 Future Improvements

- Add real analytics to replace current placeholder profile metrics and badge data
- Expand protected route handling so every private frontend route is guarded consistently
- Add test coverage for API services and critical UI flows
- Introduce background job processing for heavy execution and AI tasks
- Add collaborative study features, richer submission insights, and progress tracking over time

## 👨‍💻 Author

Built by the Abdulloh Ortiqov.
