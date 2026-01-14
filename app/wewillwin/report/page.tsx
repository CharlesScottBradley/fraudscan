import { Metadata } from 'next';
import ReportClient from './ReportClient';

export const metadata: Metadata = {
  title: 'Florida Investigation Report | SomaliScan',
  description: 'Executive briefing on Florida state contracting investigation.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportPage() {
  return <ReportClient />;
}
