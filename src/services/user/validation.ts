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

export { SignupSchema, SigninSchema, SigninInput, SignupInput };
