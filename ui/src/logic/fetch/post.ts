import { APP_FID, LocalHub, MyHub, farcastHub, pinata } from "../constants";

import {
  Factories,
  Message,
  ViemLocalEip712Signer,
  ViemWalletEip712Signer,
} from "@farcaster/hub-web";
import { Fid } from "../types/farcaster";
import { PID } from "../types/farcaster";
import useGlobalState from "../state/state";
import { signTypedData } from "viem/accounts";

async function goPost(path: string, body: Buffer) {
  const { url, httpPort } = MyHub;
  // const res = await fetch(`https://${url}/${path}`);
  const u = `http://${url}:${httpPort}/${path}`;
  // const auth = {username, password};
  const opts = {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      // auth
    },
    body,
  };
  const res = await fetch(u, opts);
  return res.json();
}

export async function editProfile(value: string, type: number) {}

export async function submitMessage(text: string, reply: PID | null) {
  // const castAddBody = {
  //   // embedsDeprecated: [],
  //   // mentions: [],
  //   // mentionsPositions: [],
  //   // embeds: [],
  //   // parentCastId: reply,
  //   text
  // };
  // const { prof, wallet } = useGlobalState();
  // const fid = prof.fid;
  // const signer = Factories.Ed25519Signer.build();
  // const castAdd = await Factories.CastAddMessage.create(
  //   {
  //     data: { fid, network: "FARCASTER_NETWORK_MAINNET", castAddBody }
  //   }, { transient: { signer } })
  // const msg = Message.encode(castAdd).finish();
  // const messageBytes = Buffer.from(msg)
  // return await goPost("v1/submitMessage", messageBytes)
  // const data = {
  //   type: "MESSAGE_TYPE_CAST_ADD",
  //   fid,
  //   timestamp: (Date.now() - RetardedTime) / 1000,
  //   network: "FARCASTER_NETWORK_MAINNET",
  //   castAddBody: {
  //     embedsDeprecated: [],
  //     mentions,
  //     mentionsPositions: [],
  //     embeds,
  //     parentCastId,
  //     text
  //   }
  // }
  // const signed = hashAndSign();
  // const json = {
  //   data,
  //   ...signed
  // }
}
