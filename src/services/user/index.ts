import { Request, Response } from "express";
import {
  ForgotPasswordInput,
  ForgotPasswordSchema,
  RefreshTokenInput,
  RefreshTokenSchema,
  ResetPasswordInput,
  ResetPasswordSchema,
  SigninInput,
  SigninSchema,
  SignupInput,
  SignupSchema,
  UpdateProfileInput,
  UpdateProfileSchema,
  VerifyOtpInput,
  VerifyOtpSchema,
} from "./validation";
import {
  createUser,
  findUserByEmail,
  getProfileDao,
  PROFILE_NAMESPACE,
  updateProfileDao,
  updateUserPassword,
} from "./dao";
import bcrypt from "bcrypt";
import configuration from "../../../configuration";
import jwt from "jsonwebtoken";
import { AuthResponse, AuthTokens } from "./interface";
import { CACHE } from "../../dependency/cache";
import {
  deleteStoredRefreshToken,
  getUserIdByRefreshToken,
  storeRefreshToken,
} from "../../dependency/redis-services/refreshSession";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  deleteUserOtp,
  getUserOTP,
  storeUserOTP,
} from "../../dependency/redis-services/otp";
import {
  deleteResetToken,
  getUserIdByResetToken,
  storeResetToken,
} from "../../dependency/redis-services/passReset";
import { sendOtpEmail, sendSecurityEmail } from "../../dependency/email";

if (!configuration.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in configuration");
}

const JWT_SECRET = configuration.JWT_SECRET;

async function generateTokens(user_id: string) {
  const accessToken = jwt.sign(
    {
      sub: user_id,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  const refreshToken = uuidv4();
  await storeRefreshToken(user_id, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
}

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
    const existing = await findUserByEmail({ email });
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

    const { accessToken, refreshToken } = await generateTokens(newUser.user_id);

    const response: AuthResponse = {
      user_id: newUser.user_id,
      name: newUser.name,
      email: newUser.email,
      accessToken,
      refreshToken,
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
    const user = await findUserByEmail({ email });
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

    const { accessToken, refreshToken } = await generateTokens(user.user_id);

    const response: AuthResponse = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      accessToken,
      refreshToken,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({
      message: "Internal server Error",
    });
  }
};

const refresh = async (req: Request, res: Response) => {
  const parsed = RefreshTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing error",
      errors: parsed.error.errors,
    });
  }

  const { refreshToken } = parsed.data as RefreshTokenInput;

  try {
    const user_id = await getUserIdByRefreshToken(refreshToken);
    if (!user_id) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    await deleteStoredRefreshToken(refreshToken);

    const accessToken = jwt.sign(
      {
        sub: user_id,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    const newRefreshToken = uuidv4();
    await storeRefreshToken(user_id, newRefreshToken);

    const response: AuthTokens = {
      accessToken,
      refreshToken: newRefreshToken,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
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
  const user_id: string = req.user?.user_id;

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

async function sendOtpToUser(user: { user_id: string; email: string }) {
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0"); // always 6 digits
  await storeUserOTP(user.user_id, otp);

  sendOtpEmail(user.email, otp).catch((err) => {
    console.error("OTP email error: ", err);
  });

  return otp;
}

const forgotPassword = async (req: Request, res: Response) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing error",
      errors: parsed.error.errors,
    });
  }

  const { email } = parsed.data as ForgotPasswordInput;

  try {
    const user = await findUserByEmail({ email });
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    await sendOtpToUser(user);

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const resendOtp = async (req: Request, res: Response) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing error",
      errors: parsed.error.errors,
    });
  }

  const { email } = parsed.data as ForgotPasswordInput;

  try {
    const user = await findUserByEmail({ email });
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    await sendOtpToUser(user);

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const verifyOtp = async (req: Request, res: Response) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing error",
      errors: parsed.error.errors,
    });
  }

  const { email, otp } = parsed.data as VerifyOtpInput;

  try {
    const user = await findUserByEmail({ email });
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    const storedOtp = await getUserOTP(user.user_id);
    if (!storedOtp) {
      return res.status(410).json({
        message: "OTP expired. Please request a new one",
      });
    }

    if (storedOtp !== otp) {
      return res.status(401).json({
        message: "Invalid OTP",
      });
    }

    await deleteUserOtp(user.user_id);

    const resetToken = crypto.randomUUID();

    await storeResetToken(resetToken, user.user_id);

    res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
      expiresIn: 10 * 60,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Parsing error",
      errors: parsed.error.errors,
    });
  }

  const { resetToken, newPassword } = parsed.data as ResetPasswordInput;

  try {
    const user_id = await getUserIdByResetToken(resetToken);
    if (!user_id) {
      return res.status(401).json({
        message: "Invalid or expired reset token",
      });
    }

    const user = await getProfileDao(user_id);
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await updateUserPassword({
      user_id,
      hashedPassword,
    });
    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await deleteResetToken(resetToken);
    await deleteStoredRefreshToken(user_id);
    sendSecurityEmail(user.email).catch((err) => {
      console.error("Security email error: ", err);
    });

    res.status(200).json({
      message: "Password reset successful. Please sign in again.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export {
  signup,
  signin,
  getProfile,
  updateProfile,
  refresh,
  forgotPassword,
  resendOtp,
  verifyOtp,
  resetPassword,
};
