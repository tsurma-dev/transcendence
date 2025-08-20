export function sendFriendRequest(db, userId, friendId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO friendships (user_id, friend_id, status)
    VALUES (?, ?, 'pending')
  `);
  const info = stmt.run(userId, friendId);

  return {
    success: info.changes > 0,
    alreadyExists: info.changes === 0,
  };
}

export function findFriendRequest(db, senderId, receiverId) {
  const stmt = db.prepare(`
    SELECT * FROM friendships
    WHERE user_id = ? AND friend_id = ? AND status = 'pending'
  `);
  return stmt.get(senderId, receiverId);
}

export function acceptFriendRequest(db, userId, friendId) {
  const stmt = db.prepare(`
    UPDATE friendships
    SET status = 'accepted'
    WHERE user_id = ? AND friend_id = ? AND status = 'pending'
  `);
  const info = stmt.run(friendId, userId);
  return { success: info.changes > 0 };
}

export function rejectFriendRequest(db, userId, friendId) {
  const stmt = db.prepare(`
    UPDATE friendships
    SET status = 'rejected'
    WHERE user_id = ? AND friend_id = ? AND status = 'pending'
  `);
  const info = stmt.run(friendId, userId);

  return { success: info.changes > 0 };
}

export function listFriends(db, userId) {
  const stmt = db.prepare(`
    SELECT u.id, u.username, f.created_at
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ? AND f.status = 'accepted'
    UNION
    SELECT u.id, u.username, f.created_at
    FROM friendships f
    JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = ? AND f.status = 'accepted'
  `);
  return stmt.all(userId, userId);
}

export function deleteFriend(db, userId, friendId) {
  const stmt = db.prepare(`
    DELETE FROM friendships
    WHERE (user_id = ? AND friend_id = ?)
       OR (user_id = ? AND friend_id = ?)
  `);
  const info = stmt.run(userId, friendId, friendId, userId);

  return {
    success: info.changes > 0,
  };
}
