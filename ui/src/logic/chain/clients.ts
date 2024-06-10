import { fetchPubkey } from "../fetch/kinode";
import { HDNodeWallet, ethers } from "ethers";
import {
  onChainIdRegistryEventByAddress,
  onChainSignersByFid,
  userData,
} from "../fetch/hub";
import { makeDeadline, parseProf } from "../helpers";
import {
  HDAccount,
  mnemonicToAccount,
  privateKeyToAccount,
} from "viem/accounts";
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
import { APP_FID, APP_PRIVATE_KEY,  RECOVERY_ADDRESS } from "../constants";
import { HexString, UserProfile } from "../types/farcaster";
import { Result, AResult } from "../types/sortug";
import { mainnet, optimism } from "viem/chains";
import { registerFname } from "../fetch/warpcast";
import { getEnsName } from "viem/actions";

// export const optimism = /*#__PURE__*/ defineChain({
//   ...chainConfig,
//   id: 10,
//   name: 'OP Mainnet',
//   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
//   rpcUrls: {
//     default: {
//       http: ['https://mainnet.optimism.io'],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Optimism Explorer',
//       url: 'https://optimistic.etherscan.io',
//       apiUrl: 'https://api-optimistic.etherscan.io/api',
//     },
//   },
//   contracts: {
//     ...chainConfig.contracts,
//     l2OutputOracle: {
//       [sourceId]: {
//         address: '0xdfe97868233d1aa22e815a266982f2cf17685a27',
//       },
//     },
//     multicall3: {
//       address: '0xca11bde05977b3631167028862be2a173976ca11',
//       blockCreated: 4286263,
//     },
//     portal: {
//       [sourceId]: {
//         address: '0xbEb5Fc579115071764c7423A4f12eDde41f106Ed',
//       },
//     },
//     l1StandardBridge: {
//       [sourceId]: {
//         address: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
//       },
//     },
//   },
//   sourceId,
// })

export async function fetchEns(address: any) {
  const pc = createPublicClient({
    chain: mainnet, transport: http()
  })
  const res = await getEnsName(pc, { address });
  return await res

}

export async function createWallet(): Promise<WalletClient> {

  const [account] = await changeWalletAddress(); 
  const wc = createWalletClient({
    account,
    chain: optimism,
    transport: custom((window as any).ethereum)
  });
  await wc.switchChain({id: optimism.id});
  return wc
}
export async function connectToWallet(wc: WalletClient) {
  // const adrs =
  //   window?.ethereum?.isMetamask
  //     ? await wc.requestAddresses()
  //     // // : await wc.requestAddresses()
  //     : await wc.getAddresses()
  // // const res = await  window.ethereum.request({method: 'eth_requestAccounts'});
  // // console.log(res, "Res")
  // console.log(adrs, "adrs")
  // return adrs
  return changeWalletAddress()
}

export async function changeWalletAddress() {
  const accounts = await (window as any).ethereum.request({
    method: "wallet_requestPermissions",
    params: [{
      eth_accounts: {}
    }]
  }).then(() => (window as any).ethereum.request({
    method: 'eth_requestAccounts'
  }))
  return accounts
}
export type PublicClient = PPublicClient<any, any>
export function createPc(): PublicClient {
  const pc = createPublicClient({
    chain: optimism,
    transport: http()
  });
  return pc
}

export function phraseWallet(phrase: string): Result<HDNodeWallet> {
  try {
    const wallet = ethers.Wallet.fromPhrase(phrase);
    return { ok: wallet };
  } catch (e) {
    console.log(e);
    return { error: JSON.stringify(e) };
  }
}

export async function checkSigners(fid: number): AResult<HexString> {
  const signers = await onChainSignersByFid(fid, null);
  const pubkey = await fetchPubkey();
  if ("error" in pubkey)
    return { error: "couldn't retrieve kinode networking key" };
  for (let s of signers.events) {
    // TODO check for event types
    const key = s.signerEventBody.key;
    if (key === pubkey.ok) return { ok: pubkey.ok };
  }
  return { error: "" };
}

export function phraseClient(phrase: string): WalletClient {
  const account = mnemonicToAccount(phrase);
  const client = createWalletClient({
    account,
    chain: optimism as any,
    transport: http(),
  });
  return client;
}
export function getLocalSigner(phrase: string) {
  const account = mnemonicToAccount(phrase);
  const addr = account.address;
  const signer = new ViemLocalEip712Signer(account as any);
  return { signer, addr };
}
export function getWalletSigner(wc: WalletClient) {
  const signer = new ViemWalletEip712Signer(wc as any);
  const addr = wc!.account!.address;
  return { signer, addr };
}
export function keyWallet(key: string) {
  const account = privateKeyToAccount(key as any);
  const signer = new ViemLocalEip712Signer(account as any);
  return signer;
}


export async function signFname(name: string, owner: any, timestamp: number, signer: Signer): AResult<string> {
  const claim = makeUserNameProofClaim({
    name,
    owner,
    timestamp
  });
  const signature = await signer.signUserNameProofClaim(claim);
  if (signature.isErr()) return { error: "claim error" }
  else return { ok: bytesToHex(signature.value) as string }
}
export async function fnameFlow(name: string, fid: number, wc: WalletClient): AResult<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const { signer, addr } = getWalletSigner(wc!);
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
  }
  return { ok: "" }

}


export function appAccount() {
  const account = privateKeyToAccount(APP_PRIVATE_KEY as any);
  const signer = new ViemLocalEip712Signer(account as any);
  return signer;
}
export type Signer = ViemWalletEip712Signer | ViemLocalEip712Signer;

export async function getAppMeta(pubkey: HexString) {
  const requestFid = APP_FID;
  const signer = appAccount();
  const key = hexToBytes(pubkey);
  const payload = { requestFid, key, deadline: makeDeadline() };
  const metadata = await signer.getSignedKeyRequestMetadata(payload);
  return metadata;
}

export async function getUserSignature(
  publicClient: PublicClient,
  address: HexString,
  pubkey: HexString,
  signer: Signer,
  meta: Uint8Array,
  deadline: bigint,
) {
  const nonce = await publicClient.readContract({
    address: KEY_GATEWAY_ADDRESS,
    abi: keyGatewayABI,
    functionName: "nonces",
    args: [address],
  });
  const key = hexToBytes(pubkey);
  const metadata = bytesToHex(meta);

  const payload = {
    owner: address,
    keyType: 1,
    key,
    metadataType: 1,
    metadata,
    nonce,
    deadline,
  };
  return await signer.signAdd(payload);
}
export async function registerFlow(
  publicClient: PublicClient,
  walletClient: WalletClient,
  proxy: HexString,

): AResult<"ok"> {
  const deadline = makeDeadline();
  const signature = await registerID(publicClient, walletClient, proxy);
  if ("error" in signature) return signature;
  const signingKey = await fetchPubkey();
  if ("error" in signingKey) return signingKey
  const metadata = await getAppMeta(signingKey.ok);
  console.log(metadata, "md")
  if (!metadata.isOk()) return { error: "metadata error" }
  const signer = new ViemWalletEip712Signer(walletClient as any);
  const addSignature = await getUserSignature(
    publicClient,
    walletClient!.account!.address,
    signingKey.ok,
    signer,
    metadata.value,
    deadline,
  );
  if (!addSignature.isOk()) return { error: "add signature error" };
  const bundler = await bundlerCall(
    publicClient,
    walletClient,
    proxy,
    deadline,
    signature.ok,
    addSignature.value,
    signingKey.ok,
    metadata.value,
  );
  return { ok: "ok" }

}
export async function setKeysFlow(
  publicClient: PublicClient,
  walletClient: WalletClient,
  address: HexString,
  pubkey: HexString,
  signer: Signer): AResult<HexString> {
  const metadata = await getAppMeta(pubkey);
  if (!metadata.isOk()) return { error: "metadata error" }
  const deadline = makeDeadline();
  const signature = await getUserSignature(
    publicClient,
    address,
    pubkey,
    signer,
    metadata.value,
    deadline,
  );
  if (!signature.isOk()) return { error: "signature error" }
  const req = await setKeys(
    publicClient,
    address,
    pubkey,
    metadata.value,
    signature.value,
    deadline,
  );
  const res = await walletClient.writeContract(req);
  return { ok: res }
}
export async function setKeys(
  publicClient: PublicClient,
  address: HexString,
  pubkey: HexString,
  meta: Uint8Array,
  signature: Uint8Array,
  deadline: bigint,
) {
  const metadata = bytesToHex(meta);
  const account = privateKeyToAccount(APP_PRIVATE_KEY as any);
  const payload = {
    account,
    address: KEY_GATEWAY_ADDRESS,
    abi: keyGatewayABI,
    functionName: "addFor" as any,
    args: [
      address,
      1,
      pubkey,
      1,
      metadata,
      deadline,
      bytesToHex(signature),
    ] as any,
  };
  const { request } = await publicClient.simulateContract(payload);
  return request;
}

export async function registerApp(
  publicClient: PublicClient,
  walletClient: WalletClient,
) {
  const payload = {
    address: ID_GATEWAY_ADDRESS,
    abi: idGatewayABI,
    functionName: "price",
    args: [0n],
  };
  const price = await publicClient.readContract(payload as any);
  const account = walletClient.account;
  const params = {
    account,
    address: ID_GATEWAY_ADDRESS,
    abi: idGatewayABI,
    functionName: "register",
    args: [RECOVERY_ADDRESS, 0n],
    value: price,
  };
  const { request } = await publicClient.simulateContract(params as any);

  await walletClient.writeContract(request as any);
}
export async function checkFid(publicClient: PublicClient, address: HexString) {
  // TODO this didn't quite work for me
  const fid = await publicClient.readContract({
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "idOf",
    args: [address],
  });
  return fid;
}

export async function registerID(
  publicClient: PublicClient,
  client: WalletClient,
  recoveryProxy?: HexString,
): AResult<Uint8Array> {
  const deadline = makeDeadline();
  const address = client!.account!.address;
  const signer = new ViemWalletEip712Signer(client as any);

  let nonce = await publicClient.readContract({
    address: KEY_GATEWAY_ADDRESS,
    abi: keyGatewayABI,
    functionName: "nonces",
    args: [address],
  });

  const registerSignatureResult = await signer.signRegister({
    to: address,
    recovery: recoveryProxy || RECOVERY_ADDRESS,
    nonce,
    deadline,
  });
  if (registerSignatureResult.isOk())
    return { ok: registerSignatureResult.value };
  else return { error: `register id failed` };
}

export async function bundlerCall(
  publicClient: PublicClient,
  client: WalletClient,
  recoveryProxy: HexString,
  deadline: bigint,
  registerSignature: Uint8Array,
  addSignature: Uint8Array,
  signingKey: HexString,
  meta: Uint8Array,
) {
  const addr = client!.account!.address;
  const metadata = bytesToHex(meta);
  const price = await publicClient.readContract({
    address: BUNDLER_ADDRESS,
    abi: bundlerABI,
    functionName: "price",
    args: [0n],
  });
  const app = privateKeyToAccount(APP_PRIVATE_KEY as any);
  const recovery = recoveryProxy || RECOVERY_ADDRESS;


  const { request } = await publicClient.simulateContract({
    account: app,
    address: BUNDLER_ADDRESS,
    abi: bundlerABI,
    functionName: "register",
    args: [
      {
        to: addr,
        recovery,
        deadline,
        sig: bytesToHex(registerSignature),
      },
      [
        {
          keyType: 1,
          key: signingKey,
          metadataType: 1,
          metadata,
          deadline,
          sig: bytesToHex(addSignature),
        },
      ],
      0n,
    ],
    value: price,
  });
  console.log(request, "req")
  await client.writeContract(request);
}

// import { bytesToHex, createPublicClient, createWalletClient, custom, http } from 'viem';
// import { optimism } from "viem/chains";
// import { ID_GATEWAY_ADDRESS, ID_REGISTRY_ADDRESS, ID_GATEWAY_EIP_712_TYPES, idGatewayABI, idRegistryABI, keyGatewayABI, KEY_GATEWAY_ADDRESS, ViemWalletEip712Signer, NobleEd25519Signer, } from '@farcaster/hub-web';
// import { privateKeyToAccount } from 'viem/accounts';

// const WARPCAST_RECOVERY_PROXY = '0x00000000FcB080a4D6c39a9354dA9EB9bC104cd7';

// export const publicClient = createPublicClient({
//   chain: optimism as any,
//   transport: http()
// })

// export const walletClient = createWalletClient({
//   chain: optimism as any,
//   transport: custom((window as any).ethereum)
// })

// export async function getAccount() {
//   const [acc] = await walletClient.requestAddresses();
//   return acc
// }

// export const getDeadline = () => {
//   const now = Math.floor(Date.now() / 1000);
//   const oneHour = 60 * 60;
//   return BigInt(now + oneHour);
// };

// export const readNonce = async () => {
//   const account = await getAccount();
//   return await publicClient.readContract({
//     address: ID_GATEWAY_ADDRESS,
//     abi: idGatewayABI,
//     functionName: 'nonces',
//     args: [account],
//   });
// };

// export async function registerFid(recoveryAcc: string) {
//   const account = await getAccount();
//   const deadline = getDeadline();
//   const nonce = await readNonce();
//   const recovery = recoveryAcc as `0x${string}`;

//   const signature = await walletClient.signTypedData({
//     account,
//     ...ID_GATEWAY_EIP_712_TYPES,
//     primaryType: 'Register',
//     message: {
//       to: account,
//       recovery,
//       nonce,
//       deadline,
//     },
//   });
//   return signature
// }
// export async function getIDPrice() {
//   const price = await publicClient.readContract({
//     address: ID_GATEWAY_ADDRESS,
//     abi: idGatewayABI,
//     functionName: 'price',
//     args: [0n],
//   });
//   return price
// }
// export async function registerID() {
//   const account = await getAccount();
//   const price = await getIDPrice();

//   const { request } = await publicClient.simulateContract({
//     account,
//     address: ID_GATEWAY_ADDRESS,
//     abi: idGatewayABI,
//     functionName: 'register',
//     args: [WARPCAST_RECOVERY_PROXY, 0n],
//     value: price,
//   });
//   const res = await walletClient.writeContract(request);
//   console.log(res, "bought")
//   // return res

//   const APP_FID = await publicClient.readContract({
//     address: ID_REGISTRY_ADDRESS,
//     abi: idRegistryABI,
//     functionName: 'idOf',
//     args: [account],
//   });
//   console.log(APP_FID, "fid we got")
// }

// export async function registerKeys() {
//   const account = await getAccount();
//   const deadline = getDeadline();

//   const nonce = await publicClient.readContract({
//     address: KEY_GATEWAY_ADDRESS,
//     abi: keyGatewayABI,
//     functionName: 'nonces',
//     args: [account],
//   });
//   const message = {
//     to: account,
//     recovery: WARPCAST_RECOVERY_PROXY as any,
//     nonce,
//     deadline,
//   }
//   const hexSignature = await walletClient.signTypedData({
//     account,
//     primaryType: "Register",
//     message,
//     ...ID_GATEWAY_EIP_712_TYPES
//   })

//   console.log(hexSignature, "registered")

// }

// // NobleEd25519Signer
