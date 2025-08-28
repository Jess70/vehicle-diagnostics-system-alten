import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { File } from './file.entity';

export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  WARN = 'WARN', 
  DEBUG = 'DEBUG'
}

@Entity('logs')
@Index(['vehicleId'])
@Index(['code'])
@Index(['timestamp'])
@Index(['uniqueHash'], { unique: true })
export class LogEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileId: number;

  @Column()
  vehicleId: string;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @Column({
    type: 'text',
    enum: LogLevel
  })
  level: LogLevel;

  @Column()
  code: string;

  @Column('text')
  message: string;

  @Column({ unique: true })
  uniqueHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => File, file => file.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: File;
}

