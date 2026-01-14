import { Metadata } from 'next';
import IndianaInvestigationClient from './IndianaInvestigationClient';

export const metadata: Metadata = {
  title: 'Indiana Child Welfare Investigation | SomaliScan',
  description: 'How consulting firms captured a $4 billion child welfare system. Follow the money from taxpayers to Deloitte, KPMG, and the politicians who approved it.',
  openGraph: {
    title: 'The Indiana Child Welfare Machine',
    description: '$4.29 billion in spending. $250 million to consultants. 12,000 children in foster care.',
    type: 'article',
  },
};

export default function IndianaInvestigationPage() {
  return <IndianaInvestigationClient />;
}
