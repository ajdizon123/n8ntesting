import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData, NodeConnectionType } from 'n8n-workflow';

export class CharitysPurseDonationConfirmed implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'CharitysPurse Donation Confirmed Trigger',
        name: 'charitysPurseDonationConfirmed',
        group: ['transform'],
        version: 9,
        description: 'Triggers when a donation is confirmed.',
        defaults: {
            name: 'Donation Confirmed',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'charitysPurseApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Request Options',
                name: 'requestOptions',
                type: 'collection',
                default: {},
                placeholder: 'Add Option',
                description: 'Additional options to configure the request. Provided for compatibility with saved workflows.',
                options: [],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const staticData = this.getWorkflowStaticData('node');

        const lastTime = staticData.lastPollTime || new Date(0).toISOString();

        const response = await this.helpers.requestWithAuthentication.call(this, 'charitysPurseApi', {
            method: 'GET',
            url: 'https://api.charityspurse.ai/v1/integrations/zapier/donation/donation/list',
            qs: {
                since: lastTime,
            },
            json: true,
        });

        let body: any = response as any;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {}
        }
        const raw = body?.data ?? body;
        const donations: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

        const confirmed = donations.filter((d) => d.status === 'confirmed');

        staticData.lastPollTime = new Date().toISOString();

        const items: INodeExecutionData[] = confirmed.map((d) => {
            const { _id, ...rest } = d;
            return {
                json: {
                    id: _id,
                    ...rest,
                },
            };
        });

        return [items];
    }
}
