import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { router, UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";

// export interface CreatePostProps {
//   newPostCreated?: () => void;
// }

export function CreatePost({ newPostCreated = () => {}, posts, setPosts }) {
  const user = useContext(UserContext);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  function appendPost(userId, title, content, newId) {
    let newPost = {
      id: newId,
      title,
      score: 0,
      username: user?.profile?.username,
      user_id: userId,
    }
    setPosts([newPost, ...posts])
  }
  return (
    <>
    <div></div>
      <form
        className="rounded border-2 p-4 ml-4 flex flex-col justify-start gap-4 mb-8"
        data-e2e="create-post-form"
        onSubmit={(event) => {
          event.preventDefault();
          supaClient
            .rpc("create_new_post", {
              userId: user?.session?.user?.id,
              title,
              content,
            })
            .then(({ data, error }) => {
              if (error) {
                console.log(error);
              } else {
                console.log(JSON.stringify(data))
                const newId = data;
                appendPost(user.session?.user.id, title, content, newId);
              }
            });
        }}
      >
        <h3>Create A New Post</h3>
        <input
          type="text"
          name="title"
          className="text-gray-800 p-2 rounded text-xl"
          placeholder="Your Title Here"
          onChange={({ target: { value } }) => {
            setTitle(value);
          }}
        />
        <textarea
          name="contents"
          placeholder="Your content here"
          className="text-gray-800 p-4 rounded h-24"
          onChange={({ target: { value } }) => {
            setContent(value);
          }}
        />
        <div>
          <button
            type="submit"
            className="bg-green-400 rounded font-display text-lg p-2"
          >
            Submit
          </button>
        </div>
      </form>
    </>
  );
}
