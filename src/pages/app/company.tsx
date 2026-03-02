import { useState, useEffect } from 'react';
import {
  Building2,
  Pencil,
  Save,
  X,
  Globe,
  Mail,
  Phone,
  HelpCircle,
  HeadphonesIcon,
  ImageIcon,
} from 'lucide-react';
import { apiCompanies } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAsyncAction } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Company } from '@/types';

interface CompanyFormState {
  name: string;
  countryOfOperations: string;
  officialEmailDomain: string;
  supportContact: string;
  howHeardAboutUs: string;
  phone: string;
}

function companyToForm(company: Company): CompanyFormState {
  return {
    name: company.name,
    countryOfOperations: company.countryOfOperations.join(', '),
    officialEmailDomain: company.officialEmailDomain ?? '',
    supportContact: company.supportContact ?? '',
    howHeardAboutUs: company.howHeardAboutUs ?? '',
    phone: company.phone ?? '',
  };
}

export default function CompanyProfile() {
  const user = useAuthStore((s) => s.user);
  const companyId = user?.tenantCompanyId;

  const company = useAsync<Company>(
    () => apiCompanies.getById(companyId!),
    [companyId],
    !!companyId,
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CompanyFormState>({
    name: '',
    countryOfOperations: '',
    officialEmailDomain: '',
    supportContact: '',
    howHeardAboutUs: '',
    phone: '',
  });

  const { execute: saveCompany, loading: saving } = useAsyncAction(
    async (companyId: string, data: Partial<Company>) => {
      return apiCompanies.update(companyId, data);
    },
  );

  // Populate form when company data loads
  useEffect(() => {
    if (company.data) {
      setForm(companyToForm(company.data));
    }
  }, [company.data]);

  const handleFieldChange = (field: keyof CompanyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!companyId) return;
    if (!form.name.trim()) {
      toast.error('Company name is required.');
      return;
    }

    try {
      const updatedData: Partial<Company> = {
        name: form.name.trim(),
        countryOfOperations: form.countryOfOperations
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        officialEmailDomain: form.officialEmailDomain.trim() || undefined,
        supportContact: form.supportContact.trim() || undefined,
        howHeardAboutUs: form.howHeardAboutUs.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };

      await saveCompany(companyId, updatedData);
      toast.success('Company profile updated successfully.');
      setEditing(false);
      company.refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update company profile.');
    }
  };

  const handleCancel = () => {
    if (company.data) {
      setForm(companyToForm(company.data));
    }
    setEditing(false);
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <PageHeader title="Company Profile" />
        <ErrorCard message="No company associated with your account." />
      </div>
    );
  }

  if (company.loading) return <PageSkeleton />;

  if (company.error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Company Profile"
          breadcrumbs={[
            { label: 'App', href: '/app' },
            { label: 'Company' },
          ]}
        />
        <ErrorCard message={company.error} onRetry={company.refetch} />
      </div>
    );
  }

  const canEdit = user?.role === 'SPONSOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'CONSULTANT';

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Company Profile"
        subtitle="View and manage your organization details"
        breadcrumbs={[
          { label: 'App', href: '/app' },
          { label: 'Company' },
        ]}
        actions={
          canEdit && (
            <>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo / Brand Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Company Logo</CardTitle>
            <CardDescription>Brand identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-xl bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center mb-4">
              {company.data?.logoUrl ? (
                <img
                  src={company.data.logoUrl}
                  alt={company.data.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">No logo</span>
                </div>
              )}
            </div>
            <p className="text-lg font-semibold text-center">
              {company.data?.name}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Member since{' '}
              {company.data?.createdAt
                ? new Date(company.data.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })
                : 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* Company Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Company Details
            </CardTitle>
            <CardDescription>
              {editing
                ? 'Update your company information below'
                : 'Your registered company information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={!editing}
                  placeholder="Company name"
                />
              </div>

              {/* Country of Operations */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Country of Operations
                </label>
                <Input
                  value={form.countryOfOperations}
                  onChange={(e) =>
                    handleFieldChange('countryOfOperations', e.target.value)
                  }
                  disabled={!editing}
                  placeholder="e.g. India, USA, UK"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of countries
                </p>
              </div>

              {/* Official Email Domain */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Official Email Domain
                </label>
                <Input
                  value={form.officialEmailDomain}
                  onChange={(e) =>
                    handleFieldChange('officialEmailDomain', e.target.value)
                  }
                  disabled={!editing}
                  placeholder="e.g. company.com"
                />
              </div>

              {/* Support Contact */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <HeadphonesIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Support Contact
                </label>
                <Input
                  value={form.supportContact}
                  onChange={(e) =>
                    handleFieldChange('supportContact', e.target.value)
                  }
                  disabled={!editing}
                  placeholder="Support email or name"
                />
              </div>

              {/* How Heard About Us */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  How Heard About Us
                </label>
                <Input
                  value={form.howHeardAboutUs}
                  onChange={(e) =>
                    handleFieldChange('howHeardAboutUs', e.target.value)
                  }
                  disabled={!editing}
                  placeholder="e.g. Referral, LinkedIn, Google"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  disabled={!editing}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
