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
          options: {
            ...(instanceName ? { instanceName } : {}),
            encrypt: configService.get<string>('DB_ENCRYPT') === 'true',
            trustServerCertificate:
              configService.get<string>(
                'DB_TRUST_SERVER_CERTIFICATE',
                'true',
              ) === 'true',
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
