export class Neo4jConnector {
    uri;
    user;
    password;
    connected = false;
    constructor(uri, user, password) {
        this.uri = uri;
        this.user = user;
        this.password = password;
    }
    async connect() {
        try {
            const response = await fetch(`${this.uri}/db/data/transaction/commit`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    statements: [{ statement: 'RETURN 1 as connected' }],
                }),
            });
            this.connected = response.ok;
            return this.connected;
        }
        catch {
            this.connected = false;
            return false;
        }
    }
    async pushGraph(graph) {
        if (!this.connected) {
            const ok = await this.connect();
            if (!ok)
                return false;
        }
        try {
            const statements = [];
            // Merge nodes
            for (const node of graph.nodes) {
                statements.push({
                    statement: `
            MERGE (n:GraphNode {id: $id})
            SET n.type = $type, n.label = $label, n.metadata = $metadata,
                n.createdAt = $createdAt, n.updatedAt = $updatedAt, n.version = $version
          `,
                    parameters: {
                        id: node.id,
                        type: node.type,
                        label: node.label,
                        metadata: JSON.stringify(node.metadata),
                        createdAt: node.createdAt,
                        updatedAt: node.updatedAt,
                        version: node.version,
                    },
                });
            }
            // Merge relations
            for (const rel of graph.relations) {
                statements.push({
                    statement: `
            MATCH (a:GraphNode {id: $source}), (b:GraphNode {id: $target})
            MERGE (a)-[r:RELATES {type: $type}]->(b)
            SET r.weight = $weight, r.metadata = $metadata
          `,
                    parameters: {
                        source: rel.source,
                        target: rel.target,
                        type: rel.type,
                        weight: rel.weight,
                        metadata: rel.metadata ? JSON.stringify(rel.metadata) : '{}',
                    },
                });
            }
            const response = await fetch(`${this.uri}/db/data/transaction/commit`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ statements }),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async pullGraph() {
        if (!this.connected) {
            const ok = await this.connect();
            if (!ok)
                return null;
        }
        try {
            const response = await fetch(`${this.uri}/db/data/transaction/commit`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    statements: [
                        { statement: 'MATCH (n:GraphNode) RETURN n' },
                        { statement: 'MATCH (a:GraphNode)-[r:RELATES]->(b:GraphNode) RETURN a.id AS source, r.type AS type, b.id AS target, r.weight AS weight' },
                    ],
                }),
            });
            const data = await response.json();
            if (!data.results)
                return null;
            const nodes = [];
            const relations = [];
            const nodeRows = data.results[0]?.data || [];
            for (const row of nodeRows) {
                if (!row || !Array.isArray(row) || !row[0])
                    continue;
                const raw = row[0];
                nodes.push({
                    id: raw.id,
                    type: raw.type,
                    label: raw.label,
                    metadata: typeof raw.metadata === 'string' ? JSON.parse(raw.metadata) : (raw.metadata || {}),
                    createdAt: raw.createdAt,
                    updatedAt: raw.updatedAt,
                    version: raw.version,
                });
            }
            const relRows = data.results[1]?.data || [];
            for (const row of relRows) {
                if (!row || !Array.isArray(row) || row.length < 4)
                    continue;
                relations.push({
                    source: row[0],
                    type: row[1],
                    target: row[2],
                    weight: row[3],
                });
            }
            return {
                nodes,
                relations,
                lastUpdated: new Date().toISOString(),
                version: 1,
            };
        }
        catch {
            return null;
        }
    }
    async clearGraph() {
        if (!this.connected)
            return false;
        try {
            const response = await fetch(`${this.uri}/db/data/transaction/commit`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    statements: [{ statement: 'MATCH (n:GraphNode) DETACH DELETE n' }],
                }),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
