# Photo Editing Feature - Mobile App

## Overview
Added photo editing functionality to the mobile app's Edit Profile screen, allowing users to change their profile picture by either taking a photo with the camera or selecting one from their gallery.

## Features Implemented

### 1. Image Selection Options
- **Take Photo**: Opens the device camera to capture a new profile picture
- **Choose from Gallery**: Allows users to select an existing image from their photo library

### 2. Image Editing
- **Aspect Ratio**: Images are cropped to 1:1 (square) for consistency
- **Quality**: Images are compressed to 0.8 quality to optimize upload size
- **Preview**: Selected image is displayed immediately before upload

### 3. Upload Process
- Photo preview after selection (no immediate upload)
- Upload happens when user clicks "Save Changes" button
- Loading indicator during upload
- Success/Error feedback messages
- Profile picture updates after successful save

### 4. User Interface
- Camera icon button overlay on profile picture
- "Change Photo" button below the avatar
- Alert dialog with options (Take Photo / Choose from Gallery / Cancel)
- Visual feedback during upload process

## Technical Implementation

### Dependencies Used
- `expo-image-picker`: Already installed in package.json
  - Handles both camera and gallery access
  - Provides built-in image editing capabilities
  - Cross-platform compatibility (iOS & Android)

### Key Components Modified

#### EditProfileScreen.tsx
**New Features:**
- Image picker integration with permission handling
- Camera functionality with permission requests
- Image upload with FormData
- Real-time profile picture updates
- Loading states and error handling

**New Functions:**
1. `requestPermissions()` - Requests media library permissions
2. `pickImage()` - Opens image gallery selector
3. `takePhoto()` - Opens camera to capture new photo
4. `uploadImage()` - Uploads selected image to backend
5. `handleChangePhoto()` - Shows options dialog

### Backend Integration
The feature uses the existing `/auth/update-profile` endpoint which:
- Accepts `multipart/form-data` with `profilePicture` field
- Processes and uploads images to Appwrite storage
- Returns updated user profile with new picture URL
- Automatically handles old picture deletion

### Permissions Required
- **iOS**: Camera and Photo Library usage descriptions in app.json
- **Android**: Camera and Storage permissions automatically handled by Expo

## User Flow

1. User navigates to Edit Profile screen
2. User taps camera icon or "Change Photo" button
3. Alert dialog appears with options
4. User selects "Take Photo" or "Choose from Gallery"
5. Permission request appears (if not already granted)
6. User selects/captures image
7. Image editor appears (crop to square, adjust if needed)
8. User confirms selection
9. Selected photo previews in the avatar (no upload yet)
10. Button changes to "✓ Photo Selected"
11. Hint appears: "📷 New photo selected. Press 'Save Changes' to upload."
12. User can make other profile changes (name, age, gender)
13. User clicks "Save Changes" button
14. All changes including photo upload together
15. Success message appears
16. Profile updates throughout the app

## Security Features
- Permission validation before camera/gallery access
- Image format validation on backend
- File size limits enforced by backend
- Secure upload via authenticated API endpoint
- Old profile pictures automatically deleted

## Error Handling
- Permission denied alerts with clear messages
- Upload failure error messages
- Network error handling
- Invalid image format handling
- File size limit notifications

## UI/UX Enhancements
- Smooth loading states during upload
- Immediate visual feedback
- Clear success/error messages
- Disabled state during upload to prevent multiple submissions
- Responsive camera button overlay
- Material Design components for consistency

## Testing Recommendations

### Manual Testing
1. **Camera Functionality**
   - Test taking photo with camera
   - Verify image cropping works
   - Check permission handling
   
2. **Gallery Selection**
   - Test selecting from gallery
   - Try different image formats (JPG, PNG, HEIC)
   - Test with various image sizes
   
3. **Upload Process**
   - Verify upload progress indicator
   - Test with slow network
   - Test with no network (error handling)
   
4. **Profile Update**
   - Verify picture updates in Edit Profile screen
   - Check picture updates in Profile screen
   - Confirm picture persists after app restart

### Edge Cases to Test
- Very large images (> 5MB)
- Small images (< 100x100px)
- Non-square images
- Corrupted image files
- Permission denial scenarios
- Network interruption during upload

## Future Enhancements (Optional)

1. **Remove Photo Option**
   - Add ability to remove current profile picture
   - Revert to default avatar

2. **Image Filters**
   - Add basic filters (brightness, contrast)
   - Instagram-style filters

3. **Multiple Photos**
   - Support for photo gallery/carousel
   - Multiple profile pictures

4. **Advanced Editing**
   - Zoom and pan controls
   - Rotation options
   - Stickers or frames

5. **Compression Options**
   - Let users choose quality level
   - Show file size before upload

## Code Example

```typescript
// Example of how the photo is saved with other profile changes
const handleSave = async () => {
  // ... validation logic ...
  
  const formData = new FormData();
  formData.append('nickName', nickName.trim());
  formData.append('age', age.toString());
  formData.append('gender', gender);

  // Add profile picture if a new one was selected
  if (selectedImage) {
    const uriParts = selectedImage.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('profilePicture', {
      uri: selectedImage,
      name: `profile.${fileType}`,
      type: `image/${fileType}`,
    } as any);
  }

  const response = await apiService.updateProfileWithForm(formData);
  // ... update user in store ...
};
```

## Configuration Notes

### app.json Permissions (if not already configured)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app needs access to your photos to let you choose a profile picture.",
          "cameraPermission": "The app needs access to your camera to let you take a profile picture."
        }
      ]
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **Camera not opening**
   - Check camera permissions
   - Verify expo-image-picker is installed
   - Restart development server

2. **Upload fails**
   - Check network connection
   - Verify backend endpoint is accessible
   - Check file size limits
   - Review server logs

3. **Image doesn't update**
   - Check if upload was successful
   - Verify store is updating correctly
   - Clear app cache and restart

## Support
For issues or questions, refer to:
- Expo ImagePicker documentation: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Backend API documentation: See server/routes/authRoutes.js
- Profile management guide: PROFILE-MANAGEMENT-IMPLEMENTATION.md
