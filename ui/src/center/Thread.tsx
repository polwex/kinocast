import Post from "../components/Post";
// import { extractThread, toFlat } from "./helpers";
import spinner from "@/assets/icons/pacman.svg";
import { useEffect, useRef, useState } from "react";
// import { LoadFailed } from "@/loaders/Failed";
import left from "../assets/icons/left.svg";
import { useQuery } from "@tanstack/react-query";
import { checkFnameAvailable } from "../logic/fetch/warpcast";
import { useHistory } from "../logic/state/state";
import {
  FullCastRes,
  FullThreadRes,
  ThreadRes,
  fetchFullThread,
} from "../logic/fetch/kinode";

export function ThreadLoader({
  name,
  hash,
  fid,
}: {
  name: string;
  hash: string;
  fid?: number;
}) {
  const [error, setError] = useState(false);
  const [ffid, setFid] = useState<number | undefined>(fid);

  useEffect(() => {
    checkFnameAvailable(name).then((r) => {
      if (r.length === 0) setError(true);
      else {
        const last = r[r.length - 1];
        const { fid } = last;
        setFid(fid);
      }
    });
  }, [name]);

  if (error)
    return (
      <div>
        <h3>404</h3>
        <p>No Post found with hash {hash}</p>
      </div>
    );
  else if (ffid) return <Thread fid={ffid} hash={hash} />;
  else return <img className="agc" src={spinner} />;
}

function extractThread(t: ThreadRes) {
  const zhu = t.cast.fid;
  const zi: FullCastRes[] = [];
  const da: FullCastRes[] = [];
  for (let r of t.replies) {
    if (r.author.fid === zhu) zi.push(r);
    else da.push(r);
  }
  return [zi, da];
}

function Thread({ fid, hash }: { fid: number; hash: string }) {
  async function fetchCast() {
    const res = await fetchFullThread(hash);
    return res;
  }
  const { isLoading, isError, data, refetch } = useQuery({
    queryKey: ["post", fid, hash],
    queryFn: fetchCast,
  });
  if (isLoading) return <img className="agc big-spin" src={spinner} />;
  else return <Inner data={data!} refetch={refetch} />;
}

export default Thread;

function Inner({ data, refetch }: { data: ThreadRes; refetch: Function }) {
  const { history, navigate } = useHistory();
  const postData: FullThreadRes = { ...data, reply_count: data.replies.length };
  // TODO
  const flatPost: FullCastRes = { ...postData, replies: [] };

  function goback() {
    const [now, before, ..._] = history;
    navigate(before || "/");
    // goto()
  }
  function openComposer() {}
  return (
    <>
      <div className="row spread" id="feed-nav">
        <div className="row" id="feed-name">
          <img src={left} className="cp" onClick={goback} />
          <h2>Thread</h2>
        </div>
        <button onClick={openComposer}>Cast</button>
      </div>
      <div id="trill-thread">
        <div id="head">
          <Post post={flatPost} />
        </div>
        <Tail data={data} refetch={refetch} />
      </div>
    </>
  );
}

function Tail({ data, refetch }: { data: ThreadRes; refetch: Function }) {
  const [threadChildren, replies] = extractThread(data);
  return (
    <>
      <div id="tail">
        {threadChildren.map((n) => {
          return <Post key={n.cast.hash.toString()} post={n} />;
        })}
      </div>
      {/* ...something */}
      <div id="replies">
        {replies.map((n) => (
          <ReplyThread
            key={n.cast.hash.toString()}
            reply={n}
            refetch={refetch}
          />
        ))}
      </div>
    </>
  );
}

function ReplyThread({
  reply,
  refetch,
}: {
  reply: FullCastRes;
  refetch: Function;
}) {
  // const [threadChildren, replies] = extractThread(reply);
  return (
    <div className="trill-reply-thread">
      <div className="head">
        <Post post={reply} />
      </div>
      {/*<div className="tail">
        {replies.map((r) => (
          <Post key={r.id} poast={toFlat(r)} refetch={refetch} />
        ))}
      </div>*/}
    </div>
  );
}
