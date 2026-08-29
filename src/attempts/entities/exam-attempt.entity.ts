import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('exam_attempts')
export class ExamAttempt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  exam_id!: number;

  @Column()
  student_id!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  assignment_id!: number | null;

  @Column({
    type: 'int',
  })
  attempt_no!: number;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: 'STARTED',
  })
  status!: string;

  @CreateDateColumn()
  started_at!: Date;

  @Column({
    type: 'datetime2',
  })
  expires_at!: Date;

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  submitted_at!: Date | null;

  @Column({
    type: 'nvarchar',
    length: 30,
    nullable: true,
  })
  submission_type!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  total_questions!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  correct_count!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  wrong_count!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  unanswered_count!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  positive_marks!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  negative_marks!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  final_score!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  percentage!: number | null;

  @Column({
    type: 'nvarchar',
    length: 20,
    nullable: true,
  })
  pass_status!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
