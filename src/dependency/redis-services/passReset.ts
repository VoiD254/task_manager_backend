import { CACHE } from "../cache";

const RESET_NAMESPACE = "taskmanager:user:reset";
const RESET_TTL = 10 * 60; // 10 mins

async function storeResetToken(resetToken: string, user_id: string) {
  const key = `${RESET_NAMESPACE}:${resetToken}`;

  await CACHE.set(key, user_id, RESET_TTL);
}

async function getUserIdByResetToken(resetToken: string) {
  const key = `${RESET_NAMESPACE}:${resetToken}`;

  return await CACHE.get(key);
}

async function deleteResetToken(resetToken: string) {
  const key = `${RESET_NAMESPACE}:${resetToken}`;

  await CACHE.del(key);
}

export { storeResetToken, getUserIdByResetToken, deleteResetToken };
