import { Metadata } from 'next';
import ColumbusClient from './ColumbusClient';
import networkData from './columbus_network_data.json';

export const metadata: Metadata = {
  title: 'Columbus OH PPP Fraud Network - Investigation | SomaliScan',
  description: 'Multi-cluster analysis of potential PPP fraud in Columbus, Ohio centered on SERC and connected home health and transportation businesses. $13.86M in PPP exposure across 186 entities.',
};

export default function ColumbusInvestigationPage() {
  return <ColumbusClient data={networkData} />;
}
