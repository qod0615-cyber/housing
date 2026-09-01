import { NextResponse } from 'next/server';

const GIST_ID = process.env.GIST_ID || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

export async function GET() {
  try {
    if (!GIST_ID) {
      return NextResponse.json({ error: 'GIST_ID not configured' }, { status: 500 });
    }

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from cloud storage' }, { status: 500 });
    }

    const data = await res.json();
    const content = data?.files?.['housing_blueprint.json']?.content;

    if (content) {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: 'No content found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching blueprint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!GIST_ID || !GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Cloud storage credentials not configured' }, { status: 500 });
    }

    const body = await request.json();
    const jsonString = JSON.stringify(body, null, 2);

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'housing_blueprint.json': {
            content: jsonString,
          },
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to update cloud storage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving blueprint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
