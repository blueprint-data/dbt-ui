export type Manifest = {
    nodes?: Record<string, any>;
    sources?: Record<string, any>;
    metadata?: any;
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
    tags?: string[];
    meta?: any;
    config?: any;
    columns?: Record<string, { description?: string; meta?: any }>;
    depends_on?: { nodes?: string[] };
};
