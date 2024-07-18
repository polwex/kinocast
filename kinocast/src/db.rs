use crate::hub;
use crate::types::*;
use anyhow::{anyhow, Error, Result};
use hex::ToHex;
use kinode_process_lib::kv::Kv;
use kinode_process_lib::sqlite::Sqlite;
use kinode_process_lib::{kv, println, sqlite, Address};
use serde_json::Value;
use serde_json::Value::Null;
use std::collections::HashMap;
use std::ptr::NonNull;
use std::time::{SystemTime, UNIX_EPOCH};

// rocks

pub fn open_kv(our: &Address) -> Result<Kv<String, String>> {
  let kv = kv::open(our.package_id(), "kinocast", Some(5000))?;
  Ok(kv)
}

//sqlite

pub fn open_db(our: &Address) -> Result<sqlite::Sqlite, Error> {
  let p = our.package_id();
  let db = sqlite::open(p, "kinocast", None);
  db
}

pub fn check_schema(our: &Address) -> anyhow::Result<()> {
  let required = ["signing_keys", "user_data"];
  let mut found = required.iter()
                          .map(|&s| (s, false))
                          .collect::<std::collections::HashMap<_, _>>();

  let db = open_db(our)?;
  println!("fucking db");
  let statement = "SELECT name from sqlite_master WHERE type='table';".to_string();
  let data = db.read(statement, vec![])?;
  let values: Vec<Value> = data.iter()
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
  let db = open_db(our)?;
  let tx_id = db.begin_tx()?;
  let s0 =
    "CREATE TABLE signing_keys (fid INTEGER PRIMARY KEY, pubkey TEXT NOT NULL, created INTEGER);"
      .to_string();
  let s1 = "CREATE TABLE user_data (fid INTEGER PRIMARY KEY, username TEXT NOT NULL, name TEXT NOT NULL, bio TEXT, pfp TEXT, url TEXT, created INTEGER);".to_string();
  let s2 = r#"
    CREATE TABLE links (
      id INTEGER PRIMARY KEY, 
      hash TEXT NOT NULL UNIQUE,
      origin INTEGER NOT NULL, 
      target INTEGER NOT NULL, 
      type TEXT, 
      created INTEGER
      );"#
           .to_string();
  let s3 = r#"
    CREATE TABLE casts (
      id INTEGER PRIMARY KEY, 
      author INTEGER NOT NULL, 
      hash TEXT NOT NULL UNIQUE, 
      text TEXT,
      embeds JSONB,
      mentions JSONB,
      mentions_positions JSONB,
      created INTEGER NOT NULL,
      parent_url TEXT, 
      parent_hash TEXT,
      op_url TEXT,
      op_hash  TEXT
    );
    "#.to_string();
  let s4 = r#"
    CREATE TABLE bookmarks (
      id INTEGER PRIMARY KEY, 
      author_fid INTEGER NOT NULL, 
      author_name TEXT NOT NULL, 
      hash TEXT NOT NULL UNIQUE, 
      text TEXT,
      embeds JSONB,
      created INTEGER NOT NULL
      );
    "#.to_string();
  let s5 = r#"
    CREATE TABLE reactions (
      id INTEGER PRIMARY KEY, 
      HASH TEXT NOT NULL UNIQUE,
      author INTEGER NOT NULL, 
      type INTEGER,
      target_fid INTEGER,
      target_hash TEXT,
      target_url TEXT,
      created INTEGER NOT NULL
      );
    "#.to_string();
  db.write(s0, vec![], Some(tx_id))?;
  db.write(s1, vec![], Some(tx_id))?;
  db.write(s2, vec![], Some(tx_id))?;
  db.write(s3, vec![], Some(tx_id))?;
  db.write(s4, vec![], Some(tx_id))?;
  db.write(s5, vec![], Some(tx_id))?;
  return db.commit_tx(tx_id);
}
pub fn write_signing_key(our: &Address, fid: &u64, pubkey: String) -> Result<(), Error> {
  let db = open_db(our)?;
  let s1 = r#"
        INSERT INTO signing_keys(fid, pubkey, created) 
        VALUES (?1, ?2, ?3);
        "#.to_string();
  let fidr = *fid;
  let fidn: serde_json::Number = fidr.into();
  let now = make_json_timestamp();
  let p1 = vec![serde_json::Value::Number(fidn.clone()),
                serde_json::Value::String(pubkey),
                serde_json::Value::Number(now),];
  db.write(s1, p1, None)
}
pub fn write_db_profile(our: &Address, fid: &u64) -> anyhow::Result<Profile> {
  let db = open_db(our)?;
  let fid_string = fid.to_string();
  let bod = hub::fetch_userdata(fid_string.as_str())?;
  // let json_string = std::str::from_utf8(&bod)?;
  // println!("user data {}", json_string);
  let res = serde_json::from_slice::<HubResponse>(&bod)?;
  println!("res {:?}", res);
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
        "#.to_string();
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

  let p1 = vec![serde_json::Value::Number(fidn.clone()),
                serde_json::Value::String(username.clone()),
                serde_json::Value::String(name.clone()),
                serde_json::Value::String(bio.clone()),
                serde_json::Value::String(pfp.clone()),
                serde_json::Value::String(url.clone()),
                serde_json::Value::Number(now),];
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
pub fn write_casts(our: &Address,
                   casts: Vec<(String, u64, u32, CastAddBodyJson)>)
                   -> anyhow::Result<()> {
  let db = open_db(our)?;
  let tx_id = db.begin_tx()?;
  let s2 = r#"
        INSERT OR IGNORE INTO casts(
        author, 
        created,
        hash, 
        text,
        embeds,
        mentions,
        mentions_positions 
        ) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7);
        "#.to_string();
  // VALUES (?1, ?2, ?3, jsonb(?4), jsonb(?5), jsonb(?6), ?7);
  // parent_url,
  // parent_hash,
  // op_url,
  // op_hash
  for (hash, fid, ts, poast) in casts {
    // TODO add root parents
    // println!("par {:? }", poast.parent);
    let embeds = serde_json::to_string(&poast.embeds).unwrap();
    // let jembeds = serde_json::json!(&poast.embeds);
    // println!("embeds {:?} \n {} \n {}", poast.embeds, embeds, jembeds);
    let mentions = serde_json::to_string(&poast.mentions).unwrap();
    let mentions_p = serde_json::to_string(&poast.mentions_positions).unwrap();
    // let (root_url, root_hash) = find_op(&db, fid, poast.clone());
    // let (parent_url, parent_hash) = match poast.parent {
    //   None => (Null, serde_json::Value::Null),
    //   Some(p) => match p {
    //     CastAddBodyParentJson::ParentCastId { fid, hash } => {
    //       (serde_json::Value::Null, serde_json::Value::String(hash))
    //     }
    //     CastAddBodyParentJson::ParentUrl(url) => {
    //       (serde_json::Value::String(url), serde_json::Value::Null)
    //     }
    //   },
    // };
    // println!("parpar \n{:?} \n{:?} \n{:?} \n{:?}",
    //          root_url, root_hash, parent_url, parent_hash);
    let p1: Vec<Value> = vec![serde_json::Value::Number(fid.into()),
                              serde_json::Value::Number(ts.into()),
                              serde_json::Value::String(hash.clone()),
                              serde_json::Value::String(poast.text.clone()),
                              serde_json::Value::String(embeds),
                              serde_json::Value::String(mentions),
                              serde_json::Value::String(mentions_p),];
    db.write(s2.clone(), p1, Some(tx_id))?;
  }
  db.commit_tx(tx_id)
}
pub fn find_op(db: &Sqlite, fid: u64, cast: CastAddBodyJson) -> (Value, Value) {
  match cast.parent {
    None => (Null, Null),
    Some(p) => match p {
      CastAddBodyParentJson::ParentCastId { fid, hash } => {
        let par = get_cast_by_hash(db, &fid, hash);
        match par {
          CastRefJson::CastId { fid, hash } => (Value::String(hash), Null),
          CastRefJson::Url(s) => (Null, Value::String(s)),
        }
      }
      CastAddBodyParentJson::ParentUrl(url) => {
        let par = get_cast_by_url(db, &fid, url);
        match par {
          CastRefJson::CastId { fid, hash } => (Value::String(hash), Null),
          CastRefJson::Url(s) => (Null, Value::String(s)),
        }
      }
    },
  }
}
pub fn get_cast_by_hash(db: &Sqlite, fid: &u64, hash: String) -> CastRefJson {
  let me = CastRefJson::CastId { fid: fid.to_owned(),
                                 hash: hash.clone() };
  let s = "SELECT * FROM casts WHERE parent_hash = ?1".to_string();
  let h = serde_json::Value::String(hash);
  let data = db.read(s, vec![h]);
  match data {
    Err(_) => me,
    Ok(d) => {
      let first = d.get(0);
      match first {
        None => me,
        Some(f) => {
          let res = CastT::from_sqlite(f);
          match res {
            Err(_) => me,
            Ok(r) => {
              let newme = CastRefJson::CastId { fid: r.fid,
                                                hash: r.hash };
              match (r.parent_hash, r.parent_url) {
                (Some(h), None) => get_cast_by_hash(db, fid, h),
                (None, Some(u)) => get_cast_by_url(db, fid, u),
                _ => newme,
              }
            }
          }
        }
      }
    }
  }
}
pub fn get_cast_by_url(db: &Sqlite, fid: &u64, url: String) -> CastRefJson {
  let me = CastRefJson::Url(url.clone());
  let s = "SELECT * FROM casts WHERE parent_url = ?1".to_string();
  let u = serde_json::Value::String(url);
  let data = db.read(s, vec![u]);
  match data {
    Err(_) => me,
    Ok(d) => {
      let first = d.get(0);
      match first {
        None => me,
        Some(f) => {
          let res = CastT::from_sqlite(f);
          match res {
            Err(_) => me,
            Ok(r) => {
              let newme = CastRefJson::CastId { fid: r.fid,
                                                hash: r.hash };
              match (r.parent_hash, r.parent_url) {
                (Some(h), None) => get_cast_by_hash(db, fid, h),
                (None, Some(u)) => get_cast_by_url(db, fid, u),
                _ => newme,
              }
            }
          }
        }
      }
    }
  }
}
pub fn write_links(our: &Address,
                   links: Vec<(String, u64, u64, String, u32)>)
                   -> anyhow::Result<()> {
  let db = open_db(our)?;
  let s1 = r#"
        INSERT OR IGNORE INTO links(hash, origin, target, type, created) 
        VALUES (?1, ?2, ?3, ?4, ?5);
        "#.to_string();
  let tx_id = db.begin_tx()?;
  for (hash, origin, target, taip, ts) in links {
    let p1 = vec![serde_json::Value::String(hash.clone()),
                  serde_json::Value::Number(origin.into()),
                  serde_json::Value::Number(target.into()),
                  serde_json::Value::String(taip),
                  serde_json::Value::Number(ts.into()),];
    db.write(s1.clone(), p1, Some(tx_id))?;
  }
  db.commit_tx(tx_id)
}
pub fn write_reactions(our: &Address,
                       reactions: Vec<(String, u64, u64, String, i32, u32)>)
                       -> anyhow::Result<()> {
  let db = open_db(our)?;
  let s1 = r#"
        INSERT OR IGNORE INTO rections(hash, author, target_fid, target_url, type, created) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6);
        "#.to_string();
  let tx_id = db.begin_tx()?;
  for (hash, fid, tfid, thash, taip, ts) in reactions {
    let p1 = vec![serde_json::Value::String(hash.clone()),
                  serde_json::Value::Number(fid.into()),
                  serde_json::Value::Number(tfid.into()),
                  serde_json::Value::String(thash.into()),
                  serde_json::Value::Number(taip.into()),
                  serde_json::Value::Number(ts.into()),];
    db.write(s1.clone(), p1, Some(tx_id))?;
  }
  db.commit_tx(tx_id)
}
pub fn write_bookmark(our: &Address, poast: &CastT) -> anyhow::Result<()> {
  let db = open_db(our)?;
  let s1 = r#"
        INSERT INTO bookmarks(hash, author_name, author_fid, text, embeds, created) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6);
        "#.to_string();
  let tx_id = db.begin_tx()?;

  let fidr = poast.fid;
  let fidn: serde_json::Number = fidr.into();
  let embeds = serde_json::to_string(&poast.embeds).unwrap();
  let p1 = vec![serde_json::Value::String(poast.hash.clone()),
                serde_json::Value::String(poast.author_name.clone()),
                serde_json::Value::Number(fidn.clone()),
                serde_json::Value::String(poast.text.clone()),
                serde_json::Value::String(embeds),
                serde_json::Value::Number(poast.timestamp.into()),];
  db.write(s1, p1, Some(tx_id))?;
  db.commit_tx(tx_id)
}
pub fn del_bookmark(our: &Address, poast: &CastT) -> anyhow::Result<()> {
  let db = open_db(our)?;
  let s1 = r#"
        DELETE FROM bookmarks
        WHERE hash = ?1 AND author_fid = ?2
        "#.to_string();
  let tx_id = db.begin_tx()?;

  let fidr = poast.fid;
  let fidn: serde_json::Number = fidr.into();
  let embeds = serde_json::to_string(&poast.embeds).unwrap();

  let p1 = vec![serde_json::Value::String(poast.hash.clone()),
                serde_json::Value::Number(fidn.clone()),];
  db.write(s1, p1, Some(tx_id))?;
  db.commit_tx(tx_id)
}

pub fn make_json_timestamp() -> serde_json::Number {
  let systemtime = SystemTime::now();

  let duration_since_epoch = systemtime.duration_since(UNIX_EPOCH)
                                       .expect("Time went backwards");
  let secs = duration_since_epoch.as_secs();
  let now: serde_json::Number = secs.into();
  return now;
}
pub fn make_timestamp_secs() -> u64 {
  let systemtime = SystemTime::now();

  let duration_since_epoch = systemtime.duration_since(UNIX_EPOCH)
                                       .expect("Time went backwards");
  let secs = duration_since_epoch.as_secs();
  return secs;
}
pub fn make_timestamp_ms() -> u128 {
  let systemtime = SystemTime::now();

  let duration_since_epoch = systemtime.duration_since(UNIX_EPOCH)
                                       .expect("Time went backwards");
  let ms = duration_since_epoch.as_millis();
  return ms;
}

// getters
pub fn get_cast_count(our: &Address, fid: u64) -> Result<u64> {
  let db = open_db(our)?;
  let statement = "SELECT COUNT(*) FROM casts WHERE author = ?".to_string();
  let data = db.read(statement, vec![serde_json::Value::Number(fid.into())]);
  match data {
    Ok(v) => {
      println!("db res {:?}", v);
      if let Some(item) = v.get(0) {
        let value = item.get("COUNT(*)");
        match value {
          None => Ok(0),
          Some(v) => match v {
            Value::Number(n) => Ok(n.as_u64().unwrap()),
            _ => Ok(0),
          },
        }
      } else {
        Ok(0)
      }
    }
    Err(_) => Ok(0),
  }
}
pub fn get_casts(our: &Address, fid: u64) -> Result<Vec<CastRes>> {
  let db = open_db(our)?;
  let statement = r#"
    SELECT text,
     hash,
     author,
     embeds,
     mentions,
     mentions_positions,
     casts.created, 
     fid,
     username,
     name,
     bio,
     pfp,
     url
     FROM casts 
     LEFT JOIN user_data ON casts.author = user_data.fid
     WHERE author = ?
     "#.to_string();
  let params = vec![fid.into()];
  let data = db.read(statement, params);
  println!("reading casts {:?} {:?}", fid, data);
  let data = data.unwrap();
  let res = process_casts(our, data)?;
  Ok(res)
}
pub fn process_casts(our: &Address, data: Vec<HashMap<String, Value>>) -> Result<Vec<CastRes>> {
  let mut res = vec![];
  for dbres in data {
    let cast = CastT::from_sqlite(&dbres);
    println!("cast {:?}", cast);
    if let Err(_) = cast {
      continue;
    }
    let author = match Profile::from_sqlite(&dbres) {
      Err(err) => {
        println!("failed parsing profile {:?}", err);
        None
      }
      Ok(p) => Some(p),
    };
    println!("parsed profile {:?}", author);
    let cast = cast.unwrap();
    let (rts, likes, replies) = get_engagement(our, &cast, true);
    let reply_count = replies.len();
    let cr = CastRes { author,
                       cast,
                       rts,
                       likes,
                       replies,
                       reply_count };
    res.push(cr);
  }
  Ok(res)
}
pub fn get_timeline(our: &Address, fid: u64) -> Result<Vec<CastRes>> {
  let db = open_db(our)?;
  let statement = "SELECT target FROM links WHERE origin = ? AND type = 'follow'".to_string();
  let mut fids = vec![];
  let data = db.read(statement, vec![serde_json::Value::Number(fid.into())])?;
  println!("links {:?}", data.len());
  for link in data {
    let f = link.get("target");
    if let Some(v) = f {
      // let uv = v.as_u64().unwrap();
      // fids.push(uv);
      fids.push(v.to_owned());
    }
  }
  let values = vec!["?"; fids.len()].join(",");
  // let values = fids.clone()
  //                  .into_iter()
  //                  .fold(String::new(), |mut acc, item| {
  //                    let num = item.to_string();
  //                    if !acc.is_empty() {
  //                      acc.push(',');
  //                    }
  //                    acc.push_str(&num);
  //                    acc
  //                  });
  let s2 = format!("SELECT * FROM casts WHERE author IN ({})", values);
  println!("s2 {:?}", s2);
  let d2 = db.read(s2, fids)?;
  // let d2 = db.read(s2, vec![])?;
  println!("tl len {:?}", d2.len());
  let res = process_casts(our, d2)?;
  Ok(res)
}
pub fn get_timeline2(our: &Address, fid: u64) -> Result<Vec<CastRes>> {
  let db = open_db(our)?;
  let statement = "SELECT target FROM links WHERE origin = ? AND type = 'follow'".to_string();
  let mut fids = vec![];
  let data = db.read(statement, vec![serde_json::Value::Number(fid.into())])?;
  println!("links {:?}", data.len());
  for link in data {
    let f = link.get("target");
    if let Some(v) = f {
      let uv = v.as_u64().unwrap();
      fids.push(uv);
      // fids.push(v.to_owned());
    }
  }
  let mut res = vec![];
  // let fids = vec![346692, 378889];
  for ffid in fids {
    let cs = get_casts(our, ffid).unwrap();
    res.extend(cs);
  }
  Ok(res)
}
pub fn get_profile(our: &Address, fid: u64) -> Option<Profile> {
  let Ok(db) = open_db(our) else {
    return None;
  };
  let statement = "SELECT * FROM user_data WHERE fid = ? LIMIT 1".to_string();
  let data = db.read(statement, vec![fid.into()]);
  println!("prof data {:?} {:?}", data, fid);
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
pub fn get_engagement(our: &Address,
                      cast: &CastT,
                      recur: bool)
                      -> (Vec<ReactionRes>, Vec<ReactionRes>, Vec<CastRes>) {
  let rtsr = get_reactions(our, &cast.hash, 1);
  let rts = match rtsr {
    Ok(r) => r,
    _ => vec![],
  };

  let likesr = get_reactions(our, &cast.hash, 2);
  let likes = match likesr {
    Ok(r) => r,
    _ => vec![],
  };
  let repliesr = get_replies(our, &cast.hash);
  let replies = if recur {
    vec![]
  } else {
    match repliesr {
      Ok(r) => r,
      _ => vec![],
    }
  };

  (rts, likes, replies)
}
// TODO This schema is bad
pub fn get_fid_reactions(our: &Address, fid: u64) -> Result<Vec<ReactionRes>> {
  let db = open_db(our)?;
  let statement = "SELECT * FROM reactions WHERE author = ?1".to_string();
  let params = vec![fid.into()];
  let data = db.read(statement, params)?;
  let mut res = vec![];
  for dbres in data {
    let crr = ReactionRes::from_sqlite(&dbres);
    if let Ok(cr) = crr {
      res.push(cr);
    }
  }
  Ok(res)
}
pub fn get_reactions(our: &Address, target_hash: &str, rtype: usize) -> Result<Vec<ReactionRes>> {
  let db = open_db(our)?;
  let statement = "SELECT * FROM reactions WHERE target_url = ?1 AND type = ?2".to_string();
  let hash = serde_json::Value::String(target_hash.to_string());
  let params = vec![hash, rtype.into()];
  let data = db.read(statement, params)?;
  let mut res = vec![];
  for dbres in data {
    let crr = ReactionRes::from_sqlite(&dbres);
    if let Ok(cr) = crr {
      res.push(cr);
    }
  }
  Ok(res)
}
pub fn get_replies(our: &Address, target_hash: &str) -> Result<Vec<CastRes>> {
  let db = open_db(our)?;
  let statement = "SELECT text, hash, author, embeds, mentions, mentions_positions, created FROM casts WHERE parent_hash = ?".to_string();
  let hash = serde_json::Value::String(target_hash.to_string());
  let params = vec![hash];
  let data = db.read(statement, params)?;
  let mut res = vec![];
  for dbres in data {
    let cast = CastT::from_sqlite(&dbres);
    if let Err(_) = cast {
      continue;
    }
    let cast = cast.unwrap();
    let author = get_profile(our, cast.fid);
    let (rts, likes, replies) = get_engagement(our, &cast, false);
    let reply_count = replies.len();
    let cr = CastRes { author,
                       cast,
                       rts,
                       likes,
                       replies,
                       reply_count };
    res.push(cr);
  }
  Ok(res)
}
pub fn find_keys(our: &Address) -> Result<Value> {
  println!("finding keys");
  let db = open_db(our)?;
  let statement = "SELECT * FROM signing_keys".to_string();
  let data = db.read(statement, vec![])?;
  println!("{:?}", data);
  let first = data.get(0).ok_or_else(|| anyhow!("bad"))?;
  let fid = first.get("fid").ok_or_else(|| anyhow!("bad"))?;
  Ok(fid.clone())
}

pub fn print_pubkey(our: &Address) -> Result<String> {
  println!("finding keys");
  let db = open_db(our)?;
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
