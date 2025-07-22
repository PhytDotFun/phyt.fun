import type { Dependencies as CoreDeps } from '@phyt/core/di';

import { UserRepository } from './users/repository';
import { UserService } from './users/service';
import { PostRepository } from './posts/repository';
import { PostService } from './posts/service';
import { RunRepository } from './runs/repository';
import { RunService } from './runs/service';

export interface AppDependencies extends CoreDeps {
    userRepository: UserRepository;
    userService: UserService;
    postRepository: PostRepository;
    postService: PostService;
    runRepository: RunRepository;
    runService: RunService;
}

export function createAppDependencies(core: CoreDeps): AppDependencies {
    const userRepository = new UserRepository({
        db: core.db
    });

    const userService = new UserService({
        userRepository: userRepository,
        redis: core.redis
    });

    const runRepository = new RunRepository({
        db: core.db
    });

    const runService = new RunService({
        runRepository: runRepository,
        redis: core.redis
    });

    const postRepository = new PostRepository({
        db: core.db,
        userRepository: userRepository
    });

    const postService = new PostService({
        postRepository: postRepository,
        userService: userService,
        runService: runService,
        redis: core.redis
    });

    const repositories = {
        userRepository,
        postRepository,
        runRepository
    };

    const services = {
        userService,
        postService,
        runService
    };

    return {
        ...core,
        ...repositories,
        ...services
    };
}
