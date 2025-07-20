import express from "express";
import todoRoutes from "./src/route/todos";
import userRoutes from "./src/route/user";
import configuration from "./configuration";
import { initializeAppEnvironment } from "./src/dependency";
import cors from "cors";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/todos", todoRoutes);
console.log("User routes loaded!");

app.get("/", (req, res) => {
  res.send("Welcome to the ToDo app server!");
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  },
);

app.use("/*path", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

initializeAppEnvironment()
  .then(() => {
    console.log("All Dependencies Initialized");
    app.listen(configuration.PORT, () => {
      console.log(
        `ToDo worker ${process.pid} is listening at http://${configuration.HOST}:${configuration.PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error("Failed to initialize dependencies:", error);
    process.exit(1);
  });
