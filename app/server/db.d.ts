export interface RunResult {
  changes: number;
  lastInsertRowid: number | null;
}

export declare function run(sql: string, params?: any[] | any): RunResult;
export declare function all(sql: string, params?: any[] | any): any[];
export declare function get(sql: string, params?: any[] | any): any | undefined;
export declare function close(): void;
export declare function ensureOpen(): void;
export declare const db: unknown;
export default db;
