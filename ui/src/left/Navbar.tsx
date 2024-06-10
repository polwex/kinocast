import { BASE_URL, versionNum } from "../logic/constants";
import home from "@/assets/icons/oldhome.svg";
import profile from "@/assets/icons/head.svg";
import dms from "@/assets/icons/chat.svg";
import notes from "@/assets/icons/bell.svg";
import logo from "@/assets/logo.jpg";
import gear from "@/assets/icons/settings.svg";
import { currentPeers, info } from "../logic/fetch/hub";
import useGlobalState, { useHistory } from "../logic/state/state";
import { logout } from "../logic/fetch/kinode";
import { UserProfile } from "../logic/types/farcaster";

export default function() {
  const { prof } = useGlobalState();
  const { navigate } = useHistory();
  function goto(s: string) {
    // const path = `/${BASE_URL}/${s}`;
    navigate(s);
  }
  console.log(location, "location");
  async function peers() {
    const res = await currentPeers();
    console.log(res);
  }
  async function dbInfo() {
    const res = await info(true);
    console.log(res);
  }
  return (
    <div id="left-menu">
      <div id="logo">
        <a onClick={() => navigate("/kc:kinocast:sortugdev.os")}>
          <img src={logo} />
        </a>
        <a onClick={() => navigate("/kc:kinocast:sortugdev.os")}>
          <h4>Kinocast <span>{versionNum}</span></h4>
        </a>
      </div>
      <div id="opts">
        <div className="opt" role="link" onClick={() => goto("/timeline")}>
          <img src={home} alt="" />
          <p>Timeline</p>
        </div>
        <div className="opt" role="link" onClick={() => goto("/profile")}>
          <img src={prof ? prof.pfp : profile} alt="" />
          <p>Profile</p>
        </div>
        <div className="opt disabled" role="link" onClick={() => goto("/notifications")}>
          <img src={notes} alt="" />
          <p>Notifications</p>
        </div>
        <div
          className="opt disabled"
          role="link"
        // onClick={() => navigate("chat")}
        >
          <img src={dms} alt="" />
          <p>DMs</p>
        </div>
        <div className="opt disabled" role="link" onClick={() => goto("/settings")}>
          <img src={gear} alt="" />
          <p>Settings</p>
        </div>
      </div>
    </div>
  );
}
