const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
// const mongoose = require("mongoose");
const sslRedirect = require("heroku-ssl-redirect");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(sslRedirect(["production"], 301));

app.set("PORT", process.env.PORT || 5000);

app.use(express.static(path.join(__dirname, "client/build")));

const apiRouter = require("./routes/api");

app.use("/api", apiRouter)

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on("error", (error) => console.error(error));
// db.once("open", () => console.log("Connected to the Database"));

app.listen(app.get("PORT"), () =>
  console.log("Listening at " + app.get("PORT"))
);
