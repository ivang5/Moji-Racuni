export type UserRole = "ADMIN" | "REGULAR";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface JwtPayload {
  user_id: number;
  username: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

export interface Receipt {
  id: number;
  date: string;
  companyUnit: number;
  totalPrice: number;
  totalVat: number;
  link: string;
}

export interface Item {
  id: number;
  receipt: number;
  name: string;
  price: number;
  quantity: number;
  measurementUnit: string;
  vatType: number;
}

export interface Company {
  id: number;
  tin: string;
  name: string;
  image?: string;
}

export interface CompanyUnit {
  id: number;
  company: string;
  name: string;
  address: string;
}

export interface CompanyType {
  id: number;
  name: string;
}

export interface Report {
  id: number;
  receipt: number;
  description: string;
  seen: boolean;
  date: string;
}

export interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
