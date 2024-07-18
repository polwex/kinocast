import { queryAddressFid } from "../chain/ids";
import { parseProf } from "../helpers";
import { Fid, UserProfile } from "../types/farcaster";
import { AResult } from "../types/sortug";
import { onChainIdRegistryEventByAddress, userData } from "./hub";

export async function addressToProfile(
  pc: any,
  address: string,
): AResult<UserProfile> {
  const fid = await queryAddressFid(pc, address as any);
  console.log(fid, "fid fetched from id registry");
  if (fid === 0n) return { error: "no fid" };
  const datas = await userData(Number(fid));
  console.log(datas, "datas");
  const profile = parseProf(datas, Number(fid));
  return { ok: profile };
}
export async function fidToProfile(fid: Fid): AResult<UserProfile> {
  const datas = await userData(fid);
  console.log(datas, "datas");
  if (datas.messages.length === 0) return { error: "No profile set" };
  const profile = parseProf(datas, fid);
  return { ok: profile };
}
