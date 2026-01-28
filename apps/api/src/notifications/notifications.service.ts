import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as admin from 'firebase-admin';
import {
  LowStockProduct,
  NotificationPayload,
  NotificationQueryDto,
  CreateNotificationDto,
  NotificationType,
} from './dto/notifications.dto';

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
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured. Push notifications will be disabled.'
      );
      return;
    }

    // Handle different private key formats:
    // 1. JSON escaped: contains literal \n (two characters)
    // 2. Already has actual newlines
    // 3. Base64 encoded (some hosting platforms)
    if (privateKey.includes('\\n')) {
      // Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
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
    if (products.length === 0) {
      return;
    }

    // Build notification payload
    let payload: NotificationPayload;
    let notificationData: Record<string, unknown>;

    if (products.length === 1) {
      const product = products[0];
      payload = {
        title: 'Cảnh báo tồn kho',
        body: `Sản phẩm ${product.name} sắp hết (còn ${product.quantity})`,
        icon: '/icon-192.png',
        data: {
          url: '/inventory',
          productId: product.id,
        },
      };
      notificationData = {
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
      };
    } else {
      payload = {
        title: 'Cảnh báo tồn kho',
        body: `${products.length} sản phẩm sắp hết hàng`,
        icon: '/icon-192.png',
        data: {
          url: '/inventory?lowStock=true',
        },
      };
      notificationData = {
        productCount: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
        })),
      };
    }

    // Store notification in database (broadcast to all users)
    await this.storeNotification(
      NotificationType.LOW_STOCK,
      payload.title,
      payload.body,
      notificationData
    );

    // Send push notification if Firebase is available
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Push notification skipped.');
      return;
    }

    // Get all registered tokens
    const subscriptions = await this.prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      this.logger.debug('No registered tokens. Push notification skipped.');
      return;
    }

    const tokens = subscriptions.map((s) => s.token);

    try {
      // Use data-only message for web push so service worker handles display
      // This ensures consistent behavior across iOS and Android
      const message: admin.messaging.MulticastMessage = {
        tokens,
        data: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          url: payload.data?.url || '/inventory',
          ...payload.data,
        },
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

  async sendNotification(payload: NotificationPayload, storeInDb = true) {
    // Store notification in database
    if (storeInDb) {
      await this.storeNotification(
        NotificationType.SYSTEM,
        payload.title,
        payload.body,
        payload.data as Record<string, unknown>
      );
    }

    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return { error: 'Firebase not initialized' };
    }

    const subscriptions = await this.prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return { error: 'No registered tokens' };
    }

    const tokens = subscriptions.map((s) => s.token);

    // Use data-only message for web push so service worker handles display
    const message: admin.messaging.MulticastMessage = {
      tokens,
      data: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        url: payload.data?.url || '/',
        ...payload.data,
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      return {
        success: response.successCount,
        failed: response.failureCount,
        errors: response.responses
          .filter((r) => !r.success)
          .map((r) => r.error?.message),
      };
    } catch (error) {
      this.logger.error('Failed to send notification', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getStatus() {
    const subscriptions = await this.prisma.pushSubscription.findMany();
    return {
      firebaseInitialized: !!this.firebaseApp,
      registeredTokens: subscriptions.length,
    };
  }

  // ============================================
  // Notification List Methods
  // ============================================

  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data as Prisma.InputJsonValue | undefined,
        userId: dto.userId,
      },
    });

    return { data: notification };
  }

  async getNotifications(query: NotificationQueryDto, userId?: string) {
    const { page = 1, limit = 20, type, isRead } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Filter by userId if provided (for user-specific notifications)
    // If no userId, get all notifications (for broadcast notifications)
    // Note: MongoDB requires { isSet: false } instead of null to match missing fields
    if (userId) {
      where.OR = [{ userId }, { userId: { isSet: false } }];
    }

    if (type) {
      where.type = type;
    }

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async markAsRead(notificationIds: string[], userId?: string) {
    const where: Record<string, unknown> = {
      id: { in: notificationIds },
    };

    // Only update notifications the user has access to
    if (userId) {
      where.OR = [{ userId }, { userId: { isSet: false } }];
    }

    await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return { message: 'Notifications marked as read' };
  }

  async markAllAsRead(userId?: string) {
    const where: Record<string, unknown> = {
      isRead: false,
    };

    if (userId) {
      where.OR = [{ userId }, { userId: { isSet: false } }];
    }

    await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId?: string) {
    const where: Record<string, unknown> = {
      isRead: false,
    };

    if (userId) {
      where.OR = [{ userId }, { userId: { isSet: false } }];
    }

    const count = await this.prisma.notification.count({ where });

    return { count };
  }

  async deleteNotification(id: string, userId?: string) {
    const where: Record<string, unknown> = { id };

    if (userId) {
      where.OR = [{ userId }, { userId: { isSet: false } }];
    }

    const notification = await this.prisma.notification.findFirst({ where });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted' };
  }

  // Helper method to store notification in database
  private async storeNotification(
    type: NotificationType,
    title: string,
    body: string,
    notificationData?: Record<string, unknown>,
    userId?: string
  ) {
    this.logger.log(`Storing notification: type=${type}, title=${title}, body=${body}`);
    try {
      const notification = await this.prisma.notification.create({
        data: {
          type,
          title,
          body,
          data: notificationData as Prisma.InputJsonValue | undefined,
          userId,
        },
      });
      this.logger.log(`Notification stored successfully: id=${notification.id}`);
      return notification;
    } catch (error) {
      this.logger.error('Failed to store notification', error);
      throw error; // Re-throw to see the actual error
    }
  }
}
