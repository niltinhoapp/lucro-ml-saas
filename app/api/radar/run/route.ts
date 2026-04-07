import { NextResponse } from "next/server";
import { runRadar } from "@/core/radar/run-radar";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const data = await runRadar(query);

    return NextResponse.json({
      success: true,
      data,
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      data: null,
      error: error.message,
    });
  }
}
