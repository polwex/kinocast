use kinode_process_lib::{await_next_message_body, call_init, println, Address, Response};

wit_bindgen::generate!({
    path: "wit",
    world: "process",
});

call_init!(init);
fn init(_our: Address) {
  let Ok(args) = await_next_message_body() else {
    println!("echo: failed to get args, aborting");
    return;
  };

  match String::from_utf8(args.clone()) {
    Ok(s) => println!("{}", s),
    Err(_) => println!("{:?}", args),
  }
}
