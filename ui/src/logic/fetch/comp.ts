import { parseProf } from "../helpers";
import { Fid, UserProfile } from "../types/farcaster";
import { AResult } from "../types/sortug";
import { onChainIdRegistryEventByAddress, userData } from "./hub";

export async function addressToProfile(address: string): AResult<UserProfile> {
  const data = await onChainIdRegistryEventByAddress(address);
  console.log(data, "data");
  if ("errCode" in data) return { error: data.errCode };
  const { fid } = data;
  const datas = await userData(fid);
  console.log(datas, "datas");
  const profile = parseProf(datas, fid);
  return { ok: profile };
}
export async function fidToProfile(fid: Fid): AResult<UserProfile> {
  const datas = await userData(fid);
  console.log(datas, "datas");
  if (datas.messages.length === 0) return { error: "No profile set" };
  const profile = parseProf(datas, fid);
  return { ok: profile };
}
