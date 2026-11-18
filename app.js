const express = require("express");
const connectDB = require("./config/db");
const app = express();
const PORT = process.env.PORT || 6000;

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
