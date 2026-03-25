import express from "express";
import __dirname from "../../clientPath.js";
import path from "path";
import router from "../routes/homeRoutes.js";

// creating server
const app = express();
const port = 3000; // server running on port 3000

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "src/publicS")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use("/", router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
