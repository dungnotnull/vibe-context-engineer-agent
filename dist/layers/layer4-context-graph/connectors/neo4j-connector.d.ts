import type { ContextGraph } from '../../../core/types.js';
export declare class Neo4jConnector {
    private uri;
    private user;
    private password;
    private connected;
    constructor(uri: string, user: string, password: string);
    connect(): Promise<boolean>;
    pushGraph(graph: ContextGraph): Promise<boolean>;
    pullGraph(): Promise<ContextGraph | null>;
    clearGraph(): Promise<boolean>;
}
