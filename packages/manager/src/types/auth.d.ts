import { type JwtPayload } from "jwt-decode";

export interface User {
  username: string;
  role: string;
  name: string;
  email: string;
  requirePasswordReset: boolean;
}

export interface JwtClaims extends JwtPayload {
  user: User;
}
