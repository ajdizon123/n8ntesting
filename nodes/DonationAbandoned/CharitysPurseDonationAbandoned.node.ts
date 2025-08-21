import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	IPollFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

export class CharitysPurseDonationAbandoned implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CharitysPurse Donation Abandoned',
		name: 'charitysPurseDonationAbandoned',
		group: ['trigger'],
		version: 15,
		description: 'Triggers when a donation is abandoned',
		defaults: { name: 'Donation Abandoned Trigger' },
		inputs: [],
		outputs: [NodeConnectionType.Main],

		// REQUIRED so n8n treats this as a polling trigger at activation time
		polling: true,

		// Make creds OPTIONAL so activation never hard-fails if creds are not attached yet.
		credentials: [{ name: 'charitysPurseApi', required: true }],

		properties: [
			// Legacy top-level flag (kept so older saved workflows won't break on activation)
			{
				displayName: 'Allow Unauthorized Certs (Legacy)',
				name: 'allowUnauthorizedCerts',
				type: 'hidden',
				default: false,
				description: 'Whether to connect even if SSL certificate validation is not possible',
			},
			{
				displayName: 'Poll Timespan',
				name: 'pollTimespan',
				type: 'hidden',
				default: '',
				description: 'Legacy parameter for backward compatibility',
			},
			{
				displayName: 'Request Options',
				name: 'requestOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				description: 'Additional options to configure the request (activation-safe)',
				options: [
					{
						displayName: 'Allow Unauthorized Certs',
						name: 'allowUnauthorizedCerts',
						type: 'boolean',
						default: false,
						description: 'Whether to connect even if SSL certificate validation is not possible',
					},
					{
						displayName: 'Query Parameters',
						name: 'qs',
						type: 'string',
						default: '',
						description: 'Query parameters to include in the request (JSON object string)',
					},
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'string',
						default: '',
						description: 'Headers to include in the request (JSON object string)',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'hidden',
				default: {},
				description: 'Legacy parameter for backward compatibility',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'hidden',
				default: {},
				description: 'Legacy parameter for backward compatibility',
			},
		],
	};

	/**
	 * Poll-based trigger for abandoned donations
	 */
	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		// ---- Read params (defaults come from properties) ----
		const allowUnauthorizedCerts = Boolean(
			this.getNodeParameter('requestOptions.allowUnauthorizedCerts', 0) as unknown,
		);
		const qsRaw = String(
			(this.getNodeParameter('requestOptions.qs', 0) as unknown) ?? '',
		).trim();
		const headersRaw = String(
			(this.getNodeParameter('requestOptions.headers', 0) as unknown) ?? '',
		).trim();

		// ---- Parse optional JSON inputs (non-fatal if malformed) ----
		let userQs: Record<string, unknown> | undefined;
		if (qsRaw) {
			try { 
				userQs = JSON.parse(qsRaw); 
			} catch (e) { 
				// Failed to parse qs, continue with undefined
			}
		}

		let userHeaders: Record<string, string> | undefined;
		if (headersRaw) {
			try { 
				userHeaders = JSON.parse(headersRaw); 
			} catch (e) { 
				// Failed to parse headers, continue with undefined
			}
		}

		// ---- Interval control via staticData ----
		const staticData = this.getWorkflowStaticData('node');
		const intervalSeconds = 60;

		const now = Date.now();
		const nextPollAt = (staticData.nextPollAt as number | undefined) ?? 0;
		if (now < nextPollAt) {
			return null;
		}

		if (!staticData.processedIds) staticData.processedIds = {};
		const processedIds = staticData.processedIds as Record<string, boolean>;
		const lastTime = (staticData.lastPollTime as string) || new Date(0).toISOString();

		// ---- Build request ----
		const baseUrlDefault = 'https://api.charityspurse.ai';
		let hasCreds = false;
		let baseUrl = baseUrlDefault;
		let authHeader: string | undefined;

		// Try to load credentials (optional)
		try {
			const creds = (await this.getCredentials('charitysPurseApi')) as Record<string, any>;
			if (creds) {
				hasCreds = true;
				baseUrl = (creds.baseUrl as string) || baseUrlDefault;
				const apiKey = (creds.apiKey as string) || '';
				if (apiKey) authHeader = `Bearer ${apiKey}`;
			}
		} catch {
			// No credentials attached, continue with defaults
		}

		const requestOptions: any = {
			method: 'GET',
			url: `${String(baseUrl).replace(/\/+$/, '')}/v1/integrations/zapier/donation/donation/list`,
			qs: { since: lastTime, ...(userQs ?? {}) },
			headers: { ...(userHeaders ?? {}), ...(authHeader ? { Authorization: authHeader } : {}) },
			json: true,
			// honored by n8n's HTTP client
			rejectUnauthorized: !allowUnauthorizedCerts,
		};

		// ---- Make request (with or without auth helper) ----
		let response: unknown;
		try {
			if (hasCreds) {
				response = await this.helpers.requestWithAuthentication.call(
					this,
					'charitysPurseApi',
					requestOptions,
				);
			} else {
				// Fallback if no creds attached (works for public/test endpoints)
				response = await this.helpers.request!(requestOptions);
			}
		} catch (err) {
			// Don't throw; keep trigger alive. Push next poll farther to avoid hot-looping on errors.
			staticData.nextPollAt = Date.now() + 2 * 60 * 1000;
			return null;
		}

		// ---- Normalize response ----
		let body: any = response as any;
		if (typeof body === 'string') {
			try { body = JSON.parse(body); } catch { /* ignore */ }
		}
		const raw = body?.data ?? body;
		const donationsArray: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

		// ---- Filter new/interesting items ----
		const filteredDonations = donationsArray.filter((d: any) => {
			// Only look for abandoned donations
			const statusMatch = d?.status === 'abandoned';
			const id = d?._id;
			const seen = id ? processedIds[id] : false;

			if (!statusMatch || !id || seen) return false;
			processedIds[id] = true;
			return true;
		});

		// ---- Update cursors/interval ----
		staticData.lastPollTime = new Date().toISOString();
		staticData.nextPollAt = Date.now() + intervalSeconds * 1000;
		staticData.processedIds = processedIds;

		if (filteredDonations.length === 0) {
			return null;
		}

		const items = filteredDonations.map((d: any) => ({ json: { id: d._id, ...d } }));
		return [items];
	}
}