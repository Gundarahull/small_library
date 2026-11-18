const express = require("express");
const connectDB = require("./config/db");
const app = express();
const PORT = process.env.PORT || 6000;
const cookieParser = require("cookie-parser");

app.use(cookieParser()); //parsing cookie
app.use(express.json()); //to parse the request
app.use(express.urlencoded({ extended: true })); //to parse the request form data

//routes
app.use("/auth", require("./routes/member.routes"));
app.use("/books", require("./routes/book.route"));
app.use("/loans", require("./routes/loans.route"));
app.use("/reservations", require("./routes/reservations.route"));
app.use("/reports", require("./routes/reports.route"));

connectDB
  .authenticate()
  .then(() => {
    console.log("Succcesfully Connected to DB");
  })
  .catch((err) => {
    console.log("Error while connecting to the Postgre : ", err);
  });

app.listen(PORT, () => {
  console.log(`Server Started at PORT : ${PORT}`);
});
