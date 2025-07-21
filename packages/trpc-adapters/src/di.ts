import type { Dependencies as CoreDeps } from '@phyt/core/di';

import { UserRepository } from './users/repository';
import { UserService } from './users/service';

export interface AppDependencies extends CoreDeps {
    userRepository: UserRepository;
    userService: UserService;
}

export function createAppDependencies(core: CoreDeps): AppDependencies {
    const userRepository = new UserRepository(core);

    const userService = new UserService({
        userRepository,
        redis: core.redis
    });

    // const postRepository = new PostRepository(core);

    // const postService = new PostService({
    //     postRepository,
    //     redis: core.redis
    // });

    const repositories = {
        userRepository
        // postRepository
    };

    const services = {
        userService
        // postService
    };

    return {
        ...core,
        ...repositories,
        ...services
    };
}
