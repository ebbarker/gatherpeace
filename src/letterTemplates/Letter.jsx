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
  deleteLetter

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

          />
        }
      </div>




      {showModal && (
        <MyVerticallyCenteredModal
        show={showModal}
        onHide={() => setShowModal(false)}
        letterId={letterData?.id}
        myVotes={myVotes}
        onVoteSuccess={onVoteSuccess}
        letters={letters}
        letterData={letterData}
        toggleModal={toggleModal}
        path={path}

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
          letterId={props.letterId}
          onVoteSuccess={props.onVoteSuccess}
          myVotes={props.myVotes}
          letterData={props.letterData}
        />

    </Modal>
  );
}





     {/* {showModal && (
        <div className="modal-container">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-weird-content">
            <div className="modal-back-button">
              <IoArrowBackCircleSharp onClick={toggleModal}/>
            </div>

            <letterView
              letterId={letterData?.Id}
              onVoteSuccess={onVoteSuccess}
              letterData={letterData}
              setShowModal={toggleModal}

            />
          </div>
        </div>)
      } */}




      // function MyVerticallyCenteredModal(props) {
      //   const setShowModal = props.setShowModal;
      //   return (

      //       // size="lg"
      //       // aria-labelledby="contained-modal-title-vcenter"
      //       // centered


      //       <div className="letter-modal">
      //         <div onClick={setShowModal(!props.showModal)} className="overlay"></div>
      //         <div className="modal-content">


      //           <letterView
      //             letterId={props.letterId}
      //             onVoteSuccess={props.onVoteSuccess}
      //             letterData={props.letterData}
      //             setShowModal={setShowModal}

      //           />
      //         </div>
      //       </div>


      //   );
      // }





      // import { useContext, useEffect, useMemo, useState } from "react";
      // import { Link, useLoaderData, useParams } from "react-router-dom";
      // import { UserContext } from "./layout/App";
      // import { Createletter } from "./Createletter";
      // import { supaClient } from "./layout/supa-client";
      // import { timeAgo } from "./layout/time-ago";
      // import { UpVote } from "./UpVote";
      // import { letterView } from "./letterView"
      // import CommentDetails from "./CommentDetails"
      // import { castVote } from "./Allletters";
      // // import ReactModal from 'react-modal';
      // // import ReactDOM from 'react-dom';
      // // import Modal from 'react-bootstrap/Modal'
      // import { Modal } from "react-bootstrap"

      // export function letter({
      //   index,
      //   key,
      //   letterData,
      //   myVotes,
      //   onVoteSuccess,
      //   letters,
      //   parentIsTimeline
      // }) {
      //   const { session } = useContext(UserContext);
      //   //const [isModalOpen, setModalOpen] = useState(false);
      //   const [showModal, setShowModal] = useState(false);

      //   // function handleRequestClose (){
      //   //   setModalOpen(false);
      //   // }

      //   return (
      //     <>
      //       <div className="flex-none grid grid-cols-1 place-content-center letter-container text-white">

      //           <CommentDetails
      //             key={letterData?.id}
      //             comment={letterData}
      //             myVotes={myVotes}
      //             onVoteSuccess={onVoteSuccess}
      //             index={index}
      //             setShowModal={setShowModal}
      //             showModal={showModal}
      //           />
      //       </div>