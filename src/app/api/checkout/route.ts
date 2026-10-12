import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth/auth";
import { processCheckout } from "@/backend/services/checkout-service";
import { checkoutSchema } from "@/backend/schemas/validation";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    const sale = await processCheckout({
      items: validated.items,
      paymentMethod: validated.paymentMethod,
      discountPercentage: validated.discountPercentage,
      taxRatePercentage: validated.taxRatePercentage,
      cashTendered: validated.cashTendered,
      cashierId: session?.user?.id,
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/checkout error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid checkout payload" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Checkout transaction failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
