"use client";

import { useEffect } from "react";

export function PolicyModalHost() {
  useEffect(() => {
    let isMounted = true;

    import("@/js/policy-modal.js").then(({ initPolicyModal }) => {
      const win = window as Window & { __lentinyPolicyModalInitialized?: boolean };
      if (isMounted && !win.__lentinyPolicyModalInitialized) {
        initPolicyModal();
        win.__lentinyPolicyModalInitialized = true;
      }
    });

    return () => {
      isMounted = false;
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="policy-modal" id="policyModal">
      <div className="policy-modal-content">
        <button
          className="policy-modal-close"
          type="button"
          aria-label="Đóng chính sách"
          onClick={async () => {
            const { closePolicyModal } = await import("@/js/policy-modal.js");
            closePolicyModal();
          }}
        >
          x
        </button>
        <div id="policyContent" />
      </div>
    </div>
  );
}
