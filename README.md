# Small Library Backend

REST API for a small lending library. It uses Express, Sequelize, and
PostgreSQL, with JWT authentication for members and librarians.

## Requirements

- Node.js and npm
- PostgreSQL

## Setup

Install the backend dependencies with one command:

```bash
npm install
```

Create a PostgreSQL database, then create a `.env` file in this directory:

```env
PORT=6000
DB_NAME=library
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres
SECRET_KEY=replace_with_a_long_random_secret
```

Keep `.env` private; it is ignored by Git. Apply the database migrations and
start the API:

```bash
npx sequelize-cli db:migrate
npm run dev
```

The API listens on `http://localhost:6000` by default.

## Tests

The Jest/Supertest integration suite uses a real PostgreSQL database. Create a
separate, disposable test database (for example, `library_test`) and a
`.env.test` file with the same connection settings as `.env`, but use
`DB_TEST_NAME` for the database name:

```env
DB_TEST_NAME=library_test
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres
SECRET_KEY=test_secret
```

Run the suite with:

```bash
npm test
```

Or run Jest in watch mode:

```bash
npm run test:watch
```


## API overview

All protected routes expect a bearer token in the `Authorization` header:

```http
Authorization: Bearer <JWT>
```

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a member |
| `POST` | `/auth/login` | Public | Sign in and receive a JWT |
| `GET` | `/books` | Authenticated | Browse/search books with pagination |
| `POST` | `/books` | Librarian | Add a book |
| `PATCH` | `/books/:bookId` | Librarian | Update a book |
| `POST` | `/books/:id/reservations` | Member | Join the waiting list when no copies are available |
| `POST` | `/loans` | Member | Borrow a book using `{ "bookId": 1 }` |
| `GET` | `/loans/me/loans` | Member | List the signed-in member's loans |
| `GET` | `/loans/me/loans?status=active` | Member | Filter loans by `active`, `returned`, or `overdue` |
| `POST` | `/loans/:id/return` | Authenticated | Return the member's loan; `:id` is the book ID |
| `DELETE` | `/reservations/:id` | Librarian | Cancel a reservation |
| `GET` | `/reports/overdue` | Librarian | View overdue loans |

Book browsing accepts `search`, `page`, `limit`, `available`, and `sort` query
parameters. Search matches book titles and authors. Most endpoints return JSON
with a `success` flag and a human-readable `message`; errors include the reason
when available.

## Design decisions and trade-offs

- **PostgreSQL and Sequelize:** Sequelize models describe the core entities,
  while parameterized SQL is used for read queries that need filtering, joins,
  ordering, or pagination. This keeps those result shapes explicit but means
  some query logic is database-specific.
- **JWT bearer authentication:** the API is stateless and supports role checks
  for member and librarian actions. Tokens currently expire after seven days;
  there is no refresh-token or revocation flow.
- **Transactions and row locks:** borrowing, returning, reservation creation,
  and cancellation use transactions and lock relevant rows to reduce conflicts
  when multiple requests update the same inventory.
- **Real-database integration tests:** tests exercise HTTP routes against
  PostgreSQL rather than mocking the persistence layer. This verifies database
  behavior too, at the cost of requiring a running PostgreSQL service and an
  isolated test database.
- **Separate member frontend:** the React app is in the sibling `FrontEnd`
  directory. Its Vite development server proxies API calls to port 6000, so
  local development does not require CORS configuration.

## What I would improve with more time

- Improve startup and shutdown handling so the server only begins listening
  after a successful database connection and closes cleanly on termination.
- Add rate limiting and a token refresh/revocation strategy for production
  authentication.
- Add Redis Cache.
- I will write on my own frontEnd. just to revise the concepts, it will boost the confidence
## Approximate effort

These are rough estimates, not stopwatch measurements; 

| Part | Approximate effort | Reason
| --- | --- | --- |
| Database models, migrations, and connection setup | 2-2.5 hours | I work normal one sync methods in sequlize, to see how migrations works while creating, adding, altering, remove colums. it took time. It was learning thing
| API routes, authentication, and library rules | 5–6 hours |
| Manual testing, Validation cases, test cases | 40-50 mins | Patching the edge missing cases
| PostgreSQL/Jest integration tests | 10-20 mins | Used AI, On Jest not superior knowledge on this
| Member-facing React app | 30-40 hours | Used AI, i focuded more on backend, rather than Frontend
| Setup instructions and documentation | 10 minutes |
