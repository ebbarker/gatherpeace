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
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import  LinkPreview  from "./link-preview/LinkPreview";




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
  const [ogPreview, setOgPreview] = useState(null);



  useEffect(() => {
    getOgContent(letter.content);
  }, [letter.content]);

  // Function to find URLs in a text
 async function getOgContent(text) {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const url = text.match(urlRegex)[0];
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
          let ogPreviewObject = {
            title: data.metaTags?.twitter?.title ? data.metaTags?.twitter?.title : data.metaTags?.og?.title,
            image: data.metaTags?.twitter?.image ? data.metaTags?.twitter?.image : data.metaTags?.og?.image,
            description: data.metaTags?.twitter?.description ? data.metaTags?.twitter?.description : data.metaTags?.og?.description
           }
          setOgPreview(ogPreviewObject);
        }

    }

  return url;

  }

  useEffect(() => {

    async function getOg() {




      // const { data, error } = await supaClient.functions.invoke('hello', {
      //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ foo: 'bar' }),
      // })



      // try {
      //   const response = await supaClient.functions.invoke('hello', {
      //     method: 'POST',
      //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ name: 'Functions' }),
      //   });


      //   console.log("Raw response:", JSON.stringify(data));

      //   if (response.error) {
      //     setOgpreview('OG ERROR: ' + response.error.message);
      //   } else {
      //     console.log('OG DATA:', response.data);
      //     setOgpreview(response.data);
      //   }
      // } catch (error) {
      //   console.error('Error fetching data:', error);
      //   // Handle additional error scenarios
      // }

        // const response = await supaClient.functions.invoke('hello', {
        //   method: 'POST',
        //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        //   data: JSON.stringify({ name: 'Functions' }),
        // });
        // console.log('resp ', JSON.stringify(response));
    }

    getOg();
  }, []);




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
  </div>
</>
  );
}


