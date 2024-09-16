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
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

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

//function to reload the website so render doesn't make it inactive

const url = `https://buynow-backend-iasj.onrender.com`;
const interval = 30000; // Interval in milliseconds (30 seconds)

function reloadWebsite() {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log(
        `Reloaded at ${new Date().toISOString()}: Status Code ${
          response.status
        }`
      );
    })
    .catch((error) => {
      console.error(
        `Error reloading at ${new Date().toISOString()}:`,
        error.message
      );
    });
}

setInterval(reloadWebsite, interval);
