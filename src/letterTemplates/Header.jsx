import React from 'react';
import { Link } from "react-router-dom";
import { FiMoreVertical, FiTrash } from "react-icons/fi";
import { timeAgo } from "../layout/time-ago";
import { ProfilePicture } from "./ProfilePicture";

export function Header({
  id,
  letter,
  userContext,
  showDropdown,
  handleDropdownToggle,
  handleDelete,
  dropdownRef,
  postLabel,
  icon
}) {
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
            <button className="vert-dots" onClick={handleDropdownToggle}>
              <FiMoreVertical />
            </button>
            {showDropdown && userContext.session?.user?.id === letter.user_id && (
              <div className="special-options-menu">
                <button className="special-option" onClick={handleDelete}>
                  <FiTrash className="delete-icon" />Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="header-divider"></div>
    </div>
  );
}