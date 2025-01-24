import express from "express";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import emailRouter from "./routes/activation";
import cors from "cors";
import cookieParcer from "cookie-parser";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParcer());

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.use("/api", authRouter);
app.use("/api/products/", productsRouter);
app.use("/api/users/", usersRouter);
app.use("/api/email", emailRouter);

app.all("*", (req, res) => {
  res.status(404).send("<h1>Page not found</h1>");
});

const db = process.env.MONGO_URI;

mongoose.set("strictQuery", true);
mongoose
  .connect(`${db}`)
  .then(() => {
    app.listen(port, () => {
      console.log(`[server]: Db is running at https://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));