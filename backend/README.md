# AI Dataset Repository — Backend API Documentation

Modular Node.js and Express backend built on MySQL 8, featuring parameterized queries, connection pooling, role-based access control, file storage, and audit trails.

---

## 1. Directory Structure

```
backend/
├── .env.example
├── .env
├── package.json
├── uploads/
│   └── datasets/                 # Local disk storage for uploaded datasets (.csv, .zip)
├── test/
│   └── api-test.js               # Automated integration test suite
└── src/
    ├── server.js                 # Express bootstrap, CORS, router mounts & error handling
    ├── config/
    │   └── db.js                 # mysql2/promise connection pool & health check
    ├── middleware/
    │   ├── auth.middleware.js    # JWT verification (authenticate & optionalAuth)
    │   ├── role.middleware.js    # RBAC guards (requireAdmin, requireRoles)
    │   ├── upload.middleware.js  # Multer engine (CSV/ZIP validation & size limits)
    │   └── error.middleware.js   # Centralized error mapping & status codes
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── category.controller.js
    │   ├── dataset.controller.js
    │   ├── access.controller.js
    │   ├── review.controller.js
    │   └── admin.controller.js
    ├── services/
    │   ├── auth.service.js
    │   ├── category.service.js
    │   ├── dataset.service.js
    │   ├── access.service.js
    │   ├── review.service.js
    │   └── admin.service.js
    └── utils/
        ├── response.js           # Uniform JSON response standard
        └── validators.js         # Input sanitization and format validators
```

---

## 2. Environment Variables (.env)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port for Express | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `DB_HOST` | MySQL 8 server host | `127.0.0.1` |
| `DB_PORT` | MySQL 8 server port | `3306` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL user password | `MySQL@12345` |
| `DB_NAME` | Database schema name | `ai_dataset_repository` |
| `JWT_SECRET` | Secret key for JWT signing | `super-secret-jwt-key` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `MAX_FILE_SIZE_MB`| Max dataset upload size | `50` |

---

## 3. REST API Endpoint Reference

### Authentication & Users (`/api/auth`)
* `POST /api/auth/register` — Register a new student/researcher account (`name`, `email`, `password`).
* `POST /api/auth/login` — Login and receive JWT access token.
* `GET /api/auth/me` — *(Auth)* Retrieve authenticated user identity.
* `GET /api/auth/users` — *(Admin)* List all platform users with upload and download counts.
* `PATCH /api/auth/users/:id/status` — *(Admin)* Toggle user status (`ACTIVE` vs `SUSPENDED`).

### Categories & Tags (`/api/categories`)
* `GET /api/categories` — List all categories with associated dataset counts.
* `GET /api/categories/tags` — List all dataset tags with usage frequency.
* `POST /api/categories` — *(Admin)* Create a new category.
* `PUT /api/categories/:id` — *(Admin)* Update a category.
* `DELETE /api/categories/:id` — *(Admin)* Delete category (protected by referential integrity).

### Datasets (`/api/datasets`)
* `GET /api/datasets` — Discover approved datasets. Supports query parameters:
  * `search`: Keyword search in title/description.
  * `domain`, `task_type`, `data_type`, `difficulty_level`, `access_level`, `category_id`.
  * `sort`: `newest`, `popular` (by downloads), `rating`, or `name`.
  * `page`, `limit`: Pagination parameters.
* `GET /api/datasets/:id` — Full dataset metadata, uploader, tags, average rating, reviews, and user access status.
* `POST /api/datasets` — *(Auth)* Upload a new dataset (`multipart/form-data` with `dataset_file` CSV/ZIP).
* `PUT /api/datasets/:id` — *(Auth: Owner or Admin)* Update metadata.
* `DELETE /api/datasets/:id` — *(Auth: Owner or Admin)* Delete dataset and disk file.
* `PATCH /api/datasets/:id/approval` — *(Admin)* Approve or reject a dataset with reason.
* `GET /api/datasets/:id/download` — *(Auth)* Protected file download stream. Verifies permissions (PUBLIC vs RESTRICTED with approved access request) and logs download audit trail.
* `GET /api/datasets/my/uploads` — *(Auth)* View personal uploaded datasets.
* `GET /api/datasets/my/downloads` — *(Auth)* View personal download history.

### Access Requests (`/api/access-requests`)
* `POST /api/access-requests` — *(Auth)* Submit access request for a `RESTRICTED` dataset with research justification.
* `GET /api/access-requests/my` — *(Auth)* List user's access requests and review outcomes.
* `GET /api/access-requests` — *(Admin)* View all pending, approved, and rejected access requests.
* `PATCH /api/access-requests/:id/review` — *(Admin)* Approve or reject (`status`, `rejection_reason`).

### Ratings & Reviews (`/api`)
* `POST /api/ratings` — *(Auth)* Rate dataset 1 to 5 stars (atomic upsert preventing duplicates).
* `GET /api/ratings/:datasetId/my` — *(Auth)* Get user's rating for a dataset.
* `POST /api/reviews` — *(Auth)* Post substantive feedback on a dataset.
* `GET /api/reviews/:datasetId` — Get paginated qualitative reviews for a dataset.
* `DELETE /api/reviews/:id` — *(Auth: Author or Admin)* Delete review.

### Analytics (`/api/admin/analytics`)
* `GET /api/admin/analytics` — *(Admin)* Overview metrics (total users, total datasets, pending approvals, pending requests, total downloads, overall average rating, top downloaded datasets, popular categories, and audit log).

---

## 4. Running the Backend Server & Automated Tests

### Start Backend Development Server:
```bash
cd ai-dataset-repository/backend
npm run dev
```

### Run Automated API Integration Tests:
```bash
cd ai-dataset-repository/backend
npm run test:api
```
