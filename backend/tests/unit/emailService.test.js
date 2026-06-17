jest.mock('../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
}));

const transporter = require('../../src/config/mailer');
const { sendOtpEmail } = require('../../src/services/emailService');

describe('emailService.sendOtpEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APP_NAME = 'TestApp';
    process.env.SMTP_FROM = 'noreply@test.com';
  });

  test('should send OTP email with correct parameters', async () => {
    await sendOtpEmail({
      name: 'Test User',
      email: 'test@example.com',
      otp: '123456',
    });

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('123456'),
        html: expect.stringContaining('Test User'),
      })
    );
  });

  test('should include OTP in email body', async () => {
    await sendOtpEmail({
      name: 'Test User',
      email: 'test@example.com',
      otp: '654321',
    });

    const callArgs = transporter.sendMail.mock.calls[0][0];
    expect(callArgs.html).toContain('654321');
  });

  test('should propagate send failure', async () => {
    transporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));

    await expect(
      sendOtpEmail({ name: 'Test', email: 'test@example.com', otp: '999999' })
    ).rejects.toThrow('SMTP connection failed');
  });
});
