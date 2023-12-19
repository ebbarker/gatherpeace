import { useEffect, useRef, useState } from "react";

export interface DialogProps {
  allowClose?: boolean;
  contents: React.ReactNode;
  open: boolean;
  dialogStateChange?: (open: boolean) => void;
}

export default function Dialog({
  allowClose = true,
  contents,
  open,
  dialogStateChange = () => {},
}: DialogProps) {
  const [showModal, setShowModal] = useState(open);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open !== showModal) {
      setShowModal(open);
    }
  }, [open]);

  function updateDialogState(open: boolean) {
    setShowModal(open);
    dialogStateChange(open);
  }

  return showModal ? (
    <>
      <div className="opacity-75 fixed inset-0 z-40 bg-black"></div>
      <div
        onClick={({ target }) => {
          if (!allowClose || dialog.current?.contains(target as any)) {
            return;
          }
          updateDialogState(false);
        }}
        onKeyDown={({ key }) => {
          if (!allowClose || key !== "Escape") {
            return;
          }
          updateDialogState(false);
        }}
        className="login-blackout"
      >
        <div className="login-container">
          <div className="login-grouper">
            <div className="UNKNOWN absolute -inset-0.5 bg-gradient-to-r from-green-200 to-green-600 rounded-lg blur-lg opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-2000"></div>
            <div
              ref={dialog}
              className="login-details-container"
            >
              {contents}
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
}
