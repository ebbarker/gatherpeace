import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreateLetter } from "./CreateLetter";
import { supaClient } from "./layout/supa-client";
import { timeAgo } from "./layout/time-ago";
import { UpVote } from "./UpVote";

import { LetterView } from "./LetterView"
import { VoteContext } from "./contexts/VoteContext";
import { Stepform } from "./createPostForm/Stepform";
import { Letter } from "./Letter"
import { SearchBar } from "./search-bar/SearchBar"


export function AllPosts() {
  const { session } = useContext(UserContext);
  const { pageNumber } = useParams();
  //const [bumper, setBumper] = useState(0);
  const [letters, setLetters] = useState([]);
  //const [voteBumper, setVoteBumper] = useState(0);
  const [myVotes, setMyVotes] = useState({});
  const [totalPages, setTotalPages] = useState(0);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchFilter, setSearchFilter] = useState('both');
  const [writingMessage, setWritingMessage] = useState(false);

  const showMessageDialog = (e) => {
    e.preventDefault();
    setWritingMessage(true);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    getLetters();
    // Trigger re-fetching of letters with the new search keyword and filter
  };


  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  useEffect(() => {
    if (searchKeyword.length) return;
    getLetters();


  }, [pageNumber]);

  async function getLetters() {
    console.log('get letterssdfsdf');
    const queryPageNumber = pageNumber ? +pageNumber : 1;
    console.log (' promise all query called')
    Promise.all([
      supaClient
        .rpc("get_letters_with_tsv", {
          page_number: queryPageNumber,
          search_keyword: searchKeyword.length? searchKeyword : null,
        })
        .select("*")
        .then(({ data }) => {
          console.log('data from getletters: ' + data);
          setLetters(data);

        }),
      supaClient
        .from("letters")
        .select("*", { count: "exact", head: true })
        .then(({ count }) => {
          count == null ? 0 : setTotalPages(Math.ceil(count / 10));
        }),
    ]);
  }


  return (
    <>
      {/* {session && <Createletter letters={letters} setLetters={setLetters}/>} */}
      {!writingMessage &&
        <div className="call-to-action-container">
          <button className="write-a-message-button" onClick={showMessageDialog}>Write a Peace Message</button>
        </div>}
      {writingMessage && <Stepform letters={letters} setLetters={setLetters}/> }

      <SearchBar
        searchFilter={searchFilter}
        searchKeyword={searchKeyword}
        setSearchFilter={setSearchFilter}
        setSearchKeyword={setSearchKeyword}
        handleSearch={handleSearch}
        getLetters={getLetters}
      />

      <div id="news-feed" className="news-feed-container">

        {letters?.map((letter, i) => {
          letter.path = 'root';
          return (
          <Letter
            key={letter?.id}
            letters={letters}
            index={i}
            letterData={letter}
            parentIsTimeline={true}
            onVoteSuccess={(id, direction) => {

                setLetters(letters => {
                  return letters.map((current) => {
                  if (current.id == id) {
                    if (direction === 'delete') {
                      return {
                        ...current,
                        likes: current.likes - 1
                      }
                    }
                    if (direction === 'up') {
                      return {
                        ...current,
                        likes: current.likes + 1
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
          // <letterView letterId={letter.id} key={i}/>
          })}
      </div>
      <Pagination
        totalPages={totalPages}
        currentPage={pageNumber ? +pageNumber : 0}
      />
    </>
  );
}

export async function castLetterVote({
  letterId,
  userId,
  voteType,
  onSuccess = () => {},
  onError = (error) => console.log('error!!!') // Optional: define an onError callback for handling errors
}) {
  console.log('castVote called for iddfgdfg: ' + letterId + " " + userId + ' vote type: ' + voteType);


  if (voteType === "up") {
    await supaClient.rpc("insert_letter_vote",
      {
        p_letter_id: letterId,
        p_user_id: userId,
        p_vote_type: voteType,
      })
    .then(({ data, error }) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log('data: ' + JSON.stringify(data) + ' error: ' + error);
        onSuccess();
      }
    });
  } else if (voteType === "delete") {
    await supaClient.rpc("delete_letter_vote", { p_user_id: userId, p_letter_id: letterId })
    .then(({ data, error }) => {
      if (error) {
        console.error(error.message);
      } else {
        onSuccess();
      }
    })
  }
}

// .then(({ data, error }) => {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log(JSON.stringify(data));

//     appendLetter(user.session?.user.id, content, data[0].new_letter_id, data[0].creation_time);
//   }
// });

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

export async function castPostVote({
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
    ).then(onSuccess());

  } else if (voteType === "delete") {
   const res = await supaClient
        .rpc("delete_post_vote", { p_user_id: userId, p_post_id: postId })
        .then(onSuccess());
  }

}



export async function getVoteId(
  userId,
  letterId
){
  const { data, error } = await supaClient
    .from("letter_votes")
    .select("id")
    .eq("user_id", userId)
    .eq("letter_id", letterId)
    .single();
  return data?.id || undefined;
}
