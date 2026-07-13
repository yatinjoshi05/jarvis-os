import { Template } from './interfaces';
import { TemplateError } from './errors';
import { AutomationUtils } from './utils';

export class TemplateManager {
  private templates = new Map<string, Template>();

  constructor() {
    this.seedDefaultTemplates();
  }

  private seedDefaultTemplates() {
    this.registerTemplate({
      id: 'crm_welcome_email',
      name: 'CRM Welcome Email Template',
      channel: 'email',
      subjectTemplate: 'Welcome to JARVIS OS, {{lead.name}}!',
      bodyTemplate: '<p>Hi {{lead.name}},</p><p>We are thrilled to welcome you. Your interest in <b>{{lead.source}}</b> has been noted, and an advisor has been assigned to contact you soon.</p><p>Best regards,<br/>JARVIS OS Automation Team</p>'
    });

    this.registerTemplate({
      id: 'financial_goal_alert_whatsapp',
      name: 'Financial Goal Achieved WhatsApp Alert',
      channel: 'whatsapp',
      bodyTemplate: 'Hi {{profile.fullName}}! Congratulations! 🎉 You have successfully achieved your milestone: "{{goal.name}}". Total saved amount is ${{goal.targetAmount}}.'
    });

    this.registerTemplate({
      id: 'insurance_expiry_sms',
      name: 'Insurance Premium Expiry SMS Alert',
      channel: 'sms',
      bodyTemplate: 'Alert: Your policy "{{policy.policyName}}" premium payment is due on {{policy.nextPremiumDate}}. Please renew to keep your coverage active.'
    });
  }

  public registerTemplate(template: Template): Template {
    this.templates.set(template.id, template);
    return template;
  }

  public getTemplate(id: string): Template {
    const temp = this.templates.get(id);
    if (!temp) {
      throw new TemplateError(id, `Template "${id}" not found.`);
    }
    return temp;
  }

  public render(templateId: string, variables: Record<string, any>): { subject?: string; body: string } {
    const temp = this.getTemplate(templateId);
    
    try {
      const subject = temp.subjectTemplate ? AutomationUtils.interpolate(temp.subjectTemplate, variables) : undefined;
      const body = AutomationUtils.interpolate(temp.bodyTemplate, variables);
      return { subject, body };
    } catch (e: any) {
      throw new TemplateError(templateId, e.message || String(e));
    }
  }

  public getTemplates(): Template[] {
    return Array.from(this.templates.values());
  }
}

export const templateManager = new TemplateManager();
export default templateManager;
