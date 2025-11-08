import { type JwtPayload } from "jwt-decode";

export interface User {
  un: string;
  r: string;
  n: string;
  e: string;
  pr: boolean;
}

export interface JwtClaims extends JwtPayload {
  usr: User;
}
