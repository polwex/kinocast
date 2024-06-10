import Feed from "../components/Feed";
import useGlobalState from "../logic/state/state";

export default function () {
  const { prof } = useGlobalState();
  return <Feed fid={prof!.fid} />;
  // return <Feed fid={14537} />;
  // return <Feed fid={576} />;
  // return <Feed fid={5650} />;
}
// ("0x24ed6abdf653b5933cbb48a6441c433e10a3db50");
// 0x24ed6abd;
