import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  client: RedisClientType;
  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: configService.getOrThrow<string>('REDIS_URI'),
    });
    this.client
      .connect()
      .then(() => console.log('✅ Redis connected'))
      .catch(err => console.error('❌ Redis connection error', err));
  }
  async onModuleDestroy() {
    await this.client.quit();
    console.log('👋 Redis disconnected');
  }
}
