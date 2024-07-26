import { ViemLocalEip712Signer } from "@farcaster/hub-web";
import { privateKeyToAccount } from "viem/accounts";
import { APP_FID, APP_PRIVATE_KEY } from "../constants";
import { HexString } from "../types/farcaster";
import { hexToBytes } from "../helpers";

export function getAppAccount() {
  const account = privateKeyToAccount(APP_PRIVATE_KEY);
  return account;
}
export async function getAppMetadata(pubkey: HexString, deadline: bigint) {
  const requestFid = APP_FID;
  const appAccount: any = getAppAccount();
  const eip712signer = new ViemLocalEip712Signer(appAccount);
  const key = hexToBytes(pubkey);
  const metadata = await eip712signer.getSignedKeyRequestMetadata({
    requestFid,
    key,
    deadline,
  });
  return metadata;
}
