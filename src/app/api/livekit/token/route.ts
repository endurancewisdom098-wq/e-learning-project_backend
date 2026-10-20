import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomName, userName, userId, isHost } = body;

    if (!roomName || !userName) {
      return NextResponse.json(
        { error: 'Both roomName and userName are required fields.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    console.log(
      "Loading LiveKit Key:",
      apiKey ? "EXISTS (" + apiKey.slice(0, 4) + "...)" : "MISSING!"
    );
    console.log(
      "Loading LiveKit Secret:",
      apiSecret ? "EXISTS" : "MISSING!"
    );

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit API keys are missing in environment variables.' },
        { status: 500 }
      );
    }

    // Create an Access Token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(userId ?? userName),
      name: String(userName),
    });

    // Grant permissions to join the room and publish/subscribe to audio/video
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      roomAdmin: !!isHost, // Ensures boolean value for host privileges
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error: unknown) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}