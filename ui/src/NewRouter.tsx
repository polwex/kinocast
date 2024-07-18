import * as React from "react";
import Init from "./modals/Login";
import { useEffect } from "react";
import useGlobalState, { useHistory } from "./logic/state/state";
import Timeline from "./center/Timeline";
import Home from "./center/Home";
import Feed, { FeedLoader } from "./components/Feed";
import { setTheme2, useTheme } from "./logic/theme";
import { Router, Route, RouteParams, ExtractRouteParams } from "./logic/router";
import spinner from "./assets/icons/pacman.svg";
import Modal from "./components/Modal";
import Navbar from "./left/Navbar";
import Thread, { ThreadLoader } from "./center/Thread";
import { BASE_URL } from "./logic/constants";

declare global {
  var window: Window & typeof globalThis;
  var our: { node: string; process: string };
}
function Muh() {
  const { init, prof, modal, sync, logout } = useGlobalState();
  const { history, navigate } = useHistory();

  const [loading, setLoading] = React.useState(true);
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    setTheme2();
  }, [theme]);
  async function start() {
    // await logout();
    await init();
    if (prof) sync();
    setLoading(false);
  }
  useEffect(() => {
    start();
  }, []);
  if (loading) return <img id="super-spinner" className="gc" src={spinner} />;
  if (!prof) return <Init />;
  // const rc: RouteChild = (params) => <Timeline />
  return (
    <div className="container-1">
      <div className="container-2">
        <Navbar />
        <main>
          <Router basePath={`${BASE_URL}`}>
            <Route path="/" component={Timeline} />
            <Route path="/profile" component={Home} />
            <Route path="/:fid">
              {(p: RouteParams) => {
                console.log(p, "params");
                if (!isNaN(+p.fid)) return <Feed fid={Number(p.fid)} />;
                else return <FeedLoader name={p.fid} />;
              }}
            </Route>
            <Route path="/:fid/:hash">
              {(p: RouteParams) => {
                if (!isNaN(+p.fid))
                  return <Thread fid={Number(p.fid)} hash={p.hash} />;
                else return <ThreadLoader name={p.fid} hash={p.hash} />;
              }}
            </Route>
          </Router>
        </main>
        {modal && <Modal {...modal.opts}>{modal.node}</Modal>}
      </div>
    </div>
  );
}

export default Muh;

// Define specific parameter types for each route
interface RouteDefinitions {
  "/user/:userId": { userId: number };
  "/product/:productId": { productId: number };
  "/search/:query": { query: string };
}

type RouteKey = keyof RouteDefinitions;
