const mongoose = require("mongoose");

//Connecting to the local mongoDB server

const DATA_BASE_NAME = process.env.DATA_BASE_NAME;
const DATA_BASE_PASSWORD = process.env.DATA_BASE_PASSWORD;
mongoose
  .connect(`mongodb+srv://${DATA_BASE_NAME}:${DATA_BASE_PASSWORD}@cluster0.ysey58m.mongodb.net/?retryWrites=true&w=majority`)
  .then(() => {
    console.log("db is connected");
  })
  .catch((err) => {
    console.log(err);
  });
