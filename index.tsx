import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { AppRegistry, View, Text, ScrollView, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

// Minimal APNs test app
function RootApp() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  useEffect(() => {
    (async () => {
      try {
        // Request notification permissions
        addLog('Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        addLog(`Permission status: ${status}`);

        if (status === 'granted') {
          // Get device token
          const token = await Notifications.getDevicePushTokenAsync();
          addLog(`🔔 Device Token: ${token.data}`);
          setDeviceToken(token.data);
        }
      } catch (error) {
        addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>APNs Test App</Text>
      <Text style={styles.subtitle}>Device Token for Push Notifications</Text>
      
      {deviceToken ? (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>Token:</Text>
          <Text style={styles.tokenValue}>{deviceToken}</Text>
        </View>
      ) : (
        <Text style={styles.loading}>Waiting for token...</Text>
      )}

      <ScrollView style={styles.logsContainer}>
        {logs.map((log, i) => (
          <Text key={i} style={styles.log}>{log}</Text>
        ))}
      </ScrollView>

      <Text style={styles.footer}>
        Copy token above and use test-apns.sh to send notifications
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  tokenBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  tokenValue: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Courier New',
  },
  loading: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  log: {
    fontSize: 11,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Courier New',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

AppRegistry.registerComponent('main', () => RootApp);
