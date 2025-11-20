import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme, HelperText } from 'react-native-paper';
import { apiService } from '../services';
import { useAuthStore } from '../store';

interface EmailVerificationScreenProps {
  email: string;
}

export default function EmailVerificationScreen({ email }: EmailVerificationScreenProps) {
  const theme = useTheme();
  const { logout } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const handleResendEmail = async () => {
    setError('');
    setSuccess('');
    
    // Show helpful message - resend requires password which we don't have
    setSuccess('📧 To resend the verification email, please go back to the login screen and try logging in again. You\'ll receive a new verification email automatically.');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Icon and Title */}
          <View style={styles.header}>
            <Text style={styles.icon}>📧</Text>
            <Text variant="displaySmall" style={styles.title}>
              Verify Your Email
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              We've sent a verification link to:
            </Text>
            <Text variant="titleMedium" style={[styles.email, { color: theme.colors.primary }]}>
              {email}
            </Text>
          </View>

          {/* Instructions Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                📝 Next Steps:
              </Text>
              <View style={styles.stepsList}>
                <Text variant="bodyMedium" style={styles.step}>
                  1. Check your email inbox for our verification email
                </Text>
                <Text variant="bodyMedium" style={styles.step}>
                  2. Click the verification link in the email
                </Text>
                <Text variant="bodyMedium" style={styles.step}>
                  3. Return to the app and log in
                </Text>
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⏰</Text>
                <Text variant="bodySmall" style={styles.warningText}>
                  The verification link expires in 24 hours
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Tips Card */}
          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.tipsTitle}>
                💡 Didn't receive the email?
              </Text>
              <View style={styles.tipsList}>
                <Text variant="bodySmall" style={styles.tip}>
                  • Check your spam/junk folder
                </Text>
                <Text variant="bodySmall" style={styles.tip}>
                  • Wait a few minutes for delivery
                </Text>
                <Text variant="bodySmall" style={styles.tip}>
                  • Make sure you entered the correct email
                </Text>
              </View>
            </Card.Content>
          </Card>

          {success ? (
            <HelperText type="info" visible={true} style={styles.successText}>
              {success}
            </HelperText>
          ) : null}

          {error ? (
            <HelperText type="error" visible={true} style={styles.errorText}>
              {error}
            </HelperText>
          ) : null}

          {remainingAttempts !== null && remainingAttempts > 0 && (
            <Text variant="bodySmall" style={[styles.attemptsText, { color: theme.colors.onSurfaceVariant }]}>
              {remainingAttempts} resend attempts remaining
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.button}
              icon="login"
            >
              Back to Login
            </Button>

            <Button
              mode="outlined"
              onPress={handleResendEmail}
              style={styles.button}
              icon="email-sync"
            >
              How to Resend Email
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  stepsList: {
    marginBottom: 16,
  },
  step: {
    marginBottom: 8,
    lineHeight: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    color: '#856404',
  },
  tipsCard: {
    elevation: 2,
    marginBottom: 16,
  },
  tipsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  tipsList: {
    marginLeft: 8,
  },
  tip: {
    marginBottom: 6,
    color: '#666',
  },
  successText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  attemptsText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
  },
  buttonsContainer: {
    marginTop: 8,
  },
  button: {
    marginBottom: 12,
  },
});
