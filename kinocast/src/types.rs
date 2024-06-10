use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug)]
pub enum Errors {
  Bad,
}
impl std::fmt::Display for Errors {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl std::error::Error for Errors {}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PID {
  pub hash: String,
  pub fid: u64,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FrameBodyJson {
  pub fid: u64,
  pub url: String,
  pub message_hash: String,
  pub timestamp: u64,
  pub network: u8,
  pub button_index: u32,
  pub input_text: String,
  pub state: String,
  pub transaction_id: String,
  pub address: String,
  pub cast_id: PID,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FrameBodyJsonReq {
  pub untrusted_data: FrameBodyJson,
  pub trusted_data: Td,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Td {
  pub message_bytes: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum UIPostRequest {
  IDLogin { id: String },
  Send { message: String },
  Reply { message: String, parent: PID },
  Like { target: PID },
  RT { target: PID },
  Bookmark { posts: Vec<CastT> },
  BookmarkDel { posts: Vec<CastT> },
  Follow { target: u64 },
  Unfollow { target: u64 },
  Scrape { url: String },
  SendFrame { frame: FrameBodyJson },
  SetUserData { value: String, r#type: u8 },
  SetFname { name: String, address: String },
  History,
}
#[derive(Debug, Serialize, Deserialize)]
pub enum UIGetResponse {
  Profile(Profile),
  Casts(Casts),
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
  fid: u64,
  name: String,
  username: String,
  bio: String,
  pfp: String,
  url: String,
}
impl Profile {
  pub fn new(
    fid: u64,
    name: String,
    username: String,
    bio: String,
    pfp: String,
    url: String,
  ) -> Self {
    Self {
      fid,
      name,
      username,
      bio,
      pfp,
      url,
    }
  }
  pub fn from_sqlite(map: &HashMap<String, Value>) -> Result<Self> {
    let fid = map
      .get("fid")
      .and_then(|v| v.as_u64())
      .ok_or_else(|| anyhow!("Missing or invalid 'id'"))? as u64;
    let name = map
      .get("name")
      .and_then(|v| v.as_str())
      .ok_or_else(|| anyhow::anyhow!("Missing or invalid 'name'"))?
      .to_string();
    let username = map
      .get("username")
      .and_then(|v| v.as_str())
      .ok_or_else(|| anyhow::anyhow!("Missing or invalid 'name'"))?
      .to_string();
    let bio = map
      .get("bio")
      .and_then(|v| v.as_str())
      .ok_or_else(|| anyhow::anyhow!("Missing or invalid 'name'"))?
      .to_string();
    let pfp = map
      .get("pfp")
      .and_then(|v| v.as_str())
      .ok_or_else(|| anyhow::anyhow!("Missing or invalid 'name'"))?
      .to_string();
    let url = map
      .get("url")
      .and_then(|v| v.as_str())
      .ok_or_else(|| anyhow::anyhow!("Missing or invalid 'name'"))?
      .to_string();

    Ok(Profile {
      fid,
      name,
      username,
      bio,
      pfp,
      url,
    })
  }
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Casts {
  name: String,
  username: String,
  bio: String,
  pfp: String,
  url: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse {
  pub fid: u64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct HubResponse {
  pub messages: Vec<Message>,
  #[serde(rename = "nextPageToken")]
  pub next_page_token: String,
}

// protobuf conversions

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct UserNameProof {
  pub timestamp: u64,
  pub name: Vec<u8>,
  pub owner: Vec<u8>,
  pub signature: Vec<u8>,
  pub fid: u64,
  pub r#type: i32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserNameType {
  UsernameTypeNone = 0,
  UsernameTypeFname = 1,
  UsernameTypeEnsL1 = 2,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Message {
  pub data: Option<MessageDataJson>,
  pub hash: String,
  #[serde(rename = "hashScheme")]
  pub hash_scheme: HashScheme,
  pub signature: String,
  #[serde(rename = "signatureScheme")]
  pub signature_scheme: SignatureScheme,
  pub signer: String,
  // pub data_bytes: Option<Vec<u8>>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct MessageDataJson {
  pub r#type: MessageType,
  pub fid: u64,
  pub timestamp: u32,
  pub network: FarcasterNetwork,
  #[serde(flatten)]
  pub body: Option<MessageBodyJson>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// #[serde(untagged)]
#[serde(rename_all = "camelCase")]
pub enum MessageBodyJson {
  CastAddBody(CastAddBodyJson),
  CastRemoveBody(CastRemoveBodyJson),
  ReactionBody(ReactionBodyJson),
  VerificationAddAddressBody(VerificationAddAddressBodyJson),
  VerificationRemoveBody(VerificationRemoveBodyJson),
  UserDataBody(UserDataBodyJson),
  LinkBody(LinkBodyJson),
  UsernameProofBody(UserNameProof),
  FrameActionBody(FrameActionBodyJson),
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct UserDataBodyJson {
  pub r#type: UserDataType,
  pub value: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EmbedJson {
  #[serde(flatten)]
  pub embed: Option<EmbedVariantJson>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum EmbedVariantJson {
  Url(String),
  CastId(CastIdJson),
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct CastAddBodyJson {
  pub embeds_deprecated: Vec<String>,
  pub mentions: Vec<u64>,
  pub text: String,
  pub mentions_positions: Vec<u32>,
  pub embeds: Vec<EmbedJson>,
  #[serde(flatten)]
  pub parent: Option<CastAddBodyParentJson>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CastAddBodyParentJson {
  ParentCastId(CastIdJson),
  ParentUrl(String),
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct CastRemoveBodyJson {
  pub target_hash: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct CastIdJson {
  pub fid: u64,
  pub hash: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReactionBodyJson {
  pub r#type: i32,
  #[serde(flatten)]
  pub target: Option<ReactionBodyTargetJson>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ReactionBodyTargetJson {
  TargetCastId(CastIdJson),
  TargetUrl(String),
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct VerificationAddAddressBodyJson {
  pub address: Vec<u8>,
  pub claim_signature: Vec<u8>,
  pub block_hash: Vec<u8>,
  pub verification_type: u32,
  pub chain_id: u32,
  pub protocol: i32,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct VerificationRemoveBodyJson {
  pub address: Vec<u8>,
  pub protocol: i32,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct LinkBodyJson {
  pub r#type: String,
  pub display_timestamp: Option<u32>,
  #[serde(flatten)]
  pub target: Option<LinkBodyTargetJson>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum LinkBodyTargetJson {
  TargetFid(u64),
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct FrameActionBodyJson {
  pub button_index: u32,
  pub cast_id: Option<CastIdJson>,
  pub input_text: Vec<u8>,
  pub state: Vec<u8>,
  pub transaction_id: Vec<u8>,
  pub address: Vec<u8>,
}

// copied from kinohub

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CastT {
  pub fid: i64,
  pub author_name: String,
  pub hash: String,
  pub timestamp: u64,
  pub text: String,
  pub embeds: Value,
  pub mentions: Value,
  pub mentions_positions: Value,
  pub parent_fid: Option<i64>,
  pub parent_hash: Option<String>,
  pub parent_url: Option<String>,
  pub root_parent_hash: Option<Vec<String>>,
  pub root_parent_url: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
// #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum HashScheme {
  #[serde(rename = "HASH_SCHEME_NONE")]
  None = 0,
  #[serde(rename = "HASH_SCHEME_BLAKE3")]
  Blake3 = 1,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
// #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SignatureScheme {
  #[serde(rename = "SIGNATURE_SCHEME_NONE")]
  None = 0,
  #[serde(rename = "SIGNATURE_SCHEME_ED25519")]
  Ed25519 = 1,
  #[serde(rename = "SIGNATURE_SCHEME_EIP712")]
  Eip712 = 2,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
// #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MessageType {
  #[serde(rename = "MESSAGE_TYPE_NONE")]
  None = 0,
  #[serde(rename = "MESSAGE_TYPE_CAST_ADD")]
  CastAdd = 1,
  #[serde(rename = "MESSAGE_TYPE_CAST_REMOVE")]
  CastRemove = 2,
  #[serde(rename = "MESSAGE_TYPE_REACTION_ADD")]
  ReactionAdd = 3,
  #[serde(rename = "MESSAGE_TYPE_REACTION_REMOVE")]
  ReactionRemove = 4,
  #[serde(rename = "MESSAGE_TYPE_LINK_ADD")]
  LinkAdd = 5,
  #[serde(rename = "MESSAGE_TYPE_LINK_REMOVE")]
  LinkRemove = 6,
  #[serde(rename = "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS")]
  VerificationAddEthAddress = 7,
  #[serde(rename = "MESSAGE_TYPE_VERIFICATION_REMOVE")]
  VerificationRemove = 8,
  #[serde(rename = "MESSAGE_TYPE_USER_DATA_ADD")]
  UserDataAdd = 11,
  #[serde(rename = "MESSAGE_TYPE_USERNAME_PROOF")]
  UsernameProof = 12,
  #[serde(rename = "MESSAGE_TYPE_FRAME_ACTION")]
  FrameAction = 13,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
// #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FarcasterNetwork {
  #[serde(rename = "FARCASTER_NETWORK_NONE")]
  None = 0,
  #[serde(rename = "FARCASTER_NETWORK_MAINNET")]
  Mainnet = 1,
  #[serde(rename = "FARCASTER_NETWORK_TESTNET")]
  Testnet = 2,
  #[serde(rename = "FARCASTER_NETWORK_DEVNET")]
  Devnet = 3,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
// #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserDataType {
  #[serde(rename = "USER_DATA_TYPE_NONE")]
  None = 0,
  #[serde(rename = "USER_DATA_TYPE_PFP")]
  Pfp = 1,
  #[serde(rename = "USER_DATA_TYPE_DISPLAY")]
  Display = 2,
  #[serde(rename = "USER_DATA_TYPE_BIO")]
  Bio = 3,
  #[serde(rename = "USER_DATA_TYPE_URL")]
  Url = 5,
  #[serde(rename = "USER_DATA_TYPE_USERNAME")]
  Username = 6,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReactionType {
  None = 0,
  Like = 1,
  Recast = 2,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Protocol {
  Ethereum = 0,
  Solana = 1,
}
