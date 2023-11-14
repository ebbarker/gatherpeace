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
}) {
  const { session } = useContext(UserContext);
  //const [isModalOpen, setModalOpen] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  // function handleRequestClose (){
  //   setModalOpen(false);
  // }

  return (
    <>
      <div className="flex-none grid grid-cols-1 place-content-center post-container text-white">

          <CommentDetails
            key={postData?.id}
            comment={postData}
            myVotes={myVotes}
            onVoteSuccess={onVoteSuccess}
            index={index}
            setModalShow={setModalShow}
            modalShow={modalShow}
          />
      </div>


      <MyVerticallyCenteredModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        postId={postData?.id}
        myVotes={myVotes}
        onVoteSuccess={onVoteSuccess}
        posts={posts}
        postData={postData}

      />
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
      <div className="post-modal">
        <PostView
          postId={props.postId}
          onVoteSuccess={props.onVoteSuccess}
          postData={props.postData}

        />
      </div>

    </Modal>
  );
}





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
//   const [modalShow, setModalShow] = useState(false);

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
//             setModalShow={setModalShow}
//             modalShow={modalShow}
//           />
//       </div>


//       <MyVerticallyCenteredModal
//         show={modalShow}
//         onHide={() => setModalShow(false)}
//         postId={postData?.id}
//         myVotes={myVotes}
//         onVoteSuccess={onVoteSuccess}
//         posts={posts}
//         postData={postData}

//       />
//     </>


//   );
// }

// function MyVerticallyCenteredModal(props) {
//   return (
//     <Modal
//       {...props}
//       // size="lg"
//       // aria-labelledby="contained-modal-title-vcenter"
//       // centered
//       style={{ background: 'black' }}
//     >
//       <div className="post-modal">
//         <PostView
//           postId={props.postId}
//           onVoteSuccess={props.onVoteSuccess}
//           myVotes={props.myVotes}
//           postData={props.postData}

//         />
//       </div>

//     </Modal>
//   );
// }



