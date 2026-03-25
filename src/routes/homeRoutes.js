import express from "express";
import { runSpark } from "../controllers/compileController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("home.ejs");
});

router.post("/run", runSpark);

export default router;
