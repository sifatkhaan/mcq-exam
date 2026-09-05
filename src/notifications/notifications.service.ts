import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(
    userId: number,
    organizationId: number | null,
    type: string,
    title: string,
    message: string,
    channel: string = 'IN_APP',
    referenceType?: string,
    referenceId?: number,
  ) {
    const notification = this.notificationRepository.create({
      user_id: userId,
      organization_id: organizationId,
      type,
      title,
      message,
      reference_type: referenceType ?? null,
      reference_id: referenceId ?? null,
      channel,
      status: 'UNREAD',
      read_at: null,
    });

    return this.notificationRepository.save(notification);
  }

  async getMyNotifications(userId: number, organizationId: number) {
    return this.notificationRepository.find({
      where: {
        user_id: userId,
        organization_id: organizationId,
        channel: 'IN_APP',
      },

      order: {
        created_at: 'DESC',
      },
    });
  }

  async getUnreadCount(userId: number, organizationId: number) {
    const count = await this.notificationRepository.count({
      where: {
        user_id: userId,
        organization_id: organizationId,
        channel: 'IN_APP',
        status: 'UNREAD',
      },
    });

    return {
      count,
    };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.status = 'READ';
    notification.read_at = new Date();
    await this.notificationRepository.save(notification);
    return {
      message: 'Notification marked as read',
    };
  }

  async markAllAsRead(userId: number, organizationId: number | null) {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        status: 'READ',
      })
      .where('user_id = :userId', {
        userId,
      })
      .andWhere('organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('channel = :channel', {
        channel: 'IN_APP',
      })
      .andWhere('status = :status', {
        status: 'UNREAD',
      })
      .execute();

    return {
      message: 'All notifications marked as read',
    };
  }
}
