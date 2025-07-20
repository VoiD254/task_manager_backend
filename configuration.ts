import path from "path";

import * as dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, `./configs/.${process.env.NODE_ENV}.env`),
});

export default {
  NODE_ENV: process.env.NODE_ENV,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};
