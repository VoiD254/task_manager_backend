import { ZodUUID } from "zod/v4";
import { CACHE } from "../cache";

const REFRESH_NAMESPACE = "taskmanager:user:refresh";
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days

async function storeRefreshToken(
  user_id: string,
  refreshToken: ZodUUID | string,
) {
  const key = `${REFRESH_NAMESPACE}:${refreshToken}`;

  await CACHE.set(key, user_id, REFRESH_TTL);
}

async function getUserIdByRefreshToken(refreshToken: ZodUUID | string) {
  const key = `${REFRESH_NAMESPACE}:${refreshToken}`;

  return await CACHE.get(key);
}

async function deleteStoredRefreshToken(refreshToken: ZodUUID | string) {
  const key = `${REFRESH_NAMESPACE}:${refreshToken}`;

  await CACHE.del(key);
}

async function deleteAllUserRefreshTokens(user_id: string) {
  const pattern = `${REFRESH_NAMESPACE}:*`;
  const keys = await CACHE.scan(pattern);
  if (keys.length === 0) {
    return;
  }

  const values = await Promise.all(keys.map((key) => CACHE.get<string>(key)));

  const matchingKeys = keys.filter((_, i) => values[i] === user_id);

  if (matchingKeys.length > 0) {
    await CACHE.del(matchingKeys);
    console.log(
      `Deleted ${matchingKeys.length} refresh token(s) for user ${user_id}`,
    );
  }
}

export {
  storeRefreshToken,
  getUserIdByRefreshToken,
  deleteStoredRefreshToken,
  deleteAllUserRefreshTokens,
};
