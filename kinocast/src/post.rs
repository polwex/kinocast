use crate::db::make_timestamp_secs;
use crate::protos::message::{
  CastAddBody, CastId, FarcasterNetwork, FrameActionBody, HashScheme, LinkBody, Message,
  MessageData, MessageType, ReactionBody, ReactionType, SignatureScheme, UserDataBody,
  UserDataType,
};
use crate::protos::username_proof::{UserNameProof, UserNameType};
use anyhow::Result;
use hex::{FromHex, ToHex};
use kinode_process_lib::http::{send_request_await_response, Method};
use kinode_process_lib::println;
use protobuf::Message as ProtoMessage;
use url::Url;

use ed25519_dalek::{SecretKey, Signer, SigningKey};

pub static FARCASTER_EPOCH: u64 = 1609459200; // January 1, 2021 UTC
use crate::types::PID;
use crate::{hub, FrameBodyJson, FrameBodyJsonReq, Td};

pub fn make_signature(hash: Vec<u8>) -> (Vec<u8>, Vec<u8>) {
  let priv_key = "0xdeadbeef";
  let private_key = SigningKey::from_bytes(
    &SecretKey::from_hex(priv_key).expect("Please provide a valid private key"),
  );
  let signature = private_key.sign(&hash).to_bytes().to_vec();
  let verkey = private_key.verifying_key().to_bytes().to_vec();
  return (signature, verkey);
}

fn make_fc_timestamp() -> u32 {
  return (std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)
                                      .unwrap()
                                      .as_secs()
          - FARCASTER_EPOCH) as u32;
}
fn send(body: Vec<u8>) -> Result<String> {
  let urls = format!("{}{}", hub::HUB_HTTP_URL, "/v1/submitMessage");
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let mut headers = std::collections::HashMap::new();
  headers.insert("Content-Type".to_string(),
                 "application/octet-stream".to_string());
  let res = send_request_await_response(Method::POST, url, Some(headers), 5000, body)?;
  let res_json = String::from_utf8(res.into_body())?;
  println!("res json{}", res_json);
  Ok(res_json)
}

pub fn cast_add(fid: u64, text: &String, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;

  // Construct the cast add message
  let mut cast_add = CastAddBody::new();
  cast_add.set_text(text.to_string());

  // Construct the cast add message data object
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_CAST_ADD);
  msg_data.set_fid(fid);
  // Set the timestamp to the current time
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_cast_add_body(cast_add);
  let msg = sign_msg(msg_data, signer)?;
  send(msg)
}
pub fn reply_add(fid: u64, text: &String, parent: &PID, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;

  // Construct the cast add message
  let mut cast_add = CastAddBody::new();
  cast_add.set_text(text.to_string());
  let mut parent_id = CastId::new();
  parent_id.set_fid(parent.fid);
  let hash_bytes = hex::decode(parent.hash.clone())?;
  parent_id.set_hash(hash_bytes);
  cast_add.set_parent_cast_id(parent_id);

  // Construct the cast add message data object
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_CAST_ADD);
  msg_data.set_fid(fid);
  // Set the timestamp to the current time
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_cast_add_body(cast_add);
  let msg = sign_msg(msg_data, signer)?;
  send(msg)
}
pub fn like_add(fid: u64, target: &PID, signer: SigningKey) -> Result<String> {
  let rt = ReactionType::REACTION_TYPE_LIKE;
  react_add(fid, rt, target, signer)
}
pub fn rt_add(fid: u64, target: &PID, signer: SigningKey) -> Result<String> {
  let rt = ReactionType::REACTION_TYPE_RECAST;
  react_add(fid, rt, target, signer)
}
pub fn react_add(fid: u64,
                 reaction_type: ReactionType,
                 target: &PID,
                 signer: SigningKey)
                 -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;

  // Construct the cast add message
  let mut reaction = ReactionBody::new();
  reaction.set_field_type(reaction_type);
  let mut target_id = CastId::new();
  target_id.set_fid(target.fid);
  let hash_bytes = hex::decode(target.hash.clone())?;
  target_id.set_hash(hash_bytes);
  reaction.set_target_cast_id(target_id);

  // Construct the cast add message data object
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_REACTION_ADD);
  msg_data.set_fid(fid);
  // Set the timestamp to the current time
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_reaction_body(reaction);
  let msg = sign_msg(msg_data, signer)?;
  send(msg)
}
pub fn follow_fid(fid: u64, target: u64, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;

  // Construct the cast add message
  let mut link = LinkBody::new();
  link.set_field_type("follow".to_string());
  link.set_target_fid(target);
  // Construct the cast add message data object
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_LINK_ADD);
  msg_data.set_fid(fid);
  // Set the timestamp to the current time
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_link_body(link);
  let msg = sign_msg(msg_data, signer)?;
  send(msg)
}
pub fn unfollow_fid(fid: u64, target: u64, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;

  // Construct the cast add message
  let mut link = LinkBody::new();
  link.set_field_type("follow".to_string());
  link.set_target_fid(target);
  // Construct the cast add message data object
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_LINK_REMOVE);
  msg_data.set_fid(fid);
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_link_body(link);
  let msg = sign_msg(msg_data, signer)?;
  send(msg)
}

pub fn frame_action(f: FrameBodyJson, fid: u64, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;
  let f2 = f.clone();
  let mut cast_id = CastId::new();
  cast_id.set_fid(f.cast_id.fid);
  cast_id.set_hash(f.cast_id.hash.into());
  let mut frame = FrameActionBody::new();
  frame.set_url(f.url.into_bytes());
  frame.set_button_index(f.button_index);
  frame.set_cast_id(cast_id);
  frame.set_input_text(f.input_text.into_bytes());
  frame.set_state(f.state.into_bytes());
  frame.set_transaction_id(f.transaction_id.into_bytes());
  frame.set_address(f.address.into_bytes());
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_FRAME_ACTION);
  msg_data.set_fid(fid);
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_frame_action_body(frame);
  let msg = sign_msg(msg_data, signer)?;
  let message_bytes: String = msg.encode_hex();
  let validated = validate(msg);
  let mut headers = std::collections::HashMap::new();
  headers.insert("Content-Type".to_string(), "application/json".to_string());
  let frame_url = Url::parse(&f2.url)?;
  let trusted_data = Td { message_bytes };
  let frame_req = FrameBodyJsonReq { untrusted_data: f2,
                                     trusted_data };
  let frame_res = send_request_await_response(Method::POST,
                                              frame_url,
                                              Some(headers),
                                              5000,
                                              serde_json::to_vec(&frame_req)?)?;
  let res_json = String::from_utf8(frame_res.into_body())?;
  println!("res json{}", res_json);
  Ok(res_json)
}
fn validate(body: Vec<u8>) -> Result<String> {
  let urls = format!("{}{}", hub::HUB_RPC_URL, "/v1/validateMessage");
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let mut headers = std::collections::HashMap::new();
  headers.insert("Content-Type".to_string(),
                 "application/octet-stream".to_string());
  let res = send_request_await_response(Method::POST, url, Some(headers), 5000, body)?;
  let res_json = String::from_utf8(res.into_body())?;
  println!("res json{}", res_json);
  Ok(res_json)
}
pub fn set_user_data(fid: u64, value: String, utype: u8, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;
  let mut action = UserDataBody::new();
  let otype: Option<UserDataType> = match utype {
    1 => Some(UserDataType::USER_DATA_TYPE_PFP),
    2 => Some(UserDataType::USER_DATA_TYPE_DISPLAY),
    3 => Some(UserDataType::USER_DATA_TYPE_BIO),
    5 => Some(UserDataType::USER_DATA_TYPE_URL),
    6 => Some(UserDataType::USER_DATA_TYPE_USERNAME),
    _ => None,
  };
  let udtype = otype.ok_or(anyhow::anyhow!("bad usertype"))?;
  action.set_field_type(udtype);
  action.set_value(value);
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_USER_DATA_ADD);
  msg_data.set_fid(fid);
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_user_data_body(action);
  let msg = sign_msg(msg_data, signer)?;
  send(msg)
}
pub fn set_fname(fid: u64, name: String, address: String, signer: SigningKey) -> Result<String> {
  let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;
  let mut action = UserNameProof::new();
  action.set_name(name.into_bytes());
  action.set_owner(hex::decode(address)?);
  action.set_fid(fid);
  action.set_field_type(UserNameType::USERNAME_TYPE_FNAME);
  let ts = make_timestamp_secs();
  action.set_timestamp(ts);
  let mut msg_data = MessageData::new();
  msg_data.set_field_type(MessageType::MESSAGE_TYPE_USERNAME_PROOF);
  msg_data.set_fid(fid);
  msg_data.set_timestamp(make_fc_timestamp());
  msg_data.set_network(network);
  msg_data.set_username_proof_body(action);
  let msg = sign_msg(msg_data, signer)?;
  let msg2 = msg.clone();
  let validated = validate(msg);
  match validated {
    Err(e) => {
      println!("validation error {:?}", e);
      Err(anyhow::anyhow!("oops"))
    }
    Ok(o) => send(msg2),
  }
}
fn sign_msg(msg_data: MessageData, signer: SigningKey) -> Result<Vec<u8>> {
  println!("msg data {:?}", msg_data);
  let msg_data_bytes = msg_data.write_to_bytes()?;
  // Calculate the blake3 hash, trucated to 20 bytes
  let hash = blake3::hash(&msg_data_bytes).as_bytes()[0..20].to_vec();
  // Construct the actual message
  let mut msg = Message::new();
  msg.set_hash_scheme(HashScheme::HASH_SCHEME_BLAKE3);
  msg.set_hash(hash.clone());
  let signature = signer.sign(&hash);

  //
  msg.set_signature_scheme(SignatureScheme::SIGNATURE_SCHEME_ED25519);
  msg.set_signature(signature.to_vec());
  let pubbytes = signer.verifying_key().to_bytes().to_vec();
  msg.set_signer(pubbytes);

  msg.set_data_bytes(msg_data_bytes.to_vec());
  let msg_bytes = msg.write_to_bytes()?;
  Ok(msg_bytes)
}
