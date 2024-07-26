import { fromFarcasterTime } from "@farcaster/hub-web";
import { RetardedTime } from "./constants";
import { CastRes, FullCastRes, ReactionRes, profileBunt } from "./fetch/kinode";
import { MessageData, Post, UserProfile } from "./types/farcaster";

export function date_diff(date: number | Date, type: "short" | "long") {
  const now = new Date().getTime();
  const diff = now - new Date(date).getTime();
  if (type == "short") {
    return to_string(diff / 1000);
  } else {
    return to_string_long(diff / 1000);
  }
}

function to_string(s: number) {
  if (s < 60) {
    return "now";
  } else if (s < 3600) {
    return `${Math.ceil(s / 60)}m`;
  } else if (s < 86400) {
    return `${Math.ceil(s / 60 / 60)}h`;
  } else if (s < 2678400) {
    return `${Math.ceil(s / 60 / 60 / 24)}d`;
  } else if (s < 32140800) {
    return `${Math.ceil(s / 60 / 60 / 24 / 30)}mo`;
  } else {
    return `${Math.ceil(s / 60 / 60 / 24 / 30 / 12)}y`;
  }
}

function to_string_long(s: number) {
  if (s < 60) {
    return "right now";
  } else if (s < 3600) {
    return `${Math.ceil(s / 60)} minutes ago`;
  } else if (s < 86400) {
    return `${Math.ceil(s / 60 / 60)} hours ago`;
  } else if (s < 2678400) {
    return `${Math.ceil(s / 60 / 60 / 24)} days ago`;
  } else if (s < 32140800) {
    return `${Math.ceil(s / 60 / 60 / 24 / 30)} months ago`;
  } else {
    return `${Math.ceil(s / 60 / 60 / 24 / 30 / 12)} years ago`;
  }
}

export function displayCount(c: number): string {
  if (c === 0) return "";
  if (c < 1_000) return `${c}`;
  if (c >= 1_000 && c < 1_000_000) return `${Math.round(c / 1_00) / 10}K`;
  if (c >= 1_000_000) return `${Math.round(c / 100_000) / 10}M`;
  else return "";
}

// parsing hub

export function parseProf(
  p: MessageData<"MESSAGE_TYPE_USER_DATA_ADD">[],
  fid: number,
): UserProfile {
  const [followers, follows] = [0, 0];
  let [username, displayname, bio, url, pfp] = ["", "", "", "", ""];
  for (let m of p) {
    const d = m.data.userDataBody;
    if (d.type === "USER_DATA_TYPE_USERNAME") username = d.value;
    if (d.type === "USER_DATA_TYPE_PFP") pfp = d.value;
    if (d.type === "USER_DATA_TYPE_DISPLAY") displayname = d.value;
    if (d.type === "USER_DATA_TYPE_BIO") bio = d.value;
    if (d.type === "USER_DATA_TYPE_URL") url = d.value;
  }
  return { username, displayname, bio, url, pfp, fid, follows, followers };
}
export function parseCasts(p: any, author: any) {
  const posts: Post[] = p.messages.map((m: any) => parseCast(m, author));
  // const posts: Post[] = p.messages.slice.(0, 50).map(m => parseCast(m, author));
  const casts = posts.sort((a, b) => b.time - a.time);
  return casts;
}

export function parseCast(j: any, author: any): Post {
  if (j.data.type === "MESSAGE_TYPE_CAST_ADD") {
    const d = j.data.castAddBody;
    const parent = "parentCastId" in d ? d.parentCastId : null;
    const p: Post = {
      time: j.data.timestamp * 1000 + RetardedTime,
      text: d.text,
      embeds: d.embeds,
      author,
      parent,
      hash: j.hash,
    };
    return p;
  } else if (j.data.type === "MESSAGE_TYPE_CAST_REMOVE") {
    return {
      time: j.data.timestamp * 1000 + RetardedTime,
      text: "Deleted post",
      embeds: [],
      author,
      parent: null,
      hash: j.hash,
    };
  } else throw new Error(`${j.data.type} not handled`);
}

export function makeDeadline() {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // set the signatures' deadline to 1 hour from now
  return deadline;
}

// from viem via farcaster-core
export function bytesToHash(a: number[]) {
  const ar = new Uint8Array(a);
  return bytesToHex(ar);
}
export function bytesToHex(value: Uint8Array): string {
  let string = "";
  for (let i = 0; i < value.length; i++) {
    string += hexes[value[i]];
  }
  const hex = `0x${string}` as const;
  return hex;
}
export function hexToBytes(hex: string): Uint8Array {
  let hexString = hex.slice(2) as string;
  if (hexString.length % 2) hexString = `0${hexString}`;

  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === undefined || nibbleRight === undefined) {
      throw new Error(
        `Invalid byte sequence ("${hexString[j - 2]}${
          hexString[j - 1]
        }" in "${hexString}").`,
      );
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}
function charCodeToBase16(char: number) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine)
    return char - charCodeMap.zero;
  if (char >= charCodeMap.A && char <= charCodeMap.F)
    return char - (charCodeMap.A - 10);
  if (char >= charCodeMap.a && char <= charCodeMap.f)
    return char - (charCodeMap.a - 10);
  return undefined;
}

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, "0"),
);
const charCodeMap = {
  zero: 48,
  nine: 57,
  A: 65,
  F: 70,
  a: 97,
  f: 102,
} as const;

export function abbreviateNumber(n: number): string {
  if (n < 1000) return n.toString();

  const suffixes = ["", "k", "m", "B", "T"];
  const i = Math.floor(Math.log10(n) / 3);
  const scaled = n / Math.pow(1000, i);
  return scaled.toFixed(1) + suffixes[i];
}
export function abbreviate(s: string, len: number): string {
  if (s.length < len) return s;
  else return `${s.slice(0, len)}...`;
}

export function parseCastAdd(
  r: MessageData<"MESSAGE_TYPE_CAST_ADD">,
): FullCastRes {
  const likes: ReactionRes[] = [];
  const rts: ReactionRes[] = [];
  const replies: CastRes[] = [];
  const reply_count = replies.length;
  const ccast = r.data.castAddBody;
  const fid = r.data.fid;
  const text = ccast.text;
  let timestamp = r.data.timestamp;
  const tsres = fromFarcasterTime(r.data.timestamp);
  if (tsres.isOk()) {
    timestamp = tsres.value;
  }
  const hash = r.hash;
  const embeds = ccast.embeds;
  const mentions = ccast.mentions;
  const mentions_positions = ccast.mentionsPositions;
  const parent_url = ccast.parentCastUrl ? ccast.parentCastUrl : null;
  const parent_hash = ccast.parentCastId ? ccast.parentCastId.hash : null;
  const parent_fid = ccast.parentCastId ? ccast.parentCastId.fid : null;
  const root_parent_hash = null;
  const root_parent_url = null;
  const cast: CastRes = {
    fid,
    text,
    timestamp,
    hash,
    mentions,
    mentions_positions,
    embeds,
    parent_url,
    parent_hash,
    parent_fid,
    root_parent_hash,
    root_parent_url,
  };
  return {
    author: profileBunt,
    cast,
    likes,
    rts,
    replies,
    reply_count,
  };
}
