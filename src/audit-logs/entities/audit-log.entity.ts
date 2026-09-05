import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
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
    nullable: true,
  })
  user_id!: number | null;

  @Column({
    type: 'varchar',
    length: 50,
  })
  action!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  entity_type!: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  entity_id!: number | null;

  @Column({
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
  })
  old_values!: string | null;

  @Column({
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
  })
  new_values!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  ip_address!: string | null;

  @Column({
    type: 'nvarchar',
    length: 500,
    nullable: true,
  })
  user_agent!: string | null;

  @Column({
    type: 'datetime2',
    default: () => 'GETDATE()',
  })
  created_at!: Date;
}
