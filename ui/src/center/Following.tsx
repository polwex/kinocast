import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import spinner from "../assets/icons/roundspin.svg";
import left from "../assets/icons/left.svg";
import { useState } from "react";
import { Fid, UserProfile } from "../logic/types/farcaster";
import useGlobalState, { useHistory } from "../logic/state/state";
import {
  FollowRes,
  LinksRes,
  fetchUserLinks,
  sendFollow,
  sendUnfollow,
} from "../logic/fetch/kinode";

export type LinkType = "in" | "out";
function Follows({ fid, type }: { fid: number; type: LinkType }) {
  const [linkType, setl] = useState<LinkType>(type);

  async function init() {
    const res = await fetchUserLinks(fid);
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

function Inner({
  fid,
  data,
  ltype,
  refetch,
}: {
  fid: Fid;
  data: LinksRes;
  refetch: Function;
  ltype: LinkType;
}) {
  return (
    <div>
      <div id="users">
        {ltype === "in" ? (
          <ProfileList fid={fid} map={data.followers} />
        ) : (
          <ProfileList fid={fid} map={data.following} />
        )}
      </div>
    </div>
  );
}

function ProfileList({
  fid,
  map,
}: {
  fid: Fid;
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
