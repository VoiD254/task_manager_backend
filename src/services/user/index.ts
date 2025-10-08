import { Request, Response } from "express";
import {
  SigninInput,
  SigninSchema,
  SignupInput,
  SignupSchema,
  UpdateProfileInput,
  UpdateProfileSchema,
} from "./validation";
import {
  createUser,
  findUserByEmail,
  getProfileDao,
  PROFILE_NAMESPACE,
  updateProfileDao,
} from "./dao";
import bcrypt from "bcrypt";
import configuration from "../../../configuration";
import jwt from "jsonwebtoken";
import { AuthResponse } from "./interface";
import { CACHE } from "../../dependency/cache";

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

  const { name, email, password } = parse.data as SignupInput;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({
        message: "email already exists",
      });

      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        sub: newUser.user_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response: AuthResponse = {
      user_id: newUser.user_id,
      name: newUser.name,
      email: newUser.email,
      token,
    };

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
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

  const { email, password } = parse.data as SigninInput;

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
        sub: user.user_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response: AuthResponse = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      token,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({
      message: "Internal server Error",
    });
  }
};

const getProfile = async (req: Request, res: Response) => {
  const user_id = req.user?.user_id;

  try {
    const profile = await getProfileDao(user_id);

    if (!profile) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const updateProfile = async (req: Request, res: Response) => {
  const user_id = req.user?.user_id;

  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing Error",
      errors: parsed.error.errors,
    });
  }

  const { name } = parsed.data as UpdateProfileInput;

  try {
    const updatedUser = await updateProfileDao({ user_id, name });

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    try {
      await CACHE.del(`${PROFILE_NAMESPACE}:${user_id}`);
    } catch (err) {
      console.error("Failed to invalidate profile cache", err);
    }

    return res.status(200).json({
      profile: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export { signup, signin, getProfile, updateProfile };
