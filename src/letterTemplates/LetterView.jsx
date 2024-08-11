import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { castLetterVote } from "../AllPosts";
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { timeAgo } from "../layout/time-ago";
import { UpVote } from "../UpVote";
// import CommentDetails from "../CommentDetails";
import LetterDetails from "./LetterDetails";
import ReplyDetails from "./ReplyDetails";
import { NameDetails } from "./NameDetails";
import { UseScrollToHash } from "./UseScrollToHash";
import { VoteContext } from "../contexts/VoteContext";

//import { SupashipUserInfo } from "./layout/use-session";


export function LetterView({ id = null, letterData = null,  myVotes = null, onVoteSuccess = null, deleteMessage = null}) {
  const userContext = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const navigate = useNavigate();

  const params = useParams();
  const letterId = letterData ? letterData.id : params.LetterId;

  // const [voteBumper, setVoteBumper] = useState(0);
  const [bumper, setBumper] = useState(0);
  const [letterDetailData, setletterDetailData] = useState({
    letter: null,
    comments: [],
  });
  const [pageError, setPageError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const term = searchParams.get("query");
  const location = useLocation();
  const hash = location.hash.slice(1);
  // const searchParams = new URLSearchParams(location.search);
  // const query = searchParams.get('query');

  function getDepth(path) {
    const rootless = path.slice(5);
    return rootless.split(".").filter((x) => !!x).length;
  };

  const defaultDeleteMessage = async (id) => {
    console.log('delete default id: ' + id);
    try {
      const { data, error } = await supaClient.rpc('delete_letter_and_comments', { letter_id: id });

      if (error) {
        console.error('Error deleting letter and comments:', error.message);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }

  };

  // Use the provided deleteMessage or the default one
  const handleDeleteMessage = deleteMessage || defaultDeleteMessage;

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



    for (const letter of sortedByDepthThenCreationTime) {
        if (letter.depth === 1) {
            result.push(letter);
        } else {
            const parentNode = getParent(commentMap, letter.path);
            parentNode.comments.push(letter);
        }
    }

    return result;
  }



  async function letterDetailLoader({ params, userContext }) {

  console.log ('params: ' + JSON.stringify(params));
    let data, error;
      if (!letterData) {
        console.log('getting letter and comments together ' + letterId);
          ({ data, error } = await supaClient
          .rpc("get_single_letter_with_comments", { p_letter_id: letterId })
          .select("*"));
        if (error ) {
          setPageError(error);
          throw new Error(JSON.stringify(error));
        }
        if (!data || data.length === 0) {
          setPageError({message: 'letter not found'});
          throw new Error('letter not found');
        }

      } else {
        console.log('using letterId to get comments');
          ({ data, error } = await supaClient
        .rpc("get_comments_by_letter_id", { letter_id: letterId })
        .select("*"));
        if (error ) {
          setPageError(error);
          throw new Error(JSON.stringify(error));
        }

        letterData.path = 'root';
        if (!data) {
          data = [letterData];
        } else {
          data.push(letterData);
        }

      }


    const letterMap = data.reduce((acc, letter) => {
      acc[letter.id] = letter;
      return acc;
    }, {});
    const letter = letterMap[letterId];
    const comments = data.filter((x) => x.id !== letterId);
    console.log('comments: ' + comments);

    return { letter, comments };
  }

  useEffect(() => {
    console.log('letter detail loader hit');
    letterDetailLoader({
      params: letterId ? { letterId } : params,
      userContext,
    }).then((newletterDetailData) => {
      if (newletterDetailData) {
        let sortedDetails = {...newletterDetailData};
        sortedDetails.comments = unsortedCommentsToNested(newletterDetailData.comments);
        setletterDetailData(sortedDetails);
      }
    });
  }, []);




  function onLetterVoteSuccess (id, direction)  {

    if (id === letterId) {

      console.log('letterDetailData, ' + JSON.stringify(letterDetailData))
      let newData = {...letterDetailData};

      if (direction === 'delete') {
        newData.letter.score--;
        newData.letter.likes--;
      } else {
        newData.letter.score++;
        newData.letter.likes++;
      }

      console.log('newLetterDetailData, ' + JSON.stringify(newData));
      setletterDetailData(newData);
    }
    console.log('letter vote success');
    function recursiveCommentMapper (current) {

      if (current.id == id) {
        if (direction === 'delete') {
          console.log('deleting inside mapper')
          return {
            ...current,
            score: current.score - 1,
            likes: current.likes - 1
          }
        }
        if (direction === 'up') {
          return {
            ...current,
            score: current.score + 1,
            likes: current.likes + 1
          }
        }
      } else if (current.comments.length > 0) {
        let newChildComments = current.comments.map(recursiveCommentMapper);
        current.comments = newChildComments;
      }
        return current;

    }

        let commentsArr = letterDetailData.comments.map(recursiveCommentMapper);
        let newletterDetailData = {...letterDetailData};
        newletterDetailData.comments = commentsArr;
        setletterDetailData(newletterDetailData);

  }



  function onCommentVoteSuccess(id, direction)  {
   console.log('onCommentVoteSuccess: ' + direction);

    function recursiveCommentMapper (current) {


      if (current.id == id) {
        if (direction === 'delete') {
          console.log('recursiveCommentMapper');
          return {
            ...current,
            score: current.score - 1,
            likes: current.likes - 1
          }
        }
        if (direction === 'up') {
          console.log('recursiveCommentMapper');
          return {
            ...current,
            score: current.score + 1,
            likes: current.likes + 1
          }
        }
      } else if (current.comments.length > 0) {
        let newChildComments = current.comments.map(recursiveCommentMapper);
        current.comments = newChildComments;
      }
        return current;

    }

        let commentsArr = letterDetailData.comments.map(recursiveCommentMapper);
        let newletterDetailData = {...letterDetailData};
        newletterDetailData.comments = commentsArr;
        setletterDetailData(newletterDetailData);

  }


  // useLayoutEffect(() => {
  //   const hash = location.hash.slice(1);
  //   if (hash) {
  //     setTimeout(() => {
  //       const element = document.getElementById(`${hash}`);
  //       console.log('hash: ' + hash);
  //       console.log('element: ' + element);
  //       if (element) {
  //         element.scrollIntoView({ behavior: 'smooth' });
  //         console.log('scrolled: ');
  //       }
  //     }, 500); // You can increase the timeout duration if necessary
  //   }
  // }, [location]);

  return (
    <>

      <div className="letter-container flex flex-col">
      <div class="letter flex flex-col place-content-center grow">
        {pageError &&
          <>
            <h4>There was an error loading the page. The details of the error are:</h4>
            <div>{pageError.details}</div>
            <div>{pageError.hint}</div>
            <div>{pageError.message}</div>
          </>
        }
            {letterDetailData?.letter?.post_type === 'letter' &&
              <LetterDetails
                id={id ? id : letterId}
                // key={letterDetailData?.letter?.id}
                letter={letterData ? letterData : letterDetailData.letter}
                onVoteSuccess={onVoteSuccess ? onVoteSuccess : onLetterVoteSuccess}
                getDepth={getDepth}
                repliesCount={letterDetailData.comments.length}
                deleteMessage={handleDeleteMessage}
              />
            }
            {letterDetailData?.letter?.post_type === 'name' &&
              <NameDetails
                id={id ? id : letterId}
                // key={letterDetailData?.letter?.id}
                letter={letterData ? letterData : letterDetailData.letter}
                onVoteSuccess={onVoteSuccess ? onVoteSuccess : onLetterVoteSuccess}
                getDepth={getDepth}
                repliesCount={letterDetailData.comments.length}
                deleteMessage={handleDeleteMessage}
              />
            }
          </div>
        <div className="create-comments-container">
          {userContext.session  && (
            <CreateComment
              parent={letterData ? letterData : letterDetailData.letter}
              onSuccess={(newComment) => {
                let newletterDetailData = {...letterDetailData};
                newletterDetailData.letter.count_comments++;
                newletterDetailData.comments.push(newComment);
                setletterDetailData(newletterDetailData);
              }}
              getDepth={getDepth}
            />
          )}
        </div>
        <div className="comments-container flex flex-col w-full grow">
          {letterDetailData.comments.map((comment) => (
            <CommentView
              key={comment.id}
              comment={comment}
              onVoteSuccess={onCommentVoteSuccess}
              getDepth={getDepth}
              letterDetailData={letterDetailData}
              setletterDetailData={setletterDetailData}
              hash={hash}
            />
          ))}
        </div>
      </div>
    </>
  );
};

function CommentView({
  // key,
  comment,
  myVotes,
  getDepth,
  onVoteSuccess,
  setletterDetailData,
  letterDetailData,
  leftBorderLine,
  replyIndex,
  arrLength,
  hash
}) {
  const [commenting, setCommenting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { session } = useContext(UserContext);
  const repliesCount = comment.comments.length;
  const location = useLocation();
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  // useEffect(() => {
  //   if (hash === comment.id) {
  //     setShowReplies(true);
  //     const element = document.getElementById(`${hash}`);
  //     if (element) {
  //       element.scrollIntoView({ behavior: 'smooth' });
  //     }
  //   }
  // }, [hash, comment.id]);


  useEffect(() => {
    console.log('COUNT!');
    for (let i = 0; i < comment.comments.length; i++) {
      console.log('REPLY IDs: ' + comment.comments[i].id);
      if (comment.comments[i].id === hash) {
        setShowReplies(true);
      }
    }
  }, []);


  UseScrollToHash();
  // useEffect(() => {
  //   const hash = location.hash.slice(1);
  //   if (hash) {
  //     const element = document.getElementById(`${hash}`);
  //     console.log('hash: ' + hash);
  //     console.log('element: ' + element);
  //     if (element) {
  //       element.scrollIntoView({ behavior: 'smooth' });
  //       console.log('scrolled: ');
  //     }
  //   }



  // }, [location]);


  return (

  <>
  {myContextVotes[comment.id] !== 'down' &&
    <div className="comment flex flex-col  rounded">


            <ReplyDetails
              // key={comment.id}
              comment={comment}
              myVotes={myVotes}
              onVoteSuccess={onVoteSuccess}
              getDepth={getDepth}
              commenting={commenting}
              letterDetailData={letterDetailData}
              setletterDetailData={setletterDetailData}
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
                    setletterDetailData={setletterDetailData}
                    letterDetailData={letterDetailData}
                    onSuccess={(newComment) => {

                      function addComment (newComment) {
                        console.log('this is the new comment being written: ' + JSON.stringify(newComment));

                        let parentIndex;
                        let realParent = newComment.path.slice(newComment.path.lastIndexOf('.') + 1);
                        for (let i = 0; i < letterDetailData.comments.length; i++) {

                          let transmutedId = letterDetailData.comments[i]['id'].replaceAll("-", "_");

                          if (transmutedId === realParent) {
                            parentIndex = i;

                            break;
                          }
                        }
                        let newletterDetailData = {...letterDetailData};
                        newletterDetailData.comments[parentIndex]['comments'].push(newComment);
                        newletterDetailData.letter.count_comments++;
                        setletterDetailData(newletterDetailData);
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
                    <button className="show-replies-button"
                        onClick={() => setShowReplies(!showReplies)}
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
                      key={index}
                      comment={reply}
                      myVotes={myVotes}
                      onVoteSuccess={onVoteSuccess}
                      getDepth={getDepth}
                      setletterDetailData={setletterDetailData}
                      letterDetailData={letterDetailData}
                      replyIndex={index}
                      arrLength={comment.comments.length}
                      hash={hash}
                    />
                  </>
                ))}
              </div>
            )}
        </div>
}
        </>

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
  const { profile } = useContext(UserContext);


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
        className="p-4 flex flex-col justify-start mobile-full-width create-reply"
        data-e2e="create-comment-form"
        onSubmit={(event) => {

          event.preventDefault();


          let actualPath = `${parent?.path}.${parent.id.replaceAll("-", "_")}`;
          let parentDepth = getDepth(parent?.path);

          if (parentDepth >= 2) {
            actualPath = parent?.path;
          }
          console.log(actualPath);
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
                  user_id: user.session.user.id,
                  username: user.profile.username,
                  created_at: data[0].creation_time,
                  content: comment,
                  score: 0,
                  likes: 0,
                  path: data[0].returned_path,
                  depth: commentDepth,
                  comments: [],
                  avatar_url: profile.avatar_url,
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
        {parent?.path === 'root' ? <h4>Add a New Comment</h4> : <h3>Add a New Reply</h3>}

        <textarea autoFocus
          ref={textareaRef}
          name="comment"
          placeholder={parent?.path === 'root' ? 'Your Comment Here' : 'Your Reply Here'}
          className="text-gray-800 p-4 rounded"
          onChange={({ target: { value } }) => {
            setComment(value);
          }}
        />
        <div className="flex gap-2 comment-submit-container">
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



