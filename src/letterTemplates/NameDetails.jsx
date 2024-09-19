import { useContext, useState, useEffect, useRef } from "react";
import { GiFeather } from "react-icons/gi";
import { UserContext } from "../layout/App";
import { castLetterVote } from "../AllPosts";
import { VoteContext } from "../contexts/VoteContext";
import { MessageContent } from "./MessageContent";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmReportModal } from "./ConfirmReportModal";
import { Header } from "./Header";
import { PostControls } from "./PostControls";
import  LinkPreview from "../link-preview/LinkPreview";

export function NameDetails({
  id,
  letter,
  onVoteSuccess = () => {},
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
  deleteMessage = () => {},
}) {
  const userContext = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const [copied, setCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const dropdownRef = useRef(null);

  async function onVoteClick() {
    if (!letter) return;
    const voteType = myContextVotes[letter?.id] === "up" ? "delete" : "up";

    await castLetterVote({
      letterId: letter?.id,
      userId: userContext.session?.user?.id,
      voteType,
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
        setTimeout(() => setIsClicked(false), 300);
      },
    });
  }

  function copyLink() {
    const host = window.location.host;
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

  function handleReport() {
    setShowReportModal(true);
    setShowDropdown(false);
  }

  function confirmDelete() {
    deleteMessage(id, "name");
    setShowDeleteModal(false);
  }

  async function confirmReport(selectedReason, additionalInfo) {
    const reportData = {
      letterId: letter.id,
      userId: userContext.session?.user?.id,
      reason: selectedReason,
      additionalInfo,
    };

    const { data, error } = await supaClient
      .from("letter_reports")
      .insert([{ reported_letter_id: letter.id, reported_by_user_id: userContext.session?.user?.id, report_reason: selectedReason, additional_info }]);

    if (error) {
      console.error("Error submitting report:", error.message);
      alert("There was an issue submitting your report. Please try again.");
    } else {
      setMyContextVotes((myContextVotes) => {
        myContextVotes[reportData.letterId] = "down";
        return myContextVotes;
      });
    }

    setShowReportModal(false);
  }

  function closeModal() {
    setShowDeleteModal(false);
  }

  function closeReportModal() {
    setShowReportModal(false);
  }

  // Close the dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
          handleReport={handleReport}
          dropdownRef={dropdownRef}
          postLabel={"Signature"}
          icon={<GiFeather />}
        />
        <div className="letter-sender-details">
          <div className="name-peace">"{letter?.sign_off}"</div>
          <div className="sender-name">{`${letter?.sender_name}`}</div>
          <div className="sender-location-details">
            <div className="sender-city header-secondary">{letter?.sender_city ? `${letter.sender_city}, ` : null}</div>
            <div className="sender-state header-secondary">{letter?.sender_state ? `${letter.sender_state}, ` : null}</div>
            <div className="sender-country header-secondary">{letter?.sender_country}</div>
          </div>
        </div>
        <MessageContent content={letter.content} />

        <LinkPreview text={letter.content} />

        <PostControls letter={letter} onVoteClick={onVoteClick} toggleModal={toggleModal} />

        <ConfirmDeleteModal show={showDeleteModal} onClose={closeModal} onConfirm={confirmDelete} />
        <ConfirmReportModal show={showReportModal} onClose={closeReportModal} onConfirm={confirmReport} />
      </div>
    </>
  );
}
