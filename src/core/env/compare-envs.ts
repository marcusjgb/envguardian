export interface CompareEnvSetsInput {
    usedVars: string[];
    envVars: string[];
    envExampleVars: string[];
}

export interface CompareEnvSetsResult {
    missingInEnv: string[];
    missingInEnvExample: string[];
    unusedInEnv: string[];
    unusedInEnvExample: string[];
}

export function compareEnvSets(
    input: CompareEnvSetsInput,
): CompareEnvSetsResult {
    const usedSet = new Set(input.usedVars);
    const envSet = new Set(input.envVars);
    const envExampleSet = new Set(input.envExampleVars);

    const missingInEnv = input.usedVars.filter((key) => !envSet.has(key));
    const missingInEnvExample = input.usedVars.filter(
        (key) => !envExampleSet.has(key),
    );

    const unusedInEnv = input.envVars.filter((key) => !usedSet.has(key));
    const unusedInEnvExample = input.envExampleVars.filter(
        (key) => !usedSet.has(key),
    );

    return {
        missingInEnv,
        missingInEnvExample,
        unusedInEnv,
        unusedInEnvExample,
    };
}