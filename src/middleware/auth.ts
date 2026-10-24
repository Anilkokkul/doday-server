import { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Support custom user header for local development or bearer token
  const headerUserId = req.header("x-user-id");
  const authHeader = req.header("authorization");

  if (headerUserId) {
    req.user = { id: headerUserId };
    return next();
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // When JWT / Auth0 is configured, verify here. For now, extract or fallback:
    req.user = { id: token || "default-user" };
    return next();
  }

  // Fallback for single-user personal MVP mode
  req.user = { id: "default-user" };
  next();
}
