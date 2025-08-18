import {
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    IPollFunctions,
    INodeExecutionData,
  } from 'n8n-workflow';
  
  export class HelloPollTrigger implements INodeType {
    description: INodeTypeDescription = {
      displayName: 'Hello Poll Trigger',
      name: 'helloPollTrigger',
      group: ['trigger'],
      version: 1,
      description: 'Emits a dummy item on every poll',
      defaults: { name: 'Hello Poll Trigger' },
      inputs: [],
      outputs: [NodeConnectionType.Main],
      // 🔥 THIS LINE IS REQUIRED for polling triggers
      polling: true,
      properties: [],
    };
  
    async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
      // emit one item; activation will succeed if polling is recognized
      return [[{ json: { ok: true, ts: Date.now() } }]];
    }
  }