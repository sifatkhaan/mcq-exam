import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  organization_id!: number;

  @Column()
  user_id!: number;

  @Column()
  role_id!: number;

  @Column({
    default: 'ACTIVE',
  })
  status!: string;

  @CreateDateColumn()
  joined_at!: Date;

  @Column({
    nullable: true,
  })
  created_by!: number;

  @CreateDateColumn()
  created_at!: Date;
}
