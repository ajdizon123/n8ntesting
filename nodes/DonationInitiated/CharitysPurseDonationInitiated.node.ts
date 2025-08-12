import { INodeType, INodeTypeDescription, NodeConnectionType, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export class CharitysPurseDonationInitiated implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CharitysPurse Donation Initiated',
		name: 'charitysPurseDonationInitiated',
		group: ['transform'],
		version: 9,
		description: 'Triggers when a donation is initiated',
		defaults: {
			name: 'Donation Initiated Trigger',
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
		const donationsArray: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

		const filteredDonations = donationsArray.filter((d: any) =>
			d.status === 'processing' || (d.status === 'confirmed' && d.created_at !== d.updated_at)
		);

		staticData.lastPollTime = new Date().toISOString();

		return [filteredDonations.map((d: any) => ({ json: { id: d._id, ...d } }))];
	}
}
