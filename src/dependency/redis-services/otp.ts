import { getDependencies } from "..";

const redis = getDependencies().redisClient;

const OTP_NAMESPACE = "taskmanager:user:otp";
const OTP_TTL = 5 * 60; // 5 mins

async function storeUserOTP(user_id: string, otp: string) {
  const key = `${OTP_NAMESPACE}:${user_id}`;

  await redis.set(key, otp, "EX", OTP_TTL);
}

async function getUserOTP(user_id: string) {
  const key = `${OTP_NAMESPACE}:${user_id}`;

  return await redis.get(key);
}

async function deleteUserOtp(user_id: string) {
  const key = `${OTP_NAMESPACE}:${user_id}`;

  await redis.del(key);
}

export { storeUserOTP, getUserOTP, deleteUserOtp };
