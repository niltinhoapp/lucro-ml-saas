import { NextRequest, NextResponse } from "next/server";

function okResponse() {
  return NextResponse.json(
    {
      ok: true,
      provider: "mercado_livre",
      route: "notifications",
      status: "ready",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export async function GET() {
  return okResponse();
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET,POST,HEAD,OPTIONS",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    let payload: unknown = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    console.log("[ml notifications] payload", JSON.stringify(payload));

    return NextResponse.json(
      { ok: true, received: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ml notifications] error", error);

    return NextResponse.json(
      { ok: false, received: false },
      { status: 200 }
    );
  }
}




