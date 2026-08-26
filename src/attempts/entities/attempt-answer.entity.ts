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
    nullable: true,
  })
  selected_option_id!: number;

  @Column({
    type: 'bit',
    nullable: true,
  })
  is_correct!: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  marks_awarded!: number;

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  answered_at!: Date;

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  updated_at!: Date;
}
