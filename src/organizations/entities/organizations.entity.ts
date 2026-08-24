import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'nvarchar',
    length: 200,
  })
  name!: string;
  @Column({
    type: 'nvarchar',
    length: 50,
    unique: true,
  })
  code!: string;

  @Column({
    type: 'nvarchar',
    length: 50,
  })
  type!: string;

  @Column({
    type: 'nvarchar',
    length: 500,
    nullable: true,
  })
  logo_url!: string;

  @Column({
    type: 'nvarchar',
    length: 150,
    nullable: true,
  })
  email!: string;

  @Column({
    type: 'nvarchar',
    length: 30,
    nullable: true,
  })
  phone!: string;

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

  @Column({
    nullable: true,
  })
  updated_by!: number;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({
    default: false,
  })
  is_deleted!: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  deleted_by!: number | null;

  @Column({
    type: 'datetime2',
    nullable: true,
  })
  deleted_at!: Date | null;
}
