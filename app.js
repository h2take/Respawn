const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const morgan = require("morgan");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const userRouter = require("./routes/userRoutes");
const communityRouter = require("./routes/communityRoutes");
const postRouter = require("./routes/postRoutes");
const commentRouter = require("./routes/commentRoutes");

const app = express();

// 1) GLOBAL MIDDLEWARES

// Enable CORS — required so Flutter (or any separate frontend) can call this API
app.use(cors());
app.options('*splat', cors());

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body (with size limit)
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Serving static files (uploaded photos, etc.)
app.use(express.static(`${__dirname}/public`));

// 2) ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/communities", communityRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the forum app!",
  });
});

// Catch-all for undefined routes — routes into the central error handler
app.all("*splat", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
