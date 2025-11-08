export function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at ? user.created_at.split(" ")[0] : null,
    twoFAEnabled: Boolean(user.two_fa_enabled),
    links: {
      self: `/api/users/${encodeURIComponent(user.username)}`,
    },
  };
}
