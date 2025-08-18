import { INodeType, ICredentialType } from 'n8n-workflow';
import { CharitysPurseApi } from './credentials/CharitysPurseApi.credentials';

import { CharitysPurseDonationInitiated } from './nodes/DonationInitiated/CharitysPurseDonationInitiated.node';
import { CharitysPurseDonationConfirmed } from './nodes/DonationConfirmed/CharitysPurseDonationConfirmed.node';
import { CharitysPurseDonationAbandoned } from './nodes/DonationAbandoned/CharitysPurseDonationAbandoned.node';
import { CharitysPurseDonationTesting } from './nodes/DonationTesting/CharitysPurseDonationTesting.node';
import { CharitysPurseDonationTestingAlt } from './nodes/DonationTestingAlt/CharitysPurseDonationTestingAlt.node';

export const nodes: INodeType[] = [
  new CharitysPurseDonationInitiated(),
  new CharitysPurseDonationConfirmed(),
  new CharitysPurseDonationAbandoned(),
  new CharitysPurseDonationTesting(),
  new CharitysPurseDonationTestingAlt(),
];

export const credentials: ICredentialType[] = [
  new CharitysPurseApi(),
];
