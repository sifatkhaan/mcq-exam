import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  organization_id!: number;

  @Column({
    type: 'nvarchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'nvarchar',
    length: 50,
  })
  code!: string;

  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  description!: string;

  @Column({
    default: 'ACTIVE',
  })
  status!: string;

  @Column({
    nullable: true,
  })
  created_by!: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column({
    nullable: true,
  })
  updated_by!: number;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({
    default: false,
  })
  is_deleted!: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  deleted_by!: number | null;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  deleted_at!: Date | null;
}
