import {
  Fid,
  FrameActionJson,
  HexString,
  PID,
  UserProfile,
} from "../types/farcaster";
import { AResult } from "../types/sortug";
import { castsByFid, likesByFid, userData } from "./hub";
import { ChannelRes, getUserChannels } from "./warpcast";
import { parseCastAdd } from "../helpers";

// export const URL = import.meta.env.PROD ? "" : "http://localhost:8095";

const BASE_URL = import.meta.env.BASE_URL;
if (window.our) window.our.process = BASE_URL?.replace("/", "");
console.log("env", import.meta.env);
console.log(window.our, "our");
// const NODE_URL = import.meta.env.VITE_NODE_URL;

const PROXY_TARGET = `${import.meta.env.VITE_NODE_URL || "http://localhost:8090"}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
// const WEBSOCKET_URL = import.meta.env.DEV
//   ? `${PROXY_TARGET.replace("http", "ws")}`
//   : undefined;

// export function bootstrapAPI(): KinodeClientApi {
// const api = new KinodeClientApi({
//   uri: WEBSOCKET_URL,
//   nodeId: window.our.node,
//   processId: window.our.process,
//   onOpen: (_event, _api) => {
//     console.log("Connected to Kinode");
//     // api.send({ data: "Hello World" });
//   },
//   onMessage: (json, _api) => {
//     console.log("WEBSOCKET MESSAGE", json);
//   },
// });
// return api
// }
// Kinohub
export const profileBunt: UserProfile = {
  pfp: "",
  displayname: "",
  username: "",
  bio: "",
  fid: 0,
  url: "",
  follows: 0,
  followers: 0,
};
export type NodeRes =
  | { timeline: TimelineRes }
  | { profile: UserProfile }
  | { feed: { fid: Fid; casts: TimelineRes } };
export type TimelineRes = {
  casts: FullCastRes[];
  cursor: number;
};
export type UserRes = {
  feed: {
    fid: Fid;
    casts: FullCastRes[];
    cursor: number;
    profile: UserProfile;
  };
};
export type LikesRes = {
  likes: PID[];
  cursor: number;
};
export type ProfileMap = Record<Fid, UserProfile>;
export type LinksRes = {
  fid: Fid;
  following: ProfileMap;
  followers: ProfileMap;
};
export type ChannelsRes = {
  chans: ChannelRes[];
  cursor: number;
};
export type ThreadRes = {
  author: UserProfile;
  cast: CastRes;
  likes: ReactionRes[];
  rts: ReactionRes[];
  replies: FullCastRes[];
};
export type FullThreadRes = {
  author: UserProfile;
  cast: CastRes;
  likes: ReactionRes[];
  rts: ReactionRes[];
  replies: FullCastRes[];
  reply_count: number;
};
export type FullCastRes = {
  author: UserProfile;
  cast: CastRes;
  likes: ReactionRes[];
  rts: ReactionRes[];
  replies: CastRes[];
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
  timestamp: number; // todo,
  hash: string; // todo
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
export type Embed = { url: string } | { castId: CastID };
type Timestamp = number;

export async function fetchTimeline(
  fid: Fid,
  cursor: Timestamp,
): Promise<TimelineRes> {
  const res = await gofetch(`/timeline?cursor=${cursor}`);
  if ("ok" in res) {
    return res.ok.timeline;
  } else
    return {
      casts: [],
      cursor: 0,
    };
}

export async function fetchUserFeed(
  fid: Fid,
  cursor: Timestamp,
  includeReplies = false,
): Promise<UserRes> {
  const path = includeReplies
    ? `/userfeed?fid=${fid}&cursor=${cursor}&replies=1`
    : `/userfeed?fid=${fid}&cursor=${cursor}`;
  const res = await gofetch(path);
  if ("ok" in res && res.ok.feed.casts.length > 0) {
    return res.ok;
  } else {
    const res2 = await castsByFid(fid, cursor.toString());
    const ccasts = res2.messages.reduce((acc: FullCastRes[], r, i) => {
      const t = r.data.type;
      if (t !== "MESSAGE_TYPE_CAST_ADD") return acc;
      const rr = parseCastAdd(r);
      return [...acc, rr];
    }, []);
    const profile = await userData(fid);
    const casts = ccasts.map((c) => ({ ...c, author: profile }));
    return { feed: { fid, casts, cursor, profile } };
  }
}
export async function fetchUserReactions(
  fid: Fid,
  cursor: Timestamp,
): Promise<LikesRes> {
  const res = await gofetch(`/userreactions?fid=${fid}&cursor=${cursor}`);
  if ("ok" in res) {
    return res.ok;
  } else {
    const res2 = await likesByFid(fid);
    console.log(res2, "likesfrom hub");
    return res2;
  }
}
export async function fetchUserLinks(
  fid: Fid,
  // cursor: Timestamp,
): Promise<LinksRes> {
  const res = await gofetch(`/userlinks?fid=${fid}`);
  if ("ok" in res) {
    return res.ok;
  } else {
    const res2 = await likesByFid(fid);
    console.log(res2, "likesfrom hub");
    return res2;
  }
}
export async function fetchUserChannels(
  fid: Fid,
  cursor: Timestamp,
): Promise<ChannelsRes> {
  const res = await gofetch(`/userchans?fid=${fid}&cursor=${cursor}`);
  if ("ok" in res) {
    return res.ok;
  } else {
    const res2 = await getUserChannels(fid, cursor.toString());
    console.log(res2, "chans from hub");
    return { chans: res2.result.channels, cursor };
  }
}

export async function fetchFullThread(hash: string): Promise<ThreadRes> {
  const res = await gofetch(`/fullthread?hash=${hash}`);
  if ("ok" in res) return res.ok;
  else return null as any;
}
export async function fetchEngagement(fid: Fid, hash: string): Promise<any> {
  const res = await gofetch(`/engagement?fid=${fid}&hash=${hash}`);
  console.log(res, "eng res");
  if ("ok" in res) {
    return {};
  } else return {};
}
export async function fetchPubkey(): AResult<{ pubKey: string }> {
  // const res1 = await gofetch("/change-key");
  const res = await gofetch("/pubkey");
  return res;
}
export async function readProfile(): AResult<{ profile: UserProfile }> {
  const res = await gofetch("/profile");
  return res;
}
export async function id_login(id: string): Promise<UserProfile> {
  const body = { IDLogin: { id } };
  const res = await post(body);
  return res;
}
export async function logout(): Promise<boolean> {
  const res = await gofetch("/logout");
  if ("ok" in res) return res.ok;
  else return false;
}
export async function setupDB() {
  const res = await gofetch("/setup");
  if ("ok" in res) return res.ok;
}
export async function checkID() {}
export async function fetchProfile(fid: number) {
  const res = await gofetch(`/profile?fid=${fid}`);
  if ("ok" in res) return res.ok;
  else return 0;
}
export async function fetchCasts(fid: number) {
  const res = await gofetch(`/casts?fid=${fid}`);
  if ("ok" in res) return res.ok;
  else return 0;
}

export async function setOnBackend(fid: number) {
  const res = await gofetch(`/save-account?fid=${fid}`);
  if ("ok" in res) return res.ok;
}

export async function gofetch(
  path: string,
  opts: RequestInit = {},
): AResult<any> {
  const url = `${BASE_URL}/api${path}`;
  console.log(url, "fetching");
  // TODO use neverthrow or whatever
  try {
    const res = await fetch(url, opts);
    const j = await res.json();
    return j;
  } catch {
    return { error: "request to node failed" };
  }
}

export async function post(body: any): Promise<any> {
  const opts = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-type": "application/json",
    },
  };
  // TODO use neverthrow or whatever
  try {
    const res = await fetch(`${BASE_URL}/api/post`, opts);
    return await res.json();
  } catch {
    throw new Error("wtf");
  }
}

// kinocast features

export async function bookmarkPost(cast: CastRes) {
  const body = { Bookmark: { cast } };
  const res = await post(body);
  return res;
}
export async function bookmarkDel(cast: CastRes) {
  const body = { BookmarkDel: { cast } };
  const res = await post(body);
  return res;
}

// message sending
export async function sendCast(text: string) {
  const body = { Send: { message: text } };
  const res = await post(body);
  return res;
}
export async function sendReply(text: string, par: PID) {
  const parent = { ...par, hash: par.hash.slice(2) };
  const body = { Reply: { message: text, parent } };
  const res = await post(body);
  return res;
}
export async function sendLike(target: PID) {
  const body = { Like: { target } };
  const res = await post(body);
  return res;
}
export async function sendRT(target: PID) {
  const body = { RT: { target } };
  const res = await post(body);
  return res;
}
export async function sendFollow(target: Fid) {
  const body = { Follow: { target } };
  const res = await post(body);
  return res;
}
export async function sendUnfollow(target: Fid) {
  const body = { Unfollow: { target } };
  const res = await post(body);
  return res;
}
export async function scrapeURL(url: string) {
  const body = { Scrape: { url } };
  const res = await post(body);
  return res;
}
export async function sendFrame(frame: FrameActionJson) {
  const body = { SendFrame: { frame } };
  const res = await post(body);
  return res;
}

export async function sendUserData(value: string, type: number) {
  const body = { SetUserData: { value, type } };
  const res = await post(body);
  return res;
}
export async function sendFnameReg(name: string, hex: string) {
  const address = hex.slice(2);
  const body = { SetFname: { name, address } };
  const res = await post(body);
  return res;
}
