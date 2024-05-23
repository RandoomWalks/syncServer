// core/domain/repositories/user.repository.ts

import { User } from '../models/user.model';

export interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    createUser(user: User): Promise<User>;
    updateUser(id: string, user: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
}