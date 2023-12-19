import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { castPostVote } from "./AllPosts";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { VoteContext } from "./contexts/VoteContext";
import { BiCommentDetail } from "react-icons/bi"
import { PiLinkBold } from "react-icons/pi";



export default function CommentDetails({
  key,
  comment,
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
  // }, [comment, arrLength]); // Dependency array: re-run effect if comment changes
  async function onVoteClick () {

      if (!comment) {
        return;
      }
      let voteType =
        myContextVotes[comment?.id] === "up" ? "delete" : "up";

      await castPostVote({
        postId: comment?.id,
        userId: userContext.session?.user?.id,
        voteType: voteType,
        onSuccess: () => {
          onVoteSuccess(comment?.id, voteType);
          // onSinglePageVoteSuccess();
          setMyContextVotes((myContextVotes) => {
            if (voteType === "delete") {
              delete myContextVotes[comment.id];
            }
            if (voteType === "up") {
              myContextVotes[comment.id] = "up";
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
    navigator.clipboard.writeText(`${host}/peace-wall/post/${comment?.id}`);
    setCopied(true);
  }

  return (
    <>
      <div className="details-container">
      <div className="head flex justify-between" key={key}>
        <div className="head-left flex flex-col">
          <div className="flex items-center">
            <div className="image"></div>
            <div className="name">
              <div className="username">
                {`@${comment?.username}`}
              </div>
            </div>
          </div>
        </div>
        <div className="head-right">
          <div className="date">
            {comment && `${timeAgo(comment?.created_at)} ago`}
          </div>
        </div>
      </div>
          {/* {
            replyIndex < arrLength - 1  && <div ref={borderLineRef} className="left-border-line"></div>
          }
          {
            comment?.path?.length > 45 ?
            <div className="left-curve"></div>
            :
            null
          } */}
      {!comment?.path ?
        <Link to={`/peace-wall/post/${comment?.id}`} className="flex-auto">
                  <div ref={contentContainerRef} className="post-content-container">
                    {comment?.content?.split("\n").map((paragraph) => (
                      <p className="text-left">{paragraph}</p>
                    ))}
                  </div>
        </Link>
      :
        <div className="flex-auto">
          <div ref={contentContainerRef} className="post-content-container">
          {comment?.content?.split("\n").map((paragraph) => (
            <p className="text-left">{paragraph}</p>
          ))}
          </div>
        </div>
      }

      <div className="post-controls-container flex items-center">
        <button className="post-votes-container post-control-button" onClick={onVoteClick}>
          <div>
            <span>

              <UpVote
                direction="up"
                filled={myContextVotes[comment?.id] === "up"}
                enabled={!!userContext.session}
                isClicked={isClicked}

              />
              {' ' + comment?.score}
            </span>
          </div>
        </button>
        <button className="post-comments-count-container post-control-button" onClick={toggleModal}>
          { //if !comment?.path then this is in a timeline because those posts don't have paths.
            //if it has a path of root then it is the main post and should not be clickable.
            //if it has a path !== root then it is a reply.


                <>

                      {commenting ?
                        <div className="reply-count-container" onClick={() => {setCommenting(!commenting)}} disabled={!session}>
                          Cancel
                        </div>
                        :
                        <div className="reply-count-container" onClick={() => {setCommenting(!commenting)}} disabled={!session}>
                          <i className="comment-icon-container">
                            <BiCommentDetail />
                          </i>
                          {commenting ? " Cancel" : " Reply" }
                        </div>
                      }
                </>
          }
        </button>

      </div>
      </div>
    </>
  );
}
