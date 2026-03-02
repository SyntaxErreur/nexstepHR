import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { apiBypassCodes } from '@/api/mock';
import { useAuthStore } from '@/store/auth';
import type { BypassCode } from '@/types';
import { ArrowLeft, KeyRound, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminBypassCodesNewPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.user);

  const [generatedCode, setGeneratedCode] = useState<BypassCode | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to generate codes.');
      return;
    }
    setGenerating(true);
    setCopied(false);
    try {
      const code = await apiBypassCodes.create(currentUser.id);
      setGeneratedCode(code);
      toast.success('Bypass code generated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate bypass code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      toast.success('Code copied to clipboard.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for environments without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Code copied to clipboard.');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Generate Bypass Code"
        subtitle="Create a new payment bypass code for assessments."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Bypass Codes', href: '/sa/bypass-codes' },
          { label: 'Generate New' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/sa/bypass-codes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        }
      />

      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-primary/10 p-4 mb-2 w-fit">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Payment Bypass Code</CardTitle>
            <CardDescription>
              Generate a unique code that allows sponsors to bypass payment for an assessment.
              Each code can only be used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedCode ? (
              <>
                {/* Generated code display */}
                <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                    Your Bypass Code
                  </p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-primary">
                    {generatedCode.code}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleCopy}
                    variant={copied ? 'secondary' : 'default'}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    loading={generating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Another
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Make sure to save this code. It will be visible on the bypass codes list
                  but cannot be regenerated once created.
                </p>
              </>
            ) : (
              <>
                {/* Initial state - no code generated yet */}
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-4">
                    Click the button below to generate a new bypass code.
                    The code will follow the format <span className="font-mono">NSHR-XXXX-XXXX</span>.
                  </p>
                  <Button onClick={handleGenerate} loading={generating} size="lg">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Generate Code
                  </Button>
                </div>
              </>
            )}

            <div className="pt-2 text-center">
              <Link
                to="/sa/bypass-codes"
                className="text-sm text-primary hover:underline"
              >
                View all bypass codes
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
