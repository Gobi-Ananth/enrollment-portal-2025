import express from "express";
import dotenv from "dotenv";

import { connectDB } from "./lib/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("IEEE VIT Enrollment 2025");
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  connectDB;
});
