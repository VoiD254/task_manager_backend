import { ZodUUID } from "zod/v4";

interface AuthResponse extends AuthTokens {
  user_id: string;
  name: string;
  email: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string | ZodUUID;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

interface UserProfile {
  name: string;
  email: string;
}

interface UpdateUserPassword {
  user_id: string;
  hashedPassword: string;
}

interface UpdateProfileInput {
  user_id: string;
  name: string;
}

export {
  AuthResponse,
  CreateUserInput,
  UserProfile,
  UpdateProfileInput,
  AuthTokens,
  UpdateUserPassword,
};
