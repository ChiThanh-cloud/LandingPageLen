import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: "Tiệm Len Nhà Tiny <test@lentiny.xyz>",
      to: ["siachay37@gmail.com"],
      subject: "Test Resend - Tiệm Len Nhà Tiny",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>🎉 Resend hoạt động rồi!</h2>
          <p>Đây là email test từ website Tiệm Len Nhà Tiny.</p>
          <p>Nếu bạn nhận được email này thì API + domain đều hoạt động bình thường.</p>
        </div>
      `,
    });

    if (error) {
      return Response.json(
        {
          success: false,
          error,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}