import { Children, ReactNode, useEffect, useRef, useState } from "react";
import useGlobalState from "../logic/state/state";

export type ModalProps = {
  children: ReactNode;
  closable?: boolean;
  width?: string;
  height?: string;
};
function Modal({
  children,
  closable = true,
  height = "fit-content",
  width = "80%",
}: ModalProps) {
  const { setModal, unsetModal } = useGlobalState();

  function onKey(event: any) {
    if (closable && event.key === "Escape") unsetModal();
  }
  useEffect(() => {
    document.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("keyup", onKey);
    };
  }, [children]);

  function clickAway(e: React.MouseEvent) {
    e.stopPropagation();
    if (closable)
      if (!modalRef.current || !modalRef.current.contains(e.target as any))
        unsetModal();
  }
  const modalRef = useRef<HTMLDivElement>(null);
  const style = { width, height };
  return (
    <div id="modal-bg" onClick={clickAway}>
      <div id="modal-fg" style={style} ref={modalRef}>
        {children}
      </div>
    </div>
  );
}
export default Modal;

export function Tooltip({ children, text, className }: any) {
  const [show, toggle] = useState(false);
  return (
    <div
      className={"tooltip-wrapper " + (className || "")}
      onMouseOver={() => toggle(true)}
      onMouseOut={() => toggle(false)}
    >
      {children}
      {show && <div className="tooltip">{text}</div>}
    </div>
  );
}
