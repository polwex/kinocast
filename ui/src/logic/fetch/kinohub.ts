// standard Hubble API requests

import { PG_URL, RPC_URL, RetardedTime } from "../constants";
import { LocalHub, MyHub, farcastHub, pinata } from "../constants";
import {
  Fid,
  FidsRes,
  UserDataRequestType,
  UserNameByFidRes,
  UserNameRes,
  UserProfile,
} from "../types/farcaster";
import { UserChannelsRes, getUserChannels } from "./warpcast";

// Kinohub
export type TimelineRes = {
  casts: FullCastRes[];
  cursor: number;
};
export type UserRes = {
  fid: Fid;
  casts: FullCastRes[];
  cursor: number;
  profile: UserProfile;
};
export type ThreadRes = {
  author: UserProfile;
  cast: CastRes;
  likes: ReactionRes[];
  rts: ReactionRes[];
  replies: FullCastRes[];
};
export type FullCastRes = {
  author: UserProfile;
  cast: CastRes;
  likes: ReactionRes[];
  rts: ReactionRes[];
  // replies: CastRes[];
  reply_count: number;
};
export type ReactionRes = {};
export type FollowsRes = {
  fid: Fid;
  followers: FollowRes;
  follows: FollowRes;
};
export type FollowRes = {
  map: Record<number, UserProfile>;
  cursor: number;
};
export type CastRes = {
  fid: number;
  text: string;
  timestamp: string; // todo,
  hash: number[]; // todo
  embeds: Embed[];
  mentions: Fid[];
  mentions_positions: number[]; // todo
  parent_hash: string | null;
  parent_url: string | null;
  parent_fid: Fid | null;
  root_parent_hash: string | null;
  root_parent_url: string | null;
};
export type CastID = { fid: number; hash: number[] };
export type Embed = { Url: string } | { CastId: CastID };
type Timestamp = number;
async function goQuery(s: string) {
  const path = PG_URL + s;
  const res = await fetch(path);
  const j = await res.json();
  return j;
}

export async function fetchTimeline(
  fid: Fid,
  cursor: Timestamp,
): Promise<TimelineRes> {
  return await goQuery(`/kinov1/timeline?fid=${fid}&cursor=${cursor}`);
}
export async function userCasts(
  fid: Fid,
  cursor: Timestamp,
  replies = false,
): Promise<UserRes> {
  return await goQuery(
    `/kinov1/feed?fid=${fid}&cursor=${cursor}&replies=${replies}`,
  );
}
export async function userLikes(fid: Fid, cursor: Timestamp): Promise<UserRes> {
  return await goQuery(`/kinov1/likes?fid=${fid}&cursor=${cursor}`);
}
export async function userLinks(
  fid: Fid,
  cursor: Timestamp,
): Promise<FollowsRes> {
  return await goQuery(`/kinov1/links?fid=${fid}&cursor=${cursor}`);
}
export async function userFollows(
  fid: Fid,
  cursor: Timestamp,
  ltype: 0 | 1,
): Promise<FollowRes> {
  return await goQuery(
    `/kinov1/follows?fid=${fid}&cursor=${cursor}&ltype=${ltype}`,
  );
}
export async function userChannels(
  fid: Fid,
  cursor?: string,
): Promise<UserChannelsRes> {
  // return await goQuery(`/kinov1/userchannels?fid=${fid}&cursor=${cursor}`)
  // const res = await fetch(path);
  // const j = await res.json();
  const j = await getUserChannels(fid, cursor);
  return j;
}

export async function fullThread(hash: string): Promise<ThreadRes> {
  return await goQuery(`/kinov1/threadH?hash=${hash.slice(2)}`);
}
export async function fullThreadURL(url: string): Promise<ThreadRes> {
  return await goQuery(`/kinov1/threadU?url=${url}`);
}
