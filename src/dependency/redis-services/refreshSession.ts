import { ZodUUID } from "zod/v4";
import { getDependencies } from "..";

const redis = getDependencies().redisClient;
const REFRESH_NAMESPACE = "taskmanager:user:refresh";
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days

async function storeRefreshToken(
  user_id: string,
  refreshToken: ZodUUID | string,
) {
  const key = `${REFRESH_NAMESPACE}:${refreshToken}`;

  await redis.set(key, user_id, "EX", REFRESH_TTL);
}

async function getUserIdByRefreshToken(refreshToken: ZodUUID | string) {
  const key = `${REFRESH_NAMESPACE}:${refreshToken}`;

  return await redis.get(key);
}

async function deleteStoredRefreshToken(refreshToken: ZodUUID | string) {
  const key = `${REFRESH_NAMESPACE}:${refreshToken}`;

  await redis.del(key);
}

export { storeRefreshToken, getUserIdByRefreshToken, deleteStoredRefreshToken };
