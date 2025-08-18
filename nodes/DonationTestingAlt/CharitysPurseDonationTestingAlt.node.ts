import { 
	INodeType, 
	INodeTypeDescription, 
	NodeConnectionType, 
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError
} from 'n8n-workflow';

export class CharitysPurseDonationTestingAlt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CharitysPurse Donation Testing Alt',
		name: 'charitysPurseDonationTestingAlt',
		group: ['transform'],
		version: 1,
		description: 'Alternative implementation that works with Schedule Trigger',
		defaults: {
			name: 'Donation Testing Alt',
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
				displayName: 'Important: Use with Schedule Trigger',
				name: 'scheduleNote',
				type: 'notice',
				default: '',
				description: 'This node must be connected to a Schedule Trigger node set to run every minute',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const staticData = this.getWorkflowStaticData('node');
		
		if (!staticData.processedIds) {
			staticData.processedIds = {};
		}
		
		if (!staticData.lastPollTime) {
			staticData.lastPollTime = new Date(0).toISOString();
		}
		
		const processedIds = staticData.processedIds as Record<string, boolean>;
		const lastTime = staticData.lastPollTime as string;
		
		try {
			const response = await this.helpers.requestWithAuthentication.call(
				this, 
				'charitysPurseApi', 
				{
					method: 'GET',
					url: 'https://api.charityspurse.ai/v1/integrations/zapier/donation/donation/list',
					qs: {
						since: lastTime,
					},
					json: true,
				}
			);
			
			let body: any = response as any;
			if (typeof body === 'string') {
				try {
					body = JSON.parse(body);
				} catch (e) {
				}
			}
			
			const raw = body?.data ?? body;
			const donationsArray: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
			
			const filteredDonations = donationsArray.filter((d: any) => {
				const statusMatch = d.status === 'processing' || (d.status === 'confirmed' && d.created_at !== d.updated_at);
				
				if (!statusMatch || processedIds[d._id]) {
					return false;
				}
				
				processedIds[d._id] = true;
				return true;
			});
			
			staticData.lastPollTime = new Date().toISOString();
			staticData.processedIds = processedIds;
			
			if (filteredDonations.length > 0) {
				return [filteredDonations.map((d: any) => ({ 
					json: { id: d._id, ...d } 
				}))];
			}
			
			return [[]];
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Error fetching donations: ${(error as Error).message}`);
		}
	}
}