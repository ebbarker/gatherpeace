import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App.tsx";
import { CreatePost } from "./CreatePost.jsx";
import { supaClient } from "./layout/supa-client.ts";
import { timeAgo } from "./layout/time-ago.ts";
import { UpVote } from "./UpVote.jsx";
import { Post } from "./PostModal.jsx"
import { PostView } from "./PostView.jsx"
import { VoteContext } from "./contexts/VoteContext.jsx";
import { Stepform } from "./createPostForm/Stepform.jsx";


export function AllPosts() {
  const { session } = useContext(UserContext);
  const { pageNumber } = useParams();
  //const [bumper, setBumper] = useState(0);
  const [posts, setPosts] = useState([]);
  //const [voteBumper, setVoteBumper] = useState(0);
  const [myVotes, setMyVotes] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  useEffect(() => {
    const queryPageNumber = pageNumber ? +pageNumber : 1;
    Promise.all([
      supaClient
        .rpc("get_posts", { page_number: queryPageNumber })
        .select("*")
        .then(({ data }) => {
          setPosts(data);
          console.log(JSON.stringify(data));

        }),
      supaClient
        .from("posts")
        .select("*", { count: "exact", head: true })
        .filter("path", "eq", "root")
        .then(({ count }) => {
          count == null ? 0 : setTotalPages(Math.ceil(count / 10));
        }),
    ]);

  }, [session, pageNumber]);


  return (
    <>
      {session && <CreatePost posts={posts} setPosts={setPosts}/>}
      <Stepform />
      <Pagination
        totalPages={totalPages}
        currentPage={pageNumber ? +pageNumber : 0}
      />
      <div id="news-feed" className="news-feed-container">

        {posts?.map((post, i) => {
          post.path = 'root';
          return (
          <Post
            key={post?.id}
            posts={posts}
            index={i}
            postData={post}
            parentIsTimeline={true}
            onVoteSuccess={(id, direction) => {

                setPosts(posts => {
                  return posts.map((current) => {
                  if (current.id == id) {
                    if (direction === 'delete') {
                      return {
                        ...current,
                        score: current.score - 1
                      }
                    }
                    if (direction === 'up') {
                      return {
                        ...current,
                        score: current.score + 1
                      }
                    }
                  } else {

                    return current;
                  }
                })});

              //};
            }}
          />
          )
          // <PostView postId={post.id} key={i}/>
          })}
      </div>
    </>
  );
}

export async function castVote({
  postId,
  userId,
  voteType,
  onSuccess = () => {},
}) {

  if (voteType === "up") {
    await supaClient.from("post_votes").upsert(
      {
        post_id: postId,
        user_id: userId,
        vote_type: voteType,
      },
      { onConflict: "post_id,user_id" }
    ).then(({ data, error }) => {
      if (error) {
        console.log(error);
      } else {
        onSuccess();
      }
    });
  } else if (voteType === "delete") {
   const res = await supaClient
        .rpc("delete_post_vote", { p_user_id: userId, p_post_id: postId })
        .then(({ data, error }) => {
          if (error) {
            console.log(error);
          } else {
            onSuccess();
          }
        });
  }

}

const selectedStyles = "border-2 border-white rounded p-2 bg-gray-700";
const notSelectedStyles = "rounded p-2 bg-gray-700";

function Pagination({
  totalPages,
  currentPage,
}) {
  if (!currentPage) currentPage = 1;
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
          to={`/peace-wall/1`}
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
          to={`/peace-wall/${pageNumber}`}
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
          to={`/peace-wall/${totalPages}`}
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



// export async function getVoteId(
//   userId,
//   postId
// ){
//   const { data, error } = await supaClient
//     .from("post_votes")
//     .select("id")
//     .eq("user_id", userId)
//     .eq("post_id", postId)
//     .single();
//   return data?.id || undefined;
// }
