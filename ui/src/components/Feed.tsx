import { useEffect, useLayoutEffect, useRef, useState } from "react";
import left from "../assets/icons/left.svg";
import {
  PID,
  Post as PostT,
  ProfileBunt,
  UserProfile,
} from "../logic/types/farcaster";
import Post from "./Post";
import Composer from "../modals/Composer";
import "./feed.css";
import spinner from "../assets/icons/ring-spin.svg";

import useGlobalState, { useHistory } from "../logic/state/state";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { ChannelRes, checkFnameAvailable } from "../logic/fetch/warpcast";
import {
  ChannelsRes,
  FullCastRes,
  LikesRes,
  UserRes,
  fetchUserChannels,
  fetchUserFeed,
  fetchUserReactions,
  profileBunt,
} from "../logic/fetch/kinode";
import { NEWMAN } from "../logic/constants";

export type FeedType = "casts" | "replies" | "likes" | "channels";

export function FeedLoader({ name, fid }: { name: string; fid?: number }) {
  console.log([name, fid], "feed loader");
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
        <p>No feed found belonging to username @{name}</p>
      </div>
    );
  else if (ffid) return <Feed fid={ffid} />;
  else return <img className="agc" src={spinner} />;
}

function Feed({ fid }: { fid: number }) {
  console.log(fid, "feed fid");
  const [feedType, setft] = useState<FeedType>("casts");

  async function init({ pageParam }: { pageParam: any }) {
    const start = Date.now();
    const res =
      feedType === "casts"
        ? fetchUserFeed(fid, pageParam)
        : feedType === "replies"
          ? fetchUserFeed(fid, pageParam, true)
          : feedType === "likes"
            ? fetchUserReactions(fid, pageParam)
            : fetchUserChannels(fid, pageParam);
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
      "cursor" in lastPage ? lastPage.cursor : "",
  });
  useEffect(() => {
    console.log(feedType, "feed type");
    refetch();
  }, [feedType]);

  if (!data) return <img className="agc big-spin" src={spinner} />;
  else
    return (
      <Inner
        data={data}
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
  setFeed,
}: {
  data: InfiniteData<UserRes | LikesRes | ChannelsRes>;
  refetch: Function;
  fetchNext: Function;
  loading: boolean;
  feed: FeedType;
  setFeed: Function;
}) {
  console.log(data, "data");
  useEffect(() => {
    const first = data.pages[0];
    console.log(first, "first");
    if (first && "feed" in first) setProf(first.feed.profile);
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
          "likes" in pag ? (
            <LikesList key={pag.cursor} pids={pag.likes} />
          ) : "feed" in pag ? (
            <PostList key={pag.feed.cursor} posts={pag.feed.casts} />
          ) : (
            <ChannelList key={pag.cursor} chans={pag.chans} />
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
      {posts.map((p) => {
        const ps = p.author ? p : { ...p, author: profileBunt };
        return <Post key={JSON.stringify(p)} post={ps} />;
      })}
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
  const { history, navigate } = useHistory();
  const { fid, displayname, username, pfp, bio, url, follows, followers } =
    data;
  // console.log(data, "data");
  const { prof, setModal, logout } = useGlobalState();
  const prof_pic = pfp ? pfp : NEWMAN;
  const uname = username ? username : fid;
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
  function openUserMenu() {}
  function enlargenProfile() {}
  function gotoFollows() {
    navigate(`/f/${fid}/following`);
  }
  function gotoFollowers() {
    navigate(`/f/${fid}/followers`);
  }
  function doLogout() {
    const res = logout();
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
        <img src={prof_pic} className="cp" onClick={enlargenProfile} />
        <div id="bio-proper">
          <div className="row spread">
            <div id="names">
              <div className="bio-name">{displayname}</div>
              <div className="bio-uname">@{uname}</div>
            </div>
            {fid == our ? (
              <button onClick={doLogout}>Logout</button>
            ) : (
              <button onClick={openUserMenu}>...</button>
            )}
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

function LikesList({ pids }: { pids: PID[] }) {
  return <div></div>;
}
