const { Resend } = require('resend');
const resend = new Resend('re_iKprHi5K_3dTUqBRvqAHFP58ESpsGBQKJ');

async function test() {
  try {
    const data = await resend.emails.send({
      from: 'TrimSpace <onboarding@resend.dev>',
      to: 'Mohammad.Hasan@a2baustralia.com',
      subject: 'Test Email',
      html: '<p>Test</p>',
    });
    console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
