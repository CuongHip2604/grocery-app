import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';
import { LowStockProduct, NotificationPayload } from './dto/notifications.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured. Push notifications will be disabled.'
      );
      return;
    }

    try {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  async registerToken(token: string, userId?: string) {
    const subscription = await this.prisma.pushSubscription.upsert({
      where: { token },
      update: {
        userId,
        updatedAt: new Date(),
      },
      create: {
        token,
        userId,
      },
    });

    return { data: { id: subscription.id, token: subscription.token } };
  }

  async unregisterToken(token: string) {
    try {
      await this.prisma.pushSubscription.delete({
        where: { token },
      });
      return { message: 'Token unregistered successfully' };
    } catch {
      // Token might not exist, which is fine
      return { message: 'Token not found or already unregistered' };
    }
  }

  async sendLowStockNotification(products: LowStockProduct[]) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping notification.');
      return;
    }

    if (products.length === 0) {
      return;
    }

    // Get all registered tokens
    const subscriptions = await this.prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      this.logger.debug('No registered tokens. Skipping notification.');
      return;
    }

    const tokens = subscriptions.map((s) => s.token);

    // Build notification payload
    let payload: NotificationPayload;

    if (products.length === 1) {
      const product = products[0];
      payload = {
        title: 'Canh bao ton kho',
        body: `San pham ${product.name} sap het (con ${product.quantity})`,
        icon: '/icon-192.png',
        data: {
          url: '/inventory',
          productId: product.id,
        },
      };
    } else {
      payload = {
        title: 'Canh bao ton kho',
        body: `${products.length} san pham sap het hang`,
        icon: '/icon-192.png',
        data: {
          url: '/inventory?lowStock=true',
        },
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        webpush: {
          notification: {
            icon: payload.icon,
            badge: '/icon-192.png',
            requireInteraction: true,
          },
          fcmOptions: {
            link: payload.data?.url || '/inventory',
          },
        },
        data: payload.data,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Sent low stock notification: ${response.successCount} success, ${response.failureCount} failed`
      );

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await this.prisma.pushSubscription.deleteMany({
            where: { token: { in: invalidTokens } },
          });
          this.logger.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
        }
      }

      return { success: response.successCount, failed: response.failureCount };
    } catch (error) {
      this.logger.error('Failed to send notification', error);
      throw error;
    }
  }

  async sendNotification(payload: NotificationPayload) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping notification.');
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return;
    }

    const tokens = subscriptions.map((s) => s.token);

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          icon: payload.icon || '/icon-192.png',
        },
        fcmOptions: {
          link: payload.data?.url || '/',
        },
      },
      data: payload.data,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return { success: response.successCount, failed: response.failureCount };
  }
}
