import { Metadata } from 'next';
import ForestParkClient from './ForestParkClient';
import fraudNetworkData from './fraud_network_data.json';

export const metadata: Metadata = {
  title: 'Forest Park Medical Center - Fraud Network Analysis | SomaliScan',
  description: 'Interactive visualization of the Forest Park Medical Center healthcare fraud network. 15 convicted individuals, $82.9M restitution, 72.5 years combined prison time.',
};

export default function ForestParkPage() {
  return <ForestParkClient data={fraudNetworkData} />;
}
