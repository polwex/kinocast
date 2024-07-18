import { useEffect, useLayoutEffect, useRef } from "react";
import useGlobalState from "../logic/state/state";
import "../components/feed.css";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import spinner from "@/assets/icons/pacman.svg";
import { PostList } from "../components/Feed";
import { TimelineRes, fetchTimeline } from "../logic/fetch/kinode";

export default function Timeline() {
  console.log("tl");
  const { prof } = useGlobalState();
  async function init({ pageParam }: { pageParam: number }) {
    const res = await fetchTimeline(prof!.fid, pageParam);
    return res;
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
    queryKey: ["timeline"],
    queryFn: init,
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage, _pages) => lastPage.cursor,
  });
  console.log(data, "data");
  if (isLoading) return <img className="agc big-spin" src={spinner} />;
  else
    return (
      <Inner
        data={data!}
        refetch={refetch}
        fetchNext={fetchNextPage}
        loading={isFetchingNextPage}
      />
    );
}

function Inner({
  data,
  refetch,
  fetchNext,
  loading,
}: {
  data: InfiniteData<TimelineRes, any>;
  refetch: Function;
  fetchNext: Function;
  loading: boolean;
}) {
  console.log(data, "data");
  const cursorDiv = useRef<HTMLDivElement>(null);
  // infinite scroll
  function cursorVisible(entries: IntersectionObserverEntry[]) {
    for (let entry of entries) {
      if (entry.isIntersecting) fetchNext();
    }
  }

  useLayoutEffect(() => {
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 1.0,
    };
    const observer = new IntersectionObserver(cursorVisible, options);
    if (cursorDiv.current) observer.observe(cursorDiv.current);
    // if (downCursor.current) observer.observe(downCursor.current);
    return () => observer.disconnect();
  }, [data.pages]);

  // </infscr
  return (
    <>
      <div id="timeline-top">
        <h2>Timeline</h2>
      </div>
      <div id="feed" className="timeline">
        {data.pages.map((pag) => (
          <PostList key={pag.cursor} posts={pag.casts} />
        ))}
        {loading ? (
          <img className="ac" src={spinner} />
        ) : data.pages[data.pages.length - 1]?.cursor !== 0 ? (
          <div ref={cursorDiv} />
        ) : null}
      </div>
    </>
  );
}
