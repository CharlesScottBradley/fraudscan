import { Metadata } from 'next';
import ColumbusClient from './ColumbusClient';
import networkData from './columbus_network_data.json';
import ToshiAdBanner from '../../components/ToshiAdBanner';

export const metadata: Metadata = {
  title: 'Columbus OH Fraud Network - Investigation | SomaliScan',
  description: 'Multi-cluster analysis of potential fraud in Columbus, Ohio centered on SERC shell organization, connected home health, transportation businesses, and 26+ daycares. $13.86M PPP + $14M daycare subsidies.',
};

export default function ColumbusInvestigationPage() {
  return (
    <div>
      <ColumbusClient data={networkData} />
      <ToshiAdBanner className="mt-8" />
    </div>
  );
}
