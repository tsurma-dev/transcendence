export const loginCookieOptions = {
  path: "/",
  httpOnly: true, // prevent JS access
  secure: true, // https only
  sameSite: "none", // set to strict later to prevent other sites access
  signed: true, // use sign key
  maxAge: 60 * 60 * 24, // one day, use of lifetime instad of session in case of
  // session restore
  // domain: 'example.com' // Optional: set if needed
};
