import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  organization_id!: number;
  @Column({
    type: 'nvarchar',
    length: 200,
  })
  title!: string;
  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  description!: string;
  @Column({
    type: 'int',
  })
  duration_minutes!: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_marks!: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  pass_marks!: number;
  @Column({
    type: 'bit',
    default: false,
  })
  negative_marking_enabled!: boolean;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
  })
  default_correct_mark!: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  default_negative_mark!: number;
  @Column({
    type: 'bit',
    default: false,
  })
  shuffle_questions!: boolean;
  @Column({
    type: 'bit',
    default: false,
  })
  shuffle_options!: boolean;
  @Column({
    type: 'bit',
    default: true,
  })
  show_result!: boolean;
  @Column({
    type: 'bit',
    default: true,
  })
  allow_review!: boolean;
  @Column({
    type: 'bit',
    default: true,
  })
  show_correct_answer!: boolean;
  @Column({
    type: 'bit',
    default: true,
  })
  show_explanation!: boolean;
  @Column({
    type: 'int',
    default: 1,
  })
  max_attempts!: number;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  start_at!: Date | null;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  end_at!: Date | null;
  @Column({
    type: 'nvarchar',
    length: 20,
    default: 'DRAFT',
  })
  status!: string;
  @Column({
    type: 'int',
    nullable: true,
  })
  created_by!: number | null;
  @CreateDateColumn()
  created_at!: Date;
  @Column({
    type: 'int',
    nullable: true,
  })
  updated_by!: number | null;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  updated_at!: Date | null;
  @Column({
    type: 'bit',
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
