import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Call Anthropic Vision API
    const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.type,
                data: base64
              }
            },
            {
              type: 'text',
              text: `Extract menu items from this image. Return a JSON array with format:
[{"name": "Item Name", "price": 100, "category": "Category Name"}]

Rules:
- price should be a number in rupees (convert paise to rupees if needed)
- If category is not visible, use "General"
- Only return the JSON array, no other text`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse menu items' }, { status: 500 });
    }

    const items = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
