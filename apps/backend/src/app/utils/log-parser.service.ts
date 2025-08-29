import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as readline from 'readline';
import { LogLevel } from '../entities/log-entry.entity';

export interface ParsedLogEntry {
  vehicleId: string;
  timestamp: Date;
  level: LogLevel;
  code: string;
  message: string;
  fileId: number;
}

@Injectable()
export class LogParserService {
  private readonly logger = new Logger(LogParserService.name);

  async parseFile(
    filePath: string,
    fileId: number,
    startOffset: number = 0
  ): Promise<{
    entries: ParsedLogEntry[];
    processedBytes: number;
    processedLines: number;
  }> {
    const entries: ParsedLogEntry[] = [];
    let processedBytes = startOffset;
    let processedLines = 0;

    try {
      const fileStream = fs.createReadStream(filePath, { 
        encoding: 'utf8',
        start: startOffset 
      });
      
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        processedBytes += Buffer.byteLength(line, 'utf8') + 1; 
        processedLines++;

        const parsedEntry = this.parseLine(line, fileId);
        if (parsedEntry) {
          entries.push(parsedEntry);
        }

        if (entries.length >= 100) {
          break;
        }
      }

      this.logger.log(`Parsed ${entries.length} entries from ${processedLines} lines`);
      
      return {
        entries,
        processedBytes,
        processedLines
      };

    } catch (error) {
      this.logger.error(`Error parsing file ${filePath}`, error);
      throw error;
    }
  }

  async parseStream(
    stream: NodeJS.ReadableStream,
    fileId: number,
    startOffset: number = 0
  ): Promise<{
    entries: ParsedLogEntry[];
    processedBytes: number;
    processedLines: number;
  }> {
    const entries: ParsedLogEntry[] = [];
    let processedBytes = startOffset;
    let processedLines = 0;
    let bytesSkipped = 0;

    try {
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        const lineBytes = Buffer.byteLength(line, 'utf8') + 1; 
        
        if (bytesSkipped < startOffset) {
          bytesSkipped += lineBytes;
          continue;
        }
        
        processedBytes += lineBytes;
        processedLines++;

        const parsedEntry = this.parseLine(line, fileId);
        if (parsedEntry) {
          entries.push(parsedEntry);
        }

        if (entries.length >= 100) {
          break;
        }
      }

      this.logger.log(`Parsed ${entries.length} entries from ${processedLines} lines (stream)`);
      
      return {
        entries,
        processedBytes,
        processedLines
      };

    } catch (error) {
      this.logger.error(`Error parsing stream`, error);
      throw error;
    }
  }

  parseLine(line: string, fileId: number): ParsedLogEntry | null {
    const regex = /^\[([^\]]+)\]\s*\[VEHICLE_ID:([^\]]+)\]\s*\[([^\]]+)\]\s*\[CODE:([^\]]+)\]\s*\[(.+)\]$/;
    
    const match = line.trim().match(regex);
    
    if (!match) {
      this.logger.debug(`Skipping malformed line: ${line.substring(0, 100)}...`);
      return null;
    }

    const [, timestampStr, vehicleId, levelStr, code, message] = match;

    try {
      const timestamp = new Date(timestampStr);
      if (isNaN(timestamp.getTime())) {
        this.logger.debug(`Invalid timestamp: ${timestampStr}`);
        return null;
      }

      const level = this.normalizeLogLevel(levelStr);
      if (!level) {
        this.logger.debug(`Invalid log level: ${levelStr}`);
        return null;
      }

      return {
        vehicleId: vehicleId.trim(),
        timestamp,
        level,
        code: code.trim(),
        message: message.trim(),
        fileId
      };

    } catch (error) {
      this.logger.debug(`Error parsing line: ${line}`, error);
      return null;
    }
  }

  private normalizeLogLevel(levelStr: string): LogLevel | null {
    const normalized = levelStr.trim().toUpperCase();
    
    switch (normalized) {
      case 'INFO':
        return LogLevel.INFO;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
      case 'WARNING':
        return LogLevel.WARN;
      case 'DEBUG':
        return LogLevel.DEBUG;
      default:
        return null;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      this.logger.error(`Error getting file size for ${filePath}`, error);
      throw error;
    }
  }

  async validateFileFormat(filePath: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let validLines = 0;
      let totalLines = 0;
      const maxLinesToCheck = 100;

      for await (const line of rl) {
        totalLines++;
        
        if (this.parseLine(line, 0)) {
          validLines++;
        }

        if (totalLines >= maxLinesToCheck) {
          break;
        }
      }

      const validPercentage = totalLines > 0 ? (validLines / totalLines) * 100 : 0;
      
      if (validPercentage < 50) {
        return {
          isValid: false,
          error: `File format validation failed. Only ${validPercentage.toFixed(1)}% of sample lines match expected format.`
        };
      }

      return { isValid: true };

    } catch (error) {
      return {
        isValid: false,
        error: `Error validating file format: ${error.message}`
      };
    }
  }
}

