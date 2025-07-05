import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import fileUpload from "express-fileupload";
import dbConnect from "./src/config/dbconnect.js";
import cloudinaryConnect from "./src/config/cloudinary.js";
import userRoutes from "./src/routes/userRoutes.js";
import enterpriseRoutes from "./src/routes/enterpriseRoutes.js";
import levelRoutes from "./src/routes/levelRoutes.js";
import classRoutes from "./src/routes/classRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import topicRoutes from "./src/routes/topicRoutes.js";
import subtopicRoutes from "./src/routes/subtopicRoutes.js";
import questionRoutes from "./src/routes/questionRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import utilRoutes from "./src/routes/utilRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

dbConnect();
cloudinaryConnect();

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/enterprise", enterpriseRoutes);
app.use("/api/v1/level", levelRoutes);
app.use("/api/v1/class", classRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/topic", topicRoutes);
app.use("/api/v1/subtopic", subtopicRoutes);
app.use("/api/v1/question", questionRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/util", utilRoutes);

app.get("/", (req, res) => {
  res.status(200).send(`<div>Server running at PORT ${PORT}</div>`);
});

app.listen(PORT, () => {
  console.log(`Server running at PORT ${PORT}`);
});
