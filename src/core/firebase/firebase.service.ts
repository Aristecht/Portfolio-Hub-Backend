import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      if (admin.apps.length > 0) {
        this.app = admin.app();
        return;
      }

      const serviceAccountPath = path.join(
        process.cwd(),
        'src',
        'core',
        'config',
        'firebase-service-account.json',
      );

      const serviceAccountJson = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_JSON',
      );
      const credentialsPathFromEnv = this.configService.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      );

      let credential: admin.credential.Credential;

      if (serviceAccountJson) {
        const parsed = JSON.parse(serviceAccountJson);
        credential = admin.credential.cert(parsed as admin.ServiceAccount);
      } else {
        const resolvedCredentialsPath =
          credentialsPathFromEnv && fs.existsSync(credentialsPathFromEnv)
            ? credentialsPathFromEnv
            : serviceAccountPath;

        if (!fs.existsSync(resolvedCredentialsPath)) {
          console.log(
            '⚠️ Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS to enable push notifications.',
          );
          return;
        }

        credential = admin.credential.cert(resolvedCredentialsPath);
      }

      this.app = admin.initializeApp({
        credential,
      });
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.log('❌ Failed to initialize Firebase: ', error);
    }
  }

  async sendToDevice(
    token: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        data: {
          ...notification.data,
          title: notification.title,
          body: notification.body,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          headers: { Urgency: 'high' },
        },
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error: any) {
      console.log('Failed to send push notification', error);

      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        console.warn(`Invalid token: ${token}`);
      }

      throw error;
    }
  }

  async sendToMultipleDevice(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        data: {
          ...notification.data,
          title: notification.title,
          body: notification.body,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          headers: { Urgency: 'high' },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      if (response.failureCount > 0) {
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            console.log(`Failed to send to ${tokens[index]}: ${resp.error}`);
          }
        });
      }
      return response;
    } catch (error: any) {
      console.log('Failed to send multicast notification', error);
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
      };

      const response = await admin.messaging().send(message);

      return response;
    } catch (error: any) {
      console.log('Failed to send topic notification', error);
      throw error;
    }
  }

  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);

      return response;
    } catch (error: any) {
      console.log('Failed to send topic notification', error);
      throw error;
    }
  }
}
