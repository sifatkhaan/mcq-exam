import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('question_options')
export class QuestionOption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  question_version_id!: number;

  @Column({
    type: 'nvarchar',
  })
  option_text!: string;

  @Column({
    type: 'int',
  })
  option_order!: number;

  @Column({
    type: 'bit',
    default: false,
  })
  is_correct!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
