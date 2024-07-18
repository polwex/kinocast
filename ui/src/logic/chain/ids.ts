import {
  BUNDLER_ADDRESS,
  ID_GATEWAY_ADDRESS,
  ID_REGISTRY_ADDRESS,
  KEY_GATEWAY_ADDRESS,
  ViemLocalEip712Signer,
  ViemWalletEip712Signer,
  bundlerABI,
  idGatewayABI,
  idRegistryABI,
  keyGatewayABI,
  makeUserNameProofClaim,
} from "@farcaster/hub-web";
import {
  Account,
  PublicClient as PPublicClient,
  WalletClient,
  bytesToHex,
  createWalletClient,
  hexToBytes,
  custom,
  createPublicClient,
  http,
  webSocket,
} from "viem";
import { HexString, UserProfile } from "../types/farcaster";
import { AResult } from "../types/sortug";
import { getAppAccount, getAppMetadata } from "./app";
import { makeDeadline } from "../helpers";

export type PublicClient = PPublicClient<any, any>;

export async function queryAddressFid(
  publicClient: PublicClient,
  address: HexString,
) {
  const fid = await publicClient.readContract({
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "idOf",
    args: [address],
  });
  return fid;
}
