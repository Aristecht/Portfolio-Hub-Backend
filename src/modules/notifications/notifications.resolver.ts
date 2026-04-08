import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Authorized } from '../../shared/decorators/authorized.decorator';
import type { User } from '../../../prisma/generated/prisma/client';
import { Authorization } from '../../shared/decorators/authorization.decorator';
import { changeNotificationSettingsModel } from './models/notifications-settings.model';
import { ChangeNotificationsSettingsInput } from './inputs/change-notifications-settings.input';
import { NotificationModel } from './models/notification.model';
import { PageLimitInput } from './inputs/page-limit.input';
import { OutputNotificationModel } from './models/output.input';
import { RegisterDeviceTokenInput } from './inputs/register-device-token.input';
import { DevicesModel } from './models/devices.model';

@Resolver('Notification')
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Authorization()
  @Query(() => Number, { name: 'findNotificationsUnreadCount' })
  async findUnreadCount(@Authorized() user: User) {
    return await this.notificationsService.findUnreadCount(user);
  }

  @Authorization()
  @Query(() => OutputNotificationModel, { name: 'findNotificationsByUser' })
  async findByUser(
    @Authorized() user: User,
    @Args('data') input: PageLimitInput,
  ) {
    return await this.notificationsService.findByUser(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'markNotificationAsRead' })
  async markAsRead(
    @Authorized() user: User,
    @Args('ids', { type: () => [String] }) notificationIds: string[],
  ) {
    return await this.notificationsService.markAsRead(user, notificationIds);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'markAllNotificationAsRead' })
  async markAllAsRead(@Authorized() user: User) {
    return await this.notificationsService.markAllAsRead(user);
  }

  @Authorization()
  @Mutation(() => changeNotificationSettingsModel, {
    name: 'changeNotificationSettings',
  })
  async changeSettings(
    @Authorized() user: User,
    @Args('data') input: ChangeNotificationsSettingsInput,
  ) {
    return await this.notificationsService.changeSettings(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, {
    name: 'registerDeviceToken',
  })
  async registerDeviceToken(
    @Authorized() user: User,
    @Args('data') input: RegisterDeviceTokenInput,
  ) {
    await this.notificationsService.registerDeviceToken(user, input);
    return true;
  }

  @Authorization()
  @Mutation(() => Boolean, {
    name: 'removeDeviceToken',
  })
  async removeDeviceToken(
    @Authorized() user: User,
    @Args('token') token: string,
  ) {
    return await this.notificationsService.removeDeviceToken(user, token);
  }

  @Authorization()
  @Query(() => [DevicesModel], {
    name: 'getDevices',
  })
  async getDevices(@Authorized() user: User) {
    return await this.notificationsService.getDevices(user);
  }
}
