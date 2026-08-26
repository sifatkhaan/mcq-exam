import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('exam_assignments')
export class ExamAssignment {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  exam_id!: number;
  @Column()
  student_id!: number;
  @Column({
    type: 'nvarchar',
    length: 20,
    default: 'ASSIGNED',
  })
  status!: string;
  @Column({
    nullable: true,
  })
  assigned_by!: number;
  @CreateDateColumn()
  assigned_at!: Date;
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  completed_at!: Date;
}
