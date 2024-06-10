import {
  ok,
  Ok,
  err,
  Err,
  Result,
  okAsync,
  errAsync,
  ResultAsync,
  fromThrowable,
  fromPromise,
  fromSafePromise,
  safeTry,
} from "neverthrow";
import { Fid, FrameActionJson, HexString, PID, UserProfile } from "../types/farcaster";
import { AResult } from "../types/sortug";
import { CastAddBody } from "@farcaster/hub-web";
import { CastRes } from "./kinohub";

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

export async function fetchPubkey(): AResult<HexString> {
  const res = await gofetch("/pubkey");
  if (res === "error") return { error: "Something went wrong" };
  // else return { ok: res };
  else return { ok: `0x${res}` };
}
export async function checkNew(): Promise<number> {
  const res = await gofetch("/logged");
  return res;
}
export async function readProfile(): Promise<UserProfile> {
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
  return res;
}
export async function setupDB() {
  const res: boolean = await gofetch("/setup");
  return res;
}
export async function checkID() {}
export async function fetchProfile(fid: number) {
  const res: boolean = await gofetch(`/profile?fid=${fid}`);
  return res;
}
export async function fetchCasts(fid: number) {
  const res: boolean = await gofetch(`/casts?fid=${fid}`);
  return res;
}

export async function setOnBackend(fid: number) {
  const res: boolean = await gofetch(`/save-account?fid=${fid}`);
  return res;
}

export async function gofetch(
  path: string,
  opts: RequestInit = {},
): Promise<any> {
  // TODO use neverthrow or whatever
  try {
    const res = await fetch(`${BASE_URL}/api${path}`, opts);
    return await res.json();
  } catch {
    return null;
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

export async function bookmarkPost(cast: CastRes){
  const body = { Bookmark: { cast } };
  const res = await post(body);
  return res;
}
export async function bookmarkDel(cast: CastRes){
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
export async function scrapeURL(url: string){
  const body = { Scrape: { url} };
  const res = await post(body);
  return res;
}
export async function sendFrame(frame: FrameActionJson){
  const body = { SendFrame: { frame} };
  const res = await post(body);
  return res;
}

export async function sendUserData(value: string, type: number){
  const body = {SetUserData : {value, type}}
  const res = await post(body);
  return res;
}
export async function sendFnameReg(name: string, hex: string){
  const address = hex.slice(2);
  const body = {SetFname: {name, address}}
  const res = await post(body);
  return res;
}
