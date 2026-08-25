import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  exam_id!: number;

  @Column()
  question_version_id!: number;

  @Column({
    type: 'int',
  })
  question_order!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  marks!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  negative_marks!: number;

  @Column({
    nullable: true,
  })
  created_by!: number;

  @CreateDateColumn()
  created_at!: Date;
}
