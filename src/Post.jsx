import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreatePost } from "./CreatePost";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { PostView } from "./PostView"
// import ReactModal from 'react-modal';
// import ReactDOM from 'react-dom';
// import Modal from 'react-bootstrap/Modal'
import { Modal } from "react-bootstrap"

export function Post({
  index,
  postData,
  myVote,
  onVoteSuccess,
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
        <UpVote
          direction="up"
          // handle filling later
          filled={myVote === "up"}
          enabled={!!session}
          onClick={async () => {
            await castVote({
              postId: postData.id,
              userId: session?.user.id,
              voteType: "up",
              onSuccess: () => {

                onVoteSuccess(index, "up");
              },
            });
          }}
        />
        <p className="text-center" data-e2e="upvote-count">
          {postData.score}
        </p>
        <UpVote
          direction="down"
          filled={myVote === "down"}
          enabled={!!session}
          onClick={async () => {
            await castVote({
              postId: postData.id,
              userId: session?.user.id,
              voteType: "down",
              onSuccess: () => {
                onVoteSuccess(index, "down");
              },
            });
          }}
        />
      </div>
      <Link to={`/peace-wall/post/${postData.id}`} className="flex-auto">
        <p className="mt-4">
          Posted By {postData.username} {timeAgo((postData).created_at)}{" "}
          ago
        </p>
        <h3 className="text-2xl">{postData.title}</h3>
      </Link>
      {/* <button
        onClick={() => {
          console.log('clicked')
          setModalOpen(true);
        }}
      >
        Comment
      </button>
      {isModalOpen &&
        <div  className="modol" isOpen={isModalOpen} onClose={() => setModalOpen(false)} onRequestClose={handleRequestClose}>
          <PostView postId={postData.id}/>
        </div>
      } */}

    <>
      <button variant="primary" onClick={() => setModalShow(true)}>
        comment
      </button>

      <MyVerticallyCenteredModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        postId={postData.id}
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
        <PostView postId={props.postId}/>
      </div>

    </Modal>
  );
}

 async function castVote({
  postId,
  userId,
  voteType,
  onSuccess = () => {},
}) {
  await supaClient.from("post_votes").upsert(
    {
      post_id: postId,
      user_id: userId,
      vote_type: voteType,
    },
    { onConflict: "post_id,user_id" }
  );
  onSuccess();
}

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

