const supabaseUrl = import.meta.env.VITE_SUPABASE_API_URL;

export function ProfilePicture ({avatar_url}) {
  let avatarPath = '/storage/v1/object/public/avatars/'
  if (avatar_url === '0.6879050797391486.jpg' || avatar_url === '0.27244231307398037.jpg'
  || avatar_url === '0.6161512621186469.jpg') {
    avatarPath = '/storage/v1/object/public/default_avatars/'
  }
  const avatarFullUrl = avatar_url ? `${supabaseUrl}${avatarPath}${avatar_url}` : null;

  return (
    <img src={avatarFullUrl} alt="User Avatar" className="user-avatar"/>
  )
}