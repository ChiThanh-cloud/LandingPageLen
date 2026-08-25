import * as React from "react";
import { homeFaq } from "@/data/home-faq";

export function HomeFaq() {
  return (
    <section className="shop-info-faq section" id="cau-hoi-nhanh-tiny" aria-label="Câu hỏi nhanh về Tiệm Len Nhà Tiny">
      <div className="container shop-info-inner">
        <h2 className="section-title center">Câu hỏi nhanh về <span className="highlight">Tiệm Len Nhà Tiny</span></h2>
        <div className="shop-info-faq-list">
          {homeFaq.map((item) => (
            <details className="shop-info-faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
