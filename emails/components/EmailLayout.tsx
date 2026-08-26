import React, { type ReactNode } from "react";

type EmailLayoutProps = {
  preheader: string;
  children: ReactNode;
};

export function EmailLayout({ preheader, children }: EmailLayoutProps) {
  return (
    <html lang="vi">
      <body style={{ backgroundColor: "#f4f6f8", color: "#182235", fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <span style={{ color: "transparent", display: "none", fontSize: "1px", height: "1px", maxHeight: "1px", maxWidth: "1px", opacity: 0, overflow: "hidden", whiteSpace: "nowrap", width: "1px" }}>
          {preheader}
        </span>
        <table align="center" cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "0 auto", maxWidth: "600px", padding: "24px 12px", width: "100%" }}>
          <tbody>
            <tr>
              <td>
                <table cellPadding={0} cellSpacing={0} role="presentation" style={{ backgroundColor: "#ffffff", border: "1px solid #dfe5ec", borderRadius: "16px", overflow: "hidden", width: "100%" }}>
                  <tbody>{children}</tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
