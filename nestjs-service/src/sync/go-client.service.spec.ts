import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { Observable } from 'rxjs';

describe('GoClientService', () => {
    let service: GoClientService;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GoClientService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<GoClientService>(GoClientService);
        httpService = module.get<HttpService>(HttpService);
    });

    it('should send data to Go service and return response', async () => {
        const data: ChangeDto[] = [
            { type: 'create', data: { value: 'test' } },
        ];
        const mockResponse = { data: 'success' };

        // of Operator: creates an observable that emits the arguments provided to it and then completes. It's used to mock a successful response.

        // mockReturnValue(of({ data: mockResponse })): This uses the of operator to create an observable that emits { data: mockResponse }. When syncData calls httpService.post, it receives this observable, subscribes to it, and gets the emitted value.

        
        (httpService.post as jest.Mock).mockReturnValue(of({ data: mockResponse }));

        const result = await service.syncData(data);

        expect(result).toBe(mockResponse);

        expect(httpService.post).toHaveBeenCalledWith(
            'http://go-service:8080/sync',
            { data },
        );
    });

    it('should handle 404 response from Go service', async () => {
        const data: ChangeDto[] = [
            { type: 'create', data: { value: 'test' } },
        ];
        const mockError = { response: { data: 'Not Found', status: 404, statusText: 'Not Found' } };
        // throwError Operator: creates an observable that emits an error when subscribed to. It's used to mock error responses, such as HTTP errors.
        // mockReturnValue(throwError(() => mockError)): This uses the throwError operator to create an observable that emits an error when subscribed to. When syncData calls httpService.post, it receives this observable, subscribes to it, and the error is thrown.

        jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => mockError));

        try {
            await service.syncData(data);
        } catch (error) {
            expect(error).toBe(mockError);
            expect(httpService.post).toHaveBeenCalledWith(
                'http://go-service:8080/sync',
                { data },
            );
        }
    });

    it('should handle network errors', async () => {
        const data: ChangeDto[] = [
            { type: 'create', data: { value: 'test' } },
        ];
        const mockError = new Error('Network Error');
        jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => mockError));

        try {
            await service.syncData(data);
        } catch (error) {
            expect(error).toBe(mockError);
            expect(httpService.post).toHaveBeenCalledWith(
                'http://go-service:8080/sync',
                { data },
            );
        }
    });

    const mockResponse = { data: null, status: 200, statusText: 'OK', headers: {}, config: {} };
});
