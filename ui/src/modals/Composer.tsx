import { useRef, useState } from "react";
import useGlobalState from "../logic/state/state";
import imageIcon from "@/assets/icons/image.svg";
import { submitMessage } from "../logic/fetch/post";
import { PID } from "../logic/types/farcaster";
import { sendCast, sendReply } from "../logic/fetch/kinode";
import { QuoteLoader } from "../components/Post";

type ComposerProps = {
  replying_to?: PID;
};

function Composer(props: ComposerProps) {
  const { replying_to } = props;
  const { prof, unsetModal } = useGlobalState();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.FormEvent<HTMLTextAreaElement>) {
    setError("");
    const t = e.currentTarget.value;
    handleInput(t);
  }
  async function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length > 0) runRegex(pastedText);
    if (e.clipboardData.files[0]) {
      setLoading(true);
      // const res = await uploadFile(our, bucket, e.clipboardData.files[0]);
      // if (res) handleImageChoice(res)
      setLoading(false); // TODO error handling
    } else return;
  }
  async function runRegex(s: string) {
    handleInput(input + s);
  }
  function handleInput(s: string) {
    if (s.length <= 320) setInput(s);
    else setInput(s.slice(0, 320));
  }
  function handleFileUpload() {
    if (fileInput.current) fileInput.current.click();
  }
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setLoading(true);
    const data = new FormData();
    for (const f of e.target.files || []) {
      // data.append("files[]", f, f.name);
      // const res = await uploadFile(our, bucket, f);
    }
    setLoading(false);
  }
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const res = !replying_to
      ? await sendCast(input)
      : await sendReply(input, replying_to);
    if (res) unsetModal();
    console.log(res, "submitted message");
  }

  return (
    <div id="composer">
      {replying_to && <QuoteLoader {...replying_to} />}
      <div id="row1">
        <img id="composer-avatar" src={prof!.pfp} />
        <textarea
          value={input}
          placeholder="Poast Here"
          onInput={handleChange}
          onPaste={handlePaste}
          name=""
          id=""
          cols={30}
          rows={10}
        ></textarea>
      </div>
      <div id="button-row" className="row spread">
        <div id="icon-row">
          <div id="image-upload">
            <img className="icon" src={imageIcon} onClick={handleFileUpload} />
            <input
              id="file-input"
              ref={fileInput}
              type="file"
              onChange={handleUpload}
            />
          </div>
        </div>
        <p>{input.length}/320</p>
        <button onClick={handleSubmit}>Cast</button>
      </div>
    </div>
  );
}

export default Composer;
