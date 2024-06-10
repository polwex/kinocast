fn main() {
  let protobuf_dir = "../protobufs/schemas/";
  let files = ["rpc.proto",
               "hub_event.proto",
               "request_response.proto",
               "onchain_event.proto",
               "username_proof.proto",
               "gossip.proto",
               "message.proto",
               "hub_state.proto",
               "job.proto",
               "sync_trie.proto"];
  let protos: Vec<String> = files.iter()
                                 .map(|fname| format!("{}{}", protobuf_dir, fname))
                                 .collect();

  for proto_file in &protos {
    println!("cargo:rerun-if-changed={}", proto_file);
  }
  protobuf_codegen_pure::Codegen::new().out_dir("src/protos")
                                       .inputs(protos)
                                       .include(protobuf_dir)
                                       .run()
                                       .expect("Protobuf codegen failed");
}
