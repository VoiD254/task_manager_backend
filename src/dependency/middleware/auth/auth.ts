import { NextFunction, Request, Response } from "express";
import { getUserIdFromToken } from "../../../common/userAuth";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user_id = getUserIdFromToken(req.headers.authorization);

    if (!user_id) {
      return res.status(401).json({ message: "Invalid Token" });
    }

    req.user = { user_id };
    next();
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
