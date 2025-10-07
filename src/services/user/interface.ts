interface AuthResponse {
  user_id: string;
  name: string;
  email: string;
  token: string;
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

export { AuthResponse, CreateUserInput, UserProfile };
