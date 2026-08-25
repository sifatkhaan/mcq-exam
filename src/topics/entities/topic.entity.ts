import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  chapter_id!: number;

  @Column({
    type: 'int',
  })
  topic_no!: number;

  @Column({
    type: 'nvarchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  description!: string;

  @Column({
    type: 'nvarchar',
    length: 20,
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

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  updated_at!: Date;

  @Column({
    default: false,
  })
  is_deleted!: boolean;

  @Column({
    nullable: true,
  })
  deleted_by!: number;

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  deleted_at!: Date;
}
