import { Role } from '../roles/role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  role_id!: number;

  @ManyToOne(() => Role)
  @JoinColumn({
    name: 'role_id',
  })
  role!: Role;

  @CreateDateColumn()
  created_at!: Date;
}
