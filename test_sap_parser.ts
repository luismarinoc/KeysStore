
import { XMLParser } from 'fast-xml-parser';

const xmlContent = `<?xml version="1.0"?>
<Landscape>
    <Workspaces>
        <Workspace uuid="7ab12289-3ca1-43e9-8a54-46d45f8a94c0" name="Local" expanded="1">
            <Node uuid="968ad5aa-56a6-4786-8a71-ce6091978355" name="7.MAx Service">
                <Item uuid="d27e361c-1e0c-4e1d-a48c-f4c7954f5325" serviceid="092e1ab9-06aa-448c-ab21-5d9bb56cb742"/>
                <Item uuid="514476a6-0c1c-4f4b-91fd-4901343b597d" serviceid="b5955b8b-cfdf-4de5-b7c8-51146a3f6da6"/>
            </Node>
        </Workspace>
    </Workspaces>
    <Services>
        <Service type="SAPGUI" uuid="092e1ab9-06aa-448c-ab21-5d9bb56cb742" name="Max Service DEV" systemid="DEV" mode="1" server="192.168.70.58:3200" sncop="-1" dcpg="2" routerid="bfba75d7-0f21-443d-8e59-5c9d6625f599">
            <Memo xml:space="preserve">Usuario: mvargas
Clave  : Soporte.2023

usuario: sapadmin
clave: Max$2024</Memo>
        </Service>
        <Service type="SAPGUI" uuid="b5955b8b-cfdf-4de5-b7c8-51146a3f6da6" name="Max Service QAS" systemid="QAS" mode="1" server="192.168.70.68:3200" sncop="-1" dcpg="2" routerid="bfba75d7-0f21-443d-8e59-5c9d6625f599">
            <Memo xml:space="preserve">Gpartner2023...</Memo>
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
    console.log('=== PARSED RESULT ===');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n=== SERVICES ===');
    const services = result.Landscape?.Services?.Service;
    const serviceList = Array.isArray(services) ? services : [services];
    serviceList.forEach((service: any) => {
        console.log(`Service: ${service.name}`);
        console.log('  Memo raw:', service.Memo);
        console.log('  Memo type:', typeof service.Memo);
        if (service.Memo) {
            console.log('  Memo.value:', service.Memo.value);
            console.log('  Memo["xml:space"]:', service.Memo['xml:space']);
        }
    });
};

parseSapConfig(xmlContent);
