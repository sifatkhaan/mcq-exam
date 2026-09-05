import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('files')
export class FileEntity {
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
    type: 'nvarchar',
    length: 255,
  })
  file_name!: string;

  @Column({
    type: 'nvarchar',
    length: 255,
  })
  original_name!: string;

  @Column({
    type: 'nvarchar',
    length: 1000,
  })
  file_url!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  mime_type!: string;

  @Column({
    type: 'bigint',
  })
  size_bytes!: number;

  @Column({
    type: 'varchar',
    length: 30,
  })
  storage_provider!: string;

  @Column({
    type: 'datetime2',
    default: () => 'GETDATE()',
  })
  created_at!: Date;
}
