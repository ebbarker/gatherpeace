import React, { useState, useContext, useEffect } from 'react';
import { BiCommentDetail } from 'react-icons/bi';
import { PiLinkBold } from 'react-icons/pi';
import { UpVote } from "../UpVote";
import { UserContext } from "../layout/App";
import { VoteContext } from "../contexts/VoteContext";
import { FaHandPeace, FaRegHandPeace } from 'react-icons/fa6';
import { supaClient } from "../layout/supa-client";
import { ProfilePicture } from "../shared/ProfilePicture";
import { Link } from "react-router-dom";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import './PostControls.css';
import LoginPrompt from "../layout/LoginPrompt";


export function PostControls({
  letter,
  myVotes,
  onVoteClick,
  toggleModal,
}) {
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const userContext = useContext(UserContext);
  const { myContextVotes } = useContext(VoteContext);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch the list of users who liked the post
  useEffect(() => {
    if (showLikesModal) {
      fetchLikes();
    }
  }, [showLikesModal]);

  async function fetchLikes() {
    try {
      const { data, error } = await supaClient
        .rpc('get_letter_likes', { letter_uuid: letter.id });  // Call the PostgreSQL function

      if (error) {
        console.error('Error fetching likes:', error.message);
      } else {
        setLikesList(data);  // Set the fetched data into state
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  }

  function copyLink() {
    let host = window.location.host;
    navigator.clipboard.writeText(`${host}/peace-wall/letter/${letter?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  }

  return (
    <>
      <div className="outer-container">
        {/* Like Button and Count */}
        {letter?.likes > 0 &&
          <>
            <div className="like-info-container flex items-center" onClick={() => setShowLikesModal(true)}>
              <FaHandPeace />
              <span>{' ' + letter?.likes}</span>
            </div>
          </>
        }

        {/* Existing Post Controls */}
        <div className="post-controls-container flex items-center">
          <button
            className="post-votes-container post-control-button"
            onClick={userContext?.session ? onVoteClick : ()=>setShowLoginModal(true)}
          >
            <span>
              <UpVote
                direction="up"
                filled={myContextVotes[letter?.id]}

                isClicked={isClicked}
              />
              {' ' + letter?.likes}
            </span>
          </button>
          <button
            className="post-comments-count-container post-control-button"
            onClick={toggleModal}
          >
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
            {copied ? (
              <div className="copy-link-text">Copied!</div>
            ) : (
              <div className="copy-link-text">Copy Link</div>
            )}
          </button>
        </div>

        {/* Modal for showing who liked the post */}
        {showLikesModal && (
          <div className="post-likes-list" onClick={() => setShowLikesModal(false)}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
              {/* <span className="close-modal" onClick={() => setShowLikesModal(false)}>&times;</span> */}
              <button className="modal-back-button">
                  <IoArrowBackCircleSharp onClick={() => setShowLikesModal(false)}/>
              </button>
              <h3>People Who Liked This Post</h3>
              <div className="likes-list">
                {likesList.length > 0 ? (
                  <ul>
                    {likesList.map((user, index) => (
                      <li key={index} className="likes-list-item flex items-center">
                        <Link to={`/@${user?.username}`}>
                          <ProfilePicture avatar_url={user?.avatar_url} />
                        </Link>

                        <div className="like-user-info">
                          <strong>{user.full_name || user.username}</strong>
                          <div>{user.country || 'Somewhere On Earth'}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No one has liked this post yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showLoginModal && <LoginPrompt setShowLoginModal={setShowLoginModal} showLoginModal={showLoginModal}/>}
    </>
  );
}
