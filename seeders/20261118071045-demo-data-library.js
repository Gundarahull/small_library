'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const now = new Date();

    await queryInterface.bulkInsert('members', [
      {
        name: 'Head Librarian',
        email: 'librarian@library.com',
        password_hash: hashedPassword,
        role: 'librarian',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Rahul',
        email: 'rahul@looser.com',
        password_hash: hashedPassword,
        role: 'member',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Cool',
        email: 'cool@looser.com',
        password_hash: hashedPassword,
        role: 'member',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Sunny',
        email: 'sunny@looser.com',
        password_hash: hashedPassword,
        role: 'member',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Gunda',
        email: 'gunda@looser.com',
        password_hash: hashedPassword,
        role: 'member',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 2. Seed 20 Books
    const books = [
      { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '978-0201616224', total_copies: 3, available_copies: 3 },
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', total_copies: 5, available_copies: 5 },
      { title: 'Design Patterns', author: 'Erich Gamma', isbn: '978-0201633610', total_copies: 2, available_copies: 2 },
      { title: 'Refactoring', author: 'Martin Fowler', isbn: '978-0201485679', total_copies: 4, available_copies: 4 },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', total_copies: 2, available_copies: 2 },
      { title: 'Node.js Design Patterns', author: 'Mario Casciaro', isbn: '978-1783287314', total_copies: 3, available_copies: 3 },
      { title: 'You Don’t Know JS: Scope & Closures', author: 'Kyle Simpson', isbn: '978-1449335588', total_copies: 6, available_copies: 6 },
      { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', isbn: '978-0596517748', total_copies: 4, available_copies: 4 },
      { title: 'Effective Java', author: 'Joshua Bloch', isbn: '978-0134685991', total_copies: 3, available_copies: 3 },
      { title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '978-0073523323', total_copies: 2, available_copies: 2 },
      { title: 'Operating System Concepts', author: 'Abraham Silberschatz', isbn: '978-1118063330', total_copies: 2, available_copies: 2 },
      { title: 'Computer Networking', author: 'James F. Kurose', isbn: '978-0133594140', total_copies: 3, available_copies: 3 },
      { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', isbn: '978-0136042594', total_copies: 2, available_copies: 2 },
      { title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', isbn: '978-0201835953', total_copies: 4, available_copies: 4 },
      { title: 'Code Complete', author: 'Steve McConnell', isbn: '978-0735619678', total_copies: 3, available_copies: 3 },
      { title: 'Domain-Driven Design', author: 'Eric Evans', isbn: '978-0321125217', total_copies: 2, available_copies: 2 },
      { title: 'Working Effectively with Legacy Code', author: 'Michael Feathers', isbn: '978-0131177055', total_copies: 3, available_copies: 3 },
      { title: 'Continuous Delivery', author: 'Jez Humble', isbn: '978-0321601919', total_copies: 2, available_copies: 2 },
      { title: 'Building Microservices', author: 'Sam Newman', isbn: '978-1491950357', total_copies: 4, available_copies: 4 },
      { title: 'The Phoenix Project', author: 'Gene Kim', isbn: '978-0988262591', total_copies: 5, available_copies: 5 }
    ].map(book => ({ ...book, createdAt: now, updatedAt: now }));

    await queryInterface.bulkInsert('books', books);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('members', null, {});
    await queryInterface.bulkDelete('books', null, {});
  }
};