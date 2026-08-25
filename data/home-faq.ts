export type HomeFaqItem = {
  question: string;
  answer: string;
};

export const homeFaq: readonly HomeFaqItem[] = [
  {
    question: "Tiệm Len Nhà Tiny bán gì?",
    answer: "Tiệm Len Nhà Tiny bán cuộn len, set tự móc, túi móc handmade, thú len, đồ móc theo yêu cầu và quà tặng handmade."
  },
  {
    question: "Tiệm Len Nhà Tiny phù hợp với ai?",
    answer: "Shop phù hợp với người mới tập móc len, người muốn mua set len tự làm, khách tìm quà tặng handmade hoặc cần tư vấn phối màu len."
  },
  {
    question: "Có thể đặt đồ móc theo yêu cầu không?",
    answer: "Có. Khách có thể nhắn Facebook Messenger hoặc Zalo để gửi mẫu, chọn màu và được tư vấn trước khi đặt hàng."
  },
  {
    question: "Shop có giao hàng toàn quốc không?",
    answer: "Tiệm Len Nhà Tiny nhận đơn online và hỗ trợ giao hàng toàn quốc."
  },
  {
    question: "Người mới học móc nên chọn len thế nào?",
    answer: "Hãy bắt đầu từ chart hoặc mẫu muốn làm, rồi đối chiếu cỡ sợi và cỡ kim. Blog và catalog len sợi của Tiny có thông số để bạn tham khảo trước khi chọn."
  }
];

export function getHomeFaqSchemaEntities() {
  return homeFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }));
}
