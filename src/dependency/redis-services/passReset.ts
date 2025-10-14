import { getDependencies } from "..";

const redis = getDependencies().redisClient;

const RESET_NAMESPACE = "taskmanager:user:reset";
const RESET_TTL = 10 * 60; // 10 mins

async function storeResetToken(resetToken: string, user_id: string) {
  const key = `${RESET_NAMESPACE}:${resetToken}`;

  await redis.set(key, user_id, "EX", RESET_TTL);
}

async function getUserIdByResetToken(resetToken: string) {
  const key = `${RESET_NAMESPACE}:${resetToken}`;

  return await redis.get(key);
}

async function deleteResetToken(resetToken: string) {
  const key = `${RESET_NAMESPACE}:${resetToken}`;

  await redis.del(key);
}

export { storeResetToken, getUserIdByResetToken, deleteResetToken };
