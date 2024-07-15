import { useContext, useEffect, useMemo, useRef, useState } from "react";
// import { Link, useLoaderData, useParams } from "react-router-dom";
import { castLetterVote } from "../AllPosts";
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { timeAgo } from "../layout/time-ago";
import { UpVote } from "../UpVote";
import { VoteContext } from "../contexts/VoteContext";
import { BiCommentDetail } from "react-icons/bi"
import { FiMoreVertical, FiTrash  } from "react-icons/fi"; // Importing the icon for the vertical dots
import { PiLinkBold } from "react-icons/pi";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import  LinkPreview  from "../link-preview/LinkPreview";
import { MessageContent } from "./MessageContent";
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";



export default function LetterDetails({
  id,
  letter,
  myVotes,
  onVoteSuccess = () => {},
  index,
  onSinglePageVoteSuccess = () => {},
  commenting,
  path,
  setCommenting,
  repliesCount,
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
  // const { session } = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const borderLineRef = useRef(null);
  const contentContainerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ogPreview, setOgPreview] = useState(null);
  const [noOgPreview, setNoOgPreview] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);



  useEffect(() => {
    if (letter?.content?.length && !noOgPreview) {
      getOgContent(letter.content);
    }
  }, [letter]);

  // Function to find URLs in a text
 async function getOgContent(text) {

    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const arr = text.match(urlRegex);
    const url = arr?.length ? arr[0] : null;
    console.log ('url', url);
    if (url) {

        const { data, error } = await supaClient.functions.invoke('hello', {
          body: JSON.stringify({ externalLink: url }),
        })
        if (error instanceof FunctionsHttpError) {
          const errorMessage = await error.context.json()
          console.log('Function returned an error', errorMessage)
        } else if (error instanceof FunctionsRelayError) {
          console.log('Relay error:', error.message)
        } else if (error instanceof FunctionsFetchError) {
          console.log('Fetch error:', error.message)
        } else {
          console.log('data returned', data);

          let ogPreviewObject;

          if (data?.url) {
            ogPreviewObject = {
              title: data.title,
              description: data.description,
              image: data.image_location,
            }
          } else {
            ogPreviewObject = {
            title: data?.twitter?.title ? data?.twitter?.title : data?.og?.title,
            image: data?.twitter?.image ? data?.twitter?.image : data?.og?.image,
            description: data?.twitter?.description ? data?.twitter?.description : data?.og?.description
            }
           }
          setOgPreview(ogPreviewObject);
        }

    } else {
      setNoOgPreview(true);
    }

  return url;

  }

  // useEffect(() => {

  //   async function getOg() {




  //     // const { data, error } = await supaClient.functions.invoke('hello', {
  //     //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ foo: 'bar' }),
  //     // })



  //     // try {
  //     //   const response = await supaClient.functions.invoke('hello', {
  //     //     method: 'POST',
  //     //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //     //     body: JSON.stringify({ name: 'Functions' }),
  //     //   });


  //     //   console.log("Raw response:", JSON.stringify(data));

  //     //   if (response.error) {
  //     //     setOgpreview('OG ERROR: ' + response.error.message);
  //     //   } else {
  //     //     console.log('OG DATA:', response.data);
  //     //     setOgpreview(response.data);
  //     //   }
  //     // } catch (error) {
  //     //   console.error('Error fetching data:', error);
  //     //   // Handle additional error scenarios
  //     // }

  //       // const response = await supaClient.functions.invoke('hello', {
  //       //   method: 'POST',
  //       //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //       //   data: JSON.stringify({ name: 'Functions' }),
  //       // });
  //       // console.log('resp ', JSON.stringify(response));
  //   }

  //   getOg();
  // }, []);




  // useEffect(() => {
  //   // Ensure both elements are present
  //   if (borderLineRef.current && contentContainerRef.current) {
  //     // Set the height of left-border-line based on post-content-container
  //     const contentHeight = contentContainerRef.current.offsetHeight;
  //     borderLineRef.current.style.height = `${contentHeight + 150}px`;
  //   }
  // }, [letter, arrLength]); // Dependency array: re-run effect if letter changes
  async function onVoteClick () {

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

  function handleDropdownToggle() {
    console.log("Dropdown toggle clicked"); // Add this log to verify the function is called
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

    <MessageContent content={letter.content}/>


    <div className="letter-sender-details">
      <div className="sender-signoff">{letter?.sign_off}</div>

      <div className="sender-name">{`-${letter?.sender_name}`}</div>
      <div className="sender-location-details">
        <div className="sender-city header-secondary">{letter?.sender_city ? `${letter.sender_city}, ` : null} </div>
        <div className="sender-state header-secondary">{letter?.sender_state ? `${letter.sender_state}, ` : null}</div>
        <div className="sender-country header-secondary">
          {letter?.sender_country}
        </div>
      </div>

    </div>
    {ogPreview && <LinkPreview ogPreview={ogPreview} /> }

    {/* <LinkPreview url={"https://www.tiktok.com/@tinoandshelby/video/7315176576579308846"}/> */}

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


