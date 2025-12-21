"use client";
import { API_URL, authFetch } from '@/lib/api';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCamera, FaUser } from 'react-icons/fa';

export default function BusinessProfilePhoto({ businessData, isDisabled = true, onPhotoUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(businessData?.profileImage || null);
  const [localPreview, setLocalPreview] = useState(null); // For instant preview
  const fileInputRef = useRef(null);

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

    // Show instant local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await authFetch(`${API_URL}/api/v1/businesses/upload-profile-photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      toast.success('Profile photo updated successfully');
      
      if (data.data?.profileImage) {
        setImageUrl(data.data.profileImage);
        setLocalPreview(null); // Clear preview, use server URL
      }

      if (onPhotoUpdated) {
        onPhotoUpdated();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
      setLocalPreview(null); // Clear preview on error
    } finally {
      setUploading(false);
    }
  };

  // Handle both Cloudinary URLs (http...) and relative paths
  // localPreview takes priority for instant feedback
  const profileImageUrl = localPreview || (imageUrl 
    ? (imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`)
    : null);

  return (
    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-emerald-500 dark:border-emerald-400">
      {/* Base background (fallback) */}
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 z-0">
        {!profileImageUrl && <FaUser size={48} />}
      </div>
      
      {/* Profile Image - above background */}
      {profileImageUrl && (
        <img
          src={profileImageUrl}
          alt={businessData?.name || 'Business'}
          className="absolute inset-0 w-full h-full object-cover z-10"
          onError={(e) => {
            console.log('Image failed to load:', profileImageUrl);
            e.target.style.display = 'none';
          }}
        />
      )}
      
      {/* Edit overlay - above everything */}
      {!isDisabled && (
        <>
          <label
            htmlFor="business-photo-upload"
            className="absolute inset-0 z-20 bg-transparent hover:bg-black/50 transition-all cursor-pointer flex items-center justify-center group"
          >
            {uploading ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <FaCamera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
            )}
          </label>

          <input
            ref={fileInputRef}
            id="business-photo-upload"
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



