import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'nvarchar',
    length: 100,
    unique: true,
  })
  name!: string;

  @Column({
    type: 'nvarchar',
    length: 255,
  })
  description!: string;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: 'ACTIVE',
  })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;
}
