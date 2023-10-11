import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { castVote } from "./AllPosts";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";
import { VoteContext } from "./contexts/VoteContext";


export default function CommentDetails ({
  key,
  comment,
  myVotes,
  onVoteSuccess = ()=>{},
  index,
  onSinglePageVoteSuccess = ()=>{},

}) {
  const userContext = useContext(UserContext);
  const { session } = useContext(UserContext);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);

  return (
    <>
      <div className="head flex justify-between items-start" key={key}>
        <div className="head-left flex flex-col">
          <div className="flex items-center">
            <div className="image"></div>
            <div className="name">
              <div className="username">
                {comment?.author_name}
              </div>
              <div className="handle">@{comment?.username}</div>
              <Link to={`/peace-wall/post/${comment?.id}`} className="flex-auto">
                <div className="tweet-content-container">
                  {comment?.content?.split("\n").map((paragraph) => (
                    <p className="text-left">{paragraph}</p>
                  ))}
                  <div className="comment-id">{comment?.id}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className="head-right">
          <div className="date">
            {comment && `${timeAgo(comment?.created_at)} ago`}
          </div>
        </div>
      </div>
      <div className="controls flex items-center border border-dark">
        <div className="btn">
          <i className="fa-regular fa-comment"></i>
          <span>100k</span>
        </div>
        <div className="btn">
          <i className="fa-solid fa-retweet"></i>
          <span>10k</span>
        </div>
        <div className="btn">
          <input type="checkbox" name="" id="like" />
          <label htmlFor="like"></label>
          <span>300</span>
        </div>
        <span>
          {comment?.score}
          <UpVote
            direction="up"
            filled={myContextVotes[comment?.id] === "up"}
            enabled={!!userContext.session}
            onClick={async () => {
              if (!comment) {
                return;
              }
              let voteType = myContextVotes[comment?.id] === "up" ? "delete" : "up";



              await castVote({
                postId: comment?.id,
                userId: userContext.session?.user?.id,
                voteType: voteType,
                onSuccess: () => {
                  onVoteSuccess(comment?.id, voteType);
                  // onSinglePageVoteSuccess();
                  setMyContextVotes((myContextVotes) => {
                    if (voteType === 'delete') {
                      delete myContextVotes[comment.id];
                    }
                    if (voteType === 'up') {
                      myContextVotes[comment.id] = 'up';
                    }

                    return myContextVotes;
                  });
                },
              });
            }}
          />
        </span>
        <div className="btn">
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
        </div>
      </div>
    </>
  );
}
