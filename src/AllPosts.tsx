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

export function AllPosts() {
  const { session } = useContext(UserContext);
  const { pageNumber } = useParams();
  const [bumper, setBumper] = useState(0);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [voteBumper, setVoteBumper] = useState(0);
  const [myVotes, setMyVotes] = useState<
    Record<string, "up" | "down" | undefined>
  >({});
  const [totalPages, setTotalPages] = useState(0);
  useEffect(() => {
    const queryPageNumber = pageNumber ? +pageNumber : 1;
    Promise.all([
      supaClient
        .rpc("get_posts", { page_number: queryPageNumber })
        .select("*")
        .then(({ data }) => {
          setPosts(data as PostData[]);

        }),
      supaClient
        .from("posts")
        .select("*", { count: "exact", head: true })
        .filter("path", "eq", "root")
        .then(({ count }) => {
          count == null ? 0 : setTotalPages(Math.ceil(count / 10));
        }),
    ]);
  }, [session, bumper, pageNumber]);

  useEffect(() => {
    if (session?.user) {
      supaClient
        .from("post_votes")
        .select("*")
        .eq("user_id", session.user.id)
        .then(({ data: votesData }) => {
          if (!votesData) {
            return;
          }
          const votes = votesData.reduce((acc, vote) => {
            acc[vote.post_id] = vote.vote_type;
            return acc;
          }, {} as Record<string, "up" | "down" | undefined>);
          setMyVotes(votes);

        });
    }
  }, [session, voteBumper])

  // const incrementVote = (commentId, direction, wasNew) => {

  //   setVoteBumper(voteBumper + 1);
  // }


  return (
    <>
      {session && <CreatePost />}
      <Pagination
        totalPages={totalPages}
        currentPage={pageNumber ? +pageNumber : 0}
      />
      <div className="grid grid-cols-1 width-xl">
        {posts?.map((post, i) => (
          <Post
            key={post.id}
            index={i}
            postData={post}
            myVote={myVotes?.[post.id] || undefined}
            onVoteSuccess={(i, direction) => {

              let id = posts[i].id;
              let temp = posts;
              if (!myVotes[id]) {
                if (direction === "up") temp[i].score = temp[i].score + 1;
                if (direction === "down") temp[i].score = temp[i].score -1;
              } else if (myVotes[id] && direction === myVotes[id]) {
                return;
              } else {
                if (myVotes[id] && direction !== myVotes[id]) {
                  if (direction === "up") temp[i].score = temp[i].score + 2;
                  if (direction === "down") temp[i].score = temp[i].score -2;
                }
              }
              //setPosts(temp);
              setVoteBumper(voteBumper + 1);
            }}
          />
        ))}
      </div>
    </>
  );
}

export async function castVote({
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

const selectedStyles = "border-2 border-white rounded p-2 bg-gray-700";
const notSelectedStyles = "rounded p-2 bg-gray-700";

function Pagination({
  totalPages,
  currentPage,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const middleButtons = [currentPage];
  for (let i = currentPage - 1; i > 0 && i > currentPage - 5; i--) {
    middleButtons.unshift(i);
  }
  for (let i = currentPage + 1; i <= totalPages && i <= currentPage + 4; i++) {
    middleButtons.push(i);
  }
  return (
    <div className="flex justify-center gap-4 place-items-end">
      {currentPage > 5 ? (
        <Link
          data-e2e={`page-1`}
          className={notSelectedStyles}
          to={`/message-board/1`}
          key={1}
        >
          1
        </Link>
      ) : (
        <></>
      )}
      {currentPage > 6 ? <span data-e2e="starting-elipsis"> ... </span> : <></>}
      {middleButtons.map((pageNumber) => (
        <Link
          key={pageNumber}
          data-e2e={`page-${pageNumber}`}
          className={
            currentPage === pageNumber ? selectedStyles : notSelectedStyles
          }
          to={`/message-board/${pageNumber}`}
        >
          {pageNumber}
        </Link>
      ))}
      {totalPages - currentPage > 5 ? (
        <span data-e2e="ending-elipsis"> ... </span>
      ) : (
        <></>
      )}
      {totalPages - currentPage > 4 ? (
        <Link
          data-e2e={`page-${totalPages}`}
          className={notSelectedStyles}
          to={`/message-board/${totalPages}`}
          key={totalPages}
        >
          {totalPages}
        </Link>
      ) : (
        <></>
      )}
    </div>
  );
}





// export async function castVote({
//   postId,
//   userId,
//   voteType,
//   //onSuccess = () => {},
// }: {
//   postId: string;
//   userId: string;
//   voteType: "up" | "down";
//   voteId?: Promise<string | undefined>;
//   //onSuccess?: () => void;
// }) {
//   const voteId = await getVoteId(userId, postId);
//   const { data, error } = voteId
//     ? await supaClient.from("post_votes").update({
//         id: voteId,
//         post_id: postId,
//         user_id: userId,
//         vote_type: voteType,
//       })
//     : await supaClient.from("post_votes").insert({
//         post_id: postId,
//         user_id: userId,
//         vote_type: voteType,
//       });
//   // handle error
//   //onSuccess();
// }

export async function getVoteId(
  userId: string,
  postId: string
): Promise<string | undefined> {
  const { data, error } = await supaClient
    .from("post_votes")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();
  return data?.id || undefined;
}
