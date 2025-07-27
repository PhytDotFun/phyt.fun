import { execSync } from 'node:child_process';
import type { PlopTypes } from '@turbo/gen';

interface PackageJson {
    name: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
    plop.addHelper('eq', (a, b) => a === b);

    plop.setGenerator('init', {
        description: 'Generate a new module in either apps/ or packages/',
        prompts: [
            {
                type: 'list',
                name: 'directory',
                message: 'Where should the new module be created?',
                choices: ['packages', 'apps']
            },
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the new module?'
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
                path: '{{ directory }}/{{ name }}/eslint.config.js',
                templateFile: 'templates/eslint.config.js.hbs'
            },
            {
                type: 'add',
                path: '{{ directory }}/{{ name }}/package.json',
                templateFile: 'templates/package.json.hbs'
            },
            {
                type: 'add',
                path: '{{ directory }}/{{ name }}/tsconfig.json',
                templateFile: 'templates/tsconfig.json.hbs'
            },
            {
                type: 'add',
                path: '{{ directory }}/{{ name }}/tsup.config.ts',
                templateFile: 'templates/tsup.config.ts.hbs'
            },
            {
                type: 'add',
                path: '{{ directory }}/{{ name }}/README.md',
                templateFile: 'templates/README.md.hbs'
            },
            {
                type: 'add',
                path: '{{ directory }}/{{ name }}/.lintstagedrc.json',
                templateFile: 'templates/.lintstagedrc.json.hbs'
            },
            {
                type: 'add',
                path: '{{ directory }}/{{ name }}/src/index.ts',
                template: "export const name = '{{ name }}';"
            },
            {
                type: 'modify',
                path: '{{ directory }}/{{ name }}/package.json',
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
                if (
                    'name' in answers &&
                    typeof answers.name === 'string' &&
                    'directory' in answers
                ) {
                    execSync('pnpm i', { stdio: 'inherit' });
                    execSync(
                        `pnpm prettier --write ${answers.directory}/${answers.name}/** --list-different`
                    );
                    return 'Module scaffolded';
                }
                return 'Module not scaffolded';
            }
        ]
    });
}
