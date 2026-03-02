import { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageCircle,
  Mail,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const FAQ_ITEMS = [
  {
    question: 'What is a CAP (Comprehensive Assessment Plan)?',
    answer:
      'A CAP is a structured people strategy assessment that evaluates your organization across 8 key dimensions including talent strategy, culture, org design, and more. It collects anonymous feedback from stakeholders and generates an actionable report with recommendations tailored to your company context.',
  },
  {
    question: 'How do context selections affect the assessment?',
    answer:
      'Context selections define your company\'s operating environment across categories like investment stage, industry, company size, and growth ambition. These contexts apply multiplier rules to the base model weights, ensuring the assessment output (materiality weightings) is calibrated to your specific situation. You must select exactly 8 contexts before generating outputs.',
  },
  {
    question: 'How does the assessment process work for responders?',
    answer:
      'Responders receive an invite link via email. They select their role and tenure band, then answer a series of Likert-scale questions grouped by dimension. The assessment typically takes 10-15 minutes to complete. Responses are anonymous and cannot be traced back to individual responders in the report.',
  },
  {
    question: 'When and how is the report generated?',
    answer:
      'Once the minimum number of submissions is reached (default: 8), the CAP status changes to "ready". You can then generate a report that includes an executive summary, materiality analysis, dimension scores, role-wise breakdowns, and actionable recommendations. Reports can be exported as PDF and shared with stakeholders.',
  },
  {
    question: 'What payment options are available?',
    answer:
      'We offer two plans: Basic (INR 15,000) which includes standard reporting, and Professional (INR 25,000) which unlocks advanced analytics, benchmarking, and priority support. You can also use an admin-provided bypass code if applicable. Payment is required per assessment.',
  },
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [chatTooltipVisible, setChatTooltipVisible] = useState(false);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setContactForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    // Mock submit delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSubmitting(false);
    toast.success('Your message has been sent. We will get back to you shortly.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Help & Support"
        subtitle="Find answers, get support, and learn how to make the most of NexStep HR"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Help' },
        ]}
      />

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Common questions about using the NexStep HR platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="border-b last:border-0">
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/30 transition-colors px-2 rounded-md"
              >
                <span className="text-sm font-medium pr-4">{item.question}</span>
                {openFAQ === index ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              {openFAQ === index && (
                <div className="pb-4 px-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Support Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Send us a message and our team will
            respond within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContactSubmit} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief description of your issue"
                value={contactForm.subject}
                onChange={handleContactChange}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Describe your issue or question in detail..."
                rows={5}
                value={contactForm.message}
                onChange={handleContactChange}
                disabled={submitting}
              />
            </div>
            <Button type="submit" loading={submitting} disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Floating Chat Widget Mock */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {chatTooltipVisible && (
            <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg border bg-background px-4 py-2 shadow-lg">
              <p className="text-sm font-medium">Chat coming soon</p>
              <p className="text-xs text-muted-foreground">
                Live chat support will be available shortly.
              </p>
              <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 h-2 w-2 border-b border-r bg-background" />
            </div>
          )}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-xl"
            onMouseEnter={() => setChatTooltipVisible(true)}
            onMouseLeave={() => setChatTooltipVisible(false)}
            onClick={() => {
              setChatTooltipVisible(true);
              setTimeout(() => setChatTooltipVisible(false), 2000);
            }}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
