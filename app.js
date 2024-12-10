const express = require("express");
const app = express();
const errorMiddleware = require("./middlewares/errors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

app.use(express.json({ limit: "5mb" }));

app.use(cookieParser());
app.use(fileUpload());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "PRODUCTION"
        ? "https://buynow-66f3.onrender.com" // Production frontend URL
        : "http://localhost:5173", // Local development frontend URL
    credentials: true, // Allow cookies to be sent in cross-origin requests
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

//Import all routes
const products = require("./routes/product");
const auth = require("./routes/auth");
const order = require("./routes/order");

app.use("/api/v1", products);

app.use("/api/v1", auth);

app.use("/api/v1", order);

app.use(errorMiddleware);

module.exports = app;
