// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import spinner from "@/assets/icons/pacman.svg";
// import { useEffect, useRef, useState } from "react";
// import { castById } from "../logic/fetch/hub";

// function PostData(props: {
//   // host: Ship;
//   // id: ID;
//   // rter?: Ship;
//   // rtat?: number;
//   // rtid?: ID;
//   // nest?: number; // nested quotes
//   fid: number;
//   hash: string;
//   className?: string;
// }) {
//   const { fid, hash } = props;

//   return function(Component: React.ElementType) {
//     // const [showNested, setShowNested] = useState(nest <= 3);
//     async function fetchCast() {
//       const res = await castById(fid, hash);

//     }
//     const { isLoading, isError, data, refetch } = useQuery({
//       queryKey: ["post", fid, hash],
//       queryFn: fetchCast,
//     });
//     const queryClient = useQueryClient();
//     const dataRef = useRef(data);
//     useEffect(() => {
//       dataRef.current = data;
//     }, [data]);

//     return data ? (
//       dead ? (
//         <div className={props.className}>
//           <div className="no-response x-center not-found">
//             <p>{host} did not respond</p>
//             <button className="x-center" onMouseUp={retryPeek}>
//               Try again
//             </button>
//           </div>
//         </div>
//       ) : denied ? (
//         <div className={props.className}>
//           <p className="x-center not-found">
//             {host} denied you access to this post
//           </p>
//         </div>
//       ) : "no-node" in data || "bucun" in data ? (
//         <div className={props.className}>
//           <p className="x-center not-found">Post not found</p>
//         </div>
//       ) : "bugen" in data ? (
//         <div className={props.className}>
//           <div className="x-center not-found">
//             <p className="x-center">Post not found, requesting...</p>
//             <img src={spinner} className="x-center s-100" alt="" />
//           </div>
//         </div>
//       ) : "fpost" in data && data.fpost.contents === null ? (
//         <div className={props.className}>
//           <p className="x-center not-found">Post deleted</p>
//         </div>
//       ) : (
//         <Component
//           data={data.fpost}
//           refetch={refetch}
//           {...props}
//           nest={enest}
//         />
//       )
//     ) : // no data
//       isLoading || isError ? (
//         <div className={props.className}>
//           <img className="x-center post-spinner" src={spinner} alt="" />
//         </div>
//       ) : (
//         <div className={props.className}>
//           <p>...</p>
//         </div>
//       );
//   };
// }
// export default PostData;
