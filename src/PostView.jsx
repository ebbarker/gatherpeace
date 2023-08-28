import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import { castVote } from "./AllPosts";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import CommentDetails from "./CommentDetails";
//import { SupashipUserInfo } from "./layout/use-session";

// export interface Post {
//   id: string;
//   username_name: string;
//   title: string;
//   content: string;
//   score: number;
//   created_at: string;
//   path: string;
//   comments: Comment[];
// }

// export interface Comment {
//   id: string;
//   username_name: string;
//   content: string;
//   score: number;
//   created_at: string;
//   path: string;
//   depth: number;
//   comments: Comment[];
// }

// export type DepthFirstComment = Omit<Comment, "comments"> & { depth: number };

// interface PostDetailData {
//   post: Post | null;
//   comments: DepthFirstComment[] | null;
//   myVotes?: Record<string, "up" | "down" | undefined | null >;
// }
// interface newPostDetailData {
//   post: Post | null;
//   comments: DepthFirstComment[];
//   myVotes?: Record<string, "up" | "down" | undefined>;
// }






export function PostView({ postId,  myVotes = null, onVoteSuccess = () => { setBumper(bumper + 1)}, posts}) {
  const userContext = useContext(UserContext);
  const params = useParams();
  // const [voteBumper, setVoteBumper] = useState(0);
  const [bumper, setBumper] = useState(0);
  const [postDetailData, setPostDetailData] = useState({
    post: null,
    comments: [],
  });

  function getDepth(path) {
    const rootless = path.slice(5);
    return rootless.split(".").filter((x) => !!x).length;
  }



  function convertToUuid(path) {
    return path.replaceAll("_", "-");
  }

  function getParent(map, path) {
    const parentId = path.replace("root.", "").split(".").slice(-1)[0];
    const parent = map[convertToUuid(parentId)];
    if (!parent) {
      throw new Error(`Parent not found at ${parentId}`);
    }
    return parent;
  }

  function unsortedCommentsToNested(comments) {
    const commentMap = comments.reduce((acc, comment) => {
      acc[comment.id] = {
        ...comment,
        comments: [],
        depth: getDepth(comment.path),
      };
      return acc;
    }, {});
    const result = [];
    const sortedByDepthThenCreationTime = [...Object.values(commentMap)].sort(
      (a, b) =>
        a.depth > b.depth
          ? 1
          : a.depth < b.depth
          ? -1
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const post of sortedByDepthThenCreationTime) {
      if (post.depth === 1) {
        result.push(post);
      } else {
        const parentNode = getParent(commentMap, post.path);
        parentNode.comments.push(post);
      }
    }
    return result;
  }

  async function postDetailLoader({ params, userContext }) {
    const { postId } = params;
    const { data, error } = await supaClient
      .rpc("get_single_post_with_comments", { post_id: postId })
      .select("*");
    if (error || !data || data.length === 0) {
      throw new Error("Post not found");
    }
    const postMap = data.reduce((acc, post) => {
      acc[post.id] = post;
      return acc;
    }, {});
    const post = postMap[postId];
    const comments = data.filter((x) => x.id !== postId);
    if (!userContext.session?.user) {
      return { post, comments };
    }
    let votes;
    if (!myVotes) {
      const { data: votesData } = await supaClient
      .from("post_votes")
      .select("*")
      .eq("user_id", userContext.session?.user.id);
    if (!votesData) {
      return;
    }
    votes = votesData.reduce((acc, vote) => {
      acc[vote.post_id] = vote.vote_type;
      return acc;
    }, {});

    } else {
      votes = myVotes;
    }
    console.log('votes: ' + votes);
    console.log('myVotes: ' + myVotes);

    return { post, comments, myVotes: votes };
  }

  useEffect(() => {
    postDetailLoader({
      params: postId ? { postId } : params,
      userContext,
    }).then((newPostDetailData) => {
      if (newPostDetailData) {
        setPostDetailData(newPostDetailData);
      }
    });
  }, [userContext, params, bumper]);

  const nestedComments = useMemo(
    () => unsortedCommentsToNested(postDetailData.comments),
    [postDetailData]
  );

  function onSinglePageVoteSuccess () {
    setBumper(bumper + 1);
  }

  return (
    <>
      <div className="tweetContainer flex flex-col">
      <div class="tweet flex flex-col place-content-center border grow">

            <CommentDetails
              key={postDetailData?.post?.id}
              comment={postDetailData?.post}
              myVotes={postDetailData?.myVotes}
              onVoteSuccess={onVoteSuccess}
              getDepth={getDepth}
              onSinglePageVoteSuccess={onSinglePageVoteSuccess}

            />
          </div>
        <div className="create-comments-container">
          {userContext.session && postDetailData.post && (
            <CreateComment
              parent={postDetailData.post}
              onSuccess={() => {
                setBumper(bumper + 1);
              }}
              getDepth={getDepth}
            />
          )}
        </div>
        <div className="commentsContainer flex flex-col m-2 w-full grow">
          {nestedComments.map((comment) => (
            <CommentView
              key={comment.id}
              comment={comment}
              myVotes={postDetailData.myVotes}
              onVoteSuccess={onVoteSuccess}
              getDepth={getDepth}
            />
          ))}
        </div>
      </div>
    </>
  );
};

function CommentView({
  key,
  comment,
  myVotes,
  onVoteSuccess,
  getDepth,
}) {
  const [commenting, setCommenting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { session } = useContext(UserContext);


  return (

    <div className="comment tweet flex flex-col my-4 ml-4 border-l-2 rounded">
            {/* <div className="head flex justify-between items-start">
                <div className="head-left flex flex-col">
                    <div className="flex items-center">
                        <div className="image"></div>
                        <div className="name">
                            <div className="username">
                                {comment.username_name}
                            </div>
                            <div className="handle">@{comment.username_name}</div>
                            <div className="content-container">
                                {comment.content.split("\n").map((paragraph) => (
                                    <p className="text-dark text-left">{paragraph}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="head-right">
                    <div className="date">
                        {timeAgo(comment.created_at)} ago
                    </div>
                </div>
            </div>

            <div className="controls flex items-center border border-dark">

                <div className="btn">
                    <i className="fa-regular fa-comment"></i>
                    <span>Reply</span>
                </div>
                <div className="btn">
                    <i className="fa-solid fa-retweet"></i>
                    <span>Share</span>
                </div>
                <span>
                    {comment.score}
                    <UpVote
                        direction="up"
                        filled={myVotes?.[comment.id] === "up"}
                        enabled={!!session}
                        onClick={async () => {
                            //... (existing logic)
                        }}
                    />
                </span>
            </div> */}

            <CommentDetails
              key={comment.id}
              comment={comment}
              myVotes={myVotes}
              onVoteSuccess={onVoteSuccess}
              getDepth={getDepth}
            />

            {commenting && (
                <CreateComment
                    parent={comment}
                    onCancel={() => setCommenting(false)}
                    onSuccess={() => {
                        onVoteSuccess();
                        setCommenting(false);
                    }}
                    getDepth={getDepth}
                />
            )}
            {!commenting && (
                <div className="ml-4">
                    <button
                        onClick={() => setCommenting(!commenting)}
                        disabled={!session}
                    >
                        {commenting ? "Cancel" : "Reply"}
                    </button>
                </div>
            )}
            {/* Recursive nested comments */}
            {!!comment.comments.length && (
                <div className="ml-4">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        disabled={!session}
                    >
                        {showReplies ? "Hide Replies" :
                        (comment.comments.length === 1) ? `Show 1 Reply` : `Show ${comment.comments.length} Replies`}
                    </button>
                </div>
            )
            }
            {showReplies && (

              <div className="replyContainer">
                {comment.comments.map((comment) => (
                  <CommentView
                    key={comment.id}
                    comment={comment}
                    myVotes={myVotes}
                    onVoteSuccess={onVoteSuccess}
                    getDepth={getDepth}
                  />
                ))}
              </div>

            )}

        </div>
  );
}





function CreateComment({
  parent,
  onCancel,
  onSuccess,
  getDepth,
}) {
  const user = useContext(UserContext);
  const [comment, setComment] = useState("");
  const textareaRef = useRef(null);
  return (
    <>
      <form
        className="rounded border-2 p-4 mx-4 flex flex-col justify-start gap-4"
        data-e2e="create-comment-form"
        onSubmit={(event) => {
          event.preventDefault();
          let actualPath = `${parent.path}.${parent.id.replaceAll("-", "_")}`;
          let parentDepth = getDepth(parent.path);
          if (parentDepth >= 2) {
            actualPath = parent.path;
          }
          supaClient
            .rpc("create_new_comment", {
              user_id: user.session?.user.id,
              content: comment,
              path: actualPath,
            })
            .then(({ data, error }) => {
              if (error) {
                console.log(error);
              } else {
                onSuccess();
                textareaRef.current?.value != null &&
                  (textareaRef.current.value = "");
                const commentId = data;
                let intervalId = setInterval(() => {
                  const comment = document.querySelector(
                    `div[data-e2e="comment-${commentId}"]`
                  );
                  if (comment) {
                    clearInterval(intervalId);
                    comment.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }
            });
        }}
      >
        <h4>Add a New Comment</h4>
        <textarea autoFocus
          ref={textareaRef}
          name="comment"
          placeholder="Your comment here"
          className="text-gray-800 p-4 rounded"
          onChange={({ target: { value } }) => {
            setComment(value);
          }}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            id="new-comment-submit"
            className="bg-green-400 border rounded font-display text-lg p-2"
            disabled={!comment}
          >
            Submit
          </button>
          {onCancel && (
            <button
              type="button"
              className="bg-gray-400 rounded font-display text-lg p-2"
              onClick={() => onCancel()}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  );
}



