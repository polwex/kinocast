use anyhow::{anyhow, Result};
use hex::ToHex;
use kinode_process_lib::{
  http::{send_request_await_response, Method},
  println, Address,
};
use url::Url;

use crate::db;
use crate::protos::request_response::MessagesResponse;
use crate::sur;
use crate::types::*;

pub static HUB_HTTP_URL: &str = "https://kino.sortug.com/http";
pub static HUB_RPC_URL: &str = "https://kino.sortug.com/rpc";
pub static HUB_PG_URL: &str = "https://kino.sortug.com/pg";

pub fn fetch_casts(fid: &str, cursor: Option<String>) -> Result<Vec<u8>> {
  let urls = match cursor {
    None => format!("{}/v1/castsByFid?reverse=1&fid={}", HUB_HTTP_URL, fid),
    Some(c) => format!("{}/v1/castsByFid?reverse=1&fid={}&pageToken={}",
                       HUB_HTTP_URL, fid, c),
  };
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  // send the json as is to the browser
  let bod = res.into_body();
  Ok(bod)
}
pub fn fetch_reactions(fid: &str, hash: &str, cursor: Option<String>) -> Result<Vec<u8>> {
  let urls = match cursor {
    None => format!("{}/v1/reactionsByCast?reverse=1&fid={}&target_hash={}",
                    HUB_HTTP_URL, fid, hash),
    Some(c) => format!("{}/v1/reactionsByCast?reverse=1&fid={}&target_hash={}&pageToken={}",
                       HUB_HTTP_URL, fid, hash, c),
  };
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  // send the json as is to the browser
  let bod = res.into_body();
  Ok(bod)
}
pub fn fetch_links(fid: &str) -> Result<Vec<u8>> {
  let path = "/v1/linksByFid?reverse=1&fid=";
  let urls = format!("{}{}{}", HUB_HTTP_URL, path, fid);
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  // send the json as is to the browser
  let bod = res.into_body();
  Ok(bod)
}
pub fn fetch_userdata(fid: &str) -> Result<Vec<u8>> {
  let path = "/v1/userDataByFid?reverse=1&fid=";
  let urls = format!("{}{}{}", HUB_HTTP_URL, path, fid);
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  let bod = res.into_body();
  Ok(bod)
}
pub fn fetch_user_fid(username: &str) -> Result<u64> {
  let path = "/v1/userNameProofByName?name=";
  let urls = format!("{}{}{}", HUB_HTTP_URL, path, username);
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  let bod = res.into_body();
  // let json_string = std::str::from_utf8(&bod)?;
  // println!("fetched fid {:?}", json_string);
  let body = serde_json::from_slice::<ApiResponse>(&bod)?;
  return Ok(body.fid);
}

// build

pub fn build_timeline(our: &Address, state: &mut sur::State) -> Result<()> {
  println!("building timeline  {:?}", state);
  match state.active_fid {
    None => Err(anyhow::anyhow!("no active fid")),
    Some(fid) => {
      let post_count = db::get_cast_count(our, fid)?;
      println!("post count {:?}", post_count);
      if post_count == 0 {
        let _own_casts = save_all_casts(our, fid)?;
        let links = save_links(our, fid)?;
        for (_, _, follow_fid, _, _) in links {
          let _saved = save_all_casts(our, follow_fid)?;
        }
      } else {
        let _own_casts = save_casts(our, fid)?;
        let links = save_links(our, fid)?;
        for (_, _, follow_fid, _, _) in links {
          let _saved = save_casts(our, follow_fid)?;
        }
      }
      Ok(())
    }
  }
}
fn save_casts(our: &Address, fid: u64) -> Result<()> {
  let fids = fid.to_string();
  // println!("fetching and saving casts from {}", fids);
  let mut msgs: Vec<Message> = vec![];
  let casts = fetch_casts(&fids, None)?;
  let hres = serde_json::from_slice::<HubResponse>(&casts)?;
  msgs.extend(hres.messages);
  write_casts(our, msgs)
  // save the msgs to db
}
fn write_casts(our: &Address, msgs: Vec<Message>) -> Result<()> {
  let mut casts: Vec<(String, u64, u32, CastAddBodyJson)> = vec![];
  for msg in msgs {
    match msg.data {
      None => (),
      Some(d) => match d.body {
        None => (),
        Some(b) => match b {
          MessageBodyJson::CastAddBody(cab) => {
            // let _rs = save_reactions(our, &d.fid, &msg.hash);
            let tuple = (msg.hash, d.fid, d.timestamp, cab);
            casts.push(tuple);
          }
          _ => (),
        },
      },
    }
  }
  let _casts_ok = db::write_casts(our, casts)?;
  Ok(())
}
fn save_all_casts(our: &Address, fid: u64) -> Result<()> {
  let fids = fid.to_string();
  println!("fetching and saving casts from {}", fids);
  let mut msgs: Vec<Message> = vec![];
  let mut cursor: Option<String> = None;
  // TODO we might as well just ignore the cursor tho at least for the timeline
  loop {
    let casts = fetch_casts(&fids, cursor)?;
    let hres = serde_json::from_slice::<HubResponse>(&casts)?;
    msgs.extend(hres.messages);
    println!("cursor {}", hres.next_page_token);
    if hres.next_page_token.is_empty() {
      break;
    } else {
      cursor = Some(hres.next_page_token);
    }
  }
  write_casts(our, msgs)
}

fn save_links(our: &Address, fid: u64) -> Result<Vec<(String, u64, u64, String, u32)>> {
  let fids = fid.to_string();
  let links = fetch_links(&fids)?;
  let hres = serde_json::from_slice::<HubResponse>(&links)?;
  println!("links fetched {} {:?}",
           hres.next_page_token,
           hres.messages.len());
  let mut links: Vec<(String, u64, u64, String, u32)> = vec![];
  for msg in hres.messages {
    match msg.data {
      None => (),
      Some(d) => match d.body {
        None => (),
        Some(b) => match b {
          MessageBodyJson::LinkBody(lb) => {
            println!("link type {:?}", lb.r#type);
            let tuple = (msg.hash, d.fid, lb.target_fid, lb.r#type, d.timestamp);
            links.push(tuple);
          }
          _ => (),
        },
      },
    }
  }
  let links_ok = db::write_links(our, links.clone());
  println!("links saved{:?}", links_ok);
  Ok(links)
}

fn save_reactions(our: &Address, fid: &u64, hash: &str) -> Result<()> {
  println!("saving reactions {:?}/{:?}", fid, hash);
  let fids = fid.to_string();
  let reactions = fetch_reactions(&fids, hash, None)?;
  let hres = serde_json::from_slice::<HubResponse>(&reactions)?;
  let mut rreactions = vec![];
  for msg in hres.messages {
    println!("reaction msg {:?}", msg);
    match msg.data {
      None => (),
      Some(d) => match d.body {
        None => (),
        Some(b) => match b {
          MessageBodyJson::ReactionBody(rb) => {
            println!("rb{:?}", rb);
            if rb.target == None {
              ()
            };
            let tg = rb.target.unwrap();
            match tg {
              ReactionBodyTargetJson::TargetCastId(tci) => {
                let tfid = tci.fid;
                let thash: String = tci.hash.encode_hex();
                let tuple = (msg.hash, d.fid, tfid, thash, rb.r#type, d.timestamp);
                rreactions.push(tuple);
              }
              ReactionBodyTargetJson::TargetUrl(u) => {
                let tuple = (msg.hash, d.fid, 0, u, rb.r#type, d.timestamp);
                rreactions.push(tuple);
              }
            }
          }
          _ => (),
        },
      },
    }
  }
  let _reactions = db::write_reactions(our, rreactions.clone());
  Ok(())
}
// debugging

// debugging
// let json_value: serde_json::Value = serde_json::from_slice(&casts)?;
// let msgs = json_value.get("messages").ok_or(anyhow!("mm"))?;
// let msg1 = msgs.as_array()
//                .and_then(|a| a.first())
//                .ok_or(anyhow!("mmm"))?;
// let data = msg1.get("data").ok_or(anyhow!("mm"))?;
// println!("data {:?}", data);
// let parsed = serde_json::from_value::<MessageDataJson2>(data.clone());
// println!("parsed {:?}", parsed);
// #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// pub struct HubResponse2 {
//   pub messages: Vec<Message2>,
//   #[serde(rename = "nextPageToken")]
//   pub next_page_token: String,
// }
// #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// pub struct Message2 {
//   pub data: Option<MessageDataJson2>,
//   pub hash: String,
//   #[serde(rename = "hashScheme")]
//   pub hash_scheme: HashScheme,
//   pub signature: String,
//   #[serde(rename = "signatureScheme")]
//   pub signature_scheme: SignatureScheme,
//   pub signer: String,
//   // pub data_bytes: Option<Vec<u8>>,
// }
// #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// pub struct MessageDataJson2 {
//   pub r#type: MessageType,
//   pub fid: u64,
//   pub timestamp: u32,
//   pub network: FarcasterNetwork,
//   // #[serde(flatten)]
//   // pub body: Option<MessageBodyJson>,
//   pub castAddBody: CastAddBodyJson,
// }

// utils
// from https://github.com/farcasterxyz/hub-monorepo/blob/e2b1c7c6811da0bab69dec039dadc08c426a13c2/apps/hubble/src/addon/src/store/utils.rs#L260

pub const FARCASTER_EPOCH: u64 = 1609459200000;
pub fn to_farcaster_time(time_ms: u64) -> Result<u64> {
  if time_ms < FARCASTER_EPOCH {
    return Err(anyhow!("bad ts"));
  }

  let seconds_since_epoch = (time_ms - FARCASTER_EPOCH) / 1000;
  if seconds_since_epoch > u32::MAX as u64 {
    return Err(anyhow!("ts too far in the future"));
  }

  Ok(seconds_since_epoch as u64)
}

#[allow(dead_code)]
pub fn from_farcaster_time(time: u64) -> u64 {
  let to_human = time * 1000 + FARCASTER_EPOCH;
  let date = chrono::NaiveDateTime::from_timestamp_millis(to_human as i64);
  println!("date {:?}", date);
  to_human
}

#[allow(dead_code)]
pub fn get_farcaster_time() -> Result<u64> {
  let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?;
  Ok(to_farcaster_time(now.as_millis() as u64)?)
}
