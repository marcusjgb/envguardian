export function sortEnvContent(content: string): string {
    const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    return lines.join("\n") + "\n";
}