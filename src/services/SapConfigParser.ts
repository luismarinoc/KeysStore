import { XMLParser } from 'fast-xml-parser';

export interface SapSystem {
    uuid: string;
    name: string;
    systemid: string;
    server: string;
    routerid?: string;
    instance?: string;
    memo?: string;
}

export interface ParsedProject {
    name: string;
    systems: SapSystem[];
    memo?: string;
}

export const parseSapConfig = (xmlContent: string): ParsedProject[] => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: 'value', // To capture text content of tags like Memo
    });

    try {
        const result = parser.parse(xmlContent);
        const landscape = result?.Landscape;

        if (!landscape) {
            console.warn('[SAP PARSER] No Landscape found in SAP XML');
            return [];
        }

        // Extract Routers section
        const routersSection = landscape?.Routers?.Router;
        const routersMap: Record<string, string> = {};

        if (routersSection) {
            const routerList = Array.isArray(routersSection) ? routersSection : [routersSection];
            routerList.forEach((router: any) => {
                if (router.uuid && router.router) {
                    routersMap[router.uuid.trim()] = router.router;
                }
            });
            console.log(`[SAP PARSER] Found ${Object.keys(routersMap).length} Routers`);
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
                servicesMap[service.uuid.trim()] = service;
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

        // Helper to extract text from potential object with attributes
        const extractText = (obj: any): string => {
            if (!obj) return '';
            if (Array.isArray(obj)) {
                return obj.map(item => extractText(item)).join('\n\n');
            }
            if (typeof obj === 'string') return obj;
            return obj.value || obj['#text'] || obj['#value'] || obj._text || obj.text || '';
        };

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

                // Extract Project-Level Memo (Node Memo)
                let projectMemo = '';
                if (node.Memo) {
                    console.log(`[SAP PARSER] Found Memo in Node "${projectName}":`, JSON.stringify(node.Memo));
                    projectMemo = extractText(node.Memo);
                }

                // Get Items within this Node - these reference Services
                const items = node.Item;

                if (!items) {
                    // console.log(`[SAP PARSER] Node "${projectName}" has no Items, skipping`);
                    return;
                }

                // Ensure items is an array
                const itemList = Array.isArray(items) ? items : [items];

                // Map items to actual services using serviceid
                const systems: SapSystem[] = [];

                itemList.forEach((item: any) => {
                    const serviceId = item.serviceid;
                    if (!serviceId) {
                        // console.log(`[SAP PARSER] Item in "${projectName}" has no serviceid`);
                        return;
                    }

                    const service = servicesMap[serviceId.trim()];
                    if (!service) {
                        // console.log(`[SAP PARSER] Service ${serviceId} not found in services map`);
                        return;
                    }

                    // Parse Server and Instance
                    let serverHost = service.server || '';
                    let instanceNum = service.msid || service.mode || '00';

                    // Check if server has port (e.g. 10.20.6.26:3200)
                    if (serverHost.includes(':')) {
                        const parts = serverHost.split(':');
                        if (parts.length === 2) {
                            serverHost = parts[0]; // The IP/Host part
                            const port = parts[1];

                            // Extract last 2 digits of port for instance number
                            if (port.length >= 2) {
                                instanceNum = port.slice(-2);
                            }
                        }
                    }

                    // Resolve Router ID to actual Router String
                    let routerString = service.routerid;
                    if (service.routerid) {
                        const routerUuid = service.routerid.trim();
                        if (routersMap[routerUuid]) {
                            routerString = routersMap[routerUuid];
                        } else {
                            console.log(`[SAP PARSER] Router UUID ${routerUuid} not found in map. Available: ${Object.keys(routersMap).join(', ')}`);
                        }
                    }

                    // Extract Item/Service Memo
                    let itemMemo = '';
                    if (item.Memo) {
                        console.log('[SAP PARSER] Found Memo in Item:', JSON.stringify(item.Memo));
                        itemMemo = extractText(item.Memo);
                    }

                    if (!itemMemo && service.Memo) {
                        console.log('[SAP PARSER] Found Memo in Service (fallback):', JSON.stringify(service.Memo));
                        itemMemo = extractText(service.Memo);
                    }

                    if (itemMemo) {
                        console.log('[SAP PARSER] Extracted Item/Service Memo Text:', itemMemo.substring(0, 50) + '...');
                    } else if (item.Memo || service.Memo) {
                        console.log('[SAP PARSER] ⚠️ Failed to extract text from Item/Service Memo object. Keys:', Object.keys(item.Memo || service.Memo));
                    }

                    // Decode HTML entities if needed (fast-xml-parser might do it)
                    // Also handle xml:space="preserve" which might result in an object

                    systems.push({
                        uuid: service.uuid || '',
                        name: service.name || 'Unnamed System',
                        systemid: service.systemid || '',
                        server: serverHost,
                        routerid: routerString,
                        instance: instanceNum,
                        memo: itemMemo,
                    });
                });

                if (systems.length > 0) {
                    projects.push({
                        name: projectName,
                        systems,
                        memo: projectMemo,
                    });
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
