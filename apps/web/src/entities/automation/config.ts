export const AUTOMATION_CONFIG = {
  queueLimits: {
    maxQueueSize: 500,
    maxPriorityQueueSize: 200,
    maxDeadLetterQueueSize: 100
  },

  workerSettings: {
    maxParallelWorkers: 3,
    defaultTimeoutMs: 10000, // 10 seconds
    retryAttemptsLimit: 3,
    defaultRetryDelayMs: 5000 // 5 seconds
  },

  timezone: 'UTC',

  mockProviders: {
    email: {
      smtp: { host: 'smtp.mockserver.local', port: 587, enabled: true },
      sendgrid: { enabled: false, apiKey: 'SG.mock' },
      ses: { enabled: false, region: 'us-east-1' }
    },
    whatsapp: {
      businessApi: { enabled: true, phoneNumberId: '123456789' }
    },
    sms: {
      twilio: { enabled: true, accountSid: 'AC.mock' }
    },
    push: {
      firebase: { enabled: true }
    }
  }
};

export default AUTOMATION_CONFIG;
