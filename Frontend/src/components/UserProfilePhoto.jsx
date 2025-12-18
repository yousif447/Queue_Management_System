"use client";
import { API_URL } from '@/lib/api';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCamera, FaUser } from 'react-icons/fa';

export default function UserProfilePhoto({ userData, isDisabled = true, onPhotoUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(userData?.profileImage || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userData?.profileImage) {
      setImageUrl(userData.profileImage);
    }
  }, [userData?.profileImage]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`${API_URL}/api/v1/users/upload-profile-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      toast.success('Profile photo updated successfully');
      
      if (data.data?.profileImage) {
        setImageUrl(data.data.profileImage);
      }

      if (onPhotoUpdated) {
        onPhotoUpdated();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const profileImageUrl = imageUrl 
    ? `${API_URL}${imageUrl}`
    : null;

  return (
    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-emerald-500 dark:border-emerald-400 bg-gradient-to-br from-emerald-500 to-teal-600">
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={userData?.name || 'User'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
          {userData?.name?.charAt(0).toUpperCase() || <FaUser size={48} />}
        </div>
      )}
      
      {!isDisabled && (
        <>
          <label
            htmlFor="user-photo-upload"
            className={`absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all ${uploading ? 'cursor-wait' : 'cursor-pointer'} flex items-center justify-center group`}
          >
            {uploading ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <FaCamera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
            )}
          </label>

          <input
            ref={fileInputRef}
            id="user-photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}



