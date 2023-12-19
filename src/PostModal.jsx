import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreatePost } from "./CreatePost";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { PostView } from "./PostView"
import CommentDetails from "./CommentDetails"
import { castVote } from "./AllPostsBACKUP";
// import ReactModal from 'react-modal';
// import ReactDOM from 'react-dom';
// import Modal from 'react-bootstrap/Modal'
import { Modal } from "react-bootstrap"
import { IoArrowBackCircleSharp } from "react-icons/io5";


export function Post({
  index,
  key,
  postData,
  myVotes,
  onVoteSuccess,
  posts,
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

  return (
    <>
      <div className="flex-none grid grid-cols-1 place-content-center post-container text-white">
        <CommentDetails
          key={postData?.id}
          comment={postData}
          myVotes={myVotes}
          onVoteSuccess={onVoteSuccess}
          index={index}
          toggleModal={toggleModal}
          showModal={showModal}
          path={path}
          parentIsTimeline
        />
      </div>




      {showModal && (
        <MyVerticallyCenteredModal
        show={showModal}
        onHide={() => setShowModal(false)}
        postId={postData?.id}
        myVotes={myVotes}
        onVoteSuccess={onVoteSuccess}
        posts={posts}
        postData={postData}
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
        <PostView
          postId={props.postId}
          onVoteSuccess={props.onVoteSuccess}
          myVotes={props.myVotes}
          postData={props.postData}
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

            <PostView
              postId={postData?.Id}
              onVoteSuccess={onVoteSuccess}
              postData={postData}
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


      //       <div className="post-modal">
      //         <div onClick={setShowModal(!props.showModal)} className="overlay"></div>
      //         <div className="modal-content">


      //           <PostView
      //             postId={props.postId}
      //             onVoteSuccess={props.onVoteSuccess}
      //             postData={props.postData}
      //             setShowModal={setShowModal}

      //           />
      //         </div>
      //       </div>


      //   );
      // }





      // import { useContext, useEffect, useMemo, useState } from "react";
      // import { Link, useLoaderData, useParams } from "react-router-dom";
      // import { UserContext } from "./layout/App";
      // import { CreatePost } from "./CreatePost";
      // import { supaClient } from "./layout/supa-client";
      // import { timeAgo } from "./layout/time-ago";
      // import { UpVote } from "./UpVote";
      // import { PostView } from "./PostView"
      // import CommentDetails from "./CommentDetails"
      // import { castVote } from "./AllPosts";
      // // import ReactModal from 'react-modal';
      // // import ReactDOM from 'react-dom';
      // // import Modal from 'react-bootstrap/Modal'
      // import { Modal } from "react-bootstrap"

      // export function Post({
      //   index,
      //   key,
      //   postData,
      //   myVotes,
      //   onVoteSuccess,
      //   posts,
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
      //       <div className="flex-none grid grid-cols-1 place-content-center post-container text-white">

      //           <CommentDetails
      //             key={postData?.id}
      //             comment={postData}
      //             myVotes={myVotes}
      //             onVoteSuccess={onVoteSuccess}
      //             index={index}
      //             setShowModal={setShowModal}
      //             showModal={showModal}
      //           />
      //       </div>