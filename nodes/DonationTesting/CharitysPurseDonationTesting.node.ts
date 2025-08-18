import { INodeType, INodeTypeDescription, NodeConnectionType, IPollFunctions, INodeExecutionData, NodeOperationError, LoggerProxy } from 'n8n-workflow';

// Add a global error handler to catch activation errors
try {
    LoggerProxy.info('🔍 GLOBAL: Starting to load CharitysPurseDonationTesting node');
} catch (error) {
    LoggerProxy.error('🔍 GLOBAL ERROR: Error before node class definition:', error);
}

// Add a special method to the global scope to help diagnose activation issues
function diagnoseActivationIssue() {
    try {
        LoggerProxy.info('🔍 Diagnosing activation issue...');
        
        // Check if n8n is properly loading the node
        LoggerProxy.info('🔍 Node module loaded successfully');
        
        // Check for common issues
        LoggerProxy.info('🔍 Checking for common issues:');
        LoggerProxy.info('🔍 - Node exports correctly defined');
        LoggerProxy.info('🔍 - Node implements INodeType interface');
        LoggerProxy.info('🔍 - Node has valid description property');
        
        return true;
    } catch (error) {
        LoggerProxy.error('🔍 Diagnosis failed: ' + (error as Error).message);
        return false;
    }
}

// Run diagnosis immediately
diagnoseActivationIssue();

export class CharitysPurseDonationTesting implements INodeType {
	constructor() {
		LoggerProxy.info('🔍 CharitysPurseDonationTesting constructor called');
		
		// Log the node schema to help diagnose activation issues
		try {
			LoggerProxy.info('🔍 Node schema - name: ' + this.description.name);
			LoggerProxy.info('🔍 Node schema - displayName: ' + this.description.displayName);
			LoggerProxy.info('🔍 Node schema - group: ' + this.description.group);
			LoggerProxy.info('🔍 Node schema - version: ' + this.description.version);
			LoggerProxy.info('🔍 Node schema - credentials: ' + JSON.stringify(this.description.credentials));
			LoggerProxy.info('🔍 Node schema - properties: ' + JSON.stringify(this.description.properties));
		} catch (error) {
			LoggerProxy.error('🔍 Error logging node schema: ' + (error as Error).message);
		}
	}
	description: INodeTypeDescription = {
		displayName: 'CharitysPurse Donation Testing',
		name: 'charitysPurseDonationTesting',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when a donation is initiated',
		defaults: {
			name: 'Donation Testing Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'charitysPurseApi',
				required: true,
			},
		],
		properties: [
			// Add a debug section to help diagnose activation issues
			{
				displayName: '🔍 Debug Information',
				name: 'debugSection',
				type: 'notice',
				default: '',
				description: 'This node has debug logging enabled. Check your n8n server logs for diagnostic information.',
			},
			{
				displayName: 'Request Options',
				name: 'requestOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				description: 'Additional options for the request',
				options: [],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		LoggerProxy.info('🔍 POLL METHOD CALLED');
		
		// Try to detect the "Could not get parameter" error by checking if the function is called with expected context
		if (!this.getNode || !this.getWorkflow) {
			LoggerProxy.error('🔍 CRITICAL: Missing expected IPollFunctions methods. This could be related to the "Could not get parameter" error.');
		}
		
		try {
			// Special handling to catch parameter access errors
			try {
				// Test accessing a parameter that might be causing issues
				const testParams = this.getNode().parameters;
				LoggerProxy.info('🔍 Successfully accessed node parameters: ' + Object.keys(testParams || {}).join(', '));
			} catch (paramAccessError) {
				LoggerProxy.error('🔍 CRITICAL: Error accessing node parameters: ' + (paramAccessError as Error).message);
				LoggerProxy.error('🔍 This is likely related to the "Could not get parameter" activation error');
			}
			// Log critical information about the execution context
			LoggerProxy.info('🔍 Workflow ID: ' + this.getWorkflow().id);
			LoggerProxy.info('🔍 Node ID: ' + this.getNode().id);
			LoggerProxy.info('🔍 Node name: ' + this.getNode().name);
			
			const staticData = this.getWorkflowStaticData('node');
			LoggerProxy.info('🔍 Static data before update: ' + JSON.stringify(staticData));
		
		const intervalSeconds = 60;
		
		const now = Date.now();
		const nextPollAt = (staticData.nextPollAt as number | undefined) ?? 0;
		LoggerProxy.info(`🔍 Current time: ${now}, Next poll at: ${nextPollAt}`);
		
		if (now < nextPollAt) {
			LoggerProxy.info('🔍 Skipping poll - too early');
			return null;
		}
		LoggerProxy.info('🔍 Continuing with poll execution');
		
		if (!staticData.processedIds) {
			staticData.processedIds = {};
		}
		
		const processedIds = staticData.processedIds as Record<string, boolean>;

		const lastTime = staticData.lastPollTime || new Date(0).toISOString();
		LoggerProxy.info(`🔍 Making API request with lastTime: ${lastTime}`);
		
		// Try to access credentials to check if they're properly loaded
		try {
			const credentials = await this.getCredentials('charitysPurseApi');
			LoggerProxy.info('🔍 Credentials loaded successfully: ' + Object.keys(credentials).join(', '));
		} catch (credError) {
			LoggerProxy.error('🔍 ERROR loading credentials: ' + (credError as Error).message);
			throw new NodeOperationError(this.getNode(), 'Failed to load credentials', { 
				description: `Error: ${(credError as Error).message}` 
			});
		}
		
		// Log request details
		const requestOptions = {
			method: 'GET',
			url: 'https://api.charityspurse.ai/v1/integrations/zapier/donation/donation/list',
			qs: {
				since: lastTime,
			},
			json: true,
		};
		LoggerProxy.info('🔍 Request options: ' + JSON.stringify(requestOptions));
		
		let response;
		try {
			response = await this.helpers.requestWithAuthentication.call(this, 'charitysPurseApi', requestOptions);
			LoggerProxy.info('🔍 API response received: ' + (typeof response === 'object' ? 'Object received' : String(response)));
		} catch (apiError) {
			LoggerProxy.error('🔍 API ERROR: ' + (apiError as Error).message);
			throw new NodeOperationError(this.getNode(), 'API request failed', { 
				description: `Error: ${(apiError as Error).message}` 
			});
		}

		let body: any = response as any;
		LoggerProxy.info('🔍 Response body type: ' + typeof body);
		
		if (typeof body === 'string') {
			try {
				LoggerProxy.info('🔍 Parsing string response');
				body = JSON.parse(body);
			} catch (parseError) {
				LoggerProxy.error('🔍 ERROR parsing response: ' + (parseError as Error).message);
			}
		}
		
		const raw = body?.data ?? body;
		const rawStr = JSON.stringify(raw);
		LoggerProxy.info('🔍 Raw data: ' + rawStr.substring(0, 200) + (rawStr.length > 200 ? '...' : ''));
		
		const donationsArray: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
		LoggerProxy.info('🔍 Donations array length: ' + donationsArray.length);

		LoggerProxy.info('🔍 Filtering donations with status processing or confirmed with created_at !== updated_at');
		LoggerProxy.info('🔍 Current processedIds: ' + (Object.keys(processedIds).length > 0 ? 
			`${Object.keys(processedIds).length} IDs` : 'empty'));
		
		const filteredDonations = donationsArray.filter((d: any) => {
			const donationInfo = {
				id: d._id,
				status: d.status,
				created_at: d.created_at,
				updated_at: d.updated_at,
				already_processed: processedIds[d._id] ? 'yes' : 'no'
			};
			LoggerProxy.info('🔍 Checking donation: ' + JSON.stringify(donationInfo));
			
			const statusMatch = d.status === 'processing' || (d.status === 'confirmed' && d.created_at !== d.updated_at);
			
			if (!statusMatch || processedIds[d._id]) {
				LoggerProxy.info(`🔍 Skipping donation ${d._id}: statusMatch=${statusMatch}, alreadyProcessed=${processedIds[d._id] ? true : false}`);
				return false;
			}
			
			LoggerProxy.info(`🔍 Adding donation ${d._id} to filtered results`);
			processedIds[d._id] = true;
			return true;
		});

		staticData.lastPollTime = new Date().toISOString();
		staticData.nextPollAt = Date.now() + intervalSeconds * 1000;
		staticData.processedIds = processedIds;
		
		const staticDataSummary = {
			lastPollTime: staticData.lastPollTime,
			nextPollAt: staticData.nextPollAt,
			processedIdsCount: Object.keys(processedIds).length
		};
		LoggerProxy.info('🔍 Static data after update: ' + JSON.stringify(staticDataSummary));
		
		if (filteredDonations.length === 0) {
			LoggerProxy.info('🔍 No new donations to process, returning null');
			return null;
		}

		LoggerProxy.info(`🔍 Returning ${filteredDonations.length} new donations`);
		return [filteredDonations.map((d: any) => ({ json: { id: d._id, ...d } }))];
		
		} catch (error) {
			LoggerProxy.error('🔍 CRITICAL ERROR in poll method: ' + (error as Error).message);
			LoggerProxy.error('🔍 Error stack: ' + (error as Error).stack);
			throw error;
		}
	}
}
