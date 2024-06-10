use anyhow::Result;
use ed25519_dalek::{SecretKey, Signer, SigningKey, VerifyingKey};
use kinode_process_lib::net::{sign, verify};
use kinode_process_lib::println;
use kinode_process_lib::{net, Address, Message, Request};
use rand::rngs::OsRng;

pub fn generate_keys() -> SigningKey {
  let mut csprng = OsRng;
  // generate keypair
  let keypair = SigningKey::generate(&mut csprng);
  return keypair;
}

pub fn run() -> Result<()> {
  let kp = generate_keys();
  let pubkey = kp.verifying_key().to_bytes();
  let signed_pubkey = sign(pubkey)?;

  // we sign something with the kp
  let data = "lmao";
  let signed_data = kp.sign(data.as_bytes());

  // let verifier1 = VerifyingKey::from_bytes(signed_pubkey);

  // println!("verifying {:?}", ver);
  Ok(())
}
