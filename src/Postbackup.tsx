import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreatePost } from "./CreatePost";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { Post } from "./Post.jsx"


interface PostData {
  id: string;
  title: string;
  score: number;
  username: string;
  user_id: string;
}

// export function Post({
//   postData,
//   myVote,
//   onVoteSuccess,
// }: {
//   postData: PostData;
//   myVote: "up" | "down" | undefined;
//   onVoteSuccess: () => void;
// }) {
//   const { session } = useContext(UserContext);
//   return (
//     <div className="flex bg-grey1 text-white m-4 border-2 rounded">
//       <div className="flex-none grid grid-cols-1 place-content-center bg-gray-800 p-2 mr-4">
//         <UpVote
//           direction="up"
//           // handle filling later
//           filled={myVote === "up"}
//           enabled={!!session}
//           onClick={async () => {
//             await castVote({
//               postId: postData.id,
//               userId: session?.user.id as string,
//               voteType: "up",
//               onSuccess: () => {
//                 onVoteSuccess();
//               },
//             });
//           }}
//         />
//         <p className="text-center" data-e2e="upvote-count">
//           {postData.score}
//         </p>
//         <UpVote
//           direction="down"
//           filled={myVote === "down"}
//           enabled={!!session}
//           onClick={async () => {
//             await castVote({
//               postId: postData.id,
//               userId: session?.user.id as string,
//               voteType: "down",
//               onSuccess: () => {
//                 onVoteSuccess();
//               },
//             });
//           }}
//         />
//       </div>
//       <Link to={`/message-board/post/${postData.id}`} className="flex-auto">
//         <p className="mt-4">
//           Posted By {postData.username} {timeAgo((postData as any).created_at)}{" "}
//           ago
//         </p>
//         <h3 className="text-2xl">{postData.title}</h3>
//       </Link>
//     </div>
//   );
// }

 async function castVote({
  postId,
  userId,
  voteType,
  onSuccess = () => {},
}: {
  postId: string;
  userId: string;
  voteType: "up" | "down";
  onSuccess?: () => void;
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