# NotifyHub Backend

NotifyHub is a high-throughput, asynchronous notification dispatch service featuring multi-channel routing, database-backed request idempotency, Zod schema validation, transactional execution, and queue-based delivery.

---

## 🏛️ Production Architecture & Layered Workflow

Directly sending notifications during a standard HTTP request-response cycle presents two critical production bottlenecks:
1. **Network Latency:** External dispatch gateways (Email/SMS APIs) are slow, causing API delays for clients.
2. **System Outages:** If a downstream gateway goes down, requests fail or get lost.

NotifyHub resolves this by enforcing a strict single execution path:
**Controller → Service → Queue → Worker → NotificationProcessor → ProviderFactory → Provider**

```
 ┌─────────────┐       ┌─────────────────┐       ┌────────────────────┐
 │ Client      │ ───>  │ Controller      │ ───>  │ Service            │
 └─────────────┘       └─────────────────┘       └────────────────────┘
                                                           │
                                                           ▼
 ┌─────────────┐       ┌─────────────────┐       ┌────────────────────┐
 │ Worker      │ <───  │ BullMQ Queue    │ <───  │ PostgreSQL (Prisma)│
 └─────────────┘       └─────────────────┘       └────────────────────┘
        │
        ▼
 ┌──────────────────────┐       ┌─────────────────┐       ┌────────────────────┐
 │NotificationProcessor │ ───>  │ ProviderFactory │ ───>  │ Provider (Mock/    │
 └──────────────────────┘       └─────────────────┘       │ Resend, etc.)      │
        │                                                 └────────────────────┘
        ▼
 ┌──────────────────────┐
 │ Atomic Tx (DB Update)│
 └──────────────────────┘
```

### 1. Ingestion Phase (Fast & Safe)
* **Sub-Millisecond Ingestion:** The Express API server acts as a rapid buffer. It validates the payload using Zod, verifies and locks the `idempotency-key` in PostgreSQL to prevent duplicate delivery, saves a `PENDING` record, enqueues a job pointer in Redis via BullMQ, and immediately returns `201 Created`.
* **Idempotency Protection:** The server hashes the request payload. Duplicate requests are served cached responses instantly or blocked if the original is still processing.

### 2. Dispatch Phase (Reliable & Asynchronous)
* **Worker & Processor Separation:** A thin BullMQ worker listens for jobs and delegates orchestration directly to `NotificationProcessor`.
* **Atomic Transactions:** The processor creates an immutable `NotificationAttempt` record, resolves the singleton provider via `ProviderFactory`, invokes the provider's `send()` method, and uses a single Prisma transaction (`prisma.$transaction`) to update both `Notification` and `NotificationAttempt` statuses atomically (`SENT` or `FAILED`).

---

## 🛠️ Tech Stack & Directory Structure

* **Runtime & Framework:** Node.js (v18+) & Express (v5)
* **Database & ORM:** PostgreSQL & Prisma ORM (with `NotificationStatus` enum)
* **Queue Architecture:** Redis & BullMQ
* **Request Schema Validation:** Zod
* **Logging:** Structured Logger utility

```text
backend/
├── prisma/               # Prisma schema definitions and database migrations
├── src/
│   ├── config/           # Redis connection configuration
│   ├── constants/        # System constants (error codes, providers, idempotency)
│   ├── controllers/      # Route controllers (health, notifications)
│   ├── errors/           # Custom error classes (ProviderError, Permanent, Retryable)
│   ├── lib/              # Prisma client singleton instance
│   ├── middleware/       # Logger, error handler, validation, and idempotency
│   ├── processors/       # Orchestration layer (notification.processor.js)
│   ├── providers/        # Extensible gateway providers (email/mock, resend, factory)
│   ├── queues/           # BullMQ queue instantiations
│   ├── routes/           # Express router definitions
│   ├── services/         # Pure entity services (notification, notificationAttempt, idempotency)
│   ├── utils/            # Shared utilities (logger, hashing, AppError, asyncHandler)
│   ├── validations/      # Request validation schemas (Zod)
│   └── workers/          # BullMQ background worker (notification.worker.js)
```

---

## 🔐 Core System Features

### 1. Request Idempotency
* Requests must include an `idempotency-key` header (UUID or unique string recommended).
* Matching keys with identical payload hashes return cached responses (`200 OK`).
* Payload mismatches return a structured `422 Unprocessable Entity` response.

### 2. Notification Status Lifecycle
Notifications transition through strict enum states (`NotificationStatus`):
- `PENDING`: Created in database and enqueued into BullMQ.
- `PROCESSING`: Attempt initialized and being dispatched by provider.
- `SENT`: Provider confirmed successful delivery.
- `FAILED`: Delivery failed after attempt.

---

## 📡 API Documentation

### Endpoints Directory

| Method | Endpoint | Headers / Payload | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | None | Service health check | `200` |
| **POST** | `/notifications` | Header: `idempotency-key` <br> Body: `NotificationPayload` | Queue a notification for delivery | `201`, `400`, `422`, `500` |
| **GET** | `/notifications` | None | List all notifications (descending order) | `200` |
| **GET** | `/notifications/:id` | None | Fetch notification by ID | `200`, `404` |
| **PATCH**| `/notifications/:id/status` | Body: `{ "status": "SENT" }` | Update notification status | `200` |
| **DELETE**| `/notifications/:id` | None | Delete notification record | `200` |

### Sample Delivery Request
`POST /notifications`

```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -H "idempotency-key: a5f16e4c-1123-42e8-bf99-8cfab2de4e0a" \
  -d '{
    "channel": "email",
    "recipient": "user@example.com",
    "title": "Welcome to NotifyHub",
    "message": "Thank you for joining our platform!",
    "preferredProvider": "mock"
  }'
```

---

## ⚙️ Setup & Local Development

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_DB=0
DEFAULT_PROVIDER="mock"
```

### 2. Execution Commands

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start Redis (via Docker)
docker-compose up -d

# Sync PostgreSQL schema with Prisma
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Start Express API Server (Terminal 1)
npm run dev

# Start BullMQ Worker (Terminal 2)
npm run worker
```
