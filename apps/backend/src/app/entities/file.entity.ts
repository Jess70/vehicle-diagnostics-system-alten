import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LogEntry } from './log-entry.entity';

export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING', 
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  storagePath: string;

  @Column()
  bucketName: string;

  @Column()
  objectName: string;

  @Column({ type: 'integer' })
  sizeBytes: number;

  @Column({
    type: 'text',
    enum: FileStatus,
    default: FileStatus.PENDING
  })
  status: FileStatus;

  @Column({ type: 'integer', default: 0 })
  lastProcessedOffset: number;

  @Column({ type: 'integer', nullable: true })
  lastProcessedLine?: number;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => LogEntry, log => log.file)
  logs: LogEntry[];
}

