import { Metadata } from 'next';
import WewillwinClient from './WewillwinClient';

export const metadata: Metadata = {
  title: 'Florida Investigation | SomaliScan',
  description: 'Comprehensive investigation into Florida state spending and contract transparency.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WewillwinPage() {
  return <WewillwinClient />;
}
