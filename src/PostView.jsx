import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import { castPostVote } from "./AllPosts";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import CommentDetails from "./CommentDetails";
//import { SupashipUserInfo } from "./layout/use-session";


export function PostView({ postData = null,  myVotes = null, onVoteSuccess = null}) {
  const userContext = useContext(UserContext);

  const params = useParams();
  const postId = postData ? postData.id : params.postId;
  // const [voteBumper, setVoteBumper] = useState(0);
  const [bumper, setBumper] = useState(0);
  const [postDetailData, setPostDetailData] = useState({
    post: null,
    comments: [],
  });
  const [pageError, setPageError] = useState(null)

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

    const sortedByDepthThenCreationTime = [...Object.values(commentMap)].sort((a, b) => {
        if (a.depth !== b.depth) {
            return a.depth - b.depth; // Sort by depth first
        }

        // For depth 1, sort by score; if score is the same, sort by creation time
        if (a.depth === 1) {
            if (a.score !== b.score) {
                return b.score - a.score;
            } else {
                return new Date(a.created_at) - new Date(b.created_at);
            }
        }

        // For depth 2, sort by creation time
        if (a.depth === 2) {
            return new Date(a.created_at) - new Date(b.created_at);
        }

        return 0; // If neither depth 1 nor 2, don't change order
    });



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


    let data, error;
      if (!postData) {

          ({ data, error } = await supaClient
          .rpc("get_single_post_with_comments", { post_id: postId })
          .select("*"));
        if (error ) {
          setPageError(error);
          throw new Error(JSON.stringify(error));
        }
        if (!data || data.length === 0) {
          setPageError({message: 'post not found'});
          throw new Error('post not found');
        }

      } else {

          ({ data, error } = await supaClient
        .rpc("get_comments_by_post_id", { post_id: postId })
        .select("*"));
      if (error ) {
        setPageError(error);
        throw new Error(JSON.stringify(error));
      }
      // if (!data || data.length === 0) {
      //   setPageError({message: 'post not found'});
      //   throw new Error('post not found');
      // }

      postData.path = 'root';
      if (!data) {
        data = [postData];
      } else {
        data.push(postData);
      }

  }





    const postMap = data.reduce((acc, post) => {
      acc[post.id] = post;
      return acc;
    }, {});
    const post = postMap[postId];
    const comments = data.filter((x) => x.id !== postId);

    return { post, comments };
  }

  useEffect(() => {

    postDetailLoader({
      params: postId ? { postId } : params,
      userContext,
    }).then((newPostDetailData) => {
      if (newPostDetailData) {
        let sortedDetails = {...newPostDetailData};
        sortedDetails.comments = unsortedCommentsToNested(newPostDetailData.comments);
        setPostDetailData(sortedDetails);
      }
    });
  }, [userContext, params, bumper]);


  function onCommentVoteSuccess (id, direction)  {
    if (id === postId) {
      let newData = {...postDetailData};
      direction == 'delete' ? newData.post.score-- : newData.post.score++;
      setPostDetailData(newData);
    }

    function recursiveCommentMapper (current) {

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
      } else if (current.comments.length > 0) {
        let newChildComments = current.comments.map(recursiveCommentMapper);
        current.comments = newChildComments;
      }
        return current;

    }

        let commentsArr = postDetailData.comments.map(recursiveCommentMapper);
        let newPostDetailData = {...postDetailData};
        newPostDetailData.comments = commentsArr;
        setPostDetailData(newPostDetailData);

  }

  return (
    <>
      <div className="post-container flex flex-col">
      <div class="post flex flex-col place-content-center grow">
        {pageError &&
          <>
            <h4>There was an error loading the page. The details of the error are:</h4>
            <div>{pageError.details}</div>
            <div>{pageError.hint}</div>
            <div>{pageError.message}</div>
          </>
        }
            <CommentDetails
              key={postDetailData?.post?.id}
              comment={postData ? postData : postDetailData.post}
              onVoteSuccess={onVoteSuccess ? onVoteSuccess : onCommentVoteSuccess}
              getDepth={getDepth}
              repliesCount={postDetailData.comments.length}
            />
          </div>
        <div className="create-comments-container">
          {userContext.session  && (
            <CreateComment
              parent={postData ? postData : postDetailData.post}
              onSuccess={(newComment) => {
                let newPostDetailData = {...postDetailData};
                newPostDetailData.post.count_comments++;
                newPostDetailData.comments.push(newComment);
                setPostDetailData(newPostDetailData);
              }}
              getDepth={getDepth}
            />
          )}
        </div>
        <div className="comments-container flex flex-col w-full grow">
          {postDetailData.comments.map((comment) => (
            <CommentView
              key={comment.id}
              comment={comment}
              onVoteSuccess={onCommentVoteSuccess}
              getDepth={getDepth}
              postDetailData={postDetailData}
              setPostDetailData={setPostDetailData}
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
  getDepth,
  onVoteSuccess,
  setPostDetailData,
  postDetailData,
  leftBorderLine,
  replyIndex,
  arrLength
}) {
  const [commenting, setCommenting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { session } = useContext(UserContext);
  const repliesCount = comment.comments.length;


  return (

    <div className="comment flex flex-col  rounded">


            <CommentDetails
              key={comment.id}
              comment={comment}
              myVotes={myVotes}
              onVoteSuccess={onVoteSuccess}
              getDepth={getDepth}
              commenting={commenting}
              setCommenting={setCommenting}
              repliesCount={repliesCount}
              showReplies={showReplies}
              setShowReplies={setShowReplies}
              leftBorderLine={leftBorderLine}
              arrLength={arrLength}
              replyIndex={replyIndex}
            />

            {commenting && (
                <CreateComment
                    parent={comment}
                    onCancel={() => setCommenting(false)}
                    setPostDetailData={setPostDetailData}
                    postDetailData={postDetailData}
                    onSuccess={(newComment) => {

                      function addComment (newComment) {


                        let parentIndex;
                        let realParent = newComment.path.slice(newComment.path.lastIndexOf('.') + 1);
                        for (let i = 0; i < postDetailData.comments.length; i++) {

                          let transmutedId = postDetailData.comments[i]['id'].replaceAll("-", "_");

                          if (transmutedId === realParent) {
                            parentIndex = i;

                            break;
                          }
                        }
                        let newPostDetailData = {...postDetailData};
                        newPostDetailData.comments[parentIndex]['comments'].push(newComment);
                        newPostDetailData.post.count_comments++;
                        setPostDetailData(newPostDetailData);
                      };
                      addComment(newComment);

                        setShowReplies(true);
                        setCommenting(false);
                    }}
                    getDepth={getDepth}
                    arrLength={arrLength}
                    replyIndex={replyIndex}
                />
            )}

            {/* Recursive nested comments */}
            {!!comment?.comments?.length && (
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
            {showReplies && !!comment.comments.length && (

              <div className="reply-container" id="reply-container">
                {comment.comments.map((reply, index) => (

                  <>

                    <CommentView
                      key={reply.id}
                      comment={reply}
                      myVotes={myVotes}
                      onVoteSuccess={onVoteSuccess}
                      getDepth={getDepth}
                      setPostDetailData={setPostDetailData}
                      postDetailData={postDetailData}
                      replyIndex={index}
                      arrLength={comment.comments.length}
                    />
                  </>
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
  showReplies,
  setShowReplies,
  arrLength,
  replyIndex,

}) {
  const user = useContext(UserContext);
  const [comment, setComment] = useState("");
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const borderLineRef = useRef(null);


  useEffect(() => {

    if (textareaRef.current && borderLineRef.current) {
      const additionalHeight = 120; // Additional height in pixels
      const textareaHeight = textareaRef.current.offsetHeight;
      borderLineRef.current.style.height = `${textareaHeight + additionalHeight}px`;
    }



  }, [comment]); // Depend on the comment state to update when the text changes


  const scrollIntoView = () => {
    if (containerRef.current && comment.length === 0) {
      const extraOffset = 15; // Adjust the offset as needed
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end", // Scroll to the bottom of the container
      });

      // Scroll a little more down to create extra space
    window.scrollBy(0, extraOffset);
    }

  };

  return (
    <>
      <form
        ref={containerRef}
        className="p-4 flex flex-col justify-start mobile-full-width create-reply-container"
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
              comment_path: actualPath,
            })
            .then(({ data, error }) => {
              if (error) {
                console.log(error);
              } else {
                let commentDepth = getDepth(data[0].returned_path);
                let newComment = {
                  id: data[0].comment_id,
                  username: user.profile.username,
                  created_at: data[0].creation_time,
                  content: comment,
                  score: 0,
                  path: data[0].returned_path,
                  depth: commentDepth,
                  comments: [],
                };

                onSuccess(newComment);


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
        {replyIndex < arrLength - 1 && <div ref={borderLineRef} className="left-border-line-from-comment"></div>}
        <textarea autoFocus
          ref={textareaRef}
          name="comment"
          placeholder="Your comment here"
          className="text-gray-800 p-4 rounded"
          onChange={({ target: { value } }) => {
            setComment(value);
          }}
        />
        <div className="flex gap-2 comment-submit-container">
          <button
            type="submit"

            className="new-comment-submit"
            disabled={!comment}
          >
            Submit
          </button>
          {onCancel && (
            <button
              type="button"
              className="new-comment-cancel"
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



