export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type Manifest = {
    nodes?: Record<string, DbtNode>;
    sources?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
};

export type DbtNode = {
    unique_id: string;
    name: string;
    resource_type: string;
    package_name?: string;
    original_file_path?: string;
    path?: string;
    database?: string;
    schema?: string;
    alias?: string;
    description?: string;
    raw_code?: string;
    compiled_code?: string;
    raw_sql?: string;
    compiled_sql?: string;
    tags?: string[];
    meta?: Record<string, JsonValue>;
    config?: Record<string, JsonValue>;
    columns?: Record<string, { description?: string; meta?: Record<string, JsonValue> }>;
    depends_on?: { nodes?: string[] };
};
