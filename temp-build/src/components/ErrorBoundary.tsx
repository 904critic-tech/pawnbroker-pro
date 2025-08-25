import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error to external service (e.g., Sentry, Crashlytics)
    this.logError(error, errorInfo);
  }

  logError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Implement error logging service
    console.error('Error logged:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    
    Alert.alert(
      'Report Error',
      'Would you like to report this error to help improve the app?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Report',
          onPress: () => {
            // TODO: Implement error reporting
      
            Alert.alert('Thank you', 'Error has been reported. We appreciate your feedback!');
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Oops! Something went wrong</Title>
              <Paragraph style={styles.message}>
                We're sorry, but something unexpected happened. The app encountered an error and needs to be restarted.
              </Paragraph>
              
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details (Development):</Text>
                  <Text style={styles.errorText}>{this.state.error.message}</Text>
                  {this.state.errorInfo && (
                    <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                  )}
                </View>
              )}
            </Card.Content>
            
            <Card.Actions style={styles.actions}>
              <Button 
                mode="contained" 
                onPress={this.handleReset}
                style={styles.button}
              >
                Try Again
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={this.handleReportError}
                style={styles.button}
              >
                Report Error
              </Button>
            </Card.Actions>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#d32f2f'
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20
  },
  errorDetails: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#d32f2f'
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace'
  },
  actions: {
    justifyContent: 'space-around',
    paddingTop: 10
  },
  button: {
    marginHorizontal: 5
  }
});

export default ErrorBoundary;
