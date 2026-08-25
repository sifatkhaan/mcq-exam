import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  subject_id!: number;

  @Column()
  chapter_id!: number;

  @Column()
  topic_id!: number;

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
