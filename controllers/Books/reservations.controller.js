const { Op } = require("sequelize");
const { QueryTypes } = require("sequelize");
const Book = require("../../models/Books.model");
const Loans = require("../../models/Loans.model");
const Reservations = require("../../models/Reservations.model");
const connectDB = require("../../config/db");

const createReservation = async (req, res) => {
  const t = await connectDB.transaction();

  try {
    const bookId = req.params.id;
    const memberId = req.member.id;

    const book = await Book.findByPk(bookId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!book) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.available_copies > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Copies are currently available. You can borrow this book directly.",
      });
    }

    const activeLoan = await Loans.findOne({
      where: {
        book_id: bookId,
        member_id: memberId,
        returned_at: null,
      },
      transaction: t,
    });

    if (activeLoan) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "You already have this book borrowed",
      });
    }

    const existingReservation = await Reservations.findOne({
      where: {
        book_id: bookId,
        member_id: memberId,
        status: { [Op.in]: ["waiting", "held"] },
      },
      transaction: t,
    });

    if (existingReservation) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "You are already on the waiting list for this book",
      });
    }

    // 5. Create the reservation
    const reservation = await Reservations.create(
      {
        book_id: bookId,
        member_id: memberId,
        status: "waiting",
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Added to waiting list successfully",
      data: reservation,
    });
  } catch (error) {
    await t.rollback();
    console.error("[createReservation Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create reservation",
    });
  }
};

const cancelReservation = async (req, res) => {
  const t = await connectDB.transaction();

  try {
    const reservationId = req.params.id;

    const reservation = await Reservations.findByPk(reservationId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!reservation) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (["fulfilled", "cancelled"].includes(reservation.status)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a reservation with status '${reservation.status}'`,
      });
    }


    reservation.status = "cancelled";
    reservation.hold_expires_at = null;
    await reservation.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("[cancelReservation Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel reservation",
    });
  }
};

const getOverdueReport = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const offset = (page - 1) * limit;

    const rows = await connectDB.query(
      `SELECT 
    l.id AS "loanId",
    l.borrowed_at AS "borrowedAt",
    l.due_at AS "dueAt",
    m.id AS "memberId",
    m.name AS "memberName",
    m.email AS "memberEmail",
    b.id AS "bookId",
    b.title AS "bookTitle",
    b.author AS "bookAuthor",
    b.isbn
  FROM loans l
  JOIN members m ON l.member_id = m.id
  JOIN books b ON l.book_id = b.id
  WHERE l.returned_at IS NULL
    AND l.due_at < NOW()
  ORDER BY l.due_at ASC
  LIMIT :limit OFFSET :offset;`,
      {
        replacements: { limit, offset },
        type: QueryTypes.SELECT,
      },
    );

    const now = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const overdueLoans = rows.map((row) => {
      const daysOverdue = Math.ceil((now - new Date(row.dueAt)) / MS_PER_DAY);
      const currentLateFee = Math.min(200, daysOverdue * 5);

      return {
        ...row,
        daysOverdue,
        currentLateFee,
      };
    });

    const countResult = await connectDB.query(
      `SELECT COUNT(*)::int AS total
       FROM loans
       WHERE returned_at IS NULL
         AND due_at < NOW();`,
      { type: QueryTypes.SELECT },
    );

    const totalItems = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: "Overdue report retrieved successfully",
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
      data: overdueLoans,
    });
  } catch (error) {
    console.error("[getOverdueReport Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch overdue report",
    });
  }
};

module.exports = {
  createReservation,
  cancelReservation,
  getOverdueReport,
};
