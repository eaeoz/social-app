import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, HelperText, RadioButton, Avatar, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services';
import { useAuthStore } from '../store';
import { API_URL } from '../constants/config';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const theme = useTheme();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    gender: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [allowUserPictures, setAllowUserPictures] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Fetch site settings to check if user pictures are allowed
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/site`);
        if (response.ok) {
          const data = await response.json();
          setAllowUserPictures(data.settings.allowUserPictures !== false);
        }
      } catch (err) {
        console.error('Failed to fetch site settings:', err);
        setAllowUserPictures(true); // Default to true if fetch fails
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSiteSettings();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload profile pictures.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          setError('Image size must be less than 5MB');
          return;
        }

        // Create image object
        const image = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `profile_${Date.now()}.jpg`,
        };

        setProfileImage(image);
        setError('');
        console.log('📷 Profile image selected:', image.name);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to select image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!formData.age) {
      setError('Please select your age');
      return false;
    }

    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Already submitting, ignoring duplicate request');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('📝 Attempting registration...');
      console.log('👤 Username:', formData.username);
      console.log('📧 Email:', formData.email);
      
      // If profile image exists, use FormData, otherwise use regular JSON
      let userData;
      
      if (profileImage && allowUserPictures && parseInt(formData.age) >= 18) {
        console.log('📷 Including profile picture in registration');
        
        // Create FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('username', formData.username);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('fullName', formData.fullName);
        formDataToSend.append('age', formData.age);
        formDataToSend.append('gender', formData.gender);
        
        // Append the profile picture
        formDataToSend.append('profilePicture', {
          uri: profileImage.uri,
          type: profileImage.type,
          name: profileImage.name,
        } as any);

        // Make direct axios call with FormData
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Registration failed');
        }

        const data = await response.json();
        userData = {
          ...data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      } else {
        // Regular registration without profile picture
        userData = await apiService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          age: formData.age,
          gender: formData.gender,
        });
      }
      
      console.log('✅ Registration successful!', userData);
      
      // Auto-login after successful registration
      await login(userData);
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('📊 Full error details:', JSON.stringify(err.response?.data, null, 2));
      
      let errorMessage = 'Registration failed';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check if backend server is running.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Cannot reach server. Please check your network connection and ensure the backend server is running.';
      } else if (err.response?.status === 400) {
        // Handle 400 errors more specifically
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = 'Invalid registration data. Please check your information and try again.';
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Generate age options (18-100)
  const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>
              💬 Netcify
            </Text>
            <Text variant="headlineSmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Create Account
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Join the chat community
            </Text>
          </View>

          {/* Registration Form Card */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Full Name (Optional)"
                value={formData.fullName}
                onChangeText={(text) => updateField('fullName', text)}
                mode="outlined"
                style={styles.input}
                disabled={isSubmitting}
                left={<TextInput.Icon icon="account-circle" />}
              />

              <TextInput
                label="Username *"
                value={formData.username}
                onChangeText={(text) => updateField('username', text)}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                disabled={isSubmitting}
                left={<TextInput.Icon icon="account" />}
              />

              <TextInput
                label="Email *"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                disabled={isSubmitting}
                left={<TextInput.Icon icon="email" />}
              />

              <TextInput
                label="Password * (min 6 characters)"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                autoCapitalize="none"
                disabled={isSubmitting}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <TextInput
                label="Confirm Password *"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                autoCapitalize="none"
                disabled={isSubmitting}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />

              {/* Age Selection */}
              <View style={styles.pickerContainer}>
                <Text variant="bodyMedium" style={styles.label}>
                  Age *
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.ageScroll}
                >
                  {ageOptions.map((age) => (
                    <Button
                      key={age}
                      mode={formData.age === age.toString() ? 'contained' : 'outlined'}
                      onPress={() => updateField('age', age.toString())}
                      disabled={isSubmitting}
                      style={styles.ageButton}
                      compact
                    >
                      {age}
                    </Button>
                  ))}
                </ScrollView>
              </View>

              {/* Profile Picture Upload - Only show if allowed and user is 18+ */}
              {!isLoadingSettings && allowUserPictures && parseInt(formData.age) >= 18 && (
                <View style={styles.profilePictureContainer}>
                  {profileImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: profileImage.uri }}
                        style={styles.profilePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setProfileImage(null)}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={pickImage}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.uploadIcon}>📷</Text>
                      <Text style={styles.uploadText}>Add Profile Photo</Text>
                      <Text style={styles.uploadSubtext}>(Optional, 18+ only)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Gender Selection */}
              <View style={styles.radioContainer}>
                <Text variant="bodyMedium" style={styles.label}>
                  Gender *
                </Text>
                <RadioButton.Group
                  onValueChange={(value) => updateField('gender', value)}
                  value={formData.gender}
                >
                  <View style={styles.radioRow}>
                    <View style={styles.radioItem}>
                      <RadioButton.Android value="Male" disabled={isSubmitting} />
                      <Text>Male</Text>
                    </View>
                    <View style={styles.radioItem}>
                      <RadioButton.Android value="Female" disabled={isSubmitting} />
                      <Text>Female</Text>
                    </View>
                  </View>
                </RadioButton.Group>
              </View>

              {error ? (
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {error}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.button}
              >
                Sign Up
              </Button>

              <Button
                mode="text"
                onPress={onSwitchToLogin}
                disabled={isSubmitting}
                style={styles.linkButton}
              >
                Already have an account? Sign In
              </Button>
            </Card.Content>
          </Card>

          {/* Safety Features Info */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.safetyHeader}>
                <Text variant="titleSmall">🛡️ Safety & Protection</Text>
              </View>
              <View style={styles.safetyList}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  ✓ Real-time content filtering{'\n'}
                  ✓ Automatic user protection{'\n'}
                  ✓ Spam prevention system{'\n'}
                  ✓ Secure authentication{'\n'}
                  ✓ Privacy-focused design
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    textAlign: 'center',
  },
  card: {
    elevation: 4,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  ageScroll: {
    marginTop: 8,
  },
  ageButton: {
    marginRight: 8,
  },
  radioContainer: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoCard: {
    elevation: 2,
    marginBottom: 16,
  },
  safetyHeader: {
    marginBottom: 8,
  },
  safetyList: {
    paddingLeft: 4,
  },
  profilePictureContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  profilePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  uploadPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});
