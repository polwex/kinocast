use kinode_process_lib::http::{send_request_await_response, Method};
use url::Url;

use crate::types::*;

pub static HUB_RPC_URL: &str = "https://kino.sortug.com/rpc";
pub static HUB_PG_URL: &str = "https://kino.sortug.com/pg";

pub fn fetch_casts(fid: &str) -> anyhow::Result<Vec<u8>> {
  let path = "/v1/castsByFid?fid=";
  let urls = format!("{}{}{}", HUB_RPC_URL, path, fid);
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  // send the json as is to the browser
  let bod = res.into_body();
  Ok(bod)
}
pub fn fetch_userdata(fid: &str) -> anyhow::Result<Vec<u8>> {
  let path = "/v1/userDataByFid?fid=";
  let urls = format!("{}{}{}", HUB_RPC_URL, path, fid);
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  let bod = res.into_body();
  Ok(bod)
}
pub fn fetch_user_fid(username: &str) -> anyhow::Result<u64> {
  let path = "/v1/userNameProofByName?name=";
  let urls = format!("{}{}{}", HUB_RPC_URL, path, username);
  let urlss = urls.as_str();
  let url = Url::parse(urlss).unwrap();
  let res = send_request_await_response(Method::GET, url, None, 5000, vec![])?;
  let bod = res.into_body();
  // let json_string = std::str::from_utf8(&bod)?;
  // println!("fetched fid {:?}", json_string);
  let body = serde_json::from_slice::<ApiResponse>(&bod)?;
  return Ok(body.fid);
}
