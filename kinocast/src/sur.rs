use anyhow::{anyhow, Result};
use ed25519_dalek::{SecretKey, Signer, SigningKey};
use hex::ToHex;
use kinode_process_lib::{get_typed_state, println, set_state};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha512};

fn gen_keys() -> SigningKey {
  let mut csprng = OsRng;
  let keypair = SigningKey::generate(&mut csprng);
  return keypair;
}
fn dev_keys() -> SigningKey {
  let seed_data: &[u8] = b"your_seed_data_here_must_be_32_bytes_";
  let mut hasher = Sha512::new();
  hasher.update(seed_data);
  let hash_result = hasher.finalize();
  let seed_bytes = &hash_result[..32];
  let seed_array: [u8; 32] = seed_bytes.try_into().expect("Slice with incorrect length");
  SigningKey::from_bytes(&seed_array)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct State {
  pub active_fid: Option<u64>,
  key: [u8; 32],
  keystring: String,
}

impl State {
  pub fn new() -> Self {
    let key = gen_keys();
    let key_bytes = key.to_bytes();
    let vf = key.verifying_key();
    let keystring = hex::encode(vf.to_bytes());
    Self { key: key_bytes,
           keystring,
           active_fid: None }
  }

  pub fn reset(&mut self) {
    self.active_fid = None;
  }

  pub fn set_active_fid(&mut self, fid: u64) {
    self.active_fid = Some(fid);
  }
  pub fn get_key(&self) -> SigningKey {
    SigningKey::from_bytes(&self.key)
  }
  // pub fn get_keystring(&self) -> String {
  //   let pk = SigningKey::from_bytes(&self.key);
  //   let bytes = pk.verifying_key().to_bytes();
  //   hex::encode(bytes)
  // }
  pub fn print_state(&self) {
    println!("state {:?}", self);
  }

  pub fn save(&self) -> Result<()> {
    let bytes = bincode::serialize(self);
    match bytes {
      Err(e) => {
        println!("error serializing state!!! \n{:?}", e);
        Err(anyhow!("fucked up"))
      }
      Ok(b) => {
        set_state(&b);
        Ok(())
      }
    }
  }
  pub fn change_key(&self) -> Result<()> {
    let n = State::new();
    n.save()
  }
}
pub fn load_state() -> State {
  let s = get_typed_state(|bytes| Ok(bincode::deserialize::<State>(bytes)?));
  let ns = match s {
    Some(st) => {
      println!("state present");
      st
    }
    None => {
      println!("state absent");
      State::new()
    }
  };
  let _ = ns.save();
  ns
}
