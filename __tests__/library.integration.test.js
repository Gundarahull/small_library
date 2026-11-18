const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const connectDB = require("../config/db");
const Member = require("../models/Member.model");
const Book = require("../models/Books.model");
const Loans = require("../models/Loans.model");
const Reservations = require("../models/Reservations.model");

const tokenFor = (member) =>
  jwt.sign(
    { id: member.id, role: member.role },
    process.env.SECRET_KEY,
  );

let member;
let librarian;
let memberToken;
let librarianToken;

beforeAll(async () => {
  await connectDB.authenticate();
  await connectDB.sync({ force: true });

  member = await Member.create({
    name: "Test Member",
    email: "member@example.test",
    password_hash: "not-used",
    role: "member",
  });
  librarian = await Member.create({
    name: "Test Librarian",
    email: "librarian@example.test",
    password_hash: "not-used",
    role: "librarian",
  });

  memberToken = tokenFor(member);
  librarianToken = tokenFor(librarian);
});

beforeEach(async () => {
  await Reservations.destroy({ where: {}, truncate: true, cascade: true });
  await Loans.destroy({ where: {}, truncate: true, cascade: true });
  await Book.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await connectDB.close();
});

const createBook = (overrides = {}) =>
  Book.create({
    title: "Test Book",
    author: "Test Author",
    isbn: overrides.isbn || 123456789,
    total_copies: overrides.total_copies ?? 1,
    available_copies: overrides.available_copies ?? 0,
    language: "English",
  });

describe("POST /books/:id/reservations", () => {
  test("requires authentication", async () => {
    const book = await createBook();

    const response = await request(app)
      .post(`/books/${book.id}/reservations`);

    expect(response.status).toBe(401);
  });

  test("rejects a malformed bearer token", async () => {
    const book = await createBook();

    const response = await request(app)
      .post(`/books/${book.id}/reservations`)
      .set("Authorization", "Bearer not-a-jwt");

    expect(response.status).toBe(401);
  });

  test("requires the member role", async () => {
    const book = await createBook();

    const response = await request(app)
      .post(`/books/${book.id}/reservations`)
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(403);
  });

  test("returns 404 when the book does not exist", async () => {
    const response = await request(app)
      .post("/books/999999/reservations")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(404);
  });

  test("rejects a book with copies currently available", async () => {
    const book = await createBook({ available_copies: 1 });

    const response = await request(app)
      .post(`/books/${book.id}/reservations`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/borrow this book directly/i);
  });

  test("rejects a member who already borrowed the book", async () => {
    const book = await createBook();
    await Loans.create({
      member_id: member.id,
      book_id: book.id,
      borrowed_at: new Date(),
      due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      returned_at: null,
    });

    const response = await request(app)
      .post(`/books/${book.id}/reservations`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("You already have this book borrowed");
  });

  test.each(["waiting", "held"])(
    "rejects an existing %s reservation",
    async (status) => {
      const book = await createBook();
      await Reservations.create({
        member_id: member.id,
        book_id: book.id,
        status,
      });

      const response = await request(app)
        .post(`/books/${book.id}/reservations`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already on the waiting list/i);
    },
  );

  test("creates a waiting reservation", async () => {
    const book = await createBook();

    const response = await request(app)
      .post(`/books/${book.id}/reservations`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      member_id: member.id,
      book_id: book.id,
      status: "waiting",
    });

    const saved = await Reservations.findByPk(response.body.data.id);
    expect(saved.status).toBe("waiting");
  });
});

describe("DELETE /reservations/:id", () => {
  test("requires authentication", async () => {
    const response = await request(app).delete("/reservations/1");

    expect(response.status).toBe(401);
  });

  test("requires the librarian role", async () => {
    const response = await request(app)
      .delete("/reservations/1")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(403);
  });

  test("returns 404 when the reservation does not exist", async () => {
    const response = await request(app)
      .delete("/reservations/999999")
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(404);
  });

  test.each(["fulfilled", "cancelled"])(
    "rejects cancellation of a %s reservation",
    async (status) => {
      const book = await createBook();
      const reservation = await Reservations.create({
        member_id: member.id,
        book_id: book.id,
        status,
      });

      const response = await request(app)
        .delete(`/reservations/${reservation.id}`)
        .set("Authorization", `Bearer ${librarianToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(status);
    },
  );

  test("cancels a waiting reservation", async () => {
    const book = await createBook();
    const reservation = await Reservations.create({
      member_id: member.id,
      book_id: book.id,
      status: "waiting",
    });

    const response = await request(app)
      .delete(`/reservations/${reservation.id}`)
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(200);
    await reservation.reload();
    expect(reservation.status).toBe("cancelled");
    expect(reservation.hold_expires_at).toBeNull();
  });

  test("cancels a held reservation and clears its hold expiry", async () => {
    const book = await createBook();
    const reservation = await Reservations.create({
      member_id: member.id,
      book_id: book.id,
      status: "held",
      hold_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    const response = await request(app)
      .delete(`/reservations/${reservation.id}`)
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(200);
    await reservation.reload();
    expect(reservation.status).toBe("cancelled");
    expect(reservation.hold_expires_at).toBeNull();
  });
});

describe("GET /reports/overdue", () => {
  test("requires authentication", async () => {
    const response = await request(app).get("/reports/overdue");

    expect(response.status).toBe(401);
  });

  test("requires the librarian role", async () => {
    const response = await request(app)
      .get("/reports/overdue")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(403);
  });

  test("returns overdue loans ordered by due date with calculated fees", async () => {
    const bookA = await createBook({ isbn: 100000001 });
    const bookB = await createBook({ isbn: 100000002 });
    await Loans.bulkCreate([
      {
        member_id: member.id,
        book_id: bookA.id,
        borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        due_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        returned_at: null,
      },
      {
        member_id: member.id,
        book_id: bookB.id,
        borrowed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        due_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        returned_at: null,
      },
    ]);

    const response = await request(app)
      .get("/reports/overdue?page=1&limit=10")
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.totalItems).toBe(2);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].bookId).toBe(bookB.id);
    expect(response.body.data[0].daysOverdue).toBeGreaterThanOrEqual(49);
    expect(response.body.data[0].currentLateFee).toBe(200);
  });

  test("excludes returned and not-yet-overdue loans", async () => {
    const book = await createBook();
    await Loans.bulkCreate([
      {
        member_id: member.id,
        book_id: book.id,
        due_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        returned_at: new Date(),
      },
      {
        member_id: member.id,
        book_id: book.id,
        due_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        returned_at: null,
      },
    ]);

    const response = await request(app)
      .get("/reports/overdue")
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.data).toEqual([]);
  });

  test("clamps invalid pagination values", async () => {
    const response = await request(app)
      .get("/reports/overdue?page=-5&limit=500")
      .set("Authorization", `Bearer ${librarianToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.currentPage).toBe(1);
    expect(response.body.pagination.limit).toBe(100);
  });
});
