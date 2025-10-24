import {NextRequest, NextResponse} from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {address, price} = body;

    if (!address || !price) {
      return NextResponse.json(
        {error: 'Address and price required'},
        {status: 400}
      );
    }

    // Get publisher ID from database first
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const getPublisherRes = await fetch(`${apiUrl}/api/publishers?wallet=${address}`);

    if (!getPublisherRes.ok) {
      return NextResponse.json(
        {error: 'Publisher not found'},
        {status: 404}
      );
    }

    const {publishers} = await getPublisherRes.json();
    if (!publishers || publishers.length === 0) {
      return NextResponse.json(
        {error: 'Publisher not found'},
        {status: 404}
      );
    }

    const publisherId = publishers[0].id;

    // Update price
    const updateRes = await fetch(`${apiUrl}/api/publishers/${publisherId}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        pricePerRequest: parseFloat(price)
      })
    });

    if (!updateRes.ok) {
      const errorData = await updateRes.json();
      return NextResponse.json(
        {error: errorData.error || 'Failed to update price'},
        {status: updateRes.status}
      );
    }

    const data = await updateRes.json();
    return NextResponse.json({success: true, publisher: data.publisher});
  } catch (error: any) {
    console.error('Update price error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
