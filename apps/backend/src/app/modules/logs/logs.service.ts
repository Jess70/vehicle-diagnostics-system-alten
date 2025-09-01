import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';
import { LogEntry, LogLevel } from '../../entities/log-entry.entity';
import { QueryLogsDto } from '../../dto/query-logs.dto';
import { LogEntryDto, PaginatedLogsDto } from '../../dto/log-entry.dto';
import * as crypto from 'crypto';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectRepository(LogEntry)
    private readonly logEntryRepository: Repository<LogEntry>,
  ) {}

  async findLogs(queryDto: QueryLogsDto): Promise<PaginatedLogsDto> {
    const {
      vehicle,
      code,
      level,
      from,
      to,
      search,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = queryDto;

    const where: {
      vehicleId?: string;
      code?: string;
      level?: LogLevel;
      timestamp?: any;
      message?: any;
    } = {};

    if (vehicle) {
      where.vehicleId = vehicle;
    }

    if (code) {
      where.code = code;
    }

    if (level && Object.values(LogLevel).includes(level as LogLevel)) {
      where.level = level as LogLevel;
    }

    if (from && to) {
      where.timestamp = Between(new Date(from), new Date(to));
    } else if (from) {
      where.timestamp = Between(new Date(from), new Date());
    } else if (to) {
      where.timestamp = Between(new Date(0), new Date(to));
    }

    if (search) {
      where.message = Like(`%${search}%`);
    }

    const options: FindManyOptions<LogEntry> = {
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: {
        [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC',
      },
    };

    const [logs, total] = await this.logEntryRepository.findAndCount(options);

    const totalPages = Math.ceil(total / limit);
    
    return {
      data: logs,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async bulkInsertLogs(logs: Partial<LogEntry>[]): Promise<LogEntry[]> {
    this.logger.log(`Bulk inserting ${logs.length} log entries`);

    const logsWithHashes = logs.map(log => {
      const { id, ...logWithoutId } = log; 
      return {
        ...logWithoutId,
        uniqueHash: this.generateUniqueHash(logWithoutId),
      };
    });

    try {
      const result = await this.logEntryRepository
        .createQueryBuilder()
        .insert()
        .into(LogEntry)
        .values(logsWithHashes)
        .orIgnore() 
        .execute();

      this.logger.log(`Successfully inserted ${result.identifiers?.length || 0} new log entries`);
      
      return result.identifiers.map((identifier, index) => ({
        id: identifier.id,
        ...logsWithHashes[index],
      })) as LogEntry[];

    } catch (error) {
      this.logger.error('Error bulk inserting logs', error);
      throw error;
    }
  }



  private generateUniqueHash(log: Partial<LogEntry>): string {
    const hashString = `${log.vehicleId}|${log.timestamp}|${log.code}|${log.message}`;
    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  async getTotalCount(): Promise<{ total: number }> {
    const total = await this.logEntryRepository.count();
    return { total };
  }
}

