import { Fid, FnameTransfer } from "../types/farcaster";


// fnames
export async function checkFidFname(fid: number): Promise<FnameTransfer[]>{
  const path = `https://fnames.farcaster.xyz/transfers?fid=${fid}`
  const res = await fetch(path);
  const j = await res.json();
  return j.transfers
}
export async function checkFnameAvailable(fname: string): Promise<FnameTransfer[]>{
  const path = `https://fnames.farcaster.xyz/transfers?name=${fname}`
  const res = await fetch(path);
  const j = await res.json();
  return j.transfers
}
export async function registerFname(json: any): Promise<FnameTransfer>{
  const path = `https://fnames.farcaster.xyz/transfers`
  const body = JSON.stringify(json);
  const headers = {"Content-type": "application/json"};
  const opts = {method: "POST", body, headers};
  const res = await fetch(path, opts);
  const j = await res.json();
  return j.transfer
}
// channels
export async function getChannels() {
  const path = `v2/all-channels`;
  return warpFetch(path);
}
export async function getChannel(id: string) {
  const path = `v1/channel?channelId=${id}`;
  return warpFetch(path);
}
export async function getChannelFollowers(id: string) {
  const path = `v1/channel-followers?channelId=${id}`;
  return warpFetch(path);
}
export async function getUserChannels(
  fid: Fid,
  cursor?: string,
): Promise<UserChannelsRes> {
  const path = cursor
    ? `v1/user-following-channels?fid=${fid}&cursor=${cursor}`
    : `v1/user-following-channels?fid=${fid}`;
  return warpFetch(path);
}
export async function isUserinChannel(fid: Fid, channel: string) {
  const path = `v1/user-channel?fid=${fid}&channelId=${channel}`;
  return warpFetch(path);
}
export async function powerBadgeUsers() {
  const path = `v2/power-badge-users`;
  return warpFetch(path);
}

async function warpFetch(path: string): Promise<any> {
  const url = "https://api.warpcast.com/";
  return await fetch(url + path);
}

export type UserChannelsRes = {
  result: {
    channels: ChannelRes[];
  };
  next: {
    cursor: string;
  };
};
export type ChannelRes = {
  id: string;
  url: string;
  name: string;
  description: string;
  imageUrl: string;
  leadFid: number;
  hostFids: number[];
  moderatorFid: number;
  createdAt: number;
  followerCount: number;
  followedAt: number;
};
