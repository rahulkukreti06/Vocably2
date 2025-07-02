import { NextResponse } from 'next/server';

export async function POST() {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'GOOGLE_SHEETS_WEBHOOK_URL is not set' },
      { status: 500 }
    );
  }

  const testData = {
    email: 'test@example.com',
    name: 'Test User',
    provider: 'test',
    userId: 'test-user-123',
    isNewUser: true,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('Sending test data to webhook:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Vocably-Test/1.0'
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log('Webhook response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    try {
      return NextResponse.json(JSON.parse(responseText), { status: response.status });
    } catch {
      return NextResponse.json({ 
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
    }
  } catch (error) {
    console.error('Error calling webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to call webhook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST method to test the webhook' },
    { status: 405 }
  );
}
