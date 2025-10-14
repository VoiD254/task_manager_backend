import { z } from "zod";

const SignupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(50, "Name cannot exceed 50 characters"),
    email: z
      .string()
      .email("Invalid email")
      .max(100, "Email cannot exceed 100 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters")
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must include at least one uppercase letter",
      })
      .refine((val) => /[0-9]/.test(val), {
        message: "Password must include at least one number",
      })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        message: "Password must include at least one special character",
      }),
    confirmPassword: z
      .string()
      .min(6, "Confirm password is required")
      .max(50, "Password cannot exceed 50 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

interface SignupInput extends z.infer<typeof SignupSchema> {}

const SigninSchema = z.object({
  email: z
    .string()
    .email("Invalid email")
    .max(100, "Email cannot exceed 100 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password cannot exceed 50 characters")
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must include at least one uppercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Password must include at least one number",
    })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: "Password must include at least one special character",
    }),
});

interface SigninInput extends z.infer<typeof SigninSchema> {}

const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(50, "Name cannot be longer than 50 characters"),
});

type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

const RefreshTokenSchema = z.object({
  refreshToken: z.string().uuid("Invalid UUID format for refresh token."),
});

type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

const ResetPasswordSchema = z
  .object({
    resetToken: z.string().uuid("Invalid reset token"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must include at least one uppercase letter",
      })
      .refine((val) => /[0-9]/.test(val), {
        message: "Password must include at least one number",
      })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        message: "Password must include at least one special character",
      }),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export {
  SignupSchema,
  SignupInput,
  SigninSchema,
  SigninInput,
  UpdateProfileSchema,
  UpdateProfileInput,
  RefreshTokenSchema,
  RefreshTokenInput,
  ForgotPasswordSchema,
  ForgotPasswordInput,
  VerifyOtpSchema,
  VerifyOtpInput,
  ResetPasswordSchema,
  ResetPasswordInput,
};
