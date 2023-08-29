import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { castVote } from "./AllPosts";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";


export default function CommentDetails ({
  key,
  comment,
  myVotes,
  onVoteSuccess,
  index,
  onSinglePageVoteSuccess,
  parentIsTimeline
}) {
  const userContext = useContext(UserContext);
  const { session } = useContext(UserContext);
  const parentIsTimelined = parentIsTimeline;

    return (

      <>
          <div class="head flex justify-between items-start" key={key}>
            <div class="head-left flex flex-col">
              <div class="flex items-center">
                <div class="image"></div>
                <div class="name">
                  <div class="username">
                    {comment?.username_name}
                    {/* <span class="material-icons-round">verified</span> */}
                  </div>
                  <div class="handle">@{comment?.username}</div>
                  <Link to={`/peace-wall/post/${comment?.id}`} className="flex-auto">
                  <div class="tweet-content-container">
                    {comment?.content?.split("\n").map((paragraph) => (
                      <p className="text-left">{paragraph}</p>
                    ))}
                  </div>
                  </Link>
                </div>
              </div>
            </div>
            <div class="head-right">
              <div class="date">
                {comment &&
                `${timeAgo(comment?.created_at)} ago`}
              </div>
            </div>
          </div>
          <div class="controls flex items-center border border-dark">
            <div class="btn">
              <i class="fa-regular fa-comment"></i>
              <span>100k</span>
            </div>
            <div class="btn">
              <i class="fa-solid fa-retweet"></i>
              <span>10k</span>
            </div>
            <div class="btn">
              <input type="checkbox" name="" id="like" />
              <label for="like"></label>
              <span>300</span>
            </div>
            <span>
              {comment?.score}
              <UpVote
                direction="up"
                filled={
                  myVotes &&
                  comment &&
                  myVotes[comment?.id] === "up"
                }
                enabled={!!userContext.session}
                onClick={async () => {
                  if (!comment) {
                    return;
                  }
                  console.log(myVotes);
                  let voteType = myVotes[comment?.id] === "up" ? "delete" : "up";

                  await castVote({
                    postId: comment?.id,
                    userId: userContext.session?.user?.id,
                    voteType: voteType,
                    onSuccess: () => {
                      console.log('parent ' + parentIsTimelined)
                      if (parentIsTimeline) {
                        onVoteSuccess(comment?.id, voteType);
                      }

                      onSinglePageVoteSuccess();
                    },
                  });
                }}
              />
            </span>
            <div class="btn">
              <i class="fa-solid fa-arrow-up-from-bracket"></i>
            </div>
          </div>
        </>
    );


}