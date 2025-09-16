import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriend,
  listFriends,
  findFriendRequest,
  getPendingFriendRequests,
} from "../models/friendModel.js";
import { findUserByUsername } from "../models/userModel.js";

export async function sendFriendRequestCon(req, reply) {
  const { username } = req.params;
  const userId = req.user.id;

  const friend = findUserByUsername(req.server.db, username);
  if (!friend) return reply.code(404).send({ message: "User not found" });

  const reverse = findFriendRequest(req.server.db, friend.id, userId);
  if (reverse && reverse.status === "pending") {
    acceptFriendRequest(req.server.db, userId, friend.id);
    return reply.send({
      success: true,
      message: "Friend request accepted automatically",
    });
  }
  const info = sendFriendRequest(req.server.db, userId, friend.id);
  reply.send({
    success: info.changes > 0,
    message:
      info.changes > 0 ? "Friend request sent" : "Request already exists",
  });
}

export async function acceptFriendRequestCon(req, reply) {
  const { username } = req.params;
  const userId = req.user.id;
  console.log(
    `Accepting friend request from ${username} for user ID ${userId}`
  );
  const friend = findUserByUsername(req.server.db, username);
  if (!friend) return reply.code(404).send({ message: "User not found" });

  const result = acceptFriendRequest(req.server.db, userId, friend.id);
  reply.send(result);
}

export async function rejectFriendRequestCon(req, reply) {
  const { username } = req.params;
  const userId = req.user.id;

  const friend = findUserByUsername(req.server.db, username);
  if (!friend) return reply.code(404).send({ message: "User not found" });

  const result = rejectFriendRequest(req.server.db, userId, friend.id);
  reply.send(result);
}

export async function deleteFriendCon(req, reply) {
  const { username } = req.params;
  const userId = req.user.id;

  const friend = findUserByUsername(req.server.db, username);
  if (!friend) return reply.code(404).send({ message: "User not found" });

  const result = deleteFriend(req.server.db, userId, friend.id);
  reply.send(result);
}

export async function getFriendsCon(req, reply) {
  const userId = req.user.id;
  const friends = listFriends(req.server.db, userId);
  const pendingRequests = getPendingFriendRequests(req.server.db, userId);
  reply.send({ friends, pendingRequests });
}
