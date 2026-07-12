import type { ProductEntry } from "@/types/product";

export const products: ProductEntry[] = [
  {
    slug: "len-soi",
    kind: "product",
    name: "Len sợi & phụ kiện",
    title: "Len Sợi, Len Milk Cotton Móc Thú - Tiệm Len Nhà Tiny",
    description:
      "Mua len sợi, len milk cotton, len móc handmade tại Tiệm Len Nhà Tiny. Đa dạng màu sắc, chất sợi mềm mịn, có tư vấn loại len phù hợp. Giá từ 8.000đ.",
    ogTitle: "Len Sợi, Len Milk Cotton Móc Thú - Tiệm Len Nhà Tiny",
    ogDescription:
      "Mua len sợi, len milk cotton, len móc handmade tại Tiệm Len Nhà Tiny. Đa dạng màu sắc, chất sợi mềm mịn, tư vấn miễn phí.",
    category: "Nguyên liệu",
    eyebrow: "Nguyên liệu - Len sợi",
    h1: "Len sợi, len milk cotton móc thú tại Tiệm Len Nhà Tiny",
    lead:
      "Từ cuộn len milk cotton nhỏ xinh đến len nhung mềm mịn, Tiny có đủ loại len sợi để bạn bắt đầu hành trình handmade của mình - dù mới học hay đã biết móc.",
    image: "/images/yarn_collection_800.jpg",
    imageAlt:
      "Bảng màu len sợi đa dạng tại Tiệm Len Nhà Tiny, gồm len milk cotton, len nhung, len cotton",
    updatedAt: "2026-07-07",
    schemaName: "Len sợi móc handmade",
    schemaDescription:
      "Len milk cotton, len nhung, len cotton đa dạng màu sắc, phù hợp móc thú bông, hoa len, túi len, phụ kiện handmade.",
    legacyPhoneFound: "0909.281.029",
    legacyHadOffer: true,
    sections: [
      {
        type: "list",
        title: "Len sợi tại Tiệm Len Nhà Tiny có gì?",
        intro:
          "Tiệm Len Nhà Tiny bán nhiều loại len sợi phổ biến phù hợp với các dự án đan móc khác nhau: từ móc thú bông, hoa len, túi len đến các phụ kiện handmade nhỏ xinh. Bảng màu len rất đa dạng, từ những tông pastel dịu dàng đến màu đậm ấn tượng. Các dòng len Tiny thường có gồm:",
        items: [
          {
            label: "Len milk cotton",
            text: "Mềm mịn, nhiều màu, mũi móc dễ nhìn, phù hợp nhất cho người mới bắt đầu và cho hầu hết sản phẩm handmade."
          },
          {
            label: "Len nhung",
            text: "Sợi bông mềm, thành phẩm trông mũm mĩm và đáng yêu, đặc biệt hợp với thú bông size vừa và lớn."
          },
          {
            label: "Len cotton",
            text: "Sợi gọn, đứng form, phù hợp hoa len, túi móc, phụ kiện cần dáng rõ nét."
          },
          {
            label: "Phụ kiện kèm",
            text: "Kim móc các cỡ, bông nhồi, mắt nhựa, đánh dấu mũi, kim khâu - tất cả để bạn có thể bắt đầu ngay."
          }
        ]
      },
      {
        type: "list",
        title: "Ai nên chọn mua len sợi tại Tiny?",
        items: [
          {
            label: "Người mới học móc len",
            text: "Muốn bắt đầu với len dễ dùng, dễ nhìn mũi, giá không quá cao để luyện tay."
          },
          {
            label: "Người đã biết móc",
            text: "Cần bổ sung màu mới, đổi loại len theo mẫu, hoặc mua số lượng nhỏ theo dự án."
          },
          {
            label: "Bạn muốn mua set nguyên liệu trọn gói",
            text: "Len, kim, bông nhồi - mua 1 lần là có đủ để làm 1 sản phẩm hoàn chỉnh."
          },
          {
            label: "Bạn không biết chọn len nào",
            text: "Nhắn Tiny, gửi ảnh mẫu muốn làm, Tiny sẽ gợi ý loại len phù hợp nhất."
          }
        ]
      },
      {
        type: "priceTable",
        title: "Giá tham khảo len sợi tại Tiệm Len Nhà Tiny",
        intro:
          "Giá len tùy loại, màu sắc và số lượng. Tiny ưu tiên tư vấn trước để bạn chọn đúng loại len và không mua thừa hoặc thiếu.",
        table: {
          headers: ["Loại len", "Giá tham khảo", "Ghi chú"],
          rows: [
            ["Len milk cotton (cuộn nhỏ)", "Từ 8.000đ", "Nhiều màu, phù hợp mọi mẫu"],
            ["Len nhung", "Tùy dòng len", "Mềm bông, hợp thú bông size vừa"],
            ["Len cotton", "Tùy cuộn/màu", "Form đẹp, hợp hoa len, túi móc"],
            ["Kim móc các cỡ", "Tùy cỡ kim", "Nhiều cỡ từ 2.0mm trở lên"]
          ]
        },
        outro:
          "Nhắn Zalo 0368.903.519 để hỏi giá cụ thể và số lượng cần dùng theo mẫu."
      },
      {
        type: "callout",
        kicker: "Tư vấn miễn phí",
        title: "Chưa biết nên chọn loại len nào?",
        text:
          "Gửi Tiny ảnh mẫu hoặc mô tả sản phẩm bạn muốn làm. Tiny sẽ gợi ý loại len, màu phù hợp và ước lượng số lượng cần mua.",
        ctaLabel: "Nhắn Zalo tư vấn ngay",
        ctaTrackKey: "contact_zalo_click"
      },
      {
        type: "list",
        title: "Vì sao nên chọn len sợi tại Tiệm Len Nhà Tiny?",
        items: [
          { text: "Len được chọn lọc phù hợp với đan móc handmade, không phải len công nghiệp dệt may." },
          { text: "Bảng màu đa dạng, cập nhật thêm màu mới theo thời gian." },
          { text: "Tiny biết móc nên có thể tư vấn đúng loại len theo sản phẩm và chart bạn muốn làm." },
          { text: "Nhận đơn online, giao hàng toàn quốc, đóng gói cẩn thận." },
          { text: "Có thể mua kèm bông nhồi, kim móc, phụ kiện để không phải tìm nhiều nơi." }
        ]
      },
      {
        type: "related",
        title: "Đọc thêm từ blog LenTiny",
        links: [
          {
            href: "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
            title: "Người mới học móc len nên chọn loại len nào?",
            text: "So sánh các loại len phổ biến và cách chọn đúng loại theo mẫu."
          },
          {
            href: "/san-pham/set-tu-moc",
            title: "Set tự móc dành cho người mới",
            text: "Set trọn gói len, kim, bông nhồi và hướng dẫn - làm ngay không cần mua nhiều nơi."
          }
        ]
      }
    ],
    faq: [
      {
        question: "Len milk cotton có phù hợp làm thú bông không?",
        answer:
          "Phù hợp. Len milk cotton là lựa chọn phổ biến nhất để móc thú bông, đặc biệt cho người mới. Sợi mềm, nhiều màu, mũi móc dễ nhìn và giá dễ tiếp cận."
      },
      {
        question: "Giá len tại Tiny là bao nhiêu?",
        answer:
          "Giá từ 8.000đ cho cuộn len nhỏ, tùy loại len và màu sắc. Nhắn Zalo để được báo giá cụ thể và tư vấn số lượng cần mua theo mẫu."
      },
      {
        question: "Tiny có tư vấn loại len theo mẫu tôi muốn móc không?",
        answer:
          "Có. Bạn chỉ cần gửi ảnh mẫu hoặc mô tả, Tiny sẽ gợi ý loại len phù hợp, cỡ kim và ước lượng số cuộn cần dùng."
      },
      {
        question: "Len có giao hàng toàn quốc không?",
        answer:
          "Có. Tiệm Len Nhà Tiny nhận đơn online và hỗ trợ giao hàng toàn quốc, đóng gói cẩn thận."
      }
    ]
  },
  {
    slug: "set-tu-moc",
    kind: "product",
    name: "Set tự móc len",
    title: "Set Tự Móc Len Cho Người Mới - Kit Móc Len Handmade | Tiệm Len Nhà Tiny",
    description:
      "Set tự móc len dành cho người mới bắt đầu, gồm len, kim móc, bông nhồi và hướng dẫn chi tiết. Phù hợp làm quà, học móc tại nhà. Giá từ 100.000đ.",
    ogTitle: "Set Tự Móc Len Cho Người Mới - Kit Móc Len Handmade | Tiệm Len Nhà Tiny",
    ogDescription:
      "Set tự móc len trọn gói: len, kim, bông nhồi, hướng dẫn. Dành cho người mới bắt đầu và làm quà handmade. Giá từ 100.000đ.",
    category: "Nguyên liệu",
    eyebrow: "Nguyên liệu - Người mới",
    h1: "Set tự móc len cho người mới - kit handmade trọn gói tại Tiệm Len Nhà Tiny",
    lead:
      "Không biết bắt đầu từ đâu? Set tự móc của Tiny đã gom sẵn len, kim, bông nhồi và hướng dẫn - bạn chỉ cần mở ra là có thể bắt đầu móc ngay, không cần mua thêm gì.",
    image: "/images/set_kit_800.jpg",
    imageAlt:
      "Set tự móc gấu len kèm len sợi, kim móc, bông nhồi và hướng dẫn từ Tiệm Len Nhà Tiny",
    updatedAt: "2026-07-07",
    schemaName: "Set tự móc len handmade",
    schemaDescription:
      "Set tự móc len trọn gói gồm len milk cotton, kim móc, bông nhồi và hướng dẫn chi tiết. Dành cho người mới bắt đầu học móc len.",
    legacyPhoneFound: "0909.281.029",
    legacyHadOffer: true,
    sections: [
      {
        type: "text",
        title: "Set tự móc len là gì?",
        paragraphs: [
          "Set tự móc là bộ nguyên liệu đã được Tiny tính toán sẵn cho 1 sản phẩm handmade cụ thể - thường gồm len đủ số lượng, kim móc phù hợp, bông nhồi, phụ kiện cần thiết (như mắt nhựa, đánh dấu mũi, kim khâu) và hướng dẫn từng bước để bạn tự làm tại nhà.",
          "Thay vì phải đi tìm từng thứ ở nhiều nơi và lo mua đủ màu, đủ lượng - mở set ra là bắt đầu được ngay. Đây là lý do set tự móc rất được yêu thích, đặc biệt với người mới học móc và người muốn thử handmade lần đầu."
        ]
      },
      {
        type: "list",
        title: "Ai nên chọn set tự móc?",
        items: [
          {
            label: "Người mới học móc len",
            text: "Không biết mua len gì, kim cỡ nào - set có sẵn hết, chỉ cần theo hướng dẫn là làm được."
          },
          {
            label: "Người muốn trải nghiệm handmade tại nhà",
            text: "Buổi tối thư giãn với len và kim, không cần học quá nhiều trước."
          },
          {
            label: "Tìm quà tặng ý nghĩa cho người thích handmade",
            text: "Set tự móc là quà rất đáng yêu, vừa thiết thực vừa sáng tạo."
          },
          {
            label: "Người muốn làm quà thủ công cho người thân",
            text: "Tự tay móc một bé thú len nhỏ tặng bạn bè, người yêu hoặc em bé."
          }
        ]
      },
      {
        type: "list",
        title: "Set tự móc tại Tiny thường gồm những gì?",
        items: [
          { text: "Len sợi (đã chia màu, đủ số lượng cho 1 sản phẩm)" },
          { text: "Kim móc phù hợp với loại len trong set" },
          { text: "Bông nhồi polyester mềm, an toàn" },
          { text: "Mắt nhựa, kim khâu, đánh dấu mũi (tùy mẫu)" },
          { text: "Hướng dẫn móc chi tiết theo từng bước" }
        ],
        outro:
          "Thành phần cụ thể có thể thay đổi tùy mẫu và yêu cầu. Nhắn Tiny để xem các mẫu set hiện có và chọn set phù hợp với mức độ của bạn."
      },
      {
        type: "priceTable",
        title: "Giá tham khảo set tự móc",
        table: {
          headers: ["Mẫu set", "Giá tham khảo", "Ghi chú"],
          rows: [
            ["Set móc thú bông nhỏ (dạng móc khóa)", "Từ 100.000đ", "Kích thước mini, ít chi tiết"],
            ["Set móc thú bông size vừa", "Tùy mẫu", "Có nhiều chi tiết hơn, phù hợp người đã luyện tay"],
            ["Set móc hoa len", "Tùy mẫu", "Gồm len, kim và hướng dẫn móc hoa cơ bản"]
          ]
        },
        outro:
          "Nhắn Zalo 0368.903.519 để Tiny tư vấn mẫu phù hợp với trình độ và ngân sách của bạn."
      },
      {
        type: "callout",
        kicker: "Gợi ý từ Tiny",
        title: "Muốn bắt đầu bằng một set dễ móc?",
        text:
          "Nhắn Tiny qua Zalo, Tiny sẽ gợi ý set phù hợp với người mới, kèm hướng dẫn rõ ràng để bạn không bị bỡ ngỡ khi bắt đầu.",
        ctaLabel: "Nhắn Zalo 0368.903.519",
        ctaTrackKey: "contact_zalo_click"
      },
      {
        type: "list",
        title: "Vì sao nên chọn set tự móc của Tiệm Len Nhà Tiny?",
        items: [
          {
            text: "Tiny tự móc nên hiểu rõ người mới cần gì và gặp khó ở đâu - set được chuẩn bị đúng với nhu cầu thực tế."
          },
          { text: "Len và phụ kiện được chọn lọc phù hợp với nhau, không lo mua nhầm kim quá nhỏ hay quá lớn." },
          { text: "Hướng dẫn đi kèm được viết dễ hiểu, có thể hỏi thêm qua Zalo nếu bí bước nào." },
          { text: "Có thể đóng hộp quà, thêm thiệp nếu bạn muốn tặng ai đó." }
        ]
      },
      {
        type: "related",
        title: "Đọc thêm từ blog LenTiny",
        links: [
          {
            href: "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
            title: "Người mới học móc len nên chọn loại len nào?",
            text: "Tìm hiểu về milk cotton, len nhung, cotton và acrylic để chọn đúng loại len từ đầu."
          },
          {
            href: "/san-pham/len-soi",
            title: "Len sợi, len milk cotton tại Tiny",
            text: "Mua thêm len riêng lẻ theo màu và loại phù hợp với dự án bạn đang làm."
          }
        ]
      }
    ],
    faq: [
      {
        question: "Set tự móc có phù hợp người chưa biết móc bao giờ không?",
        answer:
          "Phù hợp. Tiny sẽ gợi ý mẫu đơn giản nhất cho người mới, có hướng dẫn từng bước và sẵn sàng hỗ trợ thêm qua Zalo nếu bạn gặp khó khăn."
      },
      {
        question: "Tôi có thể chọn màu len trong set không?",
        answer:
          "Tùy mẫu. Một số set có thể chọn màu, một số set có màu cố định theo mẫu. Nhắn Tiny để biết các lựa chọn màu cho từng mẫu cụ thể."
      },
      {
        question: "Set tự móc có thể làm quà tặng không?",
        answer:
          "Rất phù hợp. Tiny có thể đóng hộp quà, thêm thiệp hoặc gói thơm tho nếu bạn muốn tặng. Nhắn Tiny để báo thêm yêu cầu."
      },
      {
        question: "Set có giao toàn quốc không?",
        answer:
          "Có. Tiệm Len Nhà Tiny hỗ trợ giao hàng toàn quốc. Đóng gói cẩn thận, đảm bảo nguyên liệu không bị xộc xệch khi nhận."
      }
    ]
  },
  {
    slug: "thu-len-theo-yeu-cau",
    kind: "service",
    name: "Thú len theo yêu cầu",
    title: "Đặt Móc Thú Len Theo Yêu Cầu, Theo Ảnh - Tiệm Len Nhà Tiny",
    description:
      "Nhận móc thú len theo ảnh, theo mẫu, theo nhân vật riêng. Phù hợp làm quà sinh nhật, quà couple, quà kỷ niệm. Nhắn Zalo 0368.903.519 để đặt hàng.",
    ogTitle: "Đặt Móc Thú Len Theo Yêu Cầu, Theo Ảnh - Tiệm Len Nhà Tiny",
    ogDescription:
      "Móc thú len theo ảnh, theo mẫu riêng, theo nhân vật yêu thích. Quà sinh nhật, couple, kỷ niệm siêu đáng yêu. Nhắn Zalo 0368.903.519.",
    category: "Đặt móc",
    eyebrow: "Đặt móc - Handmade theo yêu cầu",
    h1: "Đặt móc thú len theo ảnh - thú bông len handmade riêng tại Tiệm Len Nhà Tiny",
    lead:
      "Một bé thú len được móc theo ảnh người thân, thú cưng hay nhân vật bạn yêu thích - đó không chỉ là món quà, mà là một kỷ niệm nhỏ được làm bằng tay với rất nhiều tỉ mỉ.",
    image: "/images/crochet_products_800.jpg",
    imageAlt:
      "Thú len handmade đặt móc theo yêu cầu tại Tiệm Len Nhà Tiny - thú bông, móc khóa, nhân vật riêng",
    updatedAt: "2026-07-07",
    schemaName: "Đặt móc thú len theo yêu cầu",
    schemaDescription:
      "Nhận móc thú len theo ảnh, mẫu riêng hoặc nhân vật yêu thích. Tư vấn màu len, kích thước, chi tiết trước khi làm.",
    legacyPhoneFound: "0909.281.029",
    sections: [
      {
        type: "list",
        title: "Tiny nhận đặt móc thú len những dạng nào?",
        items: [
          { text: "Thú bông len theo ảnh thú cưng (mèo, chó, thỏ, hamster...)" },
          { text: "Thú len theo nhân vật anime, hoạt hình, mascot yêu thích" },
          { text: "Thú bông len theo ý tưởng riêng hoặc mẫu bạn tìm thấy trên mạng" },
          { text: "Móc khóa len theo hình nhân vật hoặc thú cưng" },
          { text: "Thú len couple - làm thành cặp theo yêu cầu" },
          { text: "Thú bông len mini để bàn hoặc size ôm tùy mong muốn" }
        ],
        outro:
          "Miễn là có ảnh tham khảo và mô tả đủ chi tiết, Tiny sẽ cố gắng tái hiện bằng len gần nhất với ảnh gốc."
      },
      {
        type: "list",
        title: "Ai nên chọn thú len theo yêu cầu?",
        items: [
          {
            label: "Tặng sinh nhật",
            text: "Một bé thú len làm theo ảnh người nhận - món quà vừa đáng yêu vừa có cảm giác rất riêng."
          },
          {
            label: "Quà kỷ niệm cho couple",
            text: "Đặt cặp thú len theo hình hai người hoặc nhân vật yêu thích của cả hai."
          },
          {
            label: "Quà cho em bé",
            text: "Thú bông len mềm mịn, an toàn, gần gũi hơn đồ chơi công nghiệp."
          },
          {
            label: "Kỷ niệm thú cưng",
            text: "Một bé thú len mô phỏng con mèo, con chó yêu thích của bạn."
          },
          {
            label: "Quà tốt nghiệp, ra trường",
            text: "Thú len gấu tốt nghiệp hoặc nhân vật riêng mang theo dấu ấn của người tặng."
          }
        ]
      },
      {
        type: "steps",
        title: "Quy trình đặt móc thú len theo yêu cầu",
        steps: [
          {
            title: "Gửi ảnh và mô tả yêu cầu",
            text: "Gửi ảnh mẫu qua Zalo, nêu kích thước mong muốn và ngày cần nhận. Ảnh rõ, nhiều góc sẽ giúp Tiny tư vấn chính xác hơn."
          },
          {
            title: "Tiny tư vấn và xác nhận đơn",
            text: "Tiny xem ảnh, tư vấn màu len gần nhất, gợi ý kích thước phù hợp và báo thời gian dự kiến hoàn thiện."
          },
          {
            title: "Móc và cập nhật tiến độ",
            text: "Tiny bắt đầu móc từng phần, ráp chi tiết, nhồi bông. Có thể chia sẻ ảnh tiến độ nếu bạn muốn theo dõi."
          },
          {
            title: "Kiểm tra và giao hàng",
            text: "Trước khi đóng gói, Tiny chụp ảnh thành phẩm để bạn xem và xác nhận. Sau đó đóng gói cẩn thận và gửi hàng."
          }
        ]
      },
      {
        type: "callout",
        kicker: "Bắt đầu đặt hàng",
        title: "Có ảnh mẫu rồi? Nhắn Tiny ngay!",
        text:
          "Gửi ảnh, kích thước mong muốn và ngày cần nhận qua Zalo. Tiny sẽ phản hồi sớm nhất có thể và tư vấn miễn phí trước khi đặt cọc.",
        ctaLabel: "Gửi ảnh qua Zalo 0368.903.519",
        ctaTrackKey: "contact_zalo_click"
      },
      {
        type: "list",
        title: "Vì sao nên chọn Tiệm Len Nhà Tiny để đặt móc thú len?",
        items: [
          { text: "Tiny có kinh nghiệm móc nhiều dạng thú len, từ mẫu đơn giản đến mẫu nhiều chi tiết phức tạp." },
          { text: "Trao đổi kỹ trước khi làm - không bất ngờ khi nhận hàng." },
          { text: "Móc từng chi tiết cẩn thận, kiểm tra trước khi giao." },
          { text: "Giao hàng toàn quốc, đóng gói chắc chắn để thú len không bị méo dáng." },
          { text: "Có thể gói quà, thêm thiệp hoặc phụ kiện đi kèm nếu bạn cần." }
        ]
      },
      {
        type: "related",
        title: "Đọc thêm từ blog LenTiny",
        links: [
          {
            href: "/blog/moc-thu-len-theo-anh-mat-bao-lau",
            title: "Móc thú len theo ảnh mất bao lâu?",
            text: "Tìm hiểu quy trình và các yếu tố ảnh hưởng đến thời gian hoàn thiện đơn custom."
          },
          {
            href: "/blog/cach-bao-quan-thu-len-handmade-de-luon-dep",
            title: "Cách bảo quản thú len handmade để luôn đẹp",
            text: "Giữ bé thú len của bạn sạch và đứng form lâu hơn sau khi nhận hàng."
          }
        ]
      }
    ],
    faq: [
      {
        question: "Tôi cần gửi ảnh như thế nào để Tiny tư vấn được chính xác?",
        answer:
          "Ảnh rõ, đủ sáng, thấy được tổng thể và các chi tiết nổi bật. Nếu có thể, gửi thêm ảnh góc mặt trước, mặt nghiêng và cận chi tiết quan trọng như màu tai, đốm, nơ, áo."
      },
      {
        question: "Thú len theo yêu cầu mất bao lâu để hoàn thiện?",
        answer:
          "Tùy kích thước và độ chi tiết. Mẫu nhỏ ít chi tiết thường nhanh hơn mẫu lớn hoặc nhiều phụ kiện. Nên báo Tiny trước ít nhất 1-2 tuần so với ngày cần tặng."
      },
      {
        question: "Thú len có thể làm theo nhân vật anime hoặc mascot không?",
        answer:
          "Có. Tiny nhận làm thú len theo nhân vật anime, mascot, nhân vật game hoặc ý tưởng riêng. Gửi ảnh để Tiny tư vấn cách mô phỏng bằng len phù hợp nhất."
      },
      {
        question: "Giá đặt móc thú len theo yêu cầu là bao nhiêu?",
        answer:
          "Giá tùy kích thước, độ chi tiết và số màu len. Gửi ảnh mẫu qua Zalo 0368.903.519, Tiny sẽ xem ảnh và báo giá cụ thể sau khi trao đổi."
      }
    ]
  },
  {
    slug: "hoa-len-handmade",
    kind: "product",
    name: "Hoa len handmade",
    title: "Hoa Len Handmade - Bó Hoa Len Tặng Sinh Nhật, Người Yêu | Tiệm Len Nhà Tiny",
    description:
      "Hoa len handmade bền đẹp, không tàn, phối màu theo yêu cầu. Phù hợp tặng sinh nhật, Valentine, 8/3, tốt nghiệp. Đặt bó nhỏ, bó lớn hoặc mẫu riêng tại Tiệm Len Nhà Tiny.",
    ogTitle: "Hoa Len Handmade - Bó Hoa Len Tặng Sinh Nhật, Người Yêu | Tiệm Len Nhà Tiny",
    ogDescription:
      "Hoa len handmade bền, đẹp, không tàn. Tặng sinh nhật, Valentine, 8/3, tốt nghiệp. Có thể phối màu và chọn mẫu riêng. Nhắn Zalo 0368.903.519.",
    category: "Quà tặng",
    eyebrow: "Quà tặng - Hoa len",
    h1: "Hoa len handmade - bó hoa không bao giờ tàn từ Tiệm Len Nhà Tiny",
    lead:
      "Hoa len không cần nước, không héo theo mùa và có thể được giữ lại lâu dài như một kỷ niệm. Đó là lý do bó hoa len handmade ngày càng được chọn làm quà tặng cho những dịp đặc biệt.",
    image: "/images/gift_set_800.jpg",
    imageAlt:
      "Hộp quà hoa len handmade và thú len từ Tiệm Len Nhà Tiny, phù hợp làm quà sinh nhật và quà kỷ niệm",
    updatedAt: "2026-07-07",
    schemaName: "Hoa len handmade",
    schemaDescription:
      "Bó hoa len handmade được móc thủ công, bền đẹp, không tàn. Có thể phối màu theo yêu cầu, đặt bó nhỏ, bó lớn hoặc mẫu riêng.",
    legacyPhoneFound: "0909.281.029",
    legacyHadOffer: true,
    sections: [
      {
        type: "list",
        title: "Hoa len handmade tại Tiny có gì đặc biệt?",
        intro:
          "Mỗi bông hoa len tại Tiệm Len Nhà Tiny đều được móc thủ công từng cánh, từng lá, từng chi tiết nhỏ - không có hai bó hoa nào giống nhau hoàn toàn. Bạn có thể chọn màu hoa theo tông yêu thích, theo màu áo, theo sở thích của người nhận hoặc theo ý nghĩa bạn muốn gửi gắm.",
        items: [
          { text: "Hoa len không tàn, không cần nước, để được lâu dài." },
          { text: "Có thể phối màu theo yêu cầu - không bị giới hạn màu sắc theo mùa." },
          { text: "Kết hợp được với thú len, móc khóa và hộp quà hoàn chỉnh." },
          { text: "Cảm giác gần gũi, mềm mại hơn hoa tươi - và có câu chuyện được làm bằng tay sau đó." }
        ]
      },
      {
        type: "occasionGrid",
        title: "Hoa len phù hợp tặng những dịp nào?",
        items: [
          { icon: "🎂", label: "Sinh nhật" },
          { icon: "💝", label: "Valentine" },
          { icon: "🌸", label: "8/3 - 20/10" },
          { icon: "🎓", label: "Tốt nghiệp" },
          { icon: "💑", label: "Kỷ niệm" },
          { icon: "🎁", label: "Bất kỳ dịp nào" }
        ],
        outro:
          "Hoa len không bị ràng buộc theo mùa hoa hay mùa lễ. Bạn có thể tặng bất cứ lúc nào muốn gửi đi một điều gì đó dịu dàng và đáng nhớ."
      },
      {
        type: "list",
        title: "Ai nên chọn hoa len handmade làm quà?",
        items: [
          {
            label: "Muốn tặng quà bền lâu",
            text: "Hoa len giữ được nhiều năm nếu bảo quản tốt, trong khi hoa tươi chỉ vài ngày."
          },
          {
            label: "Người nhận thích handmade",
            text: "Cảm giác nhận một bó hoa được làm bằng tay - rất khác so với mua hoa ở tiệm."
          },
          {
            label: "Muốn phối màu riêng",
            text: "Hoa len có thể được làm theo bảng màu yêu thích, tone pastel, tone đậm hoặc nhiều màu kết hợp."
          },
          {
            label: "Kết hợp làm hộp quà",
            text: "Hoa len rất đẹp khi kết hợp với thú bông, thiệp và đóng hộp hoàn chỉnh."
          },
          {
            label: "Tặng cho người dị ứng phấn hoa",
            text: "Hoa len hoàn toàn không có phấn hoa, an toàn với người nhạy cảm."
          }
        ]
      },
      {
        type: "text",
        title: "Giá tham khảo hoa len handmade",
        paragraphs: [
          "Giá hoa len tùy theo kích thước bó, số lượng hoa, loại hoa và độ chi tiết. Một bó hoa nhỏ vài bông đơn giản sẽ có giá khác một bó lớn nhiều hoa phối màu phức tạp.",
          "Nhắn Zalo 0368.903.519 để Tiny tư vấn mẫu hoa phù hợp với ngân sách và dịp tặng của bạn. Tiny sẽ gợi ý bó hoa vừa đẹp vừa phù hợp nhất."
        ]
      },
      {
        type: "callout",
        kicker: "Đặt hoa len ngay hôm nay",
        title: "Đang cần một bó hoa đặc biệt cho người đặc biệt?",
        text:
          "Nhắn Tiny qua Zalo, cho Tiny biết dịp tặng, màu bạn thích và người nhận là ai - Tiny sẽ gợi ý mẫu hoa len thật phù hợp!",
        ctaLabel: "Nhắn Zalo 0368.903.519",
        ctaTrackKey: "contact_zalo_click"
      },
      {
        type: "list",
        title: "Vì sao nên chọn hoa len tại Tiệm Len Nhà Tiny?",
        items: [
          { text: "Hoa được móc thủ công từng cánh, không phải hoa len nhựa hay hoa len may sẵn." },
          { text: "Phối màu linh hoạt theo yêu cầu - không bị giới hạn bởi màu mùa vụ." },
          { text: "Có thể kết hợp hoa len với thú bông, hộp quà và thiệp để làm set quà hoàn chỉnh." },
          { text: "Tiny có thể tư vấn mẫu hoa phù hợp với dịp tặng và phong cách người nhận." },
          { text: "Giao hàng toàn quốc, đóng gói cẩn thận để hoa không bị xộc xệch khi vận chuyển." }
        ]
      },
      {
        type: "related",
        title: "Đọc thêm từ blog LenTiny",
        links: [
          {
            href: "/blog/vi-sao-qua-len-handmade-duoc-yeu-thich",
            title: "Vì sao quà len handmade được yêu thích?",
            text: "Tìm hiểu giá trị đặc biệt của những món quà làm bằng tay."
          },
          {
            href: "/san-pham/thu-len-theo-yeu-cau",
            title: "Đặt móc thú len theo yêu cầu",
            text: "Kết hợp hoa len và thú bông len làm set quà hoàn chỉnh."
          }
        ]
      }
    ],
    faq: [
      {
        question: "Hoa len có bền không? Giữ được bao lâu?",
        answer:
          "Hoa len rất bền. Nếu bảo quản đúng cách - để nơi khô ráo, tránh bụi và kéo mạnh - hoa len có thể giữ được nhiều năm mà không bị hỏng hình dạng."
      },
      {
        question: "Có thể chọn màu hoa theo yêu cầu không?",
        answer:
          "Có. Tiny nhận làm hoa len theo màu bạn chọn - tone pastel, màu đậm, nhiều màu phối hoặc tone màu cụ thể. Chỉ cần mô tả hoặc gửi màu tham khảo qua Zalo."
      },
      {
        question: "Có thể kết hợp hoa len với thú bông làm hộp quà không?",
        answer:
          "Được. Tiny có thể kết hợp hoa len với thú bông len, móc khóa và thiệp để đóng thành hộp quà hoàn chỉnh. Nhắn Tiny để trao đổi yêu cầu cụ thể."
      },
      {
        question: "Nên đặt hoa len trước bao lâu?",
        answer:
          "Nên đặt trước ít nhất 5-7 ngày so với ngày cần nhận. Dịp đông như Valentine, 8/3, 20/10 nên đặt sớm hơn để Tiny sắp xếp thời gian làm kỹ."
      },
      {
        question: "Giá bó hoa len là bao nhiêu?",
        answer:
          "Giá tùy kích thước bó, loại hoa và số lượng bông. Nhắn Zalo 0368.903.519 để Tiny báo giá theo nhu cầu và ngân sách của bạn."
      }
    ]
  }
];

export const productSlugs = products.map((product) => product.slug);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
