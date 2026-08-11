# ERPFlow

### Mini ERP + CRM for Wholesale Operations

---

**ERPFlow** is a full-stack wholesale operations platform that connects sales, warehouse, and accounts in one workspace. It covers customer CRM with follow-ups, product inventory with stock movements, sales challans with stock-safe confirmation, and invoice PDF export — all behind role-based access control.

```
  Flow · Connect · Optimize
```

---

## Live Links

| Layer        | URL                                              |
| ------------ | ------------------------------------------------ |
| Frontend     | [https://erpflow-o2qy.onrender.com](https://erpflow-o2qy.onrender.com) |
| Backend API  | [https://erpflow-api.onrender.com](https://erpflow-api.onrender.com)   |
| API Base     | `https://erpflow-api.onrender.com/api`           |

---

Default seeded logins (password for all):

```
Admin@123
```

| Email                   |  Password    | Role      |
| ----------------------- | ------------ | --------- |
| `admin@erpflow.com`     |  `Admin@123` | ADMIN     |
| `sales@erpflow.com`     |  `Admin@123` | SALES     |
| `warehouse@erpflow.com` |  `Admin@123` | WAREHOUSE |
| `accounts@erpflow.com`  |  `Admin@123` | ACCOUNTS  |

---

## Technology Stack

### Frontend

```
React + Vite
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form + Zod
jsPDF (invoice export)
AI-assisted development tools
```

### Backend

```
Node.js
Express.js
REST APIs
TypeScript
JWT + bcrypt
Zod validation
```

### Database

```
MySQL
```

### Tools and Services

```
Postman          API testing and collection
AWS S3           Product image storage
Docker           Container builds for client and server
GitHub Actions   CI checks and deploy triggers
Render           Hosting for frontend and API
```

---

## System Design

```
                         ┌─────────────────────────────────────┐
                         │            Client (Vite)            │
                         │  React · Tailwind · shadcn/ui       │
                         │  Auth context · TanStack Query      │
                         └──────────────────┬──────────────────┘
                                            │
                                            │  HTTPS / JSON
                                            │  Authorization: Bearer <JWT>
                                            ▼
                         ┌─────────────────────────────────────┐
                         │         API (Express / Node)        │
                         │  Routes → Controllers → Services    │
                         │  Auth · Roles · Upload · Zod        │
                         └──────────────┬──────────┬───────────┘
                                        │          │
                         ┌──────────────▼──┐    ┌──▼──────────────┐
                         │     MySQL       │    │     AWS S3      │
                         │  Users          │    │  Product images │
                         │  Customers      │    └─────────────────┘
                         │  Products       │
                         │  Stock moves    │
                         │  Challans       │
                         └─────────────────┘
```

### Request flow

```
Browser
  │
  ├─► Login ──────────────────────► POST /api/auth/login
  │                                      │
  │                                      ▼
  │                                 JWT issued
  │                                      │
  ├─► Protected pages ────────────► REST /api/*
  │   (Dashboard / CRM / Stock /         │
  │    Challans)                         ▼
  │                                 Role middleware
  │                                      │
  └─► Export Invoice PDF           MySQL + optional S3
      (client-side jsPDF)
```

### Roles

| Role        | Primary access                                              |
| ----------- | ----------------------------------------------------------- |
| `ADMIN`     | Full access across CRM, inventory, and challans             |
| `SALES`     | Customers, follow-ups, challans (create / confirm / cancel) |
| `WAREHOUSE` | Products, stock movements, image upload                     |
| `ACCOUNTS`  | Read-focused operational visibility                         |

---

## Project Structure

```
ERPFlow/
│
├── client/                          Frontend application
│   ├── public/                      Static assets and brand logo
│   ├── src/
│   │   ├── components/              UI primitives and shared layout
│   │   │   ├── common/              Empty / loading / list panels
│   │   │   ├── layout/              Sidebar · Topbar · Mobile nav
│   │   │   └── ui/                  shadcn/ui building blocks
│   │   ├── context/                 Auth provider
│   │   ├── hooks/                   Shared React hooks
│   │   ├── lib/                     API client · PDF invoice helper
│   │   ├── pages/                   Route screens
│   │   │   ├── auth/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── challans/
│   │   │   └── dashboard/
│   │   ├── routes/                  Route guards
│   │   ├── schemas/                 Client Zod schemas
│   │   ├── services/                Axios service layer
│   │   └── types/                   Shared frontend types
│   ├── Dockerfile
│   └── package.json
│
├── server/                          Backend application
│   ├── database/
│   │   ├── schema.sql               Local schema
│   │   ├── schema-aiven.sql         Cloud / Aiven-ready schema
│   │   └── seed.ts                  Idempotent seed users and sample data
│   ├── src/
│   │   ├── config/                  Env and database pool
│   │   ├── controllers/             HTTP handlers
│   │   ├── middlewares/             Auth · roles · upload
│   │   ├── models/                  SQL access layer
│   │   ├── routes/                  REST route maps
│   │   ├── schemas/                 Request validation
│   │   ├── services/                Business logic
│   │   ├── types/
│   │   ├── utils/                   JWT · password · challan number
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
│
├── .github/workflows/
│   ├── ci.yml                       Typecheck and build gates
│   └── deploy.yml                   Render deploy hooks
│
├── ERPFlow.postman_collection.json
└── README.md
```

---

## Setup — Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

> For production builds, set `VITE_API_URL` to your live API base  
> Example: `https://erpflow-api.onrender.com/api`  
> Do not include a trailing slash after `/api`.

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## Setup — Backend

```bash
cd server
npm install
```

Create `server/.env` from `.env.example`:

```env
PORT=5000
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=erpflow
DB_SSL=false
CLIENT_URL=http://localhost:5173
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1d
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=erpflow-product-images
```

> For managed MySQL (for example Aiven), set `DB_NAME`, credentials, and `DB_SSL=true`.

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Seed sample users and data:

```bash
npm run seed
```
## Setup — Database

1. Create a MySQL database (local or managed).
2. Apply the schema:

```bash
# Local
mysql -u root -p erpflow < server/database/schema.sql

# Aiven / SSL cloud
# Use server/database/schema-aiven.sql in your SQL console
```

3. Point `server/.env` at that database.
4. Run the seed script:

```bash
cd server
npm run seed
```

### Core entities

```
users
  │
  ├── creates follow_ups ──────► customers
  │                                │
  ├── manages products             │
  │       │                        │
  │       └── stock_movements      │
  │                                │
  └── creates challans ◄───────────┘
              │
              └── challan_items (price / name snapshots)
```

---

## API Architecture

Base path: `/api`  
Auth header: `Authorization: Bearer <token>`

### Auth APIs

| Method | Endpoint           | Access     | Description              |
| ------ | ------------------ | ---------- | ------------------------ |
| `POST` | `/api/auth/login`  | Public     | Email + password → JWT   |
| `GET`  | `/api/auth/me`     | Authenticated | Current user profile  |

```
POST /api/auth/login
        │
        ▼
   Validate credentials
        │
        ▼
   Return { token, user }
```

---

### Dashboard APIs

| Method | Endpoint              | Access        | Description                |
| ------ | --------------------- | ------------- | -------------------------- |
| `GET`  | `/api/dashboard/stats`| Authenticated | KPI counts + recent challans |

---

### Customer APIs

| Method   | Endpoint                         | Roles              | Description              |
| -------- | -------------------------------- | ------------------ | ------------------------ |
| `GET`    | `/api/customers`                 | Authenticated      | List / search / filter   |
| `GET`    | `/api/customers/:id`             | Authenticated      | Customer detail          |
| `POST`   | `/api/customers`                 | ADMIN, SALES       | Create customer          |
| `PATCH`  | `/api/customers/:id`             | ADMIN, SALES       | Update customer          |
| `DELETE` | `/api/customers/:id`             | ADMIN, SALES       | Delete customer          |
| `GET`    | `/api/customers/:id/follow-ups`  | Authenticated      | List follow-ups          |
| `POST`   | `/api/customers/:id/follow-ups`  | ADMIN, SALES       | Add follow-up note       |

```
Customer lifecycle

LEAD ──► ACTIVE ──► INACTIVE
  │
  └── follow_ups (notes + optional next date)
```

---

### Product APIs

| Method   | Endpoint                              | Roles                 | Description                |
| -------- | ------------------------------------- | --------------------- | -------------------------- |
| `GET`    | `/api/products`                       | Authenticated         | List / search / low stock  |
| `GET`    | `/api/products/:id`                   | Authenticated         | Product detail             |
| `POST`   | `/api/products`                       | ADMIN, WAREHOUSE      | Create product             |
| `PATCH`  | `/api/products/:id`                   | ADMIN, WAREHOUSE      | Update product             |
| `DELETE` | `/api/products/:id`                   | ADMIN, WAREHOUSE      | Delete product             |
| `GET`    | `/api/products/:id/stock-movements`   | Authenticated         | Movement history           |
| `POST`   | `/api/products/:id/stock`             | ADMIN, WAREHOUSE      | Stock IN / OUT             |
| `POST`   | `/api/products/:id/image`             | ADMIN, WAREHOUSE      | Upload image → AWS S3      |

```
Stock movement

POST /stock { type: IN | OUT, quantity, reason }
        │
        ▼
  Update products.current_stock
        │
        ▼
  Insert stock_movements row
```

---

### Challan APIs

| Method  | Endpoint                       | Roles            | Description                         |
| ------- | ------------------------------ | ---------------- | ----------------------------------- |
| `GET`   | `/api/challans`                | Authenticated    | List / filter by status / customer  |
| `GET`   | `/api/challans/:id`            | Authenticated    | Detail + line items + bill-to fields|
| `POST`  | `/api/challans`                | ADMIN, SALES     | Create draft challan                |
| `PATCH` | `/api/challans/:id`            | ADMIN, SALES     | Update draft                        |
| `POST`  | `/api/challans/:id/confirm`    | ADMIN, SALES     | Confirm → deduct stock              |
| `POST`  | `/api/challans/:id/cancel`     | ADMIN, SALES     | Cancel → restore stock if confirmed |

```
Challan state machine

        create
          │
          ▼
       DRAFT ──────► CONFIRM ──────► stock OUT
          │                              │
          │                              ▼
          └────────► CANCEL ◄────── CANCEL (restore stock)
```

Line items snapshot `product_name`, `sku`, and `unit_price` at save time so historical challans stay accurate after catalog changes.

---

## Schema Design

### `users`

| Column         | Type                         | Notes                |
| -------------- | ---------------------------- | -------------------- |
| `id`           | `CHAR(36)` PK                | UUID                 |
| `name`         | `VARCHAR(100)`               |                      |
| `email`        | `VARCHAR(150)` UNIQUE        | Login identity       |
| `password_hash`| `VARCHAR(255)`               | bcrypt               |
| `role`         | `ENUM(ADMIN,SALES,WAREHOUSE,ACCOUNTS)` | RBAC      |

### `customers`

| Column           | Type                                      | Notes            |
| ---------------- | ----------------------------------------- | ---------------- |
| `id`             | `CHAR(36)` PK                             |                  |
| `name`           | `VARCHAR(150)`                            |                  |
| `mobile`         | `VARCHAR(20)`                             | Indexed          |
| `email`          | `VARCHAR(150)`                            | Optional         |
| `business_name`  | `VARCHAR(200)`                            |                  |
| `gst_number`     | `VARCHAR(20)`                             | Invoice header   |
| `customer_type`  | `ENUM(RETAIL,WHOLESALE,DISTRIBUTOR)`      |                  |
| `status`         | `ENUM(LEAD,ACTIVE,INACTIVE)`              | Default `LEAD`   |
| `follow_up_date` | `DATE`                                    |                  |
| `address` / `notes` | `TEXT`                                 |                  |

### `follow_ups`

| Column          | Type           | Notes                          |
| --------------- | -------------- | ------------------------------ |
| `id`            | `CHAR(36)` PK  |                                |
| `customer_id`   | FK → customers | Cascade delete                 |
| `note`          | `TEXT`         |                                |
| `follow_up_date`| `DATE`         | Optional                       |
| `created_by`    | FK → users     |                                |

### `products`

| Column              | Type            | Notes                 |
| ------------------- | --------------- | --------------------- |
| `id`                | `CHAR(36)` PK   |                       |
| `name` / `sku`      | Indexed / UNIQUE| Catalog identity      |
| `category`          | `VARCHAR(100)`  |                       |
| `unit_price`        | `DECIMAL(12,2)` |                       |
| `current_stock`     | `INT`           | Live quantity         |
| `min_stock_alert`   | `INT`           | Low-stock threshold   |
| `warehouse_location`| `VARCHAR(150)`  |                       |
| `image_url`         | `VARCHAR(500)`  | S3 public URL         |

### `stock_movements`

| Column          | Type               | Notes              |
| --------------- | ------------------ | ------------------ |
| `id`            | `CHAR(36)` PK      |                    |
| `product_id`    | FK → products      |                    |
| `quantity`      | `INT`              |                    |
| `movement_type` | `ENUM(IN,OUT)`     |                    |
| `reason`        | `VARCHAR(255)`     |                    |
| `created_by`    | FK → users         |                    |

### `challans` / `challan_items`

| Table           | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `challans`      | Header: number, customer, totals, status, creator    |
| `challan_items` | Lines with snapshotted name, SKU, price, qty, amount |

```
customers 1 ───────< N challans 1 ───────< N challan_items >─────── 1 products
users     1 ───────< N challans
users     1 ───────< N stock_movements >─────── 1 products
```

Full DDL lives in:

- `server/database/schema.sql`
- `server/database/schema-aiven.sql`

---

## Features Implemented

### Authentication and access

- JWT login with hashed passwords
- Persistent session bootstrap via `/api/auth/me`
- Role-based route guards on both API and UI
- Seeded demo accounts for every role

### Dashboard

- Live KPI strip: customers, products, low stock, challans
- Recent challans table with status badges
- Role-aware CTAs (new challan, low stock, refresh)

### CRM — Customers

- Paginated list with search and status filters
- Create / edit customer forms with validation
- Detail view with GST, contact, and address
- Follow-up timeline notes for sales continuity

### Inventory — Products

- Product catalog with SKU uniqueness
- Low-stock filtering against `min_stock_alert`
- Manual stock IN / OUT with reason and audit trail
- Product image upload to AWS S3

### Sales — Challans

- Draft challans with multi-line items
- Active-customer picker and stock shortage guards
- Confirm deducts stock atomically; cancel restores when needed
- Detail view with summary and bill-to customer block

### Invoice PDF export

- Client-side PDF generation with jsPDF + AutoTable
- Includes challan meta, bill-to fields, line items, and INR totals
- ASCII-safe currency formatting for reliable PDF fonts
- One-click **Export PDF** from challan detail

### UX and polish

- Light mint green brand system with logo in shell and browser tab
- Collapsible desktop sidebar and mobile bottom navigation
- Shared empty / loading / error states and list panels
- Toast notifications without dismiss clutter

### Delivery and ops

- Dockerfiles for client (nginx) and server
- Postman collection for end-to-end API coverage
- GitHub Actions CI for typecheck and build
- Render deploy hooks on push to `main`

---

## CI / CD Flow

```
Developer
    │
    │  git push / pull request
    ▼
┌──────────────────────────────────────────────┐
│              GitHub Actions                  │
│                                              │
│   ci.yml                                     │
│   ┌─────────────┐      ┌─────────────┐       │
│   │   client    │      │   server    │       │
│   │ npm ci      │      │ npm ci      │       │
│   │ tsc -b      │      │ tsc build   │       │
│   │ vite build  │      │             │       │
│   └─────────────┘      └─────────────┘       │
│                                              │
│   deploy.yml  (push to main only)            │
│   validate Render deploy hook secrets        │
│            │                                 │
│            ├──── POST API deploy hook ────► Render API service
│            │                                 (Docker / Node)
│            │
│            └──── POST Client deploy hook ─► Render Web service
│                                              (static / nginx)
└──────────────────────────────────────────────┘
```

### What each workflow does

| Workflow      | Trigger                         | Responsibility                                      |
| ------------- | ------------------------------- | --------------------------------------------------- |
| `ci.yml`      | Push to `main`, pull requests   | Install, typecheck, and build client + server       |
| `deploy.yml`  | Push to `main`, manual dispatch | Validate secrets, then trigger Render deploy hooks  |

### Required GitHub secrets

```
RENDER_API_DEPLOY_HOOK
RENDER_CLIENT_DEPLOY_HOOK
```

Both must be valid Render deploy hook URLs:

```
https://api.render.com/deploy/...
```

### Production notes

- Client build arg / env: `VITE_API_URL=https://erpflow-api.onrender.com/api`
- API listens on `0.0.0.0` and uses platform-provided env vars (no required `.env` file at runtime)
- Database can run on managed MySQL with `DB_SSL=true`

---

## Postman

Import the collection at the repository root:

```
ERPFlow.postman_collection.json
```

Use it to exercise auth, customers, products, stock, challans, and dashboard endpoints against local or deployed API bases.

---

## License

Private project — all rights reserved unless otherwise stated by the repository owner.

---

**ERPFlow** — wholesale ops without the chaos.
