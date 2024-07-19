import { queryAddressFid } from "../chain/ids";
import { Fid, UserProfile } from "../types/farcaster";
import { AResult } from "../types/sortug";
import { userData } from "./hub";

export async function addressToProfile(
  pc: any,
  address: string,
): AResult<UserProfile> {
  const fid = await queryAddressFid(pc, address as any);
  console.log(fid, "fid fetched from id registry");
  if (fid === 0n) return { error: "no fid" };
  const profile = await userData(Number(fid));
  return { ok: profile };
}
export async function fidToProfile(fid: Fid): AResult<UserProfile> {
  const profile = await userData(fid);
  if (!profile.username) return { error: "No profile set" };
  else return { ok: profile };
}
