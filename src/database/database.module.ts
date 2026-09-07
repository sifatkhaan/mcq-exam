import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const instanceName = configService.get<string>('DB_INSTANCE_NAME');

        return {
          type: 'mssql',
          host: configService.getOrThrow<string>('DB_HOST'),
          ...(instanceName
            ? {}
            : { port: Number(configService.get<string>('DB_PORT', '1433')) }),
          username: configService.getOrThrow<string>('DB_USERNAME'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          retryAttempts: Number(
            configService.get<string>('DB_RETRY_ATTEMPTS', '5'),
          ),
          retryDelay: Number(
            configService.get<string>('DB_RETRY_DELAY', '3000'),
          ),
          options: {
            ...(instanceName ? { instanceName } : {}),
            encrypt: configService.get<string>('DB_ENCRYPT') === 'true',
            trustServerCertificate:
              configService.get<string>(
                'DB_TRUST_SERVER_CERTIFICATE',
                'true',
              ) === 'true',
          },
          extra: {
            connectionTimeout: Number(
              configService.get<string>('DB_CONNECTION_TIMEOUT', '30000'),
            ),
            requestTimeout: Number(
              configService.get<string>('DB_REQUEST_TIMEOUT', '30000'),
            ),
            pool: {
              min: Number(configService.get<string>('DB_POOL_MIN', '0')),
              max: Number(configService.get<string>('DB_POOL_MAX', '10')),
              idleTimeoutMillis: Number(
                configService.get<string>('DB_POOL_IDLE_TIMEOUT', '30000'),
              ),
              acquireTimeoutMillis: Number(
                configService.get<string>('DB_POOL_ACQUIRE_TIMEOUT', '30000'),
              ),
            },
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
