const DEBUG_FLAG = 'biopulse-debug';

export function isDebugEnabled(): boolean {
    try {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(DEBUG_FLAG) === '1';
        }
    } catch {
        /* worker / private mode */
    }
    return false;
}

export function debugLog(scope: string, ...args: unknown[]): void {
    if (isDebugEnabled()) {
        console.log(`[${scope}]`, ...args);
    }
}

export function debugWarn(scope: string, ...args: unknown[]): void {
    if (isDebugEnabled()) {
        console.warn(`[${scope}]`, ...args);
    }
}
