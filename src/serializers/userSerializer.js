export function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at ? user.created_at.split(' ')[0] : null,
    links: {
      self: `/users/${encodeURIComponent(user.username)}`
    }
  };
}
