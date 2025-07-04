import path from "path";

import * as dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, `./configs/.${process.env.NODE_ENV}.env`),
});

export default {
  NODE_ENV: process.env.NODE_ENV,
  HOST: process.env.HOST,
  REMOTE_HOST_URL: process.env.REMOTE_HOST_URL,
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
};
