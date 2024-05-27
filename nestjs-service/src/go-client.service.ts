// import { Injectable, HttpService } from '@nestjs/common';

// @Injectable()
// export class GoClientService {
//   constructor(private readonly httpService: HttpService) {}

//   async syncData(data: string[]): Promise<any> {
//     const response = await this.httpService.post('http://go-service:8080/sync', { data }).toPromise();
//     return response.data;
//   }
// }

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class GoClientService {
  constructor(private readonly httpService: HttpService) {}

  async syncData(data: string[]): Promise<any> {
    const response = await this.httpService.post('http://go-service:8080/sync', { data }).toPromise();
    return response.data;
  }
}
