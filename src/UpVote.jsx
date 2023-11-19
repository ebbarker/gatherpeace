import { useMemo } from "react";
import { FaHandPeace, FaRegHandPeace } from "react-icons/fa6";

export function UpVote({
    direction = "up",
    filled = false,
    enabled = true,
    onClick = () => {},
  }) {
  // const classes = useMemo(() => {
  //   const temp = [];
  //   if (direction === "down") {
  //     temp.push("origin-center rotate-180");
  //   }
  //   if (filled) {
  //     temp.push(direction === "up" ? "fill-green-400" : "fill-red-400");
  //     temp.push("glow");
  //   } else {
  //     temp.push("fill-white");
  //   }
  //   if (!enabled) {
  //     temp.push("opacity-50");
  //   }
  //   return temp.join(" ");
  // }, [direction, filled, enabled]);
  return (
    <>
    {/* {FaRegHandPeace} */}
      {filled ?
        <div
        className="vote-container-button"
        disabled={!enabled}

        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? FaHandPeace : FaRegHandPeace }
        >

          <i className="like-icon-container">
            <FaHandPeace />
          </i>
        </div>
        :
        <div
        className="vote-container-button vote-filled"
        disabled={!enabled}
        
        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? FaHandPeace : FaRegHandPeace }
        >
          <i className="like-icon-container">
            <FaRegHandPeace />
          </i>
        </div>

      }
    </>
  );
}
