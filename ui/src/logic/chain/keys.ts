import {
  KEY_GATEWAY_ADDRESS,
  ViemWalletEip712Signer,
  keyGatewayABI,
} from "@farcaster/hub-web";
import {
  PublicClient as PPublicClient,
  WalletClient,
  bytesToHex,
  hexToBytes,
  parseGwei,
} from "viem";
import { HexString } from "../types/farcaster";
import { AResult } from "../types/sortug";
import { getAppAccount, getAppMetadata } from "./app";
import { makeDeadline } from "../helpers";
import { optimism } from "viem/chains";

export type PublicClient = PPublicClient<any, any>;

const KeyContract = {
  abi: keyGatewayABI,
  address: KEY_GATEWAY_ADDRESS,
  chain: optimism,
};

async function readNonce(publicClient: PublicClient, account: HexString) {
  return await publicClient.readContract({
    address: KEY_GATEWAY_ADDRESS,
    abi: keyGatewayABI,
    functionName: "nonces",
    args: [account],
  });
}
async function addSignature(
  walletClient: WalletClient,
  address: HexString,
  pubkey: HexString,
  meta: Uint8Array,
  nonce: bigint,
  deadline: bigint,
) {
  const metadata = bytesToHex(meta);
  const key = hexToBytes(pubkey);
  const eip712Signer = new ViemWalletEip712Signer(walletClient as any);
  const signature = await eip712Signer.signAdd({
    owner: address,
    keyType: 1,
    key,
    metadataType: 1,
    metadata,
    nonce,
    deadline,
  });
  return signature;
}

async function generateRequest(
  publicClient: PublicClient,
  walletClient: WalletClient,
  pubkey: HexString,
  meta: Uint8Array,
  deadline: bigint,
  signature: Uint8Array,
): AResult<any> {
  const appAccount = getAppAccount();
  const metadata = bytesToHex(meta);
  try {
    const payload = {
      ...KeyContract,
      account: appAccount,
      functionName: 'addFor',
      maxFeePerGas: parseGwei('20'),
      args: [
        walletClient.account!.address,
        1,
        pubkey,
        1,
        metadata,
        deadline,
        bytesToHex(signature)
      ]
    };
    console.log(payload, "payload");
    const { request } = await publicClient.simulateContract(payload as any);
    console.log(request, "generated request");
    return { ok: request };
  } catch (e) {
    console.log(e, "key gateway request failed");
    return { error: "key gateway request failed" };
  }
}
async function generateAddRequest(
  publicClient: PublicClient,
  account: HexString,
  pubkey: HexString,
  meta: Uint8Array,
): AResult<any> {
  const metadata = bytesToHex(meta);
  try {
    const payload = {
      ...KeyContract,
      account,
      functionName: 'add',
      args: [
        1,
        pubkey,
        1,
        metadata,
      ]
    };
    console.log(payload, "payload");
    const { request } = await publicClient.simulateContract(payload as any);
    console.log(request, "generated request");
    return { ok: request };
  } catch (e) {
    console.log(e, "key gateway request failed");
    return { error: "key gateway request failed" };
  }
}

export async function setKeysFlow(
  publicClient: PublicClient,
  walletClient: WalletClient,
  pubkey: HexString,
): AResult<HexString> {
  const address = walletClient.account!.address;
  console.log(address, "setting keys for address");
  const deadline = makeDeadline();
  const metadata = await getAppMetadata(pubkey, deadline);
  if (!metadata.isOk()) return { error: "metadata error" };
  // const nonce = await readNonce(publicClient, address);
  // const signature = await addSignature(
  //   walletClient,
  //   address,
  //   pubkey,
  //   metadata.value,
  //   nonce,
  //   deadline,
  // );
  // if (!signature.isOk()) return { error: "error adding signature" };
  //  Add for has the app pay for all these sign requests
  const req = await generateAddRequest(
    publicClient,
    walletClient!.account!.address,
    pubkey,
    metadata.value,
  );
  // const req = await generateRequest(
  //   publicClient,
  //   walletClient,
  //   pubkey,
  //   metadata.value,
  //   deadline,
  //   signature.value,
  // );
  if ("error" in req) return req;
  try {
    const res = await walletClient.writeContract(req.ok);
    return { ok: res };
  } catch (e) {
    const err = "error writing to contract";
    console.log(e, err);
    return { error: err };
  }
}
