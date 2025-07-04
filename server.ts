import express from "express";
import todoRoutes from "./src/route/todos";
import configuration from "./configuration";
import { initializeAppEnvironment } from "./src/dependency";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = configuration.PORT;

const promises: Promise<any>[] = [];
promises.push(initializeAppEnvironment());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());

app.use("/api/v1/todos", todoRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the ToDo app server!");
});

Promise.all(promises).then(() => {
  console.log("All Dependencies Initialized");
  app.listen(PORT, () => {
    console.log(
      `ToDo worker ${process.pid} is listening at http://${configuration.HOST}:${PORT}`,
    );
  });
});
