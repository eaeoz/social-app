import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Avatar, Card, useTheme, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store';
import { apiService } from '../services';

export default function EditProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, setUser } = useAuthStore();

  const [nickName, setNickName] = useState(user?.nickName || user?.username || '');
  const [age, setAge] = useState(user?.age || 18);
  const [gender, setGender] = useState<'Male' | 'Female'>(user?.gender || 'Male');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to change your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    setIsUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      // Create form data with the image
      const formData = new FormData();
      
      // Get file extension from URI
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // Append the image file
      formData.append('profilePicture', {
        uri: imageUri,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Also include current profile data
      formData.append('nickName', nickName.trim());
      formData.append('age', age.toString());
      formData.append('gender', gender);

      const response = await apiService.updateProfileWithForm(formData);

      // Update user in store
      if (user) {
        setUser({
          ...user,
          profilePicture: response.user.profilePicture,
          nickName: response.user.nickName,
          age: response.user.age,
          gender: response.user.gender,
        });
      }

      setSuccess('Profile picture updated successfully!');
      setSelectedImage(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload profile picture');
      setSelectedImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    if (!nickName.trim()) {
      setError('Display name is required');
      return;
    }

    if (nickName.trim().length < 3) {
      setError('Display name must be at least 3 characters');
      return;
    }

    if (nickName.trim().length > 30) {
      setError('Display name must be at most 30 characters');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('nickName', nickName.trim());
      formData.append('age', age.toString());
      formData.append('gender', gender);

      const response = await apiService.updateProfileWithForm(formData);

      // Update user in store - merge with existing user to keep accessToken
      if (user) {
        setUser({ 
          ...user, 
          nickName: response.user.nickName,
          age: response.user.age,
          gender: response.user.gender,
        });
      }
      
      setSuccess('Profile updated successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <Card style={styles.card}>
          <Card.Content style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {selectedImage || user.profilePicture ? (
                <Avatar.Image 
                  size={100} 
                  source={{ uri: selectedImage || user.profilePicture }} 
                />
              ) : (
                <Avatar.Text 
                  size={100} 
                  label={(user.username || user.nickName || 'U').substring(0, 2).toUpperCase()} 
                />
              )}
              <TouchableOpacity 
                style={[styles.cameraButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleChangePhoto}
                disabled={isUploadingImage}
              >
                <IconButton
                  icon="camera"
                  iconColor="#FFFFFF"
                  size={20}
                  style={styles.cameraIcon}
                />
              </TouchableOpacity>
            </View>
            <Text variant="bodyMedium" style={[styles.avatarHint, { color: theme.colors.onSurfaceVariant }]}>
              @{user.username}
            </Text>
            <Button
              mode="text"
              onPress={handleChangePhoto}
              disabled={isUploadingImage}
              loading={isUploadingImage}
              icon="camera"
              compact
              style={styles.changePhotoButton}
            >
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
            </Button>
          </Card.Content>
        </Card>

        {/* Edit Form */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profile Information
            </Text>

            <TextInput
              label="Display Name *"
              value={nickName}
              onChangeText={setNickName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              disabled={isLoading}
              maxLength={30}
            />

            <Text variant="bodySmall" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Age: {age} years old
            </Text>
            <View style={styles.sliderContainer}>
              <View style={styles.ageRange}>
                <Text variant="bodySmall">18</Text>
                <Text variant="bodySmall">100</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { 
                      width: `${((age - 18) / 82) * 100}%`,
                      backgroundColor: theme.colors.primary 
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.sliderThumb,
                    { 
                      left: `${((age - 18) / 82) * 100}%`,
                      backgroundColor: theme.colors.primary
                    }
                  ]}
                  onTouchStart={() => {}}
                />
              </View>
              <View style={styles.ageButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setAge(Math.max(18, age - 1))}
                  disabled={isLoading || age <= 18}
                  compact
                  style={styles.ageButton}
                >
                  -
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setAge(Math.min(100, age + 1))}
                  disabled={isLoading || age >= 100}
                  compact
                  style={styles.ageButton}
                >
                  +
                </Button>
              </View>
            </View>

            <Text variant="bodySmall" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Gender
            </Text>
            <View style={styles.genderContainer}>
              <Chip
                icon="gender-male"
                selected={gender === 'Male'}
                onPress={() => !isLoading && setGender('Male')}
                style={[
                  styles.genderChip,
                  gender === 'Male' && { backgroundColor: theme.colors.primary }
                ]}
                textStyle={gender === 'Male' && { color: theme.colors.onPrimary }}
                disabled={isLoading}
              >
                Male
              </Chip>
              <Chip
                icon="gender-female"
                selected={gender === 'Female'}
                onPress={() => !isLoading && setGender('Female')}
                style={[
                  styles.genderChip,
                  gender === 'Female' && { backgroundColor: theme.colors.primary }
                ]}
                textStyle={gender === 'Female' && { color: theme.colors.onPrimary }}
                disabled={isLoading}
              >
                Female
              </Chip>
            </View>

            <TextInput
              label="Email"
              value={user.email}
              mode="outlined"
              style={styles.input}
              disabled
              editable={false}
              right={<TextInput.Icon icon="lock" />}
            />

            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
              * Required field. Email cannot be changed.
            </Text>

            {error ? (
              <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}

            {success ? (
              <Text variant="bodyMedium" style={[styles.successText, { color: '#4CAF50' }]}>
                ✅ {success}
              </Text>
            ) : null}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
            icon="content-save"
          >
            Save Changes
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            disabled={isLoading}
            icon="close"
          >
            Cancel
          </Button>
        </View>

        {/* Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.infoTitle}>
              💡 Profile Tips
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
              • Choose a display name that represents you{'\n'}
              • Your age and gender help connect with others{'\n'}
              • Your username and email cannot be changed{'\n'}
              • Changes are saved immediately
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cameraIcon: {
    margin: 0,
    padding: 0,
  },
  changePhotoButton: {
    marginTop: 8,
  },
  avatarHint: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  ageRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 12,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    marginLeft: -10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  ageButton: {
    minWidth: 60,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genderChip: {
    flex: 1,
  },
  hint: {
    marginTop: 4,
    marginBottom: 12,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
  },
  successText: {
    marginTop: 8,
    marginBottom: 8,
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  infoTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
});
