import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreatePost } from "./CreatePost";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { Post } from "./Post.jsx"
import { PostView } from "./PostView"


export function AllPosts() {
  const { session } = useContext(UserContext);
  const { pageNumber } = useParams();
  const [bumper, setBumper] = useState(0);
  const [posts, setPosts] = useState([]);
  const [voteBumper, setVoteBumper] = useState(0);
  const [myVotes, setMyVotes] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  useEffect(() => {
    const queryPageNumber = pageNumber ? +pageNumber : 1;
    Promise.all([
      supaClient
        .rpc("get_posts", { page_number: queryPageNumber })
        .select("*")
        .then(({ data }) => {
          setPosts(data);

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
          }, {});
          setMyVotes(votes);
          console.log('my votes + ' + JSON.stringify(myVotes))
        });
    }

  }, [session, voteBumper])

  // const incrementVote = (commentId, direction, wasNew) => {

  //   setVoteBumper(voteBumper + 1);
  // }


  return (
    <>
      {session && <CreatePost posts={posts} setPosts={setPosts}/>}
      <Pagination
        totalPages={totalPages}
        currentPage={pageNumber ? +pageNumber : 0}
      />
      <div id="primary-page" className="grid grid-cols-1 width-xl">
        {posts?.map((post, i) => (
          <Post
            key={post?.id}
            posts={posts}
            index={i}
            postData={post}
            myVotes={myVotes || undefined}
            parentIsTimeline={true}
            onVoteSuccess={(id, direction) => {
              console.log('id: ' + id)

              console.log('direction: ' + direction);

              // let id = post[i]?.id;
              // let temp = posts;
              // console.log(id);

              if (myVotes[id] && direction === myVotes[id]) null;
              if (!myVotes[id] && direction === 'delete') null;

              else {
                setPosts(oldPosts => {
                  return oldPosts.map((current) => {

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
                  setMyVotes(myVotes => {
                    if (direction === 'delete') {
                      delete myVotes[id];
                    }
                    if (direction === 'up') {
                      myVotes[id] = 'up';
                    }

                    return myVotes;
                  })
              };
              console.log('my votes + ' + JSON.stringify(myVotes))



              //   if (!myVotes[id]) {
              //   if (direction === "up") temp[i].score = temp[i].score + 1;
              //   if (direction === "down") temp[i].score = temp[i].score -1;
              //   if (direction === "delete") temp[i].score = temp[i].score -1;

              // } else {
              //   if (myVotes[id] && direction !== myVotes[id]) {
              //     if (direction === "up") temp[i].score = temp[i].score + 2;
              //     if (direction === "down") temp[i].score = temp[i].score -2;
              //     if (direction === "delete") temp[i].score = temp[i].score -1;
              //   }
              // }
              // setPosts(temp);
              // setVoteBumper(voteBumper => voteBumper + 1);
              // setBumper(bumper => bumper + 1);
            }}
          />
          // <PostView postId={post.id} key={i}/>
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
}) {
  console.log('vote type, ' + voteType)
  if (voteType === "up") {
    await supaClient.from("post_votes").upsert(
      {
        post_id: postId,
        user_id: userId,
        vote_type: voteType,
      },
      { onConflict: "post_id,user_id" }
    );
    onSuccess();
  } else if (voteType === "delete") {
   const res = await supaClient
        .rpc("delete_post_vote", { p_user_id: userId, p_post_id: postId })
        .then(res => console.log(res))


    // const postId = '5faf347d-36f0-4672-a2a4-fd18f2ec682b'
    // const res = await supaClient
    //     .from("post_votes")
    //     .delete()
    //     .eq('id', postId)

        //console.log(res);
        onSuccess();
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
  userId,
  postId
){
  const { data, error } = await supaClient
    .from("post_votes")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();
  return data?.id || undefined;
}
