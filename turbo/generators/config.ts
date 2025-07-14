import { execSync } from 'node:child_process';
import type { PlopTypes } from '@turbo/gen';

interface PackageJson {
    name: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
    plop.setGenerator('init', {
        description: 'Generate a new package',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the package?'
            },
            {
                type: 'input',
                name: 'deps',
                message:
                    'Enter a space separated list of dependencies you would like to install'
            }
        ],
        actions: [
            (answers) => {
                if ('name' in answers && typeof answers.name === 'string') {
                    if (answers.name.startsWith('@phyt/')) {
                        answers.name = answers.name.replace('@phyt/', '');
                    }
                }
                return 'Config sanitized';
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/eslint.config.js',
                templateFile: 'templates/eslint.config.js.hbs'
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/package.json',
                templateFile: 'templates/package.json.hbs'
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/tsconfig.json',
                templateFile: 'templates/tsconfig.json.hbs'
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/tsup.config.ts',
                templateFile: 'templates/tsup.config.ts.hbs'
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/README.md',
                templateFile: 'templates/README.md.hbs'
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/.lintstagedrc.json',
                templateFile: 'templates/.lintstagedrc.json.hbs'
            },
            {
                type: 'add',
                path: 'packages/{{ name }}/src/index.ts',
                template: "export const name = '{{ name }}';"
            },
            {
                type: 'modify',
                path: 'packages/{{ name }}/package.json',
                async transform(content, answers) {
                    if ('deps' in answers && typeof answers.deps === 'string') {
                        const pkg = JSON.parse(content) as PackageJson;
                        for (const dep of answers.deps
                            .split(' ')
                            .filter(Boolean)) {
                            let version = 'latest'; // fallback version

                            try {
                                const response = await fetch(
                                    `https://registry.npmjs.org/-/package/${dep}/dist-tags`
                                );

                                if (!response.ok) {
                                    console.warn(
                                        `Failed to fetch version for ${dep}: ${response.status} ${response.statusText}`
                                    );
                                } else {
                                    const json = await response.json();
                                    if (
                                        json &&
                                        typeof json.latest === 'string'
                                    ) {
                                        version = `^${json.latest}`;
                                    } else {
                                        console.warn(
                                            `Package ${dep} does not have a latest version tag`
                                        );
                                    }
                                }
                            } catch (error) {
                                console.warn(
                                    `Error fetching version for ${dep}:`,
                                    error instanceof Error
                                        ? error.message
                                        : String(error)
                                );
                            }

                            if (!pkg.dependencies) pkg.dependencies = {};
                            pkg.dependencies[dep] = version;
                        }
                        return JSON.stringify(pkg, null, 2);
                    }
                    return content;
                }
            },
            async (answers) => {
                /**
                 * Install deps and format everything
                 */
                if ('name' in answers && typeof answers.name === 'string') {
                    // execSync("pnpm dlx sherif@latest --fix", {
                    //   stdio: "inherit",
                    // });
                    execSync('pnpm i', { stdio: 'inherit' });
                    execSync(
                        `pnpm prettier --write packages/${answers.name}/** --list-different`
                    );
                    return 'Package scaffolded';
                }
                return 'Package not scaffolded';
            }
        ]
    });
}
