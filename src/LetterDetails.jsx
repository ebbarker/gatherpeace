import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { castLetterVote } from "./AllPosts";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { VoteContext } from "./contexts/VoteContext";
import { BiCommentDetail } from "react-icons/bi"
import { PiLinkBold } from "react-icons/pi";



export default function LetterDetails({
  key,
  letter,
  myVotes,
  onVoteSuccess = () => {},
  index,
  onSinglePageVoteSuccess = () => {},
  commenting,
  setCommenting,
  repliesCount,
  setShowReplies,
  showReplies,
  leftBorderLine,
  toggleModal,
  showModal,
  arrLength,
  replyIndex,
  parentIsTimeline
}) {
  const userContext = useContext(UserContext);
  const { session } = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const borderLineRef = useRef(null);
  const contentContainerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  // useEffect(() => {
  //   // Ensure both elements are present
  //   if (borderLineRef.current && contentContainerRef.current) {
  //     // Set the height of left-border-line based on post-content-container
  //     const contentHeight = contentContainerRef.current.offsetHeight;
  //     borderLineRef.current.style.height = `${contentHeight + 150}px`;
  //   }
  // }, [letter, arrLength]); // Dependency array: re-run effect if letter changes
  async function onVoteClick () {
    console.log(letter);
      if (!letter) {
        return;
      }
      let voteType =
        myContextVotes[letter?.id] === "up" ? "delete" : "up";

      await castLetterVote({
        letterId: letter?.id,
        userId: userContext.session?.user?.id,
        voteType: voteType,
        onSuccess: () => {

          onVoteSuccess(letter?.id, voteType);
          // onSinglePageVoteSuccess();
          setMyContextVotes((myContextVotes) => {
            if (voteType === "delete") {
              delete myContextVotes[letter.id];
            }
            if (voteType === "up") {
              myContextVotes[letter.id] = "up";
            }
            return myContextVotes;
          });
          setIsClicked(true);
          setTimeout(() => setIsClicked(false), 300); // Reset after animation duration
        },
      });
  }

  function copyLink () {
    let host = window.location.host;
    navigator.clipboard.writeText(`${host}/peace-wall/letter/${letter?.id}`);
    setCopied(true);
  }
  return (
<>

  <div className="details-container">
    <div className="head flex justify-between" key={key}>

      <div className="head-left flex flex-col">

        <div className="recipient-description">To: {letter?.recipient}</div>
        <div className="recipient-country header-secondary">
          {letter?.recipient_country}
        </div>
        <div className="recipient-state header-secondary">{letter?.recipient_state}</div>
        <div className="recipient-city header-secondary">{letter?.recipient_city}</div>
      </div>
      <div className="head-right">
        <div className="date">
          {letter && `${timeAgo(letter?.created_at)} ago`}
        </div>
      </div>
    </div>

    <div className="flex-auto letter-content-container">
      <div ref={contentContainerRef} className="post-content-container">
        {letter?.content?.split("\n").map((paragraph, index) => (
          <p key={index} className="text-left">{paragraph}</p>
        ))}
      </div>
    </div>

    <div className="letter-sender-details">
      <div className="sender-signoff">{letter?.sign_off}</div>

      <div className="sender-name">{letter?.sender_name}</div>
      <div className="sender-description">{letter?.sender}</div>

      <div className="sender-country header-secondary">
        {letter?.sender_country}
      </div>
      <div className="sender-state header-secondary">{letter?.sender_state}</div>
      <div className="sender-city header-secondary">{letter?.sender_city} </div>
    </div>

    <div className="post-controls-container flex items-center">
      <button className="post-votes-container post-control-button" onClick={onVoteClick}>
        <span>
          <UpVote
            direction="up"
            filled={myContextVotes[letter?.id]}
            enabled={!!userContext.session}
            isClicked={isClicked}
          />
          {' ' + letter?.likes}
        </span>
      </button>
      <button className="post-comments-count-container post-control-button" onClick={toggleModal}>
        <i className="comment-icon-container">
          <BiCommentDetail />
        </i>
        <div className="count-root-comments">
          {' ' + letter?.count_comments}
        </div>
      </button>

      <button className="post-control-button copy-link-button" onClick={copyLink}>
        <i className="link-icon-container">
          <PiLinkBold />
        </i>
        {copied ? <div className="copy-link-text">Copied!</div> : <div className="copy-link-text">Copy Link</div>}
      </button>
    </div>
  </div>
</>
  );
}
