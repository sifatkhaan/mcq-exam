import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('question_versions')
export class QuestionVersion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  question_id!: number;

  @Column({
    type: 'int',
  })
  version_no!: number;

  @Column({
    type: 'nvarchar',
  })
  question_text!: string;

  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  explanation!: string;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: 'MEDIUM',
  })
  difficulty!: string;

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
}
