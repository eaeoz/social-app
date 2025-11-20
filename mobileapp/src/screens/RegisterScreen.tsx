import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, HelperText, RadioButton } from 'react-native-paper';
import { apiService } from '../services';
import { useAuthStore } from '../store';

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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
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
      
      const userData = await apiService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        age: formData.age,
        gender: formData.gender,
      });
      
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
});
