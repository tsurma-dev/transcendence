import crypto from "crypto";

export async function reissueJwtAndSetCookie({
  user,
  req,
  reply,
  cookieOptions,
}) {
  const sessionId = crypto.randomUUID();

  const token = req.server.jwt.sign({
    id: user.id,
    username: user.username,
    sessionId,
  });

  await req.server.redis.set(
    user.id,
    JSON.stringify({
      username: user.username,
      loginTime: Date.now(),
      sessionId,
    }),
    "EX",
    86400
  );

  reply.setCookie("logintoken", token, cookieOptions);
}
