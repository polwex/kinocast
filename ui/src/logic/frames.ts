import { Frame, FrameButton, OpenGraphTags } from "./types/farcaster";

type OGRes = { frame: Frame } | { og: OpenGraphTags } | { err: null }
export function extractOpenGraph(s: string, embedURL: string): OGRes {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(s, "text/html");
  const metaTags = parsed.getElementsByTagName("meta");
  const tags: HTMLMetaElement[] = Array.from(metaTags).map(meta => {
    const name = meta.name ? meta.name : meta.getAttribute("property") || "";
    meta.name = name;
    return meta
  }).sort((a, b) => a.name.length - b.name.length);
  

  const frame = findFrameTags(tags, embedURL);
  if (frame.image) return { frame }
  const og = findOgTags(tags, embedURL);
  if (og.title) return { og }
  else return { err: null };

}
export function findOgTags(tags: HTMLMetaElement[], embedURL: string): OpenGraphTags {
  const res: any = { url: embedURL, title: "", type: "", image: {url: ""}};
  for (let meta of tags) {
    const name = meta.name;
    if (name.startsWith("og:")) {
      const key= name.replace("og:", "");
      if (key === "image") res.image.url = meta.content;
      else if (key.startsWith("image:")){
        const subkey = key.replace("image:", "");
        res.image[subkey] = meta.content
      }
      else if (key === "video") res.video =  {url: meta.content};
      else if (key.startsWith("video:")){
        const subkey = key.replace("video:", "");
        const obj = res.video || {};
        obj[subkey] = meta.content
        res.video = obj;
      }
      else if (key === "audio") res.audio =  {url: meta.content};
      else if (key.startsWith("audio:")){
        const subkey = key.replace("audio:", "");
        const obj = res.audio|| {};
        obj[subkey] = meta.content
        res.audio = obj;
      }
      else if (key === "twitter:url") res.twatter =  {url: meta.content};
      else if (key.startsWith("twitter:")){
        const subkey = key.replace("twitter:", "");
        const obj = res.twatter|| {};
        obj[subkey] = meta.content
        res.twatter = obj;
      }
      else res[key] = meta.content;
    }
  }
  return res as unknown as OpenGraphTags
}
export function findFrameTags(metaTags: HTMLMetaElement[], embedURL: string): Frame {
  const frame: Frame = { embedURL, version: "", image: "", ogImage: "", buttons: [] };
  const buttons: Record<string, string> = {};
  for (let meta of metaTags) {
    const name = meta.name;
    if (name === "fc:frame") frame.version = meta.content;
    else if (name === "fc:frame:image") frame.image = meta.content
    else if (name === "og:image") frame.ogImage = meta.content
    else if (name === "fc:frame:input:text") frame.inputText = meta.content;
    else if (name === "fc:frame:post_url") frame.postURL = meta.content;
    else if (name === "fc:frame:state") frame.state = meta.content;
    else if (name === "fc:frame:image:aspect_ratio") frame.imageAspectRatio = meta.content;
    else if (name.includes("fc:frame:button"))
      buttons[name.replace("fc:frame:button:", "")] = meta.content;
    // frame[meta.name.replace("fc:frame:", "")] = meta.content;
  }
  const buttonsar: FrameButton[] = Object.entries(buttons).reduce((acc, [k, v]) => {
    const idx = parseInt(k[0]);
    if (!idx) return acc
    const el: FrameButton = acc[idx - 1] || { text: "" };
    if (k.includes("action")) el.action = v as any
    else if (k.includes("target")) el.target = v
    else if (k.includes("post_url")) el.postUrl = v
    else el.text = v
    acc[idx - 1] = el;
    return acc
  }, [] as FrameButton[]);
  frame.buttons = buttonsar;
  return frame as Frame
}
