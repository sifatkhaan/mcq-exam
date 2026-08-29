import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('attempt_answers')
export class AttemptAnswer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  attempt_id!: number;

  @Column()
  exam_question_id!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  selected_option_id!: number | null;

  @Column({
    type: 'bit',
    nullable: true,
  })
  is_correct!: boolean | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  marks_awarded!: number | null;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  answered_at!: Date | null;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  updated_at!: Date | null;
}
