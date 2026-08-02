export interface SecretStatus {
  name: string;
  configured: boolean;
  source: 'Environment' | 'Secret Manager' | 'Unconfigured';
  maskedValue: string;
}

export class SecretManagerService {
  /**
   * Safely retrieve a secret variable with fallback validation
   */
  public static getSecret(key: string, required: boolean = false): string | null {
    const value = process.env[key];
    if (!value || value.trim() === '' || value === 'MY_GEMINI_API_KEY') {
      if (required) {
        throw new Error(`CRITICAL: Required secret ${key} is unconfigured in current runtime environment.`);
      }
      return null;
    }
    return value.trim();
  }

  /**
   * Mask sensitive keys for logs and security audits
   */
  public static maskSecret(value: string | null): string {
    if (!value) return 'Not Configured';
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
  }

  /**
   * Audit all registered application secrets
   */
  public static getAuditReport(): SecretStatus[] {
    const secretsToAudit = [
      { name: 'GEMINI_API_KEY', key: 'GEMINI_API_KEY' },
      { name: 'GCP_PROJECT_ID', key: 'GCP_PROJECT_ID' },
      { name: 'GCP_SA_KEY', key: 'GCP_SA_KEY' },
    ];

    return secretsToAudit.map((s) => {
      const val = process.env[s.key];
      const isConfigured = Boolean(val && val.trim() !== '' && val !== 'MY_GEMINI_API_KEY');
      return {
        name: s.name,
        configured: isConfigured,
        source: isConfigured ? (process.env.NODE_ENV === 'production' ? 'Secret Manager' : 'Environment') : 'Unconfigured',
        maskedValue: this.maskSecret(val || null),
      };
    });
  }
}
