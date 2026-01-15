import { Metadata } from 'next';
import ReportClient from './ReportClient';

export const metadata: Metadata = {
  title: 'Ohio Investigation Report | For Ohio',
  description: 'Printable Ohio state spending investigation report',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportPage() {
  return <ReportClient />;
}
