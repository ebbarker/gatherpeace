import { useMemo, useState } from "react";
import { FaHandPeace, FaRegHandPeace } from "react-icons/fa6";

export function UpVote({
    direction = "up",
    filled = false,
    enabled = true,
    onClick = () => {},
    isClicked
  }) {


  return (
    <>
    {/* {FaRegHandPeace} */}
    {/* {FaRegHandPeace} */}
      {filled ?
        <div
        className={`vote-container-button vote-filled ${isClicked ? 'vote-rotate' : 'vote-centered'}`}

        disabled={!enabled}


        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? FaHandPeace : FaRegHandPeace }
        >

          <i className="like-icon-container like-filled">
            <FaHandPeace />
          </i>
        </div>
        :
        <div
        className={`vote-container-button ${isClicked ? 'vote-rotate' : 'vote-centered'}`}

        disabled={!enabled}

        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? FaHandPeace : FaRegHandPeace }
        >
          <i className="like-icon-container like-unfilled">
            <FaRegHandPeace />
          </i>
        </div>

      }
    </>
  );
}
