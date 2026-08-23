import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'nvarchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'nvarchar',
    length: 150,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'nvarchar',
    length: 20,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    type: 'nvarchar',
    length: 255,
  })
  password_hash!: string;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: 'ACTIVE',
  })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
