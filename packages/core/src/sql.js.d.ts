// Type declarations for sql.js
// Based on sql.js API: https://sql.js.org/documentation/

declare module 'sql.js' {
  namespace initSqlJs {
    export interface SqlJsStatic {
      Database: typeof Database;
    }

    export interface Config {
      locateFile?: (file: string, prefix?: string) => string;
    }
  }

  function initSqlJs(config?: initSqlJs.Config): Promise<initSqlJs.SqlJsStatic>;

  export default initSqlJs;
  export { initSqlJs };

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer);
    run(sql: string, params?: any[]): void;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
    create_function(name: string, func: (...args: any[]) => any): void;
    create_aggregate(
      name: string,
      aggregateFunctions: {
        init: () => any;
        step: (state: any, value: any) => any;
        finalize?: (state: any) => any;
      }
    ): void;
  }

  export interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  export class Statement {
    bind(values?: any[] | { [key: string]: any }): boolean;
    step(): boolean;
    get(params?: any[]): any[];
    getAsObject(params?: any[]): { [key: string]: any };
    getColumnNames(): string[];
    reset(): void;
    free(): void;
  }

  export { Database as SqlJsDatabase };
}
