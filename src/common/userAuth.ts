import configuration from "../../configuration";
import jwt from "jsonwebtoken";

if (!configuration.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in configuration");
}

const JWT_SECRET = configuration.JWT_SECRET;

export const getUserIdFromToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (error) {
    return null;
  }
};
