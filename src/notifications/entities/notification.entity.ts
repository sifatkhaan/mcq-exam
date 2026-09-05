import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  organization_id!: number | null;

  @Column({
    type: 'int',
  })
  user_id!: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type!: string;

  @Column({
    type: 'nvarchar',
    length: 255,
  })
  title!: string;

  @Column({
    type: 'nvarchar',
    length: 'MAX',
  })
  message!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  channel!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  reference_type!: string | null;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  reference_id!: number | null;

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  read_at!: Date | null;

  @Column({
    type: 'datetime2',
    default: () => 'GETDATE()',
  })
  created_at!: Date;
}
