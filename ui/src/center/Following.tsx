import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import spinner from "../assets/icons/roundspin.svg";
import left from "../assets/icons/left.svg";
import {
  FollowRes,
  FollowsRes,
  userFollows,
  userLinks,
} from "../logic/fetch/kinohub";
import { useState } from "react";
import { Fid, UserProfile } from "../logic/types/farcaster";
import useGlobalState, { useHistory } from "../logic/state/state";
import { sendFollow, sendUnfollow } from "../logic/fetch/kinode";

export type LinkType = "in" | "out";
function Follows({ fid, type }: { fid: number; type: LinkType }) {
  const [linkType, setl] = useState<LinkType>(type);

  async function init() {
    const res = await userLinks(fid, Date.now());
    return res;
  }
  const { isLoading, isError, data, refetch } = useQuery({
    queryKey: ["links", fid],
    queryFn: init,
  });
  return (
    <div>
      <div className="row f g2" id="top-row">
        <img src={left} />
        <div>
          <div>tugsor</div>
        </div>
      </div>
      <div className="tabs">
        <div
          onClick={() => setl("in")}
          className={linkType === "in" ? "tab active" : "tab"}
        >
          Followers
        </div>
        <div
          onClick={() => setl("out")}
          className={linkType === "out" ? "tab active" : "tab"}
        >
          Following
        </div>
      </div>
      {isLoading ? (
        <img className="agc big-spin" src={spinner} />
      ) : (
        <Inner ltype={linkType} fid={fid} data={data!} refetch={refetch} />
      )}
    </div>
  );
}
export default Follows;

function Followers({ fid, res }: { res: FollowRes; fid: number }) {
  async function init({ pageParam }: { pageParam: any }) {
    const res = userFollows(fid, pageParam, 0);
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
    queryKey: ["followers", fid],
    queryFn: init,
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage, _pages) => lastPage.cursor,
  });
  if (isLoading) return <ProfileList cursor={res.cursor} map={res.map} />;
  else
    return (
      <>
        {data!.pages.map((pag) => (
          <ProfileList key={pag.cursor} {...pag} />
        ))}
      </>
    );
}
function Following({ fid, res }: { res: FollowRes; fid: number }) {
  async function init({ pageParam }: { pageParam: any }) {
    const res = userFollows(fid, pageParam, 1);
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
    queryKey: ["following", fid],
    queryFn: init,
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage, _pages) => lastPage.cursor,
  });

  if (isLoading) return <ProfileList cursor={res.cursor} map={res.map} />;
  else
    return (
      <>
        {data!.pages.map((pag) => (
          <ProfileList key={pag.cursor} {...pag} />
        ))}
      </>
    );
}

function Inner({
  fid,
  data,
  ltype,
  refetch,
}: {
  fid: Fid;
  data: FollowsRes;
  refetch: Function;
  ltype: LinkType;
}) {
  return (
    <div>
      <div id="users">
        {ltype === "in" ? (
          <Followers fid={fid} res={data.followers} />
        ) : (
          <Following fid={fid} res={data.follows} />
        )}
      </div>
    </div>
  );
}

function ProfileList({
  cursor,
  map,
}: {
  cursor: number;
  map: Record<number, UserProfile>;
}) {
  return (
    <>
      {Object.values(map).map((up) => (
        <ProfileDiv up={up} />
      ))}
    </>
  );
}
function ProfileDiv({ up }: { up: UserProfile }) {
  const { navigate } = useHistory();
  function open() {
    navigate(`/u/${up.fid}`);
  }
  return (
    <div key={up.fid} className="prof">
      <div className="row cp g1" onClick={open}>
        <img src={up.pfp} className="pfp" />
        <div className="txt">
          <div className="displayname">{up.displayname}</div>
          <div className="username">@{up.username}</div>
          <div className="bio">{up.bio}</div>
          {up.url && <a href={up.url}>{up.url}</a>}
        </div>
      </div>
      <FollowButtons fid={up.fid} />
    </div>
  );
}

function FollowButtons({ fid }: { fid: Fid }) {
  const gs = useGlobalState();
  const { following, mutate } = gs;
  const amFollowing = following.includes(fid);
  async function unf() {
    const res = await sendUnfollow(fid);
    const nf = following.filter((f) => f !== fid);
    const ns = { ...gs, following: nf };
    mutate(ns);
  }
  async function fol() {
    const res = sendFollow(fid);
    const nf = [...following, fid];
    const ns = { ...gs, following: nf };
    mutate(ns);
  }
  return amFollowing ? (
    <button onClick={unf}>Unfollow</button>
  ) : (
    <button onClick={fol}>Follow</button>
  );
}
