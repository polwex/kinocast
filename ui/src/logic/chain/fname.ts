import { WalletClient } from "viem";
import { AResult } from "../types/sortug";
import { ViemWalletEip712Signer, makeUserNameProofClaim } from "@farcaster/hub-web";
import { registerFname } from "../fetch/warpcast";
import { bytesToHex } from "../helpers";
import { HexString } from "../types/farcaster";

export const EIP_712_USERNAME_DOMAIN = {
  name: "Farcaster name verification",
  version: "1",
  chainId: 1,
  verifyingContract: "0xe3be01d99baa8db9905b33a3ca391238234b79d1", // name registry contract, will be the farcaster ENS CCIP contract later
} as const;

export const EIP_712_USERNAME_PROOF = [
  { name: "name", type: "string" },
  { name: "timestamp", type: "uint256" },
  { name: "owner", type: "address" },
] as const;

export async function fnameFlow(name: string, fid: number, wc: WalletClient): AResult<string> {
  await wc.switchChain({ id: 1 });
  const addr = wc!.account!.address;
  const timestamp = Math.floor(Date.now() / 1000);
  // const account: HexString = wc!.account!.address;
  // const signature = wc.signTypedData({
  //   account,
  //   domain: EIP_712_USERNAME_DOMAIN,
  //   types: { UserNameProof: EIP_712_USERNAME_PROOF },
  //   primaryType: "UserNameProof",
  //   message: {
  //     name, owner: addr, timestamp: BigInt(timestamp)
  //   }
  // })
  // console.log(signature, "signature")
  const signer = new ViemWalletEip712Signer(wc as any);
  const signature = await signFname(name, addr, timestamp, signer);
  if ("error" in signature) return { error: signature.error as any }
  else if ("ok" in signature) {
    const body = {
      name,
      from: 0,
      to: fid,
      fid,
      owner: addr,
      timestamp,
      signature: signature.ok
    };
    const res = await registerFname(body);
    console.log(res, "fname transfer");
  }
  return { ok: "" }

}
export async function signFname(name: string, owner: any, timestamp: number, signer: ViemWalletEip712Signer): AResult<string> {
  const claim = makeUserNameProofClaim({
    name,
    owner,
    timestamp
  });
  const signature = await signer.signUserNameProofClaim(claim);
  console.log(signature, "hi5")
  if (signature.isErr()) return { error: "claim error" }
  else return { ok: bytesToHex(signature.value) as string }
}
