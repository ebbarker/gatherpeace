import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./layout/App";
import { CreateLetter } from "./CreateLetter";
import { supaClient } from "./layout/supa-client";
import { AddYourName } from "./addYourName/AddYourName";
import { VoteContext } from "./contexts/VoteContext";
import { Stepform } from "./createPostForm/Stepform";
//import { Letter } from "./Letter"
import { SearchBar } from "./search-bar/SearchBar"
import { NewsFeed } from "./newsFeed/NewsFeed";
import { TrendingTags } from "./trending/TrendingTags";
import LoginPrompt from "./layout/LoginPrompt";
import Dialog from "./layout/Dialog";
import { CreateWallPost } from "./createPostForm/CreateWallPost";


export function AllPosts({ parent }) {
  const { session, profile, updateProfile } = useContext(UserContext);
  const { pageNumber } = useParams(1);
  const [letters, setLetters] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [writingMessage, setWritingMessage] = useState(false);
  const [addingName, setAddingName] = useState(false);
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [writingWallPost, setWritingWallPost] = useState(false);


  const term = searchParams.get("query");
  const location = useLocation();
  const navigate = useNavigate();

  const showMessageDialog = (e) => {

    e.preventDefault();
    setWritingMessage(true);
  }

  const showAddNameDialog = (e) => {

    e.preventDefault();
    if (!session) {
      setShowLoginModal(true); // Show login modal if not logged in
    } else {
      setAddingName(true);
    }
  }

  const showWallPostDialog = (e) => {
    e.preventDefault();

      setWritingWallPost(true);

  };

  //8-20-24 - i believe the page should always be one, so changing from:
 // navigate(`/peace-wall/${pageNumber || 1}?query=${encodeURIComponent(searchKeyword)}`);
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/peace-wall/1?query=${encodeURIComponent(searchKeyword)}`);
    //getLetters(searchKeyword);
  };

  useEffect(() => {
    const openMessage = searchParams.get("addName");
    if (openMessage === "true") {
      setAddingName(true); // Open the "Write a Peace Message" section
      document.getElementById("peace-form")?.scrollIntoView({ behavior: "smooth" });

    }
  }, [searchParams]);

  // useEffect(() => {
  //   const searchParams = new URLSearchParams(location.search);
  //   const query = searchParams.get('query');
  //   if (query !== null) {
  //     setSearchKeyword(decodeURIComponent(query));
  //   } else {
  //     setSearchKeyword('');
  //   }
  // }, [location.search]);


  useEffect(() => {
    // const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query');
    if (query !== null) {
      setSearchKeyword(decodeURIComponent(query));
    } else {
      setSearchKeyword('');
    }

    getLetters();
  }, [pageNumber, term]);

  useEffect(() => {
    fetchTotalPages();

  }, [term]);



  async function getLetters() {
    const queryPageNumber = pageNumber ? +pageNumber : 1;
    //let searchCondition = searchKeyword.length > 0 ? { search_keyword: searchKeyword } : {};
  // console.log('USER SESSION: ' + JSON.stringify(session.user));
  // console.log('PROFILE: ' + JSON.stringify(profile));
    try {

      const { data: lettersData, error: lettersError } = await supaClient
        .rpc("get_letters_with_tsv", {
          page_number: queryPageNumber,
          search_keyword: term || null,
          page_filter: parent,
        })
        .select("*");

      if (lettersError) {
        throw lettersError;
      }
      console.log('lettersData: ' + JSON.stringify(lettersData));
      setLetters(lettersData ? lettersData : []);
    } catch (error) {
      console.error("Error fetching letters:", error);
    }
  }



  async function fetchTotalPages() {

    try {
      let countQuery;

      // If there's a search term, use an RPC to get the total count for full-text search
      if (term && term.length) {
        const { data: countData, error: countError } = await supaClient
          .rpc('get_total_letters_count', { search_keyword: term, page_filter: parent });

        if (countError) {
          throw ('count error: ' + JSON.stringify(countError));
        }

        // Set total pages based on the count returned by the RPC
        const totalCount = countData?.[0]?.total_count || 0;
        setTotalPages(Math.ceil(totalCount / 10));

      } else {
        // If there's no search term, just count letters directly
        countQuery = supaClient.from("letters").select("*", { count: "exact", head: true });

        // Apply the filter for 'post_type' if necessary
        if (parent === "list-of-names") {
          countQuery = countQuery.eq('post_type', 'signature');
        }

        const { count: totalCount, error: countError } = await countQuery;

        if (countError) {
          throw ('count error: ' + JSON.stringify(countError));
        }

        // Set total pages based on the count from the normal query
        setTotalPages(totalCount ? Math.ceil(totalCount / 10) : 0);
      }

    } catch (error) {
      console.error("Error fetching total pages:", error);
    }
  }

  const deleteLetter = async (id, type = null) => {
    if (type === 'name') {
      try {


        // Call the delete_name function
        const { data, error } = await supaClient.rpc('delete_name', {
          userId: session.user.id,
          letterId: id
        });

        if (error) {
          throw error; // Throw the error to be caught in the catch block
        }

        setLetters(letters => letters.filter(letter => letter.id !== id));
        updateProfile({has_signed: false});
        // You can perform additional actions here, such as updating the UI

      } catch (error) {
        console.error('Error deleting name:', error.message);
        alert('There was an issue deleting your name. Please try again.');
        // Handle the error (e.g., show a notification to the user)
      }
    } else {
      try {
        const { data, error } = await supaClient.rpc('delete_letter_and_comments', { letter_id: id });

        if (error) {
          console.error('Error deleting letter and comments:', error.message);
        } else {
          setLetters(letters => letters.filter(letter => letter.id !== id));
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }

  };

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
      {!writingMessage && !addingName && !writingWallPost && (
        <div className="call-to-action-container">
          {!profile?.has_signed && (
            <button className="add-your-name action-button" onClick={showAddNameDialog}>
              <span>Write a Peace Message</span>
            </button>
          )}
          {profile?.has_signed && (
            <>
              <button className="write-on-wall action-button" onClick={showWallPostDialog}>
                <span>Write on the Peace Wall</span>
              </button>
              <button className="write-a-message action-button" onClick={showMessageDialog}>
                <span>Send a Peace Letter</span>
              </button>
            </>
          )}
        </div>
      )}

        {addingName && (
          <AddYourName letters={letters} setLetters={setLetters} setAddingName={setAddingName} isOpen={addingName}/>
        )}

        {writingMessage && (
          <Stepform letters={letters} setLetters={setLetters} setWritingMessage={setWritingMessage} />
        )}
        {writingWallPost && (
          <CreateWallPost posts={letters} setPosts={setLetters} setWritingWallPost={setWritingWallPost} />
        )}
      <TrendingTags />
      <SearchBar
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        handleSearch={handleSearch}
        getLetters={getLetters}
      />

      <NewsFeed
        letters={letters}
        setLetters={setLetters}
        onVoteSuccess={handleVoteSuccess}
        deleteLetter={deleteLetter}
      />

      <Pagination
        totalPages={totalPages}
        currentPage={pageNumber ? +pageNumber : 0}
        searchKeyword={searchKeyword}
        pageNumber={pageNumber}
      />

      {showLoginModal && <LoginPrompt setShowLoginModal={setShowLoginModal} showLoginModal={showLoginModal}/>}
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
        console.error('error upvoting: ' + error.message);
      } else {
        onSuccess();
      }
    });
  } else if (voteType === "delete") {
    await supaClient.rpc("delete_letter_vote", { p_user_id: userId, p_letter_id: letterId })
    .then(({ data, error }) => {
      if (error) {
        console.error('error deleting: ' + error.message);
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
  postPath,
  userId,
  voteType,
  onSuccess = () => {},
  onError = (error) => console.log('error!!!'),
  comment
}) {
  try {
    if (voteType === "up") {
      const { data, error } = await supaClient
        .from("post_votes")
        .upsert(
          {
            comment_id: postId,
            comment_path: postPath,
            user_id: userId,
            vote_type: voteType,
          },
          { onConflict: ["comment_id", "user_id"] }
        );

      if (error) {
        console.error('Error upserting vote:', error);
        onError(error);
      } else {
        onSuccess(data);
      }
    } else if (voteType === "delete") {
      const { data, error } = await supaClient
        .rpc("delete_post_vote", { p_user_id: userId, p_comment_id: postId });

      if (error) {
        console.error('Error deleting vote:', error);
        onError(error);
      } else {
        onSuccess(data);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    onError(error);
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
          to={searchKeyword ? `/peace-wall/1?query=${encodeURIComponent(searchKeyword)}` : `/peace-wall/1`}
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
          to={searchKeyword ? `/peace-wall/${pageNumbers}?query=${encodeURIComponent(searchKeyword)}` : `/peace-wall/${pageNumbers}`}
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
          to={searchKeyword ? `/peace-wall/${totalPages}?query=${encodeURIComponent(searchKeyword)}` : `/peace-wall/${totalPages}`}
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