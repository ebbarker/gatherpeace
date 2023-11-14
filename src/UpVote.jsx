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
    {FaRegHandPeace}
      {filled ?
        <button
        className="vote-container-button"
        disabled={!enabled}
        onClick={onClick}
        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? FaHandPeace : FaRegHandPeace }
        >
        <FaHandPeace />
        </button>
        :
        <button
        className="vote-container-button vote-filled"
        disabled={!enabled}
        onClick={onClick}
        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? FaHandPeace : FaRegHandPeace }
        >
        <FaRegHandPeace />
        </button>

      }
    </>
  );
}
