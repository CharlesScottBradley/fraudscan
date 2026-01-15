import { Metadata } from 'next';
import ForohioClient from './ForohioClient';

export const metadata: Metadata = {
  title: 'Ohio Investigation | For Ohio',
  description: 'Ohio state spending investigation - Follow the money',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForohioPage() {
  return <ForohioClient />;
}
