import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 비밀번호를 해싱합니다
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호를 검증합니다
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}
