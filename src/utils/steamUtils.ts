/**
 * Convert Steam ID64 to Account ID (Steam ID 3)
 */
export function steamId64ToAccountId(steamId64: string): number {
  const steamId64BigInt = BigInt(steamId64);
  const accountId = Number(steamId64BigInt - BigInt("76561197960265728"));
  return accountId;
}

/**
 * Convert Account ID (Steam ID 3) to Steam ID64
 */
export function accountIdToSteamId64(accountId: number): string {
  const steamId64 = BigInt(accountId) + BigInt("76561197960265728");
  return steamId64.toString();
}
