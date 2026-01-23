import Avatar from "../user-profile/Avatar";

// Thin wrapper so the feed/header use the exact same avatar logic
// as the profile page (including Supabase download -> blob URL).
export function ProfilePicture({ avatar_url, mini = null }) {
  const size = mini ? 32 : 48; // tune to match your existing CSS

  return (
    <Avatar
      url={avatar_url}
      size={size}
      profileIsPublic={true} // hides delete button
    />
  );
}
