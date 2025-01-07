// Avatar.jsx

import { useEffect, useState } from 'react';
import { supaClient } from '../layout/supa-client';

export default function Avatar({ url, size, onUpload, deleteAvatar, profileIsPublic = false }) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (url) {
      if (url.startsWith('/')) {
        // It's a default avatar stored in the public folder
        setAvatarUrl(url);
      } else {
        // It's a user-uploaded avatar stored in Supabase storage
        downloadImage(url);
      }
    }
  }, [url]);

  async function downloadImage(path) {
    try {
      const { data, error } = await supaClient.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  }

  return (
    <div>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar image"
          style={{ height: size, width: size }}
        />
      ) : (
        <div className="avatar no-image" style={{ height: size, width: size }} />
      )}

      {!profileIsPublic && (
        <div>
          <button className="action-button delete-avatar width-125" onClick={deleteAvatar}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
