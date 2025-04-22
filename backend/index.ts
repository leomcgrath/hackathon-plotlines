import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import tipsRoute from "./api/tips";

// Create __filename and __dirname since they are not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port: string | number = process.env.PORT || 8080;

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Let tipsRoute handle all routes under /api
app.use("/api", tipsRoute);

// Serve static files for the built React app
const buildPath = path.resolve(__dirname, "..", ".", "build/client");
app.use("/", express.static(buildPath));


// Catch-all to serve index.html for any other route
app.use("*", (_: Request, res: Response) =>
  res.sendFile(path.resolve(buildPath, "index.html"))
);

try {
  app.listen(port, () => {
    console.log(`Connected successfully on port ${port}`);
  });
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(`Error occurred: ${error.message}`);
  }
}
