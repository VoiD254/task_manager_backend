import { Request, Response } from "express";
import { SigninSchema, SignupSchema } from "./interface";
import { createUser, findUserByEmail } from "./dao";
import bcrypt from "bcrypt";
import configuration from "../../../configuration";
import jwt from "jsonwebtoken";

if (!configuration.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in configuration");
}

const JWT_SECRET = configuration.JWT_SECRET;

const signup = async (req: Request, res: Response): Promise<void> => {
  const parse = SignupSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      message: "Parsing error",
      error: parse.error,
    });
    return;
  }

  const { name, email, password } = parse.data;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({
        message: "email already exists",
      });

      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(name, email, hashedPassword);

    const token = jwt.sign(
      {
        userId: newUser.userId,
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({
      userId: newUser.userId,
      name: newUser.name,
      email: newUser.email,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

const signin = async (req: Request, res: Response): Promise<void> => {
  const parse = SigninSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      message: "Parsing error",
      error: parse.error,
    });

    return;
  }

  const { email, password } = parse.data;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        message: "Invalid credentials",
      });

      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({
        message: "Invalid Credentials",
      });

      return;
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server Error",
      error: err,
    });
  }
};

export { signup, signin };
