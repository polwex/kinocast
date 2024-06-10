export type Hub = {
  url: string; // host
  httpPort: number;
  gossipSubPort: number;
  grcpPort: number;
};

// DOCS
// https://www.thehubble.xyz/docs/httpapi/httpapi.html
// https://github.com/farcasterxyz/hub-monorepo/blob/main/packages/hub-web/src/generated/message.ts

export type HexString = `0x${string}`;
export type Fid = number; // that's a user ID
export type Cursor = string;
export type Address = string;
export type Hash = string;
export type UsernameType = "USERNAME_TYPE_FNAME" | "USERNAME_TYPE_ENS_L1";
export interface UserNameByFidRes {
  proofs: UserNameRes[];
}

export type MessageType = "MESSAGE_TYPE_CAST_ADD";
export type NetworkType = "FARCASTER_NETWORK_MAINNET";
export type PID = {
  fid: Fid;
  hash: Hash;
};
export interface MessageData {
  data: {
    type: MessageType;
    fid: Fid;
    timestamp: number;
    network: NetworkType;
    castAddBody: {
      embedsDeprecated: [];
      mentions: Fid[];
      parentCastId: PID;
      text: string;
      mentionsPositions: number[];
      embeds: any[];
    };
  };
  hash: Hash;
  hashScheme: "HASH_SCHEME_BLAKE3";
  signature: string;
  signatureScheme: "SIGNATURE_SCHEME_ED25519";
  signer: Address;
}
export interface UserNameRes {
  timestamp: number;
  name: string;
  owner: Address;
  signature: string;
  fid: Fid;
  type: UsernameType;
}
export interface FidsRes {
  fids: Fid[];
  nextPageToken: Cursor;
}
export type UserDataRequestType =
  | null
  | 1 // USER_DATA_TYPE_PFP
  | 2 // USER_DATA_TYPE_DISPLAY
  | 3 // USER_DATA_TYPE_BIO
  // | 4 // USER_DATA_TYPE_URL
  | 5 // USER_DATA_TYPE_URL
  | 6; // USER_DATA_TYPE_USERNAME

export type Post = {
  time: number;
  text: string;
  author: Author;
  embeds: Embed[];
  parent: CastID | null;
  hash: string;
};
export type CastID = { fid: number; hash: string };
export type Embed = { url: string } | { castId: CastID };
export type Author = {
  fid: number;
  pfp: string;
  name: string;
  username: string;
};

export type UserProfile = {
  fid: number;
  pfp: string;
  bio: string;
  url: string;
  displayname: string;
  username: string;
  follows: number;
  followers: number;
};
export const ProfileBunt = {
  fid: 0,
  pfp: "",
  bio: "",
  url: "",
  displayname: "Kinocast",
  username: "kinocast",
  follows: 0,
  followers: 0,
};

export type OpenGraphTags = {
  title: string;
  type: string;
  image: OGImage;
  url: string;
  audio?: OGAudio;
  description?: string;
  determiner?: string;
  locale?: string;
  "locale:alternate"?: string;
  site_name?: string;
  video?: OGVideo;
  twatter?: TwatterMeta;
};
export type OGImage = {
  url: string;
  width?: number;
  height?: number;
  secure_url?: string;
  alt?: string;
}
export type OGVideo = {
  url: string;
  width?: number;
  height?: number;
  secure_url?: string;
  tag?: string;
  type?: string;
}
export type OGAudio = {
  url: string;
  secure_url?: string;
  type?: string;
}
export type TwatterMeta = {
  card?: string;
  url: string;
  title?: string;
  image?: string;
  description?: string;
}
export type Frame = {
  embedURL: string;
  version: string; // "vNExt" | "2020-01-01";
  image: string;
  ogImage: string;
  imageAspectRatio?: string; // "1:1" | "1.91:1"
  postURL?: string;
  buttons: FrameButton[];
  state?: string; // up to 4k bytes
  inputText?: string; // 32bytes
}
export type FrameButton = {
  text: string;
  action?: "post" | "post_redirect" | "link" | "mint" | "tx";
  target?: string;
  postUrl?: string;
}
export type FrameActionJson = {
    fid: Fid,
    url: string,
    messageHash: string,
    timestamp: number,
    network: number,
    buttonIndex: number,
    inputText: string | undefined //  if requested and no input, undefined if input not requested
    state: string | undefined;
    transactionId: string,
    address: string,
    castId: {
      fid: Fid,
      hash: string
    };
  };

  export type FnameTransfer ={
    fid: Fid;
    from: number;
    id: number;
    owner: string;
    server_signature: string;
    timestamp: number;
    to: number;
    user_signature: number;
    username: string;
  }
