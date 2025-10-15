import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import tasksRoutes from "./src/route/tasks";
import userRoutes from "./src/route/user";
import configuration from "./configuration";
import { initializeAppEnvironment } from "./src/dependency";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(cors());
app.use(helmet());

const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

app.use("/api/v1/user", asyncHandler(userRoutes));
app.use("/api/v1/tasks", asyncHandler(tasksRoutes));
console.log("User routes loaded!");

app.get("/", (req, res) => {
  res.send("Welcome to the Task manager app server!");
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

initializeAppEnvironment()
  .then(() => {
    console.log("All Dependencies Initialized");
    app.listen(configuration.PORT, () => {
      console.log(
        `Task manager worker ${process.pid} is listening at http://${configuration.HOST}:${configuration.PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error("Failed to initialize dependencies:", error);
    process.exit(1);
  });
