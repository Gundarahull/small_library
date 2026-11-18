const { QueryTypes } = require("sequelize");
const connectDB = require("../../config/db");
const Book = require("../../models/Books.model");
const Loans = require("../../models/Loans.model");

const loanBook = async (req, res) => {
  const t = await connectDB.transaction();

  try {
    const { bookId } = req.body;
    const memberId = req.member.id;

    if (!bookId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide bookId",
        errors: "Client Error",
      });
    }

    // 2. Lock the book row so two members cannot grab the last copy in terms of conCurrent hits
    const book = await Book.findByPk(bookId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!book) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Book not found",
        errors: "Not Found",
      });
    }

    // Free Check
    if (book.available_copies <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No copies are currently available for loan",
        errors: "Client Error",
      });
    }

    // Fetch  active loans for member
    const activeLoans = await Loans.findAll({
      where: {
        member_id: memberId,
        returned_at: null,
      },
      transaction: t,
    });

    // A member can hold at most 3 active loans
    if (activeLoans.length >= 3) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Maximum limit of 3 active loans reached. Return a book first.",
        errors: "Client Error",
      });
    }

    const now = new Date();

    const overDueLoan = activeLoans.some((loan) => now > new Date(loan.due_at));

    if (overDueLoan) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "You have an overdue loan. Please return it before borrowing again.",
        errors: "Client Error",
      });
    }

    //Two copie check
    const alreadyBorrowedThisBook = activeLoans.some(
      (loan) => Number(loan.book_id) === Number(bookId),
    );
    if (alreadyBorrowedThisBook) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "You already have an active loan for this book",
        errors: "Client Error",
      });
    }

    //  due_at is 14 days after borrowed_at
    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt);
    dueAt.setDate(dueAt.getDate() + 14);

    // Create the loan
    const loan = await Loans.create(
      {
        member_id: memberId,
        book_id: bookId,
        borrowed_at: borrowedAt,
        due_at: dueAt,
      },
      { transaction: t },
    );

    book.available_copies = book.available_copies - 1;
    await book.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Book loaned successfully!",
      data: loan,
    });
  } catch (error) {
    await t.rollback();
    console.error("[loanBook Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at loanBook controller",
      errors: "Internal Server Error",
    });
  }
};

const returnBook = async (req, res) => {
  const t = await connectDB.transaction();

  try {
    const { id } = req.params;
    const bookId = id;
    const memberId = req.member.id;

    if (!bookId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide bookId",
        errors: "Client Error",
      });
    }

    //Lock the book
    const book = await Book.findByPk(bookId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!book) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Book not found",
        errors: "Not Found",
      });
    }

    const loan = await Loans.findOne({
      where: {
        member_id: memberId,
        book_id: bookId,
        returned_at: null,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!loan) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Book already returned",
        errors: "Client Error",
      });
    }

    const now = new Date();
    const dueAt = new Date(loan.due_at);
    let lateFee = 0;

    if (now > dueAt) {
      const MS_PER_DAY = 1000 * 60 * 60 * 24;
      const overdueDays = Math.ceil((now - dueAt) / MS_PER_DAY);
      lateFee = Math.min(200, overdueDays * 5);
    }

    loan.returned_at = now;

    await loan.save({ transaction: t });

    book.available_copies += 1;
    await book.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Book returned successfully!",
      data: {
        loanId: loan.id,
        bookId: book.id,
        returnedAt: loan.returned_at,
        lateFee,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("[returnBook Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at returnBook controller",
      errors: "Internal Server Error",
    });
  }
};


const getMyLoans = async (req, res) => {
  try {
    const memberId = req.member.id;
    const { status } = req.query;

    const allowedStatuses = ["active", "returned", "overdue"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use active, returned, or overdue",
        errors: "Client Error",
      });
    }

    const conditions = ["l.member_id = :memberId"];
    const replacements = { memberId };

    if (status === "active") {
      conditions.push("l.returned_at IS NULL");
    } else if (status === "returned") {
      conditions.push("l.returned_at IS NOT NULL");
    } else if (status === "overdue") {
      conditions.push("l.returned_at IS NULL AND l.due_at < NOW()");
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // 3. Query loans joined with book details
    const loans = await connectDB.query(
      `SELECT 
        l.id,
        l.member_id AS "memberId",
        l.book_id AS "bookId",
        b.title,
        b.author,
        b.isbn,
        l.borrowed_at AS "borrowedAt",
        l.due_at AS "dueAt",
        l.returned_at AS "returnedAt"
      FROM loans l
      JOIN books b ON l.book_id = b.id
      ${whereClause}
      ORDER BY l.borrowed_at DESC;`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Loans retrieved successfully",
      count: loans.length,
      data: loans,
    });
  } catch (error) {
    console.error("[getMyLoans Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving loans",
      errors: "Internal Server Error",
    });
  }
};


module.exports = {
  loanBook,
  returnBook,
  getMyLoans
};
