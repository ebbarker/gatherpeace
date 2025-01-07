const supabaseUrl = import.meta.env.VITE_SUPABASE_API_URL;

export function ProfilePicture({ avatar_url, mini = null }) {
  let avatarFullUrl = null;

  if (avatar_url) {
    if (avatar_url.startsWith('/')) {
      // Default avatar in public folder
      avatarFullUrl = avatar_url;
    } else {
      // User-uploaded avatar in Supabase storage
      avatarFullUrl = `/storage/v1/object/public/avatars/${avatar_url}`;
    }
  } else {
    // Placeholder image if no avatar is set
    avatarFullUrl = '/default_avatars/peace.jpg'; // Adjust as needed
  }

  return (
    <img
      src={avatarFullUrl}
      alt="User Avatar"
      className={mini ? 'mini-user-avatar' : 'user-avatar'}
    />
  );
}
