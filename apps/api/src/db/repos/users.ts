import bcrypt from "bcryptjs";
import { get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface User {
  id: string;
  business_id: string;
  email: string;
  password_hash: string;
  name?: string;
  role: string;
}

export function createUser(businessId: string, email: string, password: string, name?: string): User {
  const id = newId("usr");
  const password_hash = bcrypt.hashSync(password, 10);
  run(
    `INSERT INTO users (id, business_id, email, password_hash, name) VALUES ($id, $businessId, $email, $password_hash, $name)`,
    { id, businessId, email: email.toLowerCase(), password_hash, name: name ?? null }
  );
  return get<User>(`SELECT * FROM users WHERE id = $id`, { id })!;
}

export function findUserByEmail(email: string): User | undefined {
  return get<User>(`SELECT * FROM users WHERE email = $email`, { email: email.toLowerCase() });
}

export function getUser(id: string): User | undefined {
  return get<User>(`SELECT * FROM users WHERE id = $id`, { id });
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}
