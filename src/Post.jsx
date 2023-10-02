import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreatePost } from "./CreatePost";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { PostView } from "./PostView"
import CommentDetails from "./CommentDetails"
import { castVote } from "./AllPosts";
// import ReactModal from 'react-modal';
// import ReactDOM from 'react-dom';
// import Modal from 'react-bootstrap/Modal'
import { Modal } from "react-bootstrap"

export function Post({
  index,
  key,
  postData,
  myVotes,
  onVoteSuccess,
  posts,
  parentIsTimeline
}) {
  const { session } = useContext(UserContext);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  function handleRequestClose (){
    setModalOpen(false);
  }

  return (
    <div className="flex bg-grey1 text-white m-4 border-2 rounded">
      <div className="flex-none grid grid-cols-1 place-content-center bg-gray-800 p-2 mr-4">

          <CommentDetails
            key={postData?.id}
            comment={postData}
            myVotes={myVotes}
            onVoteSuccess={onVoteSuccess}
            index={index}
            parentIsTimeline={parentIsTimeline}
          />


        </div>

    <>
      <button variant="primary" onClick={() => setModalShow(true)}>
        comment
      </button>

      <MyVerticallyCenteredModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        postId={postData?.id}
        myVotes={myVotes}
        onVoteSuccess={onVoteSuccess}
        posts={posts}
        parentIsTimeline={parentIsTimeline}
        postData={postData}

      />
    </>

    </div>
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
      <div className="post-modal">
        <PostView
          postId={props.postId}
          onVoteSuccess={props.onVoteSuccess}
          myVotes={props.myVotes}
          parentIsTimeline={props.parentIsTimeline}
          postData={props.postData}

        />
      </div>

    </Modal>
  );
}

//  async function castVote({
//   postId,
//   userId,
//   voteType,
//   onSuccess = () => {},
// }) {
//   await supaClient.from("post_votes").upsert(
//     {
//       post_id: postId,
//       user_id: userId,
//       vote_type: voteType,
//     },
//     { onConflict: "post_id,user_id" }
//   );
//   onSuccess();
// }

// function Modal({ isOpen, onClose, postId }) {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-auto bg-smoke-dark flex">
//       <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded">
//       <PostView postId={postId} />
//         <span
//           className="absolute top-0 right-0 p-4"
//           onClick={onClose}
//         >
//           X
//         </span>
//       </div>
//     </div>
//   );
// }

