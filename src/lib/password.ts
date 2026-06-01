import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ITERATIONS}:${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [iterationsValue, salt, hash] = storedHash.split(":");
  const iterations = Number(iterationsValue);

  if (!iterations || !salt || !hash) return false;

  const attemptedHash = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const savedHash = Buffer.from(hash, "hex");

  if (attemptedHash.length !== savedHash.length) return false;

  return timingSafeEqual(attemptedHash, savedHash);
};
