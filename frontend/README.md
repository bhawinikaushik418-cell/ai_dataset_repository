# AI Dataset Repository — Frontend Application

Modern, responsive SaaS-style web interface built with React 18, Vite, Tailwind CSS, and React Router 6. Fully integrated with the MySQL 8 Express backend.

---

## 1. Technology Stack

* **UI Framework**: React 18 (Functional Components & Hooks)
* **Build Tool**: Vite 6 (Lightning-fast HMR)
* **Styling**: Tailwind CSS 3 (Custom color palette, responsive typography)
* **Routing**: React Router 6 (Nested layouts, Protected routes, Role-based guards)
* **HTTP Client**: Centralized Axios with automatic Bearer token injection and error interception
* **Icons**: Lucide React

---

## 2. Page Directory & Sitemap

### Public Pages
* `/` — **Landing Page**: Platform introduction, real database KPIs, featured benchmark cards, and DBMS 3NF architectural overview.
* `/login` — **Sign In**: Academic email and password authentication with demo credential quick-fill buttons.
* `/register` — **Registration**: Student/researcher account creation with client and server validation.
* `/datasets` — **Dataset Repository**: Search by keyword, filter by domain, task type, data type, difficulty, access level, and sort by popularity, rating, or name.
* `/datasets/:id` — **Dataset Detail Page**: Full metadata view, download permissions gate, interactive 5-star rating widget, and community reviews.
* `/recommendations` — **AI Recommender**: Content-based recommendation console with 100-point weighted rubric and TF-IDF cosine similarity.

### User Workspace (`/` protected via `AuthContext`)
* `/dashboard` — **User Workspace Dashboard**: Key metrics (submissions, downloads, requests), quick actions, recent download history, and personalized recommendations.
* `/upload` — **Upload Dataset**: Multi-part upload form supporting CSV and ZIP archives with real-time validation.
* `/my-uploads` — **My Submissions**: Track administrator review status (PENDING, APPROVED, REJECTED with documented feedback).
* `/my-downloads` — **Personal Download History**: Immutable audit log of past dataset retrievals with re-download capability.
* `/access-requests` — **Access Requests**: Monitor access grants for restricted datasets, view rejection reasons, and submit re-requests.
* `/profile` — **User Profile**: Account details, role, password hashing details, and session management.

### Admin Center (`/admin` strictly protected by `AdminRoute` guard)
* `/admin` — **Admin Dashboard**: Real-time platform analytics (total users, total datasets, pending approvals, pending requests, total downloads).
* `/admin/users` — **User Account Management**: Search users, monitor uploads/downloads count, and toggle account suspension status (`ACTIVE` vs `SUSPENDED`).
* `/admin/approvals` — **Dataset Approvals Queue**: One-click approval of new datasets or rejection with mandatory documented reason.
* `/admin/access-requests` — **Access Request Control**: Approve or deny researcher requests for restricted datasets.
* `/admin/categories` — **Category Management**: Create, edit, and delete academic domains with referential integrity protection.
* `/admin/analytics` — **Analytics & KPIs**: Deep analytics, popular categories, top downloaded datasets, and live download audit trail.

---

## 3. Running the Frontend

### Development Mode:
```bash
cd ai-dataset-repository/frontend
npm run dev
```
Runs at `http://localhost:3000` with automated proxy to the Express backend on `http://localhost:5000`.

### Production Build:
```bash
cd ai-dataset-repository/frontend
npm run build
```
Compiled output is generated in `frontend/dist/`.
