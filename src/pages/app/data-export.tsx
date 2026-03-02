import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExportPage() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: string) => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    setExporting(false);
    toast.success(`${format.toUpperCase()} export generated successfully!`);
  };

  return (
    <div>
      <PageHeader title="Data Export" subtitle="Export your data in various formats" breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Data Export' }]} />
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="rounded-lg bg-green-100 p-3 w-fit text-green-600 mb-2"><Table className="h-6 w-6" /></div>
            <CardTitle className="text-lg">CSV Export</CardTitle>
            <CardDescription>Export raw data for analysis in Excel or Google Sheets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select options={[{ value: 'submissions', label: 'Submissions Data' }, { value: 'invites', label: 'Invite Records' }, { value: 'users', label: 'User List' }, { value: 'scores', label: 'Dimension Scores' }]} placeholder="Select data type" />
            <Button className="w-full" onClick={() => handleExport('csv')} loading={exporting}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="rounded-lg bg-red-100 p-3 w-fit text-red-600 mb-2"><FileText className="h-6 w-6" /></div>
            <CardTitle className="text-lg">PDF Export</CardTitle>
            <CardDescription>Generate formatted reports for sharing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select options={[{ value: 'full', label: 'Full Report' }, { value: 'summary', label: 'Executive Summary' }, { value: 'materiality', label: 'Materiality Analysis' }]} placeholder="Select report type" />
            <Button className="w-full" variant="outline" onClick={() => handleExport('pdf')} loading={exporting}>
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
