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

  // Set session in redis
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

// export function getDummyUser() {
//   return {
//     id: "0",
//     email: "",
//     password_hash: DUMMY_PASSWORD_HASH,
//     two_fa_enabled: 1,
//     two_fa_secret: DUMMY_2FA_SECRET,
//   };
// }
