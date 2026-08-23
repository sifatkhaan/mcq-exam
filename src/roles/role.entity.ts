import { UserRole } from '../users/user-role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
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

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles!: UserRole[];

  @CreateDateColumn()
  created_at!: Date;
}
