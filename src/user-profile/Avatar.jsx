import { useEffect, useState } from 'react'
import { supaClient } from "../layout/supa-client";

export default function Avatar({ url, size, onUpload, deleteAvatar, profileIsPublic = false }) {
  const [avatarUrl, setAvatarUrl] = useState(null)
  // const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path) {
    console.log('path: ' + path);
    let bucketName = 'avatars';
    if (path === '0.27244231307398037.jpg' ||
        path === '0.6161512621186469.jpg' ||
        path === '0.6879050797391486.jpg') {
          bucketName = 'default_avatars'
        }
    try {
      const { data, error } = await supaClient.storage.from(bucketName).download(path)
      if (error) {
        throw error
      }
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {

      console.log('Error downloading image: ', error.message)
    }
  }


  return (
    <div>
      {avatarUrl && url ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar image"
          style={{ height: size, width: size }}
        />
      ) : (
        <div className="avatar no-image" style={{ height: size, width: size }} />
      )}

      {avatarUrl && url && !profileIsPublic && <div>
        <button className="action-button delete-avatar width-125" onClick={deleteAvatar}>
          Delete
        </button>
      </div>}
    </div>
  )
}