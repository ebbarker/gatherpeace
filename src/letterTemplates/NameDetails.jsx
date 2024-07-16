import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { BiCommentDetail } from "react-icons/bi";
import { PiLinkBold } from "react-icons/pi";
import { FiMoreVertical, FiTrash  } from "react-icons/fi"; // Importing the icon for the vertical dots
import { UserContext } from "../layout/App";
import { castLetterVote } from "../AllPosts";
import { supaClient } from "../layout/supa-client";
import { timeAgo } from "../layout/time-ago";
import { UpVote } from "../UpVote";
import { VoteContext } from "../contexts/VoteContext";
import LinkPreview from "../link-preview/LinkPreview";
import { MessageContent } from "./MessageContent";
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

export function NameDetails({
  id,
  letter,
  onVoteSuccess = () => {},
  index,
  onSinglePageVoteSuccess = () => {},
  commenting,
  setCommenting,
  repliesCount,
  path,
  setShowReplies,
  showReplies,
  leftBorderLine,
  toggleModal,
  showModal,
  arrLength,
  replyIndex,
  deleteMessage = () => {}
}) {
  const userContext = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ogPreview, setOgPreview] = useState(null);
  const [noOgPreview, setNoOgPreview] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (letter?.content?.length && !noOgPreview) {
      getOgContent(letter.content);
    }
  }, [letter]);

  async function getOgContent(text) {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const arr = text.match(urlRegex);
    const url = arr?.length ? arr[0] : null;
    if (url) {
      const { data, error } = await supaClient.functions.invoke('hello', {
        body: JSON.stringify({ externalLink: url }),
      });
      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        console.log('Function returned an error', errorMessage);
      } else if (error instanceof FunctionsRelayError) {
        console.log('Relay error:', error.message);
      } else if (error instanceof FunctionsFetchError) {
        console.log('Fetch error:', error.message);
      } else {
        let ogPreviewObject;
        if (data?.url) {
          ogPreviewObject = {
            title: data.title,
            description: data.description,
            image: data.image_location,
          };
        } else {
          ogPreviewObject = {
            title: data?.twitter?.title ? data?.twitter?.title : data?.og?.title,
            image: data?.twitter?.image ? data?.twitter?.image : data?.og?.image,
            description: data?.twitter?.description ? data?.twitter?.description : data?.og?.description,
          };
        }
        setOgPreview(ogPreviewObject);
      }
    } else {
      setNoOgPreview(true);
    }
    return url;
  }

  async function onVoteClick() {
    if (!letter) {
      return;
    }
    let voteType = myContextVotes[letter?.id] === "up" ? "delete" : "up";
    await castLetterVote({
      letterId: letter?.id,
      userId: userContext.session?.user?.id,
      voteType: voteType,
      onSuccess: () => {
        onVoteSuccess(letter?.id, voteType);
        setMyContextVotes((myContextVotes) => {
          if (voteType === "delete") {
            delete myContextVotes[letter.id];
          }
          if (voteType === "up") {
            myContextVotes[letter.id] = "up";
          }
          console.log('context votes ' + JSON.stringify(myContextVotes));
          return myContextVotes;
        });
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);
      },
    });
  }

  function copyLink() {
    let host = window.location.host;
    navigator.clipboard.writeText(`${host}/peace-wall/letter/${letter?.id}`);
    setCopied(true);
  }

  function handleDropdownToggle() {
    console.log("Dropdown toggle clickeddddd"); // Add this log to verify the function is called
    console.log('userId:' + userContext.session?.user?.id);
    console.log('letterUserId:' + letter.user_id);

    setShowDropdown((prev) => !prev);
  }

  function handleDelete() {
    setShowDeleteModal(true);
    setShowDropdown(false);
  }

  function confirmDelete() {
    console.log('Delete post ' + id);
    deleteMessage(id);

    setShowDeleteModal(false);
    // Add your delete logic here
  }

  // Function to close the modal
  function closeModal() {
    setShowDeleteModal(false);
  }


  // Close the dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <>
      <div className="details-container">
        <div className="head flex justify-between" key={id}>
          <div className="head-left flex flex-col">
            <div className="letter-sender-details">
              <div className="name-peace">"{letter?.sign_off}"</div>
              <div className="sender-name">{`${letter?.sender_name}`}</div>
              <div className="sender-location-details">
                <div className="sender-city header-secondary">
                  {letter?.sender_city ? `${letter.sender_city}, ` : null}
                </div>
                <div className="sender-state header-secondary">
                  {letter?.sender_state ? `${letter.sender_state}, ` : null}
                </div>
                <div className="sender-country header-secondary">
                  {letter?.sender_country}
                </div>
              </div>
            </div>
          </div>
          <div className="head-right relative">
            <div className="date">
              {letter && `${timeAgo(letter?.created_at)} ago`}
            </div>
            <div className="vert-dots-container" ref={dropdownRef}>
              <button className="vert-dots" onClick={handleDropdownToggle}>
                <FiMoreVertical />
              </button>
              {showDropdown && userContext.session?.user?.id === letter.user_id && (
                <div className="special-options-menu">
                  <button className="special-option" onClick={handleDelete}><FiTrash className="delete-icon" />Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <MessageContent content={letter.content} />
        {ogPreview && <LinkPreview ogPreview={ogPreview} />}
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

        <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={closeModal}
          onConfirm={confirmDelete}
       />
      </div>
    </>
  );
}