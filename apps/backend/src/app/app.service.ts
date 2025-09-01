import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getData(): { message: string } {
    const port = this.configService.get('app.port');
    return { 
      message: `Welcome to the Vehicle Diagnostics System! To get started, check the API documentation at http://localhost:${port}/api/docs` 
    };
  }
}
