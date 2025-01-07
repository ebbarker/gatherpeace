import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { UpVote } from "../UpVote";
import { VoteContext } from "../contexts/VoteContext";
import { BiCommentDetail } from "react-icons/bi"
import { FiMoreVertical, FiTrash } from "react-icons/fi";
import { BsEnvelopeHeart } from "react-icons/bs";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmReportModal } from "./ConfirmReportModal";
import { Header } from "./Header";
import { MessageContent } from "./MessageContent";
import { PostControls } from "./PostControls";
import  LinkPreview from "../link-preview/LinkPreview";
import { castLetterVote } from "../AllPosts";

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
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const borderLineRef = useRef(null);
  const contentContainerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const dropdownRef = useRef(null);

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
          return myContextVotes;
        });
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300); // Reset after animation duration
      },
    });
  }

  function copyLink() {
    let host = window.location.host;
    navigator.clipboard.writeText(`${host}/peace-wall/letter/${letter?.id}`);
    setCopied(true);
  }

  function handleDropdownToggle() {
    setShowDropdown((prev) => !prev);
  }

  function handleDelete() {
    setShowDeleteModal(true);
    setShowDropdown(false);
  }

  function confirmDelete() {
    deleteMessage(id);
    setShowDeleteModal(false);
  }

  async function confirmReport(selectedReason, additionalInfo) {
    const reportData = {
      letterId: letter.id,
      userId: userContext.session?.user?.id,
      reason: selectedReason,
      additionalInfo: additionalInfo,
    };

    const { data, error } = await reportLetter(reportData);

    if (error) {
      console.error('Error submitting report:', error.message);
      alert('There was an issue submitting your report. Please try again.');
    } else if (data) {
      setMyContextVotes((myContextVotes) => {
        myContextVotes[reportData.letterId] = "down";
        return myContextVotes;
      });
    }

    setShowReportModal(false);
  }

  async function reportLetter({ letterId, userId, reason, additionalInfo }) {
    const { data, error } = await supaClient
      .from('letter_reports')
      .insert([
        {
          reported_letter_id: letterId,
          reported_by_user_id: userId,
          report_reason: reason,
          additional_info: additionalInfo,
        },
      ]);

    if (error) {
      console.error('Error submitting report:', error.message);
      return null;
    }

    return data;
  }

  function closeModal() {
    setShowDeleteModal(false);
  }

  function closeReportModal() {
    setShowReportModal(false);
  }

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
      <div className="details-container" key={id}>
        <Header
          id={id}
          letter={letter}
          userContext={userContext}
          showDropdown={showDropdown}
          handleDropdownToggle={handleDropdownToggle}
          handleDelete={handleDelete}
          dropdownRef={dropdownRef}
          postLabel={'Peace Letter'}
          icon={<BsEnvelopeHeart />}
        />
        <div className="letter-second-header">
          <div className="recipient-description">To: {letter?.recipient}</div>
          <div className="recipient-country header-secondary">
            {letter?.recipient_country}
          </div>
          <div className="recipient-state header-secondary">{letter?.recipient_state}</div>
          <div className="recipient-city header-secondary">{letter?.recipient_city}</div>
        </div>

        <MessageContent content={letter.content} />


        <div className="letter-sender-details">
          <div className="sender-signoff">{letter?.sign_off}</div>
          <div className="sender-name">{`-${letter?.sender_name}`}</div>
          <div className="sender-location-details">
            <div className="sender-address header-secondary">
              {[
                letter?.sender_city,
                letter?.sender_state,
                letter?.sender_country,
              ]
                .filter(Boolean) // Removes null/undefined values
                .join(", ")}
            </div>
          </div>
        </div>
        <LinkPreview text={letter.content} />

        <PostControls
          letter={letter}
          onVoteClick={onVoteClick}
          toggleModal={toggleModal}
        />

        <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={closeModal}
          onConfirm={confirmDelete}
        />

        <ConfirmReportModal
          show={showReportModal}
          onClose={closeReportModal}
          onConfirm={confirmReport}
        />
      </div>
    </>
  );
}
