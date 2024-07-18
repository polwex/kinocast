import { ReactElement, ReactNode, createElement, useEffect } from "react";
import { useHistory } from "./state/state";
interface Routes {
  [path: string]: React.ComponentType;
}

interface RouterProps {
  children: ReactElement<RouteProps>[];
  basePath: string;
}

export interface RouteParams {
  [key: string]: string;
}

function matchPath(pathname: string, route: string): RouteParams | null {
  console.log([pathname, route], "matching");
  const keys: string[] = [];
  const pattern = route.replace(/:([^\/]+)/g, (_, key) => {
    keys.push(key);
    return "([^/]+)";
  });
  const regex = new RegExp(`^${pattern}$`);
  const match = pathname.match(regex);

  if (!match) return null;

  const params = match.slice(1).reduce<RouteParams>((acc, value, i) => {
    acc[keys[i]] = value;
    return acc;
  }, {});

  return params;
}

export function Router({ children, basePath = "/" }: RouterProps) {
  const routes = children;
  const { history, navigate } = useHistory();
  const currentPath = history[0].replace(basePath, "") || "/";

  console.log(currentPath, "cp");
  useEffect(() => {
    console.log("useeffect");
    const handlePopState = (...a: any) => {
      console.log(a, "handlepopstate");
      const location = window.location.pathname;
      console.log(location, "loc");
      navigate(location);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // let MatchedComponent: React.ComponentType | null = null;
  let MatchedComponent: any;
  let params: RouteParams = {};
  for (const route of routes) {
    console.log(basePath, currentPath);
    const match = matchPath(currentPath, route.props.path);
    console.log(match, "match");
    console.log("!!")
    if (match) {
      MatchedComponent = route.props.component || route.props.children;
      params = match;
      break;
    }
  }
  console.log(MatchedComponent, "matched component")
  return MatchedComponent ? <MatchedComponent {...params} /> : <NotFound />;
}

type RouteProps = {
  path: string;
  component?: React.ComponentType<any>;
  children?: RouteChild;
};
type Route = (r: RouteProps) => JSX.Element;
type RouteChild = (r: RouteParams) => JSX.Element;

export function Route({ path, component, children }: RouteProps) {
  const { history, navigate } = useHistory();
  const currentPath = history[0];
  const params = matchPath(currentPath, path);
  console.log([path, params], "route params");
  if (children) return children(params || {});
  else return createElement(component!, params);
}

function NotFound() {
  return (
    <div>
      <h3 className="gc">404</h3>
    </div>
  );
}

// advanced shit
export type ExtractRouteParams<T extends string> = string extends T
  ? Record<string, string>
  : T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : T extends `${infer Start}:${infer Param}`
      ? { [K in Param]: string }
      : {};
