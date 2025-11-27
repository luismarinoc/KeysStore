import { XMLParser } from 'fast-xml-parser';

export interface SapSystem {
    uuid: string;
    name: string;
    systemid: string;
    server: string;
    routerid?: string;
    instance?: string;
}

export interface ParsedProject {
    name: string;
    systems: SapSystem[];
}

export const parseSapConfig = (xmlContent: string): ParsedProject[] => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });

    try {
        const result = parser.parse(xmlContent);
        const landscape = result?.Landscape;

        if (!landscape) {
            console.warn('[SAP PARSER] No Landscape found in SAP XML');
            return [];
        }

        // Extract Services section - this is where the actual SAPGUI connection details are
        const servicesSection = landscape?.Services?.Service;
        if (!servicesSection) {
            console.warn('[SAP PARSER] No Services section found');
            return [];
        }

        // Ensure services is an array
        const serviceList = Array.isArray(servicesSection) ? servicesSection : [servicesSection];

        // Build a map of service UUID -> Service details for quick lookup
        const servicesMap: Record<string, any> = {};
        serviceList.forEach((service: any) => {
            if (service.type === 'SAPGUI' && service.uuid) {
                servicesMap[service.uuid] = service;
            }
        });

        console.log(`[SAP PARSER] Found ${Object.keys(servicesMap).length} SAPGUI services`);

        // Extract Nodes from Workspaces - these are the PROJECTS
        const workspaces = landscape?.Workspaces?.Workspace;
        if (!workspaces) {
            console.warn('[SAP PARSER] No Workspaces found');
            return [];
        }

        // Ensure workspaces is an array
        const workspaceList = Array.isArray(workspaces) ? workspaces : [workspaces];

        const projects: ParsedProject[] = [];

        workspaceList.forEach((workspace: any) => {
            // Get all children of workspace (Nodes and Items)
            const workspaceChildren = workspace.Node;

            if (!workspaceChildren) {
                console.log('[SAP PARSER] Workspace has no Nodes');
                return;
            }

            // Ensure it's an array
            const nodeList = Array.isArray(workspaceChildren) ? workspaceChildren : [workspaceChildren];

            nodeList.forEach((node: any) => {
                const projectName = node.name || 'Unnamed Project';

                // Get Items within this Node - these reference Services
                const items = node.Item;

                if (!items) {
                    console.log(`[SAP PARSER] Node "${projectName}" has no Items, skipping`);
                    return;
                }

                // Ensure items is an array
                const itemList = Array.isArray(items) ? items : [items];

                // Map items to actual services using serviceid
                const systems: SapSystem[] = [];

                itemList.forEach((item: any) => {
                    const serviceId = item.serviceid;
                    if (!serviceId) {
                        console.log(`[SAP PARSER] Item in "${projectName}" has no serviceid`);
                        return;
                    }

                    const service = servicesMap[serviceId];
                    if (!service) {
                        console.log(`[SAP PARSER] Service ${serviceId} not found in services map`);
                        return;
                    }

                    systems.push({
                        uuid: service.uuid || '',
                        name: service.name || 'Unnamed System',
                        systemid: service.systemid || '',
                        server: service.server || '',
                        routerid: service.routerid,
                        instance: service.msid || service.mode || '00',
                    });
                });

                if (systems.length > 0) {
                    projects.push({
                        name: projectName,
                        systems,
                    });
                } else {
                    console.log(`[SAP PARSER] Node "${projectName}" has no valid SAPGUI services, skipping`);
                }
            });
        });

        console.log(`[SAP PARSER] ✓ Parsed ${projects.length} projects with ${projects.reduce((acc, p) => acc + p.systems.length, 0)} total systems`);
        return projects;

    } catch (error) {
        console.error('[SAP PARSER] ✗ Error parsing SAP XML:', error);
        return [];
    }
};
