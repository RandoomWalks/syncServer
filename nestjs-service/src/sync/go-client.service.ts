// import { Injectable, HttpService } from '@nestjs/common';

// @Injectable()
// export class GoClientService {
//   constructor(private readonly httpService: HttpService) {}

//   async syncData(data: string[]): Promise<any> {
//     const response = await this.httpService.post('http://go-service:8080/sync', { data }).toPromise();
//     return response.data;
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ChangeDto } from '../models/external/change.dto';

@Injectable()
export class GoClientService {
  private readonly logger = new Logger(GoClientService.name);

  constructor(private readonly httpService: HttpService) { }

  async syncData(data: ChangeDto[]): Promise<any> {
    this.logger.log('Sending data to Go service');
    const response = await this.httpService.post('http://go-service:8080/sync', { data }).toPromise();
    this.logger.log('Received response from Go service');
    return response.data;
  }
}
