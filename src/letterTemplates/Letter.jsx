import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "../layout/App";

import { supaClient } from "../layout/supa-client";
import { timeAgo } from "../layout/time-ago";
import { UpVote } from "../UpVote";
import { LetterView } from "./LetterView"
import LetterDetails from "./LetterDetails"
import LetterToFromDetails from "./LetterToFromDetails";
import { castLetterVote } from "../AllPosts";
// import ReactModal from 'react-modal';
// import ReactDOM from 'react-dom';
// import Modal from 'react-bootstrap/Modal'
import { Modal } from "react-bootstrap"
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { NameDetails } from "./NameDetails";


export function Letter({
  index,
  letterData,
  myVotes,
  onVoteSuccess,
  letters,
  deleteLetter,
  path

}) {
  const { session } = useContext(UserContext);
  //const [isModalOpen, setModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if(showModal) {
    document.body.classList.add('active-modal')
  } else {
    document.body.classList.remove('active-modal')
  }

  function toggleModal () {
    setShowModal(!showModal);
    console.log('modal toggled');
  };

  function openModal() {
    setShowModal(true);
  }

  function deleteModalLetter(id) {
    console.log('delete modal post: ' + id);
    deleteLetter(id);
    toggleModal();
  }

  return (
    <>
      <div className="flex-none grid grid-cols-1 place-content-center letter-container text-white">
        {letterData?.post_type === 'letter' &&
        <LetterDetails
         id={letterData?.id}
          letter={letterData}
          myVotes={myVotes}
          onVoteSuccess={onVoteSuccess}
          index={index}
          toggleModal={toggleModal}
          showModal={showModal}
          deleteMessage={deleteLetter}
          path={path}
        />
        }
        {letterData?.post_type === 'name' &&
          <NameDetails
          id={letterData?.id}
            letter={letterData}
            myVotes={myVotes}
            onVoteSuccess={onVoteSuccess}
            index={index}
            toggleModal={toggleModal}
            showModal={showModal}
            deleteMessage={deleteLetter}
            path={path}
          />
        }
      </div>




      {showModal && (
        <MyVerticallyCenteredModal
        show={showModal}
        onHide={() => setShowModal(false)}
        letterId={letterData?.id}
        id={letterData?.id}
        myVotes={myVotes}
        onVoteSuccess={onVoteSuccess}
        letters={letters}
        letterData={letterData}
        toggleModal={toggleModal}
        path={path}
        deleteMessage={deleteModalLetter}

      />
      )}

    </>


  );
}

function MyVerticallyCenteredModal(props) {
  return (
    <Modal
      {...props}
      // size="lg"
      // aria-labelledby="contained-modal-title-vcenter"
      // centered
      style={{ background: 'black' }}
    >
        <button className="modal-back-button">
            <IoArrowBackCircleSharp onClick={props.toggleModal}/>
        </button>
        <LetterView
          id={props.id}
          letterId={props.letterId}
          onVoteSuccess={props.onVoteSuccess}
          myVotes={props.myVotes}
          letterData={props.letterData}
          deleteMessage={props.deleteMessage}

        />

    </Modal>
  );
}
