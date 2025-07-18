import type { Dependencies as Deps } from '@phyt/core/di';
import type { NewUser, User } from '@phyt/data-access/models/users';

import { UserRepository } from './repository';

export class UserService {
    private repo: UserRepository;
    constructor(deps: Deps) {
        this.repo = new UserRepository(deps.db);
    }

    syncPrivyData(data: NewUser): Promise<User> {
        return this.repo.upsertByPrivyId(data);
    }

    getUserByPrivyDID(privyDID: string): Promise<User | null> {
        return this.repo.findByPrivyDID(privyDID);
    }

    getUserByWalletAddress(walletAddress: string): Promise<User | null> {
        return this.repo.findByWalletAddress(walletAddress);
    }
}
