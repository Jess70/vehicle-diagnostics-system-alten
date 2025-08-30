import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: `Welcome to the Vehicle Diagnostics System! To get started, check the API documentation at http://localhost:${process.env.PORT || 3000}/api/docs` };
  }
}
