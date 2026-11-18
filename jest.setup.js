process.env.NODE_ENV = "test";
require("dotenv").config({ path: ".env.test" });
require("dotenv").config();

if (!process.env.DB_TEST_NAME) {
  throw new Error(
    "DB_TEST_NAME is required. Create .env.test with a disposable PostgreSQL database name.",
  );
}
