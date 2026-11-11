import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { one, run, now } from "./db";
import { BusinessError } from "./errors";
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export async function login(username: string, password: string) {
  if (!username.trim() || !password)
    throw new BusinessError("Vui lòng nhập đầy đủ thông tin đăng nhập");
  const a = await one("SELECT * FROM account WHERE username=?", username);
  if (!a) throw new BusinessError("Tên đăng nhập hoặc mật khẩu không chính xác");
  const [salt, hash] = a.password.split(":");
  const check = scryptSync(password, salt, 64);
  if (!timingSafeEqual(Buffer.from(hash, "hex"), check))
    throw new BusinessError("Tên đăng nhập hoặc mật khẩu không chính xác");
  const token = randomBytes(32).toString("hex");
  await run("DELETE FROM session WHERE expires_at<?", now());
  await run(
    "INSERT INTO session VALUES (?,?,?)",
    token,
    a.id,
    new Date(Date.now() + 86400000).toISOString(),
  );
  return token;
}
export function signedToken(token: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET chưa được cấu hình");
  return token + "." + createHmac("sha256", secret).update(token).digest("hex");
}
export async function authenticate(request: Request) {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("qn_session="))
    ?.split("=")[1];
  const raw = token?.split(".")[0];
  const expected = raw ? signedToken(raw) : "";
  if (
    !token ||
    token.length !== expected.length ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  )
    throw new BusinessError("Vui lòng đăng nhập", {}, 401);
  const s =
    raw &&
    (await one(
      "SELECT * FROM session WHERE token=? AND expires_at>?",
      raw,
      now(),
    ));
  if (!s) throw new BusinessError("Vui lòng đăng nhập", {}, 401);
  return raw!;
}
