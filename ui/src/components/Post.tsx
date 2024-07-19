import reply from "../assets/icons/reply.svg";
import bookmark from "../assets/icons/bookmark.svg";
import like from "../assets/icons/heart.svg";
import redheart from "../assets/icons/redheart.svg";
import quote from "../assets/icons/quote.svg";
import rt from "../assets/icons/retweet.svg";
import rt2 from "../assets/icons/retweet2.svg";
import menu from "../assets/icons/menu.svg";
import { useEffect, useState } from "react";
import useGlobalState, { useHistory } from "../logic/state/state";
import Composer from "../modals/Composer";
import {
  FullCastRes,
  fetchEngagement,
  fetchFullThread,
  scrapeURL,
  sendFrame,
  sendLike,
  sendRT,
} from "../logic/fetch/kinode";
import {
  Fid,
  Frame as FrameT,
  FrameButton,
  OpenGraphTags,
  MessageData,
} from "../logic/types/farcaster";
import { useQuery } from "@tanstack/react-query";
import { extractOpenGraph } from "../logic/frames";
import { IMAGE_REGEX, URL_REGEX } from "../logic/constants";
import {
  abbreviate,
  abbreviateNumber,
  bytesToHash,
  bytesToHex,
  date_diff,
  displayCount,
  hexToBytes,
  parseCast,
  parseProf,
} from "../logic/helpers";
// import spinner from "../assets/icons/pacman.svg";
import spinner from "../assets/icons/ring-spin.svg";
import { reactionsByCast } from "../logic/fetch/hub";

type PostType = FullCastRes;

function Post(props: { post: PostType; quote?: boolean }) {
  const { post } = props;
  if (post.cast.embeds.length === 0) return null;
  const { navigate, history } = useHistory();
  function openThread(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/${post.author.username}/${post.cast.hash}`);
  }
  const quote = props.quote || false;
  if (quote)
    return (
      <div className="cast quote">
        <Header {...props} />
        <Body {...props} />
      </div>
    );
  return (
    <div className="cast" onMouseUp={openThread}>
      <div className="left">
        <img src={post.author.pfp} />
      </div>
      <div className="right">
        <Header {...props} />
        <Body {...props} />
        <Footer {...props} />
      </div>
    </div>
  );
}
export default Post;

export function Header({ post }: { post: PostType }) {
  // console.log(post.cast.timestamp, "post time");
  const postTime = new Date(post.cast.timestamp);

  const { history, navigate } = useHistory();
  function openAuthor(e: React.MouseEvent) {
    // navigate(`/${post.author.username}`)
    e.stopPropagation();
    navigate(`/${post.author.fid}`);
    // navigate(`/un/${post.author.username}`);
  }
  function openThread(e: React.MouseEvent) {
    e.stopPropagation();
    // navigate(`/${post.author.username}/${postHash}`);
    navigate(`/${post.author.fid}/${post.cast.hash}`);
  }
  return (
    <header>
      <div className="author" role="link">
        <div className="author-name" onMouseUp={openAuthor}>
          {post.author.displayname}
        </div>
        <div className="author-uname" onMouseUp={openAuthor}>
          @{post.author.username}
        </div>
      </div>
      <div role="link" onMouseUp={openThread} className="date">
        <p title={postTime.toLocaleString()}>{date_diff(postTime, "short")}</p>
      </div>
    </header>
  );
}

type Acc = { nodes: React.ReactNode[]; text: string };
export function Body({ post, quote }: { post: PostType; quote?: boolean }) {
  const urls = post.cast.text.match(URL_REGEX) || [];
  const text = Array.from(urls).reduce(
    (acc: Acc, item: string, i) => {
      const sp = acc.text.split(item);
      // const key = `${item}${i}`;
      let textNode = <span key={sp[0] + i}>{sp[0]}</span>;
      let urlNode = (
        <a key={item + i} href={item}>
          {abbreviate(item, 40)}
        </a>
      );
      const nodes = [...acc.nodes, textNode, urlNode];
      const text = sp.slice(1).join("");
      return { nodes, text };
    },
    { nodes: [], text: post.cast.text },
  );
  // if (post.cast.embeds.length > 0) console.log(post.cast.embeds, "post embeds");
  return (
    <div className="trill-post-body body">
      <div className="body-text">
        {text.nodes}
        <p>{text.text}</p>
      </div>
      {!quote && (
        <div className="body-embeds">
          {post.cast.embeds.map((e, i): any =>
            "url" in e ? (
              <URLEmbed
                key={JSON.stringify(e) + i}
                url={e.url}
                fid={post.cast.fid}
                hash={post.cast.hash}
              />
            ) : "castId" in e ? (
              <QuoteLoader key={i} fid={e.castId.fid} hash={e.castId.hash} />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

function URLEmbed(props: { url: string; fid: number; hash: string }) {
  const [frame, setFrame] = useState<FrameT>();
  const [og, setOg] = useState<OpenGraphTags>();
  const [img, setImg] = useState("");
  async function run() {
    // const url =
    // "https://superrare.com/0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0/head-in-profile-31786";
    if (props.url.match(IMAGE_REGEX)) {
      setImg(props.url);
      return;
    }
    const res = await scrapeURL(props.url);
    if ("HTML" in res) {
      const f = extractOpenGraph(res.HTML, props.url);
      if ("frame" in f) setFrame(f.frame);
      else if ("og" in f) setOg(f.og);
    } else if ("Image" in res) setImg(res.Image);
  }

  useEffect(() => {
    run();
  }, [props.url]);
  // <img key={i + e.Url} src={e.Url} />
  if (frame) return <Frame frame={frame} {...props} />;
  else if (og) return <Og og={og} {...props} />;
  else if (img)
    return (
      <a className="url embed" href={img} target="_blank">
        <img src={img} />
      </a>
    );
  else
    return (
      <a className="url embed" href={props.url}>
        {props.url}
      </a>
    );
}

export function Og({
  og,
  fid,
  hash,
}: {
  og: OpenGraphTags;
  fid: number;
  hash: string;
}) {
  return (
    <a href={og.url} className="opengraph">
      {og.title}
      <div className="enclosure">
        <img src={og.image.url} alt={og.description || ""} />
        {og.audio && <audio src={og.audio.url} controls />}
        {og.video && <video src={og.video.url} controls />}
        <div className="site-name">{og.site_name || ""}</div>
      </div>
    </a>
  );
}
export function Frame({
  frame,
  fid,
  hash,
}: {
  frame: FrameT;
  fid: number;
  hash: string;
}) {
  const { prof } = useGlobalState();
  const our = prof!.fid;
  // TODO show the original url as warpcast?
  async function buttonAction(b: FrameButton, idx: number) {
    const postUrl = b.target || b.postUrl || frame.postURL || frame.embedURL;
    if (b.action === "post" || b.action === "post_redirect")
      buttonPost(postUrl, idx + 1, b.action === "post_redirect");
    else if (b.action === "link") buttonLink(b!.target!);
    else if (b.action === "mint") buttonMint(b!.target!);
    else if (b.action === "tx") buttonTx(b!.target!, b.postUrl!, idx + 1);
  }
  async function buttonPost(
    url: string,
    buttonIndex: number,
    redirect: boolean,
  ) {
    const body = {
      fid,
      url,
      buttonIndex,
      state: frame.state,
      inputText: frame.inputText,
      transactionId: "",
      address: "",
      messageHash: "",
      network: 1,
      timestamp: Date.now(),
      castId: { fid, hash },
    };
    const res = await sendFrame(body);
    // if (res)
  }
  async function buttonLink(target: string) {
    // TODO redirect or fetch?
    window.open(target, "_blank");
  }
  async function buttonMint(target: string) {
    // mint with wallet
  }
  async function buttonTx(
    target: string,
    postURL: string,
    buttonIndex: number,
  ) {
    const body = {
      fid,
      url: target,
      buttonIndex,
      state: frame.state,
      inputText: frame.inputText,
      transactionId: "",
      address: "",
      messageHash: "",
      network: 1,
      timestamp: Date.now(),
      castId: { fid, hash },
    };
    const res = await sendFrame(body);
    // TODO see details here for what follows
    // https://docs.farcaster.xyz/reference/frames/spec
  }
  return (
    <div>
      <div className="tc smol">Frame</div>
      <div className="frame">
        <img src={frame.image} />
        <div className="frame-buttons">
          {frame.buttons.map((b, i) => (
            <button key={JSON.stringify(b)} onClick={() => buttonAction(b, i)}>
              {b.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export function QuoteLoader(
  { fid, hash }: any,
  // { fid: Fid; hash: number[] }
) {
  async function fetchCast() {
    const postHash = bytesToHash(hash);
    const res = await fetchFullThread(postHash);
    return res;
  }
  // TODO
  //   cast
  // \xdf6fce057e4ad0f9aa6dd8443d1b529502a3671e
  // is a frame!
  // const { isLoading, isError, data, refetch } = useQuery({
  //   queryKey: ["post", fid, hash],
  //   queryFn: fetchCast,
  // });
  // async function grab() {
  //   const res = await castById(fid, postHash);
  //   const authorRes = await userData(res.data.fid);
  //   const author = parseProf(authorRes, res.data.fid);
  //   const post = parseCast(res, author);
  //   const castRes: PostType = {
  //     reply_count: 0,
  //     likes: [],
  //     rts: [],
  //     author,
  //     cast: {
  //       fid,
  //       text: post.text,
  //       timestamp: new Date(post.time).toISOString(),
  //       hash: [...hexToBytes(post.hash)],
  //       embeds: [],
  //       mentions: [],
  //       mentions_positions: [],
  //       parent_hash: null,
  //       parent_fid: null,
  //       parent_url: null,
  //       root_parent_hash: null,
  //       root_parent_url: null,
  //     },
  //   };
  //   // setPost(post);
  //   if (res) {
  //     setPost(castRes);
  //     setLoading(false);
  //   }
  // }
  // useEffect(() => {
  //   grab();
  // }, []);
  if (true) return <></>;
  // return (
  //   <div className="quote-wrapper">
  //     {isLoading ? (
  //       <img className="ac spinner" src={spinner} />
  //     ) : (
  //       <Post
  //         post={{ ...data!, reply_count: data!.replies.length }}
  //         quote={true}
  //       />
  //     )}
  //   </div>
  // );
}

export function Footer(props: { post: PostType }) {
  const { post } = props;
  const { isLoading, data } = useQuery({
    queryKey: ["engagement", post.cast.fid, post.cast.hash],
    queryFn: () => reactionsByCast(post.cast.fid, post.cast.hash),
  });
  if (!data) return <div>...</div>;
  else return <FooterInner {...props} reactions={data.messages} />;
}

export function FooterInner({
  post,
  reactions,
}: {
  post: PostType;
  reactions: MessageData<"MESSAGE_TYPE_REACTION_ADD">[];
}) {
  const { prof } = useGlobalState();
  const [liked, setLiked] = useState(false);
  const engBunt: { likes: Fid[]; rts: Fid[] } = {
    likes: [],
    rts: [],
  };
  const eng = reactions.reduce((acc, item) => {
    if (item.data.reactionBody.type === "REACTION_TYPE_LIKE")
      return { ...acc, likes: [...acc.likes, item.data.fid] };
    else return { ...acc, rts: [...acc.rts, item.data.fid] };
  }, engBunt);
  const { setModal } = useGlobalState();
  const reposting = false;
  const myRP = false;

  function doReply(e: React.MouseEvent) {
    e.stopPropagation();
    const opts = { width: "60%" };
    const pid = { fid: post.author.fid, hash: post.cast.hash };
    setModal(<Composer replying_to={pid} />, opts);
  }
  function doQuote(e: React.MouseEvent) {
    e.stopPropagation();
  }
  async function cancelRP(e: React.MouseEvent) {
    e.stopPropagation();
    // const r = await deletePost(our, rtid as string);
    // setAlert("Repost deleted");
    // refetch();
    // if (location.includes(poast.id)) navigate("/");
  }
  async function sendRP(e: React.MouseEvent) {
    e.stopPropagation();
    const postHash = post.cast.hash;
    const pid = { fid: post.author.fid, hash: postHash.slice(2) };
    const res = await sendRT(pid);
  }
  async function doLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked(true);
    const postHash = post.cast.hash;
    const pid = { fid: post.author.fid, hash: postHash.slice(2) };
    const res = await sendLike(pid);
  }
  function doBookmark(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <footer>
      <div className="icon">
        <span
          role="link"

          // onMouseUp={showReplyCount} className="reply-count"
        >
          {abbreviateNumber(post.reply_count)}
        </span>
        <img role="link" onMouseUp={doReply} src={reply} alt="" />
      </div>
      <div className="icon">
        <span
          role="link"
          // onMouseUp={showQuoteCount} className="quote-count"
        ></span>
        <img role="link" onMouseUp={doQuote} src={quote} alt="" />
      </div>
      <div className="icon">
        <span
          role="link"
          // onMouseUp={showRepostCount} className="repost-count"
        >
          {abbreviateNumber(eng.rts.length)}
        </span>
        {reposting ? (
          <p>...</p>
        ) : myRP ? (
          <img
            role="link"
            className="my-rp"
            onMouseUp={cancelRP}
            src={rt2}
            title="cancel repost"
          />
        ) : (
          <img role="link" onMouseUp={sendRP} src={rt} title="repost" />
        )}
      </div>
      <div className="icon">
        <span
          role="link"
          // onMouseUp={showQuoteCount} className="quote-count"
        >
          {abbreviateNumber(eng.likes.length)}
        </span>
        {liked || eng.likes.includes(prof!.fid) ? (
          <img role="link" onMouseUp={doLike} src={redheart} alt="" />
        ) : (
          <img role="link" onMouseUp={doLike} src={like} alt="" />
        )}
      </div>
      <div className="icon">
        <span
          role="link"
          // onMouseUp={showQuoteCount} className="quote-count"
        ></span>
        <img role="link" onMouseUp={doBookmark} src={bookmark} alt="" />
      </div>
      <div className="icon">
        <span
          role="link"
          // onMouseUp={showQuoteCount} className="quote-count"
        ></span>
        <img role="link" onMouseUp={openMenu} src={menu} alt="" />
      </div>
    </footer>
  );
}
