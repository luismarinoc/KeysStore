
import { XMLParser } from 'fast-xml-parser';

const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Landscape>
    <Workspaces>
        <Workspace>
            <Node name="Test Project">
                <Memo xml:space="preserve">Node Level Memo Content</Memo>
                <Item serviceid="uuid-123">
                    <Memo xml:space="preserve">Usuario de acceso a DEV: EXT-GPDEV
Clavede acceso a DEV: Consultor.2025</Memo>
                </Item>
            </Node>
        </Workspace>
    </Workspaces>
    <Services>
        <Service uuid="uuid-123" type="SAPGUI" name="Test System">
            <Memo xml:space="preserve">Service Level Memo Content</Memo>
        </Service>
    </Services>
</Landscape>`;

const parseSapConfig = (xml: string) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: 'value',
    });

    const result = parser.parse(xml);
    console.log('Parsed Raw Result:', JSON.stringify(result, null, 2));

    const extractText = (obj: any): string => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj.value || obj['#text'] || obj['#value'] || obj._text || obj.text || '';
    };

    const node = result.Landscape.Workspaces.Workspace.Node;
    console.log('Node Memo Raw:', node.Memo);
    console.log('Node Memo Extracted:', extractText(node.Memo));

    const item = node.Item;
    console.log('Item Memo Raw:', item.Memo);
    console.log('Item Memo Extracted:', extractText(item.Memo));
};

parseSapConfig(xmlContent);
