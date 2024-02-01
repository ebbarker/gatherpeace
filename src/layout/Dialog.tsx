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
        className="modal-background login-blackout"
      >
        <div className="login-container">
          <div className="login-grouper">

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
