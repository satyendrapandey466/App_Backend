require("express-async-errors"); //Automatically handles the error forward it to the error handling middleware
const morgan = require("morgan");
const express = require("express");
require("dotenv").config();
const cors = require("cors"); //Handle the cross origin header problem

require("./db");
const userRouter = require("./routes/user.js");
const actorRouter = require("./routes/actor.js");
const movieRouter = require("./routes/movie.js");
const reviewRouter = require("./routes/review.js");
const adminRouter = require("./routes/admin");

const { errorHandler } = require("./middlewares/error");
const { notFoundHandler } = require("./utils/helper");

const app = express();
//For parsing the data
app.use(express.json());

//For handling CORS problem
app.use(cors());

//Consoling the log status
app.use(morgan("dev"));

//Definig the routes to be used for given user path
app.use("/api/user", userRouter);

//Definig the routes to be used for given actor path
app.use("/api/actor", actorRouter);

//Definig the routes to be used for given movie path
app.use("/api/movie", movieRouter);

//Defining routes for the reviews of movie
app.use("/api/review", reviewRouter);

app.use("/api/admin", adminRouter);

//For all undefined paths to handle 404 error
app.use("/*", notFoundHandler);

//Handling the errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("the port is listening on port" + PORT);
});
