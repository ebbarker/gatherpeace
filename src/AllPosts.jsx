import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreateLetter } from "./CreateLetter";
import { supaClient } from "./layout/supa-client";
import { AddYourName } from "./addYourName/AddYourName";
import { VoteContext } from "./contexts/VoteContext";
import { Stepform } from "./createPostForm/Stepform";
//import { Letter } from "./Letter"
import { SearchBar } from "./search-bar/SearchBar"
import { NewsFeed } from "./newsFeed/NewsFeed";

export function AllPosts({ parent }) {
  const { session } = useContext(UserContext);
  const { pageNumber } = useParams();
  const [letters, setLetters] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState(null);
  const [searchFilter, setSearchFilter] = useState('both');
  const [writingMessage, setWritingMessage] = useState(false);
  const [addingName, setAddingName] = useState(false);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const location = useLocation();
  const navigate = useNavigate();

  const showMessageDialog = (e) => {
    console.log('clicked show MESSAGE');
    e.preventDefault();
    setWritingMessage(true);
  }

  const showAddNameDialog = (e) => {
    console.log ('clicked show NAME')
    e.preventDefault();
    setAddingName(true);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/peace-wall/${pageNumber || 1}?query=${encodeURIComponent(searchKeyword)}`);
    getLetters();
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query');
    if (query !== null) {
      setSearchKeyword(decodeURIComponent(query));
    } else {
      setSearchKeyword('');
    }
    getLetters();
    console.log('got letters...');
  }, [pageNumber, location.search]);

  useEffect(() => {
    fetchTotalPages();

  }, []);

  async function getLetters() {
    const queryPageNumber = pageNumber ? +pageNumber : 1;
    //let searchCondition = searchKeyword.length > 0 ? { search_keyword: searchKeyword } : {};

    try {
      console.log('page_number:', queryPageNumber);
      console.log('search_keyword:', searchKeyword);
      console.log('page_filter:', parent);
      const { data: lettersData, error: lettersError } = await supaClient
        .rpc("get_letters_with_tsv", {
          page_number: queryPageNumber,
          search_keyword: searchKeyword,
          page_filter: parent,
        })
        .select("*");

      if (lettersError) {
        throw lettersError;
      }
      console.log("Fetched letters data:", lettersData);
      console.log ('page_number: ' + queryPageNumber);
      console.log('search_keyword: ' + searchKeyword);
      console.log('page_filter: ' + parent);

      setLetters(lettersData ? lettersData : []);
    } catch (error) {
      console.error("Error fetching letters:", error);
    }
  }

  async function fetchTotalPages() {
    console.log(parent);
    try {
      let countQuery = supaClient.from("letters").select("*", { count: "exact", head: true });

      if (parent === "list-of-names") {
        countQuery = countQuery.eq('post_type', 'signature');
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        throw ('count error: ' + JSON.stringify(countError));
      }

      setTotalPages(totalCount ? Math.ceil(totalCount / 10) : 0);
    } catch (error) {
      console.error("Error fetching total pages:", error);
    }
  }

  const handleVoteSuccess = (id, direction) => {
    setLetters(letters => {
      return letters.map((current) => {
        if (current.id === id) {
          if (direction === 'delete') {
            return {
              ...current,
              likes: current.likes - 1
            };
          }
          if (direction === 'up') {
            return {
              ...current,
              likes: current.likes + 1
            };
          }
        } else {
          return current;
        }
      });
    });
  };

  return (
    <>
      {!writingMessage && !addingName &&
        <div className="call-to-action-container" >
          <button className="add-your-name action-button" onClick={showAddNameDialog}>
            <span>Add Your Name</span>
          </button>
          <button className="write-a-message action-button" onClick={showMessageDialog}>
            <span>Write a Peace Message</span>
          </button>
        </div>}
      {addingName && <AddYourName letters={letters} setLetters={setLetters} setAddingName={setAddingName} />}
      {writingMessage && <Stepform letters={letters} setLetters={setLetters} setWritingMessage={setWritingMessage}/>}

      <SearchBar
        searchFilter={searchFilter}
        searchKeyword={searchKeyword}
        setSearchFilter={setSearchFilter}
        setSearchKeyword={setSearchKeyword}
        handleSearch={handleSearch}
        getLetters={getLetters}
      />

      <NewsFeed
        letters={letters}
        setLetters={setLetters}
        onVoteSuccess={handleVoteSuccess}
      />

      <Pagination
        totalPages={totalPages}
        currentPage={pageNumber ? +pageNumber : 0}
        searchKeyword={searchKeyword}
        pageNumber={pageNumber}
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

const selectedStyles = "border-2 border-white rounded p-2 bg-gray-700";
const notSelectedStyles = "rounded p-2 bg-gray-700";

function Pagination({
  totalPages,
  currentPage,
  searchKeyword,
  pageNumber
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
          to={`/peace-wall/${pageNumber}?query=${encodeURIComponent(searchKeyword)}`}
          key={1}
        >
          1
        </Link>
      ) : (
        <></>
      )}
      {currentPage > 6 ? <span data-e2e="starting-elipsis"> ... </span> : <></>}
      {middleButtons.map((pageNumbers) => (
        <Link
          key={pageNumbers}
          data-e2e={`page-${pageNumbers}`}
          className={
            currentPage === pageNumbers ? selectedStyles : notSelectedStyles
          }
          to={`/peace-wall/${pageNumbers}?query=${encodeURIComponent(searchKeyword)}`}
        >
          {pageNumbers}
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
          to={`/peace-wall/${pageNumber}?query=${encodeURIComponent(searchKeyword)}`}
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