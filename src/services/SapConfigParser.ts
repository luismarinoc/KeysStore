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
        const servicesMap = new Map<string, any>();
        serviceList.forEach((service: any) => {
            const uuid = service.uuid?.trim();
            if (uuid) {
                console.log(`[SAP PARSER] Adding service to map: ${service.name} (UUID: ${uuid}), has Memo: ${!!service.Memo}`);
                if (service.Memo) {
                    console.log(`[SAP PARSER]   Memo content preview:`, service.Memo.value?.substring(0, 50) || service.Memo);
                }
                servicesMap.set(uuid, service);
            }
        });
        console.log(`[SAP PARSER] Total services in map: ${servicesMap.size}`);

        console.log(`[SAP PARSER] Found ${servicesMap.size} SAPGUI services`);

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

                    const service = servicesMap.get(serviceId.trim());
                    if (!service) {
                        // console.log(`[SAP PARSER] Service ${serviceId} not found in services map`);
                        return;
                    }

                    // Skip Reference type services (shortcuts) to avoid duplicates
                    // The actual service will be processed directly from its own Item
                    if (service.type === 'Reference') {
                        console.log(`[SAP PARSER] Skipping Reference/shortcut: ${service.name}`);
                        return;
                    }

                    const actualService = service;

                    const systemName = actualService.name || 'Unknown';
                    const systemId = actualService.systemid || '';

                    // Parse Server and Instance
                    // Extract server and instance
                    const serverString = actualService.server || '';
                    const serverParts = serverString.split(':');
                    const serverHost = serverParts[0] || '';
                    const serverPort = serverParts[1] || '';

                    // Extract instance from port (e.g., 3200 -> 00, 3210 -> 10)
                    let instanceNum = '';
                    if (serverPort) {
                        const portNum = parseInt(serverPort, 10);
                        if (!isNaN(portNum) && portNum >= 3200 && portNum < 3300) {
                            const inst = portNum - 3200;
                            instanceNum = inst.toString().padStart(2, '0');
                        }
                    }

                    // Resolve router string
                    let routerString = '';
                    const routerUuid = actualService.routerid;
                    if (routerUuid) {
                        const trimmedUuid = routerUuid.trim();
                        if (routersMap[trimmedUuid]) {
                            routerString = routersMap[trimmedUuid];
                            console.log(`[SAP PARSER] Resolved router ${trimmedUuid} to: ${routerString}`);
                        } else {
                            console.log(`[SAP PARSER] Router UUID ${routerUuid} not found in map. Available: ${Object.keys(routersMap).join(', ')}`);
                        }
                    }

                    // Extract Item/Service Memo
                    console.log(`[SAP PARSER] Processing Item with serviceId: ${serviceId}`);
                    console.log(`[SAP PARSER] Actual Service object:`, actualService);
                    console.log(`[SAP PARSER] Actual Service has Memo?`, !!actualService.Memo);

                    let itemMemo = '';
                    if (item.Memo) {
                        console.log('[SAP PARSER] Found Memo in Item:', JSON.stringify(item.Memo));
                        itemMemo = extractText(item.Memo);
                        console.log('[SAP PARSER] Extracted Item Memo:', itemMemo);
                    }

                    if (!itemMemo && actualService.Memo) {
                        console.log('[SAP PARSER] Found Memo in Service (fallback):', JSON.stringify(actualService.Memo));
                        itemMemo = extractText(actualService.Memo);
                        console.log('[SAP PARSER] Extracted Service Memo:', itemMemo);
                    }

                    if (itemMemo) {
                        console.log('[SAP PARSER] Extracted Item/Service Memo Text:', itemMemo.substring(0, 50) + '...');
                    } else if (item.Memo || actualService.Memo) {
                        const memoObj = item.Memo || actualService.Memo;
                        if (memoObj && typeof memoObj === 'object') {
                            console.log('[SAP PARSER] ⚠️ Failed to extract text from Item/Service Memo object. Keys:', Object.keys(memoObj));
                        }
                    }

                    // Decode HTML entities if needed (fast-xml-parser might do it)
                    // Also handle xml:space="preserve" which might result in an object

                    systems.push({
                        uuid: actualService.uuid || '',
                        name: systemName,
                        systemid: systemId,
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
