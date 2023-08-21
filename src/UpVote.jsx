import { useMemo } from "react";
import { BsPeaceFill, BsPeace } from "react-icons/bs";

export function UpVote({
    direction = "up",
    filled = false,
    enabled = true,
    onClick = () => {},
  }) {
  const classes = useMemo(() => {
    const temp = [];
    if (direction === "down") {
      temp.push("origin-center rotate-180");
    }
    if (filled) {
      temp.push(direction === "up" ? "fill-green-400" : "fill-red-400");
      temp.push("glow");
    } else {
      temp.push("fill-white");
    }
    if (!enabled) {
      temp.push("opacity-50");
    }
    return temp.join(" ");
  }, [direction, filled, enabled]);
  return (
    <>
    {BsPeace}
      {filled ?
        <button
        disabled={!enabled}
        onClick={onClick}
        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? BsPeaceFill : BsPeace }
        >
        <BsPeaceFill />
        </button>
        :
        <button
        disabled={!enabled}
        onClick={onClick}
        data-e2e={`${direction}vote`}
        data-filled={filled}
        Icon={filled ? BsPeaceFill : BsPeace }
        >
        <BsPeace />
        </button>

      }
    </>
  );
}
