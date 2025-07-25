import type { Dependencies as CoreDeps } from '@phyt/core/di';

import { UsersRepository } from './users/repository';
import { UsersService } from './users/service';
import { PostsRepository } from './posts/repository';
import { PostsService } from './posts/service';
import { RunsRepository } from './runs/repository';
import { RunsService } from './runs/service';

export interface AppDependencies extends CoreDeps {
    usersRepository: UsersRepository;
    usersService: UsersService;
    postsRepository: PostsRepository;
    postsService: PostsService;
    runsRepository: RunsRepository;
    runsService: RunsService;
}

export function createAppDependencies(core: CoreDeps): AppDependencies {
    const usersRepository = new UsersRepository({
        db: core.db
    });

    const usersService = new UsersService({
        usersRepository: usersRepository,
        redis: core.redis
    });

    const runsRepository = new RunsRepository({
        db: core.db
    });

    const runsService = new RunsService({
        runsRepository: runsRepository,
        redis: core.redis,
        idEncoder: core.idEncoder
    });

    const postsRepository = new PostsRepository({
        db: core.db,
        usersRepository: usersRepository
    });

    const postsService = new PostsService({
        postsRepository: postsRepository,
        usersService: usersService,
        runsService: runsService,
        redis: core.redis,
        idEncoder: core.idEncoder
    });

    const repositories = {
        usersRepository,
        postsRepository,
        runsRepository
    };

    const services = {
        usersService,
        postsService,
        runsService
    };

    return {
        ...core,
        ...repositories,
        ...services
    };
}
