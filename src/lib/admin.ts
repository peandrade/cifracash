/**
 * List of admin user IDs.
 * These users have access to admin features like feedback management.
 */
export const ADMIN_USER_IDS = [
  "cml77zjgc0000jr047lf5oxv7",
] as const;

/**
 * Check if a user ID belongs to an admin.
 */
export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId as typeof ADMIN_USER_IDS[number]);
}
