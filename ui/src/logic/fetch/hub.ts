// standard Hubble API requests

import { PG_URL, HUB_URL, RetardedTime } from "../constants";
import {
  Fid,
  FidsRes,
  HubResponse,
  UserDataRequestType,
  UserNameByFidRes,
  UserNameRes,
} from "../types/farcaster";

// RPC -- deprecated

export async function currentPeers() {
  const path = "v1/currentPeers";
  return goFetch(path);
}
export async function info(showStats: boolean) {
  const path = `v1/info?dbstats=${showStats ? "1" : "0"}`;
  return goFetch(path);
}
export async function castById(fid: Fid, hash: string) {
  const path = `v1/castById?fid=${fid}&hash=${hash}`;
  return goFetch(path);
}
export async function castsByFid(fid: Fid, cursor: string) {
  const path = cursor
    ? `v1/castsByFid?reverse=1&fid=${fid}&pageToken=${cursor}`
    : `v1/castsByFid?reverse=1&fid=${fid}`;
  return goFetch(path);
}
export async function castsByParent(fid: Fid, hash: string) {
  // by hash or URL
  const path = `v1/castByParent?fid=${fid}&hash=${hash}`;
  return goFetch(path);
}
export async function castsByMention(fid: Fid) {
  const path = `v1/castByMention?fid=${fid}`;
  return goFetch(path);
}
export async function reactionById(
  fid: number,
  reactionType: string,
  targetFid: number,
  targetHash: string,
) {
  const path = `v1/reactionById?fid=${fid}&reaction_type=${reactionType}&target_fid=${targetFid}&target_hash=${targetHash}`;
  return goFetch(path);
}
export async function reactionsByFid(fid: number, reactionType: number) {
  const path = `v1/reactionsByFid?fid=${fid}&reaction_type=${reactionType}`;
  return goFetch(path);
}
export async function reCastsByFid(fid: number) {
  return reactionsByFid(fid, 2);
}
export async function likesByFid(fid: number) {
  return reactionsByFid(fid, 1);
}

export async function reactionsByCast(
  fid: number,
  hash: string,
): Promise<HubResponse<"MESSAGE_TYPE_REACTION_ADD">> {
  const path = `v1/reactionsByCast?target_fid=${fid}&target_hash=${hash.slice(2)}`;
  return goFetch(path);
}
export async function reactionsByTarget(url: string, reactionType: string) {
  const path = `v1/reactionsByTarget?url=${url}&reaction_type=${reactionType}`;
  return goFetch(path);
}
export async function linkById(
  fid: number,
  targetFid: number,
  linkType: string,
) {
  const path = `v1/linkById?fid=${fid}&target_fid=${targetFid}&link_type=${linkType}`;
  return goFetch(path);
}
export async function linksByFid(fid: number) {
  const path = `v1/linksByFid?fid=${fid}`;
  return goFetch(path);
}
export async function linksByTargetFid(targetFid: number) {
  const path = `v1/linksByTargetFid?target_fid=${targetFid}`;
  return goFetch(path);
}
export async function storageLimitsByFid(fid: number) {
  const path = `v1/storageLimitsByFid?fid=${fid}`;
  return goFetch(path);
}
export async function verificationsByFid(fid: number, address: string | null) {
  const path = address
    ? `v1/verificationsByFid?fid=${fid}&address=${address}`
    : `v1/verificationsByFid?fid=${fid}`;
  return goFetch(path);
}
export async function onChainSignersByFid(fid: number, signer: string | null) {
  const path = signer
    ? `v1/onChainSignersByFid?fid=${fid}&signer=${signer}`
    : `v1/onChainSignersByFid?fid=${fid}`;
  return goFetch(path);
}
export async function onChainEventsByFid(fid: number, eventType: number) {
  const path = `v1/onChainEventsByFid?fid=${fid}&event_type=${eventType}`;
  return goFetch(path);
}
export async function onChainIdRegistryEventByAddress(address: string) {
  const path = `v1/onChainIdRegistryEventByAddress?address=${address}`;
  return goFetch(path);
}
export async function eventById(id: number) {
  const path = `v1/eventById?event_id=${id}`;
  return goFetch(path);
}
export async function events(id: number | null) {
  const path = id ? `v1/events?from_event_id=${id}` : `v1/events`;
  return goFetch(path);
}

export async function links() {
  const path = `v1/info?dbstats=1`;
  return goFetch(path);
}
export async function userData(
  fid: Fid,
  requestType: UserDataRequestType = null,
) {
  const type = requestType ? `&user_data_type=${requestType}` : "";
  const path = `v1/userDataByFid?fid=${fid}${type}`;
  return goFetch(path);
}
export async function fids(): Promise<FidsRes> {
  const path = `v1/fids`;
  return goFetch(path);
}
export async function usernameProofs(name: string): Promise<UserNameRes> {
  const path = `v1/userNameProofByName?name=${name}`;
  return goFetch(path);
}
export async function usernameProofsByFid(fid: Fid): Promise<UserNameByFidRes> {
  const path = `v1/userNameProofByFid?fid=${fid}`;
  return goFetch(path);
}

async function goFetch(path: string) {
  // const res = await fetch(`https://${url}/${path}`);
  // const u = `http://${url}:${httpPort}/${path}`;
  const res = await fetch(`${HUB_URL}/${path}`);
  return res.json();
}
