use anyhow::{anyhow, Result};
use std::collections::HashMap;

use kinode_process_lib::{
  await_message, call_init, get_blob,
  http::{
    bind_http_path, send_response, serve_ui, HttpServerRequest, IncomingHttpRequest, StatusCode,
  },
  println, sqlite,
  timer::set_timer,
  Address, Context, Message, Request,
};

// In main.rs or lib.rs
mod keys;
mod proxy;
mod types;
use keys::generate_keys;
use types::*;

mod db;
mod hub;
mod post;
mod protos;
mod sur;

wit_bindgen::generate!({
    path: "target/wit",
    world: "process-v0",
});

// my types

// db

const ICON: &str = include_str!("icon");

// Check if initialized
// Check if hub is online

fn handle_ui(our: &Address,
             state: &mut sur::State,
             source: &Address,
             body: &[u8])
             -> anyhow::Result<()> {
  let Ok(server_request) = serde_json::from_slice::<HttpServerRequest>(body) else {
    // Fail silently if we can't parse the request
    // return Err("parsing error");
    return Ok(());
  };
  match server_request {
    HttpServerRequest::WebSocketOpen { channel_id, .. } => {
      // Set our channel_id to the newly opened channel
      // Note: this code could be improved to support multiple channels
      // *our_channel_id = channel_id;
      Ok(())
    }
    HttpServerRequest::WebSocketPush { .. } => Ok(()),
    HttpServerRequest::WebSocketClose(_channel_id) => Ok(()),
    HttpServerRequest::Http(request) => {
      match request.method()?.as_str() {
        "GET" => handle_get(our, request, state),
        // Send a message
        "POST" => handle_post(our, request, state),
        _ => {
          println!("got weird req - {:?}", request);
          Ok(())
        }
      }
    }
  }
}
fn handle_get(our: &Address,
              req: IncomingHttpRequest,
              state: &mut sur::State)
              -> anyhow::Result<()> {
  // println!("got GET req - {:?}", req);
  println!("our {}", our);
  let conc = format!("{}:{}{}", our.process(), our.package_id(), "/api");
  println!("{}", conc);
  let pat = req.bound_path(Some(conc.as_str()));
  let uparams = req.url_params();
  let qparams = req.query_params();

  println!("request path {}", pat);
  println!("request up {:?}", uparams);
  println!("request qp {:?}", qparams);
  match pat {
    "/change-key" => {
      let _ = state.change_key();
    }
    "/pubkey" => {
      println!("state {:?}", state);
      let pk = state.get_key();
      let bytes = pk.verifying_key().to_bytes();
      let hex_string = hex::encode(bytes);
      println!("pk {:?}", hex_string);
      println!("pubkey {}", hex_string);
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK,
                    Some(headers),
                    serde_json::to_vec(&hex_string)?);
    }
    // quick logout
    // "/logout" => {
    //   state.reset();
    //   state.save()?;
    //   let mut headers = HashMap::new();
    //   headers.insert("Content-Type".to_string(), "application/json".to_string());
    //   send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&true)?);
    // }
    "/logout" => {
      let db = sqlite::open(our.package_id(), "kinocast", None)?;
      let statement = "DELETE FROM user_data;".to_string();
      let statement2 = "DELETE FROM signing_keys;".to_string();
      db.write(statement, vec![], None)?;
      db.write(statement2, vec![], None)?;
      state.reset();
      state.save()?;
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&true)?);
    }
    "/logged" => {
      // Write schema if not written yet
      // state.print_state();
      db::check_schema(our)?;

      // let dbres = db::find_keys(our);
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      match state.active_fid {
        Some(val) => {
          send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&val)?);
        }
        None => {
          send_response(StatusCode::OK,
                        Some(headers),
                        serde_json::to_vec(&serde_json::Value::Null)?);
        }
      }
      // println!("sql data {:?}", data)
    }
    // "/setup" => {
    //   let boolean: bool = match db::write_db_schema(our) {
    //     Ok(_) => true,
    //     Err(_) => false,
    //   };
    //   let mut headers = HashMap::new();
    //   headers.insert("Content-Type".to_string(), "application/json".to_string());
    //   send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&boolean)?);
    // }
    "/set-active" => {
      let fid = qparams.get("fid").unwrap();
      let fidn = fid.parse::<u64>()?;
      state.set_active_fid(fidn);
      state.save()?;
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&true)?);
    }
    "/save-account" => {
      let fid = qparams.get("fid").unwrap();
      let fidn = fid.parse::<u64>()?;
      state.set_active_fid(fidn);
      state.save()?;
      //
      // let key = qparams.get("key").unwrap();
      // let writeDB = db::write_signing_key(our, &fidn, key.to_string());
      let writeProf = db::write_db_profile(our, &fidn);
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&true)?);
    }
    "/profile" => match state.active_fid {
      None => {
        send_json(UIRes::Err { error: "no active fid".to_string() });
      }
      Some(f) => {
        let prof = db::get_profile(our, f);
        match prof {
          Some(data) => {
            let res = UIRes::Ok(UIResInner::Profile(data));
            send_json(res);
          }
          None => {
            send_json(UIRes::Err { error: "no profile in db".to_string() });
          }
        }
      }
    },
    "/timeline" => match state.active_fid {
      None => {
        send_json(UIRes::Err { error: "no fid".to_string() });
      }
      Some(f) => {
        let casts = db::get_timeline2(our, f)?;
        let cursor = 0;
        let res = UIRes::Ok(UIResInner::Timeline { cursor, casts });
        send_json(res);
      }
    },
    // "/profile" => {
    //   let fid = qparams.get("fid").unwrap();
    //   let data = hub::fetch_userdata(fid)?;
    //   let mut headers = HashMap::new();
    //   headers.insert("Content-Type".to_string(), "application/json".to_string());
    //   send_response(StatusCode::OK, Some(headers), data);
    // }
    "/userfeed" => {
      let fid = qparams.get("fid").unwrap();
      let fidn = fid.parse::<u64>()?;
      let ocursor = qparams.get("cursor").unwrap();
      let replies = qparams.get("replies");
      let casts = db::get_casts(our, fidn)?;
      let profile = db::get_profile(our, fidn);
      let cursor = 0;
      let ures = UIResInner::Feed { fid: fidn,
                                    casts,
                                    cursor,
                                    profile };
      send_json(UIRes::Ok(ures));
    }
    "/userreactions" => {
      let fid = qparams.get("fid").unwrap();
      let fidn = fid.parse::<u64>()?;
      let reactions = db::get_fid_reactions(our, fidn)?;
      // TODO Cursors
      let cursor = 0;
      let ures = UIResInner::Reactions { cursor,
                                         fid: fidn,
                                         reactions };
      send_json(UIRes::Ok(ures));
    }
    "/engagement" => {
      let fid = qparams.get("fid").unwrap();
      let hash = qparams.get("hash").unwrap();
      let rs = hub::fetch_reactions(fid, hash, None)?;
      let hres = serde_json::from_slice::<HubResponse>(&rs)?;
      let res = UIRes::Ok(UIResInner::Proxy(hres));
      send_json(res);
    }
    _ => {}
  }

  send_response(StatusCode::CREATED, None, vec![]);
  Ok(())
}

fn send_json(res: UIRes) -> Result<()> {
  let body = serde_json::to_vec(&res)?;
  let mut headers = HashMap::new();
  headers.insert("Content-Type".to_string(), "application/json".to_string());
  send_response(StatusCode::OK, Some(headers), body);
  Ok(())
}

fn handle_post(our: &Address,
               req: IncomingHttpRequest,
               state: &mut sur::State)
               -> anyhow::Result<()> {
  // let conc = format!("{}:{}{}", our.process(), our.package_id(), "/api");
  let Some(blob) = get_blob() else {
    return Ok(());
  };
  let Ok(post_request) = serde_json::from_slice::<UIPostRequest>(&blob.bytes) else {
    // Fail silently if we can't parse the request
    return Ok(());
  };
  println!("post body {:?}", post_request);

  match post_request {
    UIPostRequest::IDLogin { ref id } => {
      let fid = hub::fetch_user_fid(id)?;
      let _ = db::write_db_schema(our);
      let profile = db::write_db_profile(our, &fid)?;
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&profile)?);
    }
    UIPostRequest::Send { ref message } => {
      // state.set_active_fid(346692);
      // let pubkey = db::print_pubkey(our)?;
      let fid = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::cast_add(fid, message, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::Reply { ref message,
                           ref parent, } => {
      // state.set_active_fid(346692);
      // let pubkey = db::print_pubkey(our)?;
      let fid = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::reply_add(fid, message, parent, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::Like { ref target } => {
      // state.set_active_fid(346692);
      // let pubkey = db::print_pubkey(our)?;
      let fid = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::like_add(fid, target, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::RT { ref target } => {
      // state.set_active_fid(346692);
      // let pubkey = db::print_pubkey(our)?;
      let fid = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::rt_add(fid, target, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::Bookmark { posts } => {
      for post in posts {
        db::write_bookmark(our, &post)?;
      }
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&true)?);
    }
    UIPostRequest::BookmarkDel { posts } => {
      for post in posts {
        db::del_bookmark(our, &post)?;
      }
      let mut headers = HashMap::new();
      headers.insert("Content-Type".to_string(), "application/json".to_string());
      send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&true)?);
    }
    UIPostRequest::Follow { target } => {
      let our = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::follow_fid(our, target, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::Unfollow { target } => {
      let our = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::unfollow_fid(our, target, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::SendFrame { frame } => {
      let our = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::frame_action(frame, our, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::Scrape { url } => {
      let res = proxy::scrape(&url)?;
      let json = serde_json::to_vec(&res)?;
      respond_struct(json)?;
    }
    UIPostRequest::SetUserData { value, r#type } => {
      let our = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::set_user_data(our, value, r#type, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::SetFname { name, address } => {
      let our = state.active_fid.ok_or_else(|| anyhow!("no fid"))?;
      let signer = state.get_key();
      let res = post::set_fname(our, name, address, signer)?;
      respond_ok(res)?;
    }
    UIPostRequest::History => {}
  }
  send_response(StatusCode::CREATED, None, vec![]);
  Ok(())
}

fn respond_struct(body: Vec<u8>) -> Result<()> {
  let mut headers = HashMap::new();
  headers.insert("Content-Type".to_string(), "application/json".to_string());
  let _ok = send_response(StatusCode::OK, Some(headers), body);
  Ok(())
}
fn respond_ok(res: String) -> Result<()> {
  let mut headers = HashMap::new();
  headers.insert("Content-Type".to_string(), "application/json".to_string());
  let _ok = send_response(StatusCode::OK, Some(headers), serde_json::to_vec(&res)?);
  Ok(())
}

fn handle_message(our: &Address, state: &mut sur::State) -> anyhow::Result<()> {
  let message = await_message().unwrap();

  match message {
    Message::Response { .. } => {
      println!("got response - {:?}", message);
      let ctx = message.context();
      if let Some(ct) = ctx {
        let or: &str = serde_json::from_slice(ct)?;
        match or {
          "build-timeline" => {
            let timeline_ok = hub::build_timeline(our, state);
            timeline_timer();
            println!("timeline saved? {:?}", timeline_ok);
            ()
          }
          _ => {}
        }
        println!("timer {:?}", or);
      } else {
        ()
      };
      return Ok(());
    }
    Message::Request { ref source,
                       ref body,
                       .. } => {
      // // Requests that come from other nodes running this app
      // handle_chat_request(our, message_archive, channel_id, source, body, false)?;
      // // Requests that come from our http server
      // handle_http_server_request(our, message_archive, channel_id, source, body)?;
      return handle_ui(our, state, source, body);
    }
  }
}
fn add_to_home() {
  // add ourselves to the homepage
  println!("adding to home");

  Request::to(("our", "homepage", "homepage", "sys"))
    .body(
      serde_json::json!({"Add": {"label": "Kinocast","icon": ICON,"path": "/"}})
        .to_string()
        .as_bytes()
        .to_vec(),
    )
    .send()
    .unwrap();
}
fn timeline_timer() {
  set_timer(60000, Some(serde_json::to_vec("build-timeline").unwrap()));
}
call_init!(init);
fn init(our: Address) {
  println!("kinocast begin 2");
  timeline_timer();
  // let mut channel_id = 0;

  add_to_home();
  let _ = db::open_db(&our);
  let mut state = sur::load_state();
  let _ = state.save();
  println!("state {:?}", state);
  // Bind UI files to routes; index.html is bound to "/"
  serve_ui(&our, "ui", false, false, vec!["/", "/:fid"]).unwrap();

  // Bind HTTP path /messages
  bind_http_path("/api/change-key", true, false).unwrap();
  bind_http_path("/api/logged", true, false).unwrap();
  // fetch ed25519 pubkey
  bind_http_path("/api/pubkey", true, false).unwrap();
  bind_http_path("/api/save-account", true, false).unwrap();
  bind_http_path("/api/set-active", true, false).unwrap();

  // bind_http_path("/api/setup", true, false).unwrap();
  bind_http_path("/api/profile", true, false).unwrap();
  bind_http_path("/api/casts", true, false).unwrap();
  bind_http_path("/api/timeline", true, false).unwrap();
  bind_http_path("/api/userfeed", true, false).unwrap();
  bind_http_path("/api/userlikes", true, false).unwrap();
  bind_http_path("/api/engagement", true, false).unwrap();
  //
  bind_http_path("/api/logout", true, false).unwrap();
  // post requests
  bind_http_path("/api/post", true, false).unwrap();

  // Bind WebSocket path
  // bind_ws_path("/", true, false).unwrap();

  loop {
    match handle_message(&our, &mut state) {
      Ok(()) => {}
      Err(e) => {
        println!("error: {:?}", e);
      }
    };
  }
}
