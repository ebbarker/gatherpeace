import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { FiMoreVertical, FiTrash } from "react-icons/fi";
import { timeAgo } from "../layout/time-ago";
import { ProfilePicture } from "../shared/ProfilePicture";
import { FiAlertCircle } from "react-icons/fi";
import LoginPrompt from "../layout/LoginPrompt";

export function Header({
  id,
  letter,
  userContext,
  showDropdown,
  handleDropdownToggle,
  handleDelete,
  handleReport,
  dropdownRef,
  postLabel,
  icon
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  return (
    <div className="letter-header" key={id}>
      <div className="head flex justify-between">
        <div className="head-left flex items-center">
          <Link to={`/@${letter?.username}`}>
            <ProfilePicture avatar_url={letter?.avatar_url} />
          </Link>
          <div className="username-container">
            <Link to={`/@${letter?.username}`}>
              <div className="header-username">@{letter?.username}</div>
            </Link>
            <div className="post-type">{postLabel}{' '}<div className="post-type-icon">{icon}</div></div>
          </div>
        </div>
        <div className="head-right flex items-center relative">
          <div className="date">
            {letter && `${timeAgo(letter?.created_at)} ago`}
          </div>
          <div className="vert-dots-container" ref={dropdownRef}>
            <button className="vert-dots" onClick={userContext.session ? handleDropdownToggle : () => setShowLoginModal(true)}>
              <FiMoreVertical />
            </button>
            {showDropdown &&  (
              <div className="special-options-menu">
                {userContext.session?.user?.id !== letter.user_id &&
                <button className="special-option" onClick={handleReport}>
                  <FiAlertCircle className="special-icon" />Report
                </button>}
                {userContext.session?.user?.id === letter.user_id &&
                <button className="special-option" onClick={handleDelete}>
                  <FiTrash className="special-icon" />Delete
                </button>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="header-divider"></div>
      {showLoginModal && <LoginPrompt setShowLoginModal={setShowLoginModal} showLoginModal={showLoginModal}/>}
    </div>
  );
}