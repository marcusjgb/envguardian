import type { CompareEnvSetsResult } from "../env/compare-envs.js";

interface JsonReportInput {
    projectRoot: string;
    usedVars: string[];
    envVars: string[];
    envExampleVars: string[];
    comparison: CompareEnvSetsResult;
    hasBlockingIssues: boolean;
}

export function printJsonReport(input: JsonReportInput): void {
    const payload = {
        project: input.projectRoot,
        usedVars: input.usedVars,
        envVars: input.envVars,
        envExampleVars: input.envExampleVars,
        summary: {
            usedInCode: input.usedVars.length,
            definedInEnv: input.envVars.length,
            definedInEnvExample: input.envExampleVars.length,
            missingInEnv: input.comparison.missingInEnv.length,
            missingInEnvExample: input.comparison.missingInEnvExample.length,
            unusedInEnv: input.comparison.unusedInEnv.length,
            unusedInEnvExample: input.comparison.unusedInEnvExample.length,
            hasBlockingIssues: input.hasBlockingIssues,
        },
        comparison: {
            missingInEnv: input.comparison.missingInEnv,
            missingInEnvExample: input.comparison.missingInEnvExample,
            unusedInEnv: input.comparison.unusedInEnv,
            unusedInEnvExample: input.comparison.unusedInEnvExample,
        },
    };

    console.log(JSON.stringify(payload, null, 2));
}