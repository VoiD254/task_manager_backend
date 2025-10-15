import { CACHE } from "../cache";

const OTP_NAMESPACE = "taskmanager:user:otp";
const OTP_TTL = 5 * 60; // 5 mins

async function storeUserOTP(user_id: string, otp: string) {
  const key = `${OTP_NAMESPACE}:${user_id}`;

  await CACHE.set(key, otp, OTP_TTL);
}

async function getUserOTP(user_id: string) {
  const key = `${OTP_NAMESPACE}:${user_id}`;

  return await CACHE.get(key);
}

async function deleteUserOtp(user_id: string) {
  const key = `${OTP_NAMESPACE}:${user_id}`;

  await CACHE.del(key);
}

export { storeUserOTP, getUserOTP, deleteUserOtp };
