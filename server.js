const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");
//Setting up config file
dotenv.config({
  path: "config/config.env",
});

//Connecting to database
connectDatabase();

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server starting on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});

//setting up cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("shutting down the server due to Unhandled Promise rejection");
  server.close(() => {
    process.exit(1);
  });
});

//handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.stack}`);
  console.log("shutting down the server due to Uncaught exception");
  process.exit(1);
});
