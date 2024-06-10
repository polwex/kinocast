import { Hub } from "./types/farcaster";

export const BASE_URL = "kc:kinocast:sortugdev.os";
export const PAGE_SIZE = 50;
export const versionNum = "0.1.0";
export const APP_FID = BigInt(500337);
export const APP_PRIVATE_KEY =
  "0x940ea40ea5581d8d15eaea8d051198b87855c03c8019fde1bf9771d666263ec3";
export const RECOVERY_ADDRESS = "0x07AFd3e1947881e9F41e2C5dEb881752B30eAb2E";

export const MOBILE_BROWSER_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry/i;
export const AUDIO_REGEX = new RegExp(/https:\/\/.+\.(mp3|wav|ogg)\b/gim);
export const VIDEO_REGEX = new RegExp(/https:\/\/.+\.(mov|mp4|ogv)\b/gim);
export const TWITTER_REGEX = new RegExp(
  /https:\/\/(twitter|x)\.com\/.+\/status\/\d+/gim,
);
export const IMAGE_REGEX = new RegExp(
  /https:\/\/.+\.(jpg|img|png|gif|tiff|jpeg|webp|webm|svg)\b/gim,
);
export const HASHTAGS_REGEX = new RegExp(/#[a-z-]+/g);
export const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

export const PG_URL = "https://kino.sortug.com/pg";
export const RPC_URL = "https://kino.sortug.com/rpc";

export const LocalHub: Hub = {
  url: "192.168.1.110",
  httpPort: 2281,
  gossipSubPort: 2282,
  grcpPort: 2283,
};
export const MyHub: Hub = {
  url: "kino.sortug.com",
  httpPort: 2281,
  gossipSubPort: 2282,
  grcpPort: 2283,
};
export const FreeHub: Hub = {
  url: "hub.freefarcasterhub.com",
  httpPort: 3281,
  gossipSubPort: 3282,
  grcpPort: 3283,
};
export const nemes: Hub = {
  url: "nemes.farcaster.xzy",
  httpPort: 2281,
  gossipSubPort: 2282,
  grcpPort: 2283,
};
// https://foss.farchiver.xyz/

export const pinata = {
  url: "hub.pinata.cloud",
  httpPort: 2281,
  gossipSubPort: 2282,
  grcpPort: 2283,
};
export const farcastHub = {
  url: "api.farcasthub.com",
  httpPort: 2281,
  gossipSubPort: 2282,
  grcpPort: 2283,
};

export const RetardedTime = 1609459200000;
export const TIMEOUT = 10_000;
