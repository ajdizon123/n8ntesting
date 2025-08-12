import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
  } from 'n8n-workflow';
  
  export class CharitysPurseApi implements ICredentialType {
    name = 'charitysPurseApi';
    displayName = 'CharitysPurse API';
    documentationUrl = 'https://api.charityspurse.ai/docs'; // replace with actual docs URL
    properties: INodeProperties[] = [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        description: 'The API key for your CharitysPurse account',
      },
    ];
  
    authenticate: IAuthenticateGeneric = {
      type: 'generic',
      properties: {
        headers: {
          'x-api-key': '={{$credentials.apiKey}}',
        },
      },
    };
  
    // For Testing
    test: ICredentialTestRequest = {
      request: {
        baseURL: 'https://api.charityspurse.ai',
        url: '/v1/integrations/zapier/donation/donation/list',
        method: 'GET',
        qs: {
          since: '1970-01-01T00:00:00.000Z',
        },
        headers: {
          'x-api-key': '={{$credentials.apiKey}}',
        },
      },
    };
  }