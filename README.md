# Feature Request & Public Roadmap Portal

A production-grade, full-stack **MERN** web application that enables users to submit feature requests, vote on ideas, and track their progress on a live public Kanban roadmap — inspired by tools like Canny and Featurebase.

Admins have a dedicated, protected dashboard to moderate submissions, update statuses, and monitor analytics in real time. Every status change automatically triggers a transactional email notification to the request author via Resend.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| **Role-Based Access Control** | Separate `user` and `admin` roles with route-level guards on both frontend and backend |
| **JWT httpOnly Authentication** | Dual-token pair system — 15-min access token + 7-day refresh token stored in a secure httpOnly cookie |
| **Token Rotation & Reuse Detection** | Every refresh issues a new pair; reusing a consumed token wipes all sessions immediately |
| **Atomic Upvoting** | Race-condition-safe toggle using MongoDB's `$addToSet` / `$pull` — no duplicates possible |
| **Threaded Comments** | Nested replies up to 3 levels deep, with soft-delete preserving thread structure |
| **3-Column Kanban Roadmap** | Public roadmap displaying cards grouped by `Planned`, `In Progress`, and `Completed` |
| **Image Uploads** | Feature requests support image attachments via Cloudinary (max 5 MB, auto-resized) |
| **Automated Email Notifications** | Transactional HTML emails sent via Resend whenever an admin updates a request's status |
| **Admin Dashboard** | Analytics, paginated requests table with live search, status management, and rejection modals |
| **Responsive UI** | Fully mobile-responsive design with a collapsible hamburger sidebar on the Admin Dashboard |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 3, React Query, React Router v6 |
| **Backend** | Node.js, Express 4, Mongoose 8 |
| **Database** | MongoDB (local or MongoDB Atlas) |
| **Authentication** | JWT (jsonwebtoken), bcryptjs, httpOnly cookies |
| **Image Storage** | Cloudinary + multer-storage-cloudinary |
| **Email** | Resend Node.js SDK |
| **Security** | Helmet, express-rate-limit, CORS |

---

## 📁 Project Structure

```
Customer-Feedback/
├── backend/
│   ├── config/          # DB & Cloudinary connection
│   ├── controllers/     # Business logic (auth, posts, comments, admin)
│   ├── middleware/       # Auth guards, error handler, upload handler
│   ├── models/          # Mongoose schemas (User, Post, Comment)
│   ├── routes/          # Express routers
│   ├── utils/           # Token helpers, Resend email utility
│   ├── .env.example     # Environment variable template
│   └── server.js        # Express app entry point
│
└── frontend/
    ├── public/
    └── src/
        ├── api/         # Axios instance with token interceptors
        ├── components/  # UI, layout, auth, posts, comments, roadmap
        ├── context/     # AuthContext (global user state)
        ├── pages/       # HomePage, RoadmapPage, admin/AdminDashboard
        └── App.jsx      # Routes & guards
```

---

## ⚡ Quick Start — Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local installation) **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [Cloudinary](https://cloudinary.com) account
- A free [Resend](https://resend.com) account

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Customer-Feedback.git
cd Customer-Feedback
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
MONGO_URI=mongodb://localhost:27017/customer_feedback
ACCESS_TOKEN_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
REFRESH_TOKEN_SECRET=<run same command again>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_your_key
EMAIL_FROM=Roadmap Portal <onboarding@resend.dev>
```

### 3. Install & Run the Backend

```bash
# Inside /backend
npm install
npm run dev
# → API server running at http://localhost:5000
```

### 4. Install & Run the Frontend

```bash
# Open a new terminal tab
cd frontend
npm install
npm run dev
# → React app running at http://localhost:5173
```

### 5. Open the App

Visit **http://localhost:5173** in your browser.

---

## 🔑 Creating an Admin Account

1. Sign up via the app UI as a normal user.
2. Open **MongoDB Compass** (or the Atlas UI) and run:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

3. Log in again — you will be automatically redirected to `/admin/dashboard`.

---

## 🔐 API Overview

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | — | Register a new account |
| `GET` | `/verify-email/:token` | — | Verify email address |
| `POST` | `/login` | — | Login → access token + refresh cookie |
| `POST` | `/refresh` | 🍪 | Silently rotate token pair |
| `POST` | `/logout` | 🍪 | Invalidate session |
| `GET` | `/me` | 🔒 | Get current user profile |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | optional | List posts with sort, filter & pagination |
| `POST` | `/` | 🔒 | Submit a feature request (with image) |
| `GET` | `/:id` | optional | Get a single post |
| `PATCH` | `/:id/upvote` | 🔒 | Atomic upvote toggle |
| `PATCH` | `/:id/status` | 👑 admin | Update Kanban status |
| `DELETE` | `/:id` | 🔒 | Delete post (owner or admin) |

### Comments — `/api/posts/:postId/comments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Get threaded comments for a post |
| `POST` | `/` | 🔒 | Add a comment or reply |
| `DELETE` | `/:commentId` | 🔒 | Soft-delete a comment |

### Admin — `/api/admin` *(admin only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics` | Dashboard metrics (users, votes, status chart) |
| `GET` | `/requests` | Paginated + searchable requests table |

---

## 🧪 Dev Notes

- **Email Verification in Dev Mode:** The signup endpoint returns `_devEmailVerifyToken` in the JSON response. The Signup modal also shows an **"Auto-fill token"** button so you can verify instantly without a real mail server.
- **Resend Sandbox:** Without a verified custom domain, Resend will only deliver emails to the address registered on your Resend account.
- **Rate Limits:** 200 req / 15 min globally; 20 req / 15 min on all `/api/auth/*` routes.

---

## 📄 License

MIT
