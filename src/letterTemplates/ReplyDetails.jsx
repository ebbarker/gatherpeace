import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { castPostVote } from "../AllPosts";
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { timeAgo } from "../layout/time-ago";
import { UpVote } from "../UpVote";
import { VoteContext } from "../contexts/VoteContext";
import { BiCommentDetail } from "react-icons/bi"
import { PiLinkBold } from "react-icons/pi";
import { FiMoreVertical, FiTrash  } from "react-icons/fi"; // Importing the icon for the vertical dots
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { UseScrollToHash } from "./UseScrollToHash";



export default function CommentDetails({

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
  parentIsTimeline,
  letterDetailData,
  setletterDetailData,
  hash
}) {
  const userContext = useContext(UserContext);
  const { session } = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const borderLineRef = useRef(null);
  const contentContainerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);

  // UseScrollToHash();

  // useEffect(() => {
  //   // Ensure both elements are present
  //   if (borderLineRef.current && contentContainerRef.current) {
  //     // Set the height of left-border-line based on post-content-container
  //     const contentHeight = contentContainerRef.current.offsetHeight;
  //     borderLineRef.current.style.height = `${contentHeight + 150}px`;
  //   }
  // }, [comment, arrLength]); // Dependency array: re-run effect if comment changes

  async function deleteCommentAndReplies(deleteCommentId) {
    // console.log('PATH TO COMMENT: ' + comment.path);
    // console.log('letter detail data: ' + JSON.stringify(letterDetailData));
    // console.log('lenght of comments' + letterDetailData.comments.length);
    // for (let i = 0; i < letterDetailData.comments.length; i++) {
    //   console.log(letterDetailData.comments[i]);
    // }
    try {
      const { data, error } = await supaClient.rpc('delete_comment_and_replies', { p_comment_id: deleteCommentId });

      if (error) {
        console.error('Error deleting comment and replies:', error.message);
        return;
      } else {
        let temp = { ...letterDetailData };

        if (comment.path.length > 70) {
          let parentId = comment.path.slice(-36).replace(/_/g, '-');
          let commentsList = temp.comments;
          temp.letter.score -= 2;
          temp.letter.count_comments -= 1;
          console.log('parent id: ' + parentId);

          for (let i = 0; i < commentsList.length; i++) {
            let current = commentsList[i];
            let currentId = commentsList[i].id;
            if (currentId === parentId) {
              current.score -= 2;
              current.count_comments -= 1;
              console.log('comment.id: ' + comment.id);
              let parentCommentsList = current.comments.filter(
                c => c.id.replace(/_/g, '-') !== comment.id.replace(/_/g, '-')
              );
              temp.comments[i] = {
                ...current,
                comments: parentCommentsList
              };
              console.log('parentCommentsList: ' + JSON.stringify(parentCommentsList));
              console.log('modified temp: ' + JSON.stringify(temp));
              break;
            }
          }
        } else {
          console.log ('comment: ' + JSON.stringify(comment));
          let commentIdToRemove = comment.id.replace(/_/g, '-');
          let children = 1 + comment.comments.length;
          temp.letter.score -= children * 2;
          temp.letter.count_comments -= children;
          temp.comments = temp.comments.filter(c => c.id.replace(/_/g, '-') !== commentIdToRemove);

          }
          setletterDetailData(temp);
        }



      console.log('Comment and replies deleted successfully:', data);
    } catch (error) {
      console.error('Unexpected error:', error);
    }

  }

  function handleDropdownToggle() {

    setShowDropdown((prev) => !prev);
  }

  function handleDelete() {
    setShowDeleteModal(true);
    setShowDropdown(false);
  }

  function confirmDelete() {

    deleteCommentAndReplies(comment.id);

    setShowDeleteModal(false);
    // Add your delete logic here
  }

  function closeModal() {
    setShowDeleteModal(false);
  }

  async function onVoteClick () {

      if (!comment) {
        return;
      }
      let voteType =
        myContextVotes[comment?.id] === "up" ? "delete" : "up";

      await castPostVote({
        postId: comment?.id,
        postPath: comment?.path,
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
      <div className="details-container" id={comment?.id}>
      <div className="head flex justify-between" >
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
          <div className="vert-dots-container" ref={dropdownRef}>
              <button className="vert-dots" onClick={handleDropdownToggle}>
                <FiMoreVertical />
              </button>
              {showDropdown && userContext.session?.user?.id === comment.user_id && (
                <div className="special-options-menu">
                  <button className="special-option" onClick={handleDelete}><FiTrash className="delete-icon" />Delete</button>
                </div>
              )}
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
              {' ' + comment?.likes}
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
      <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={closeModal}
          onConfirm={confirmDelete}
      />
    </>
  );
}
