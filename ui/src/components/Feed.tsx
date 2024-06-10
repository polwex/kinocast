import { useEffect, useLayoutEffect, useRef, useState } from "react";
import left from "../assets/icons/left.svg";
import {
  Post as PostT,
  ProfileBunt,
  UserProfile,
} from "../logic/types/farcaster";
import Post from "./Post";
import Composer from "../modals/Composer";
import "./feed.css";
import spinner from "../assets/icons/ring-spin.svg";

import {
  FullCastRes,
  UserRes,
  userCasts,
  userChannels,
  userLikes,
} from "../logic/fetch/kinohub";
import useGlobalState, { useHistory } from "../logic/state/state";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { ChannelRes, UserChannelsRes, checkFidFname, checkFnameAvailable } from "../logic/fetch/warpcast";
import { castsByFid } from "../logic/fetch/hub";

export type FeedType = "casts" | "replies" | "likes" | "channels";

export function FeedLoader({ name, fid}: { name: string, fid?: number }) {
  const [error, setError] = useState(false);
  const [ffid, setFid] = useState<number| undefined>(fid);

  useEffect(() => {
    checkFnameAvailable(name).then(r => {
      if (r.length === 0) setError(true)
      else {
        const last = r[r.length - 1];
        const { fid } = last;
        setFid(fid);
      }
    })
  }, [name])

  if (error) return (
    <div>
      <h3>404</h3>
      <p>No feed found belonging to username @{name}</p>
    </div>
  )
  else if (ffid) return <Feed fid={ffid} />
  else return <img className="agc" src={spinner} />
}


function Feed({ fid }: { fid: number }) {
  console.log(fid, "feed fid")
  const [feedType, setft] = useState<FeedType>("casts");

  async function init({ pageParam }: { pageParam: any }) {
    const start = Date.now();
    const rpc = await castsByFid(fid)
    console.log(rpc.messages.length, "rpc length")

    const res =
      feedType === "casts"
        ? userCasts(fid, pageParam)
        : feedType === "replies"
          ? userCasts(fid, pageParam, true)
          : feedType === "likes"
            ? userLikes(fid, pageParam)
            : userChannels(fid, pageParam);
    console.log(Date.now() - start, "elapsed");
    return await res;
  }
  const {
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["feed", fid],
    queryFn: init,
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage, _pages) =>
      "cursor" in lastPage ? lastPage.cursor : lastPage.next.cursor,
  });
  useEffect(() => {
    console.log(feedType, "feed type")
    refetch();
  }, [feedType])


  if (isLoading) return <img className="agc big-spin" src={spinner} />;
  else
    return (
      <Inner
        data={data!}
        refetch={refetch}
        fetchNext={fetchNextPage}
        loading={isFetchingNextPage}
        feed={feedType}
        setFeed={setft}
      />
    );
}
function Inner({
  data,
  refetch,
  fetchNext,
  loading,
  feed,
  setFeed
}: {
  data: InfiniteData<UserRes | UserChannelsRes, any>;
  refetch: Function;
  fetchNext: Function;
  loading: boolean;
  feed: FeedType;
  setFeed: Function
}) {
  useEffect(() => {
    const first: any = data.pages[0];
    console.log(first, "first")
    console.log(first!.casts!.length, "length");
    if (first && "cursor" in first) setProf(first.profile);
  }, [data.pages]);
  const [profile, setProf] = useState<UserProfile>(ProfileBunt);

  const cursorDiv = useRef(null);
  // // infinite scroll
  // function cursorVisible(entries: IntersectionObserverEntry[]) {
  //   for (let entry of entries) {
  //     if (entry.isIntersecting) fetchNext();
  //   }
  // }
  // useLayoutEffect(() => {
  //   const options = {
  //     root: null,
  //     rootMargin: "50px",
  //     threshold: 1.0,
  //   };
  //   const observer = new IntersectionObserver(cursorVisible, options);
  //   observer.observe(cursorDiv.current);
  //   // if (downCursor.current) observer.observe(downCursor.current);
  //   return () => observer.disconnect();
  // }, [data.pages]);
  return (
    <>
      <UserInfo data={profile} />
      <div className="row even tabs">
        <div
          className={feed === "casts" ? "feed-opt active" : "feed-opt"}
          onClick={() => setFeed("casts")}
        >
          Casts
        </div>
        <div
          className={feed === "replies" ? "feed-opt active" : "feed-opt"}
          onClick={() => setFeed("replies")}
        >
          Replies
        </div>
        <div
          className={feed === "likes" ? "feed-opt active" : "feed-opt"}
          onClick={() => setFeed("likes")}
        >
          Likes
        </div>
        <div
          className={feed === "channels" ? "feed-opt active" : "feed-opt"}
          onClick={() => setFeed("channels")}
        >
          Channels
        </div>
      </div>
      <div id="feed">
        {data.pages.map((pag) =>
          "cursor" in pag ? (
            <PostList key={pag.cursor} posts={pag.casts} />
          ) : (
            <ChannelList key={pag.next.cursor} chans={pag.result.channels} />
          ),
        )}
        {loading ? (
          <img className="ac spinner" src={spinner} />
        ) : (
          <div ref={cursorDiv}></div>
        )}
      </div>
    </>
  );
}

// {feed === "casts" ? (
//   <PostList posts={casts} />
// ) : feed === "replies" ? (
//   <PostList posts={casts} />
// ) : (
//   // ) : feed === "likes" ? (
//   //   <PostList posts={likes} />
//   <ChannelList data={channels} />
// )}
export function PostList({ posts }: { posts: FullCastRes[] }) {
  posts.sort(
    (a, b) =>
      new Date(b.cast.timestamp).getTime() -
      new Date(a.cast.timestamp).getTime(),
  );
  return (
    <>
      {posts.map((p) => (
        <Post key={JSON.stringify(p)} post={p} />
      ))}
    </>
  );
}

export function ChannelList({ chans }: { chans: ChannelRes[] }) {
  return (
    <>
      {chans.map((c) => {
        <div key={JSON.stringify(c)} className="channel"></div>;
      })}
    </>
  );
}
function UserInfo({ data }: { data: UserProfile }) {
  const {history, navigate} = useHistory();
  const { fid, displayname, username, pfp, bio, url, follows, followers } =
    data;
  // console.log(data, "data");
  const { prof, setModal, logout } = useGlobalState();
  const our = prof!.fid;
  function goback() {
    const [now, before, ..._] = history;
    navigate(before || "/");
    // goto()
  }
  function openComposer() {
    const opts = { width: "60%" };
    setModal(<Composer />, opts);
  }
  function openUserMenu() { }
  function enlargenProfile() { }
  function gotoFollows() {
    navigate(`/f/${fid}/following`);
  }
  function gotoFollowers() {
    navigate(`/f/${fid}/followers`);
  }
  function doLogout() {
    const res = logout()
  }
  return (
    <div>
      <div className="row spread" id="feed-nav">
        <div className="row" id="feed-name">
          <img src={left} className="cp" onClick={goback} />
          <h2>{displayname}</h2>
        </div>
        <button onClick={openComposer}>Cast</button>
      </div>
      <div id="bio">
        <img src={pfp} className="cp" onClick={enlargenProfile} />
        <div id="bio-proper">
          <div className="row spread">
            <div id="names">
              <div className="bio-name">{displayname}</div>
              <div className="bio-uname">@{username}</div>
            </div>
            {fid == our
              ? <button onClick={doLogout}>Logout</button>
              : <button onClick={openUserMenu}>...</button>
            }
          </div>
          <p id="bio-text">{bio} </p>
          <div id="counts">
            <div className="cp" onClick={gotoFollows}>
              {follows} Following
            </div>
            <div className="cp" onClick={gotoFollowers}>
              {followers} Followers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feed;
