use serde::{Deserialize, Serialize};
use anyhow::Result;
use kinode_process_lib::http::{send_request_await_response, Method}; 
use url::Url;


#[derive(Deserialize, Serialize, Debug)]
pub enum ScrapeRes {
  Image(String),
  HTML(String),
}
pub fn scrape(url: &str) -> Result<ScrapeRes> {
  let url = Url::parse(url)?;
  let mut headers = std::collections::HashMap::new();
  headers.insert(
    "User-Agent".to_string(),
    "facebookexternalhit/1.1".to_string(),
    // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36".to_string(),
  );

  let res = send_request_await_response(Method::GET, url.clone(), Some(headers), 5000, vec![])?;
  let h = res.headers().get("content-type");
  match h {
    None => {
      let b = res.body().to_vec();
      let text = String::from_utf8(b)?;
      Ok(ScrapeRes::HTML(text))
    }
    Some(val) => {
      let str = val.to_str()?;
      if str.starts_with("image") {
        Ok(ScrapeRes::Image(url.to_string()))
      } else {
        let b = res.body().to_vec();
        let text = String::from_utf8(b)?;
        Ok(ScrapeRes::HTML(text))
      }
    }
  }
  // let body = get_blob().ok_or(anyhow::anyhow!("no blob"))?;
}
