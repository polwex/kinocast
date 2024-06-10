use crate::hub;
use crate::types::*;
use anyhow::{anyhow, Error, Result};
use chrono;
use kinode_process_lib::kv::Kv;
use kinode_process_lib::{kv, println, sqlite, Address};
use serde::Deserialize;
use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};

// rocks

pub fn open_kv(our: &Address) -> Result<Kv<String, String>> {
  let kv = kv::open(our.package_id(), "kinocast", Some(5000))?;
  Ok(kv)
}

//sqlite

pub fn open_db(our: &Address) -> Result<sqlite::Sqlite, Error> {
  let db = sqlite::open(our.package_id(), "kinocast", None);
  return db;
}

pub fn check_schema(our: &Address) -> anyhow::Result<()> {
  let required = ["signing_keys", "user_data"];
  let mut found = required
    .iter()
    .map(|&s| (s, false))
    .collect::<std::collections::HashMap<_, _>>();

  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let statement = "SELECT name from sqlite_master WHERE type='table';".to_string();
  let data = db.read(statement, vec![])?;
  let values: Vec<Value> = data
    .iter()
    .filter_map(|map| map.get("name"))
    .cloned()
    .collect();

  println!("sql tables:{:?}", values);
  for val in values {
    if let Value::String(s) = val {
      if let Some(entry) = found.get_mut(s.as_str()) {
        *entry = true;
      }
    }
  }
  let good = found.values().all(|&b| b);
  if good {
    return Ok(());
  } else {
    return write_db_schema(our);
  }
}

pub fn write_db_schema(our: &Address) -> anyhow::Result<()> {
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let tx_id = db.begin_tx()?;
  let s0 =
    "CREATE TABLE signing_keys (fid INTEGER PRIMARY KEY, pubkey TEXT NOT NULL, created INTEGER);"
      .to_string();
  let s1 = "CREATE TABLE user_data (fid INTEGER PRIMARY KEY, username TEXT NOT NULL, name TEXT NOT NULL, bio TEXT, pfp TEXT, url TEXT, created INTEGER);".to_string();
  let s2 = "CREATE TABLE links (id INTEGER PRIMARY KEY, origin INTEGER NOT NULL, target INTEGER NOT NULL, type TEXT, created INTEGER);".to_string();
  let s3 = r#"
    CREATE TABLE casts (
      id INTEGER PRIMARY KEY, 
      author INTEGER NOT NULL, 
      parent_fid INTEGER, 
      hash TEXT NOT NULL, 
      root_parent_hash TEXT, 
      root_parent_url TEXT, 
      parent_hash TEXT,
      parent_url TEXT,
      text TEXT,
      embeds JSONB,
      mentions JSONB,
      mentions_positions JSONB,
      created INTEGER);
    "#
  .to_string();
  let s4 = r#"
    CREATE TABLE bookmarks (
      id INTEGER PRIMARY KEY, 
      author_fid INTEGER NOT NULL, 
      author_name TEXT NOT NULL, 
      hash TEXT NOT NULL, 
      text TEXT,
      embeds JSONB,
      created INTEGER);
    "#
  .to_string();
  let s5 = r#"
    CREATE TABLE reactions (
      id INTEGER PRIMARY KEY, 
      author INTEGER NOT NULL, 
      target_fid INTEGER,
      type INTEGER,
      target_url TEXT,
      created INTEGER);
    "#
  .to_string();
  db.write(s0, vec![], Some(tx_id))?;
  db.write(s1, vec![], Some(tx_id))?;
  db.write(s2, vec![], Some(tx_id))?;
  db.write(s3, vec![], Some(tx_id))?;
  db.write(s4, vec![], Some(tx_id))?;
  db.write(s5, vec![], Some(tx_id))?;
  return db.commit_tx(tx_id);
}
pub fn write_signing_key(our: &Address, fid: &u64, pubkey: String) -> Result<(), Error> {
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let s1 = r#"
        INSERT INTO signing_keys(fid, pubkey, created) 
        VALUES (?1, ?2, ?3);
        "#
  .to_string();
  let fidr = *fid;
  let fidn: serde_json::Number = fidr.into();
  let now = make_json_timestamp();
  let p1 = vec![
    serde_json::Value::Number(fidn.clone()),
    serde_json::Value::String(pubkey),
    serde_json::Value::Number(now),
  ];
  db.write(s1, p1, None)
}
pub fn write_db_profile(our: &Address, fid: &u64) -> anyhow::Result<Profile> {
  let fid_string = fid.to_string();
  let bod = hub::fetch_userdata(fid_string.as_str())?;
  // let json_string = std::str::from_utf8(&bod)?;
  // println!("user data {}", json_string);
  let res = serde_json::from_slice::<HubResponse>(&bod)?;
  println!("res {:?}", res);
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let s1 = r#"
        INSERT INTO user_data(fid, username, name, bio, pfp, url, created) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7);
        ON CONFLICT(fid) DO UPDATE SET 
        username = excluded.username,
        name = excluded.name,
        bio = excluded.bio,
        pfp = excluded.pfp,
        url = excluded.url,
        created = excluded.created
        "#
  .to_string();
  let tx_id = db.begin_tx()?;
  let mut ousername: Option<String> = None;
  let mut oname: Option<String> = None;
  let mut obio: Option<String> = None;
  let mut opfp: Option<String> = None;
  let mut ourl: Option<String> = None;
  for message in res.messages {
    let data = message.data.ok_or_else(|| anyhow::anyhow!(""))?;
    println!("data {:?}", data);
    let body = data.body.ok_or_else(|| anyhow::anyhow!(""))?;
    println!("body {:?}", body);
    match body {
      MessageBodyJson::UserDataBody(user_data_type) => match user_data_type.r#type {
        UserDataType::None => {}
        UserDataType::Pfp => opfp = Some(user_data_type.value),
        UserDataType::Display => oname = Some(user_data_type.value),
        UserDataType::Bio => obio = Some(user_data_type.value),
        UserDataType::Url => ourl = Some(user_data_type.value),
        UserDataType::Username => ousername = Some(user_data_type.value),
      },
      _ => {}
    }
    // if data.r#type != MessageType::UserDataAdd {
    //     return Err(());
    // } else{

    // }
  }

  let username = ousername.ok_or_else(|| anyhow::anyhow!("no username"))?;
  let name = oname.ok_or_else(|| anyhow::anyhow!("no name"))?;
  let bio = match obio {
    Some(s) => s,
    None => String::new(),
  };
  let pfp = match opfp {
    Some(s) => s,
    None => String::new(),
  };
  let url = match ourl {
    Some(s) => s,
    None => String::new(),
  };
  let now = make_json_timestamp();
  let fidr = *fid;
  let fidn: serde_json::Number = fidr.into();

  let p1 = vec![
    serde_json::Value::Number(fidn.clone()),
    serde_json::Value::String(username.clone()),
    serde_json::Value::String(name.clone()),
    serde_json::Value::String(bio.clone()),
    serde_json::Value::String(pfp.clone()),
    serde_json::Value::String(url.clone()),
    serde_json::Value::Number(now),
  ];
  db.write(s1, p1, Some(tx_id))?;
  let tx = db.commit_tx(tx_id);
  match tx {
    Ok(()) => {
      let p = Profile::new(fidr, username, name, bio, pfp, url);
      Ok(p)
    }
    Err(e) => Err(e),
  }
}
pub fn write_bookmark(our: &Address, poast: &CastT) -> anyhow::Result<()> {
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let s1 = r#"
        INSERT INTO bookmarks(hash, author_name, author_fid, text, embeds, created) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6);
        "#
  .to_string();
  let tx_id = db.begin_tx()?;

  let fidr = poast.fid;
  let fidn: serde_json::Number = fidr.into();
  let embeds = serde_json::to_string(&poast.embeds).unwrap();
  let p1 = vec![
    serde_json::Value::String(poast.hash.clone()),
    serde_json::Value::String(poast.author_name.clone()),
    serde_json::Value::Number(fidn.clone()),
    serde_json::Value::String(poast.text.clone()),
    serde_json::Value::String(embeds),
    serde_json::Value::Number(poast.timestamp.into()),
  ];
  db.write(s1, p1, Some(tx_id))?;
  db.commit_tx(tx_id)
}
pub fn del_bookmark(our: &Address, poast: &CastT) -> anyhow::Result<()> {
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let s1 = r#"
        DELETE FROM bookmarks
        WHERE hash = ?1 AND author_fid = ?2
        "#
  .to_string();
  let tx_id = db.begin_tx()?;

  let fidr = poast.fid;
  let fidn: serde_json::Number = fidr.into();
  let embeds = serde_json::to_string(&poast.embeds).unwrap();

  let p1 = vec![
    serde_json::Value::String(poast.hash.clone()),
    serde_json::Value::Number(fidn.clone()),
  ];
  db.write(s1, p1, Some(tx_id))?;
  db.commit_tx(tx_id)
}

pub fn make_json_timestamp() -> serde_json::Number {
  let systemtime = SystemTime::now();

  let duration_since_epoch = systemtime
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards");
  let secs = duration_since_epoch.as_secs();
  let now: serde_json::Number = secs.into();
  return now;
}
pub fn make_timestamp_secs() -> u64 {
  let systemtime = SystemTime::now();

  let duration_since_epoch = systemtime
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards");
  let secs = duration_since_epoch.as_secs();
  return secs;
}
pub fn make_timestamp_ms() -> u128 {
  let systemtime = SystemTime::now();

  let duration_since_epoch = systemtime
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards");
  let ms = duration_since_epoch.as_millis();
  return ms;
}

pub fn find_profile(our: &Address) -> Option<Profile> {
  let Ok(db) = sqlite::open(our.package_id(), "kinocast", None) else {
    return None;
  };

  let statement = "SELECT * FROM user_data LIMIT 1".to_string();
  let data = db.read(statement, vec![]);
  match data {
    Ok(v) => {
      if let Some(item) = v.get(0) {
        let Ok(p) = Profile::from_sqlite(item) else {
          return None;
        };
        Some(p)
      } else {
        None
      }
    }
    Err(_) => None,
  }
}
pub fn find_keys(our: &Address) -> Result<Value> {
  println!("finding keys");
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let statement = "SELECT * FROM signing_keys".to_string();
  let data = db.read(statement, vec![])?;
  println!("{:?}", data);
  let first = data.get(0).ok_or_else(|| anyhow!("bad"))?;
  let fid = first.get("fid").ok_or_else(|| anyhow!("bad"))?;
  Ok(fid.clone())
}

pub fn print_pubkey(our: &Address) -> Result<String> {
  println!("finding keys");
  let db = sqlite::open(our.package_id(), "kinocast", None)?;
  let statement = "SELECT * FROM signing_keys".to_string();
  let data = db.read(statement, vec![])?;
  println!("{:?}", data);
  let first = data.get(0).ok_or_else(|| anyhow!("bad"))?;
  let pubkey = first.get("pubkey").ok_or_else(|| anyhow!("bad"))?;
  match pubkey {
    Value::String(f) => {
      let c = f.clone();
      Ok(c)
    }
    _ => Err(anyhow!("bad")),
  }
}
