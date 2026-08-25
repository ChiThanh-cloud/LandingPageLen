import { policyRoutes, type PolicyKey } from "@/data/policy-routes";

export type { PolicyKey } from "@/data/policy-routes";

type PolicySection = {
  heading: string;
  paragraphs: readonly string[];
};

export type Policy = {
  slug: string;
  title: string;
  description: string;
  intro?: readonly string[];
  sections: readonly PolicySection[];
};

export const policies: Record<PolicyKey, Policy> = {
  privacy: {
    slug: policyRoutes.privacy.slug,
    title: policyRoutes.privacy.title,
    description: "Thông tin về cách Tiệm Len Nhà Tiny thu thập, sử dụng và hỗ trợ cập nhật thông tin đặt hàng.",
    intro: [
      "Chủ thể bán hàng: Tiệm Len Nhà Tiny. Tiny chỉ thu thập thông tin cần thiết để tư vấn, xác nhận đơn, giao hàng và hỗ trợ sau bán hàng."
    ],
    sections: [
      {
        heading: "1. Thông tin có thể được thu thập",
        paragraphs: [
          "Tên người nhận, số điện thoại, địa chỉ giao hàng, nội dung bạn nhắn qua Zalo/Messenger/Facebook, ảnh mẫu bạn gửi để đặt làm sản phẩm và lịch sử sản phẩm đã tư vấn."
        ]
      },
      {
        heading: "2. Mục đích sử dụng",
        paragraphs: [
          "Thông tin được dùng để báo giá, tư vấn màu/size/chất liệu, xác nhận đơn, giao hàng, xử lý đổi trả/hoàn tiền và chăm sóc khách hàng."
        ]
      },
      {
        heading: "3. Cookie, pixel và công cụ đo lường",
        paragraphs: [
          "Khi được bật, website có thể dùng Meta Pixel, TikTok Pixel và Google Analytics để đo lượt xem trang, lượt nhấn nút liên hệ và hiệu quả quảng cáo. Các công cụ này không dùng để bán thông tin cá nhân của bạn."
        ]
      },
      {
        heading: "4. Bên thứ ba liên quan",
        paragraphs: [
          "Thông tin có thể được chia sẻ ở mức cần thiết với nền tảng chat, đơn vị vận chuyển, Supabase để hiển thị dữ liệu sản phẩm, và các nền tảng đo lường quảng cáo khi pixel được bật."
        ]
      },
      {
        heading: "5. Quyền của khách hàng",
        paragraphs: [
          "Bạn có thể yêu cầu Tiny kiểm tra, chỉnh sửa hoặc xóa thông tin đặt hàng bằng cách liên hệ qua Zalo 036.890.3519 hoặc Facebook Fanpage."
        ]
      },
      {
        heading: "6. Cam kết",
        paragraphs: [
          "Tiny không bán thông tin khách hàng. Dữ liệu chỉ được lưu trong thời gian cần thiết cho việc xử lý đơn, bảo hành/đổi trả và đối soát vận chuyển."
        ]
      }
    ]
  },
  terms: {
    slug: policyRoutes.terms.slug,
    title: policyRoutes.terms.title,
    description: "Điều khoản về sản phẩm, báo giá, đơn đặt riêng, thanh toán và hủy đơn tại Tiệm Len Nhà Tiny.",
    intro: [
      "Chủ thể bán hàng: Tiệm Len Nhà Tiny. Địa chỉ liên hệ: 853 Ba Đình, Phường Chánh Hưng, TP. Hồ Chí Minh. Kênh hỗ trợ: Zalo 036.890.3519 và Facebook Fanpage."
    ],
    sections: [
      {
        heading: "1. Sản phẩm và báo giá",
        paragraphs: [
          "Tiny bán len sợi từ 8.000đ, hộp quà từ 100.000đ, set tự móc từ 100.000đ và nhận làm đồ móc handmade báo giá theo mẫu. Giá hiển thị hoặc báo qua tin nhắn được tính bằng VND và có thể thay đổi theo kích thước, chất liệu, độ khó, số lượng và yêu cầu gói quà."
        ]
      },
      {
        heading: "2. Đơn đặt riêng",
        paragraphs: [
          "Với sản phẩm handmade theo ảnh mẫu, Tiny sẽ tư vấn trước về màu, size, thời gian hoàn thiện và chi phí. Sản phẩm handmade có thể chênh nhẹ về màu sắc/kích thước do ánh sáng, lô len và thao tác thủ công."
        ]
      },
      {
        heading: "3. Thanh toán và đặt cọc",
        paragraphs: [
          "Đơn có sẵn có thể thanh toán theo thỏa thuận khi chốt đơn. Đơn thiết kế riêng có thể cần đặt cọc trước, thông thường từ 30-50% giá trị đơn, tùy độ phức tạp và số lượng."
        ]
      },
      {
        heading: "4. Thời gian thực hiện",
        paragraphs: [
          "Đơn móc theo yêu cầu thường cần 3-7 ngày làm việc, đơn phức tạp hoặc số lượng lớn có thể lâu hơn. Tiny sẽ báo lịch dự kiến trước khi nhận cọc."
        ]
      },
      {
        heading: "5. Hủy đơn",
        paragraphs: [
          "Đơn đặt riêng đã bắt đầu làm hoặc đã mua nguyên liệu riêng theo yêu cầu có thể không được hủy hoàn toàn. Tiny sẽ trao đổi phương án phù hợp theo tiến độ thực tế."
        ]
      }
    ]
  },
  shipping: {
    slug: policyRoutes.shipping.slug,
    title: policyRoutes.shipping.title,
    description: "Thông tin về phạm vi giao hàng, thời gian, phí vận chuyển, đóng gói và kiểm tra đơn của Tiệm Len Nhà Tiny.",
    sections: [
      {
        heading: "1. Phạm vi giao hàng",
        paragraphs: [
          "Tiny hỗ trợ giao hàng toàn quốc qua các đơn vị vận chuyển phù hợp như GHN, GHTK, J&T hoặc đơn vị tương đương."
        ]
      },
      {
        heading: "2. Thời gian giao hàng",
        paragraphs: [
          "Nội thành TP.HCM thường từ 1-3 ngày làm việc sau khi gửi hàng. Các tỉnh thành khác thường từ 2-5 ngày làm việc, tùy khu vực và tình trạng vận chuyển."
        ]
      },
      {
        heading: "3. Phí vận chuyển",
        paragraphs: [
          "Phí ship được báo khi chốt đơn, phụ thuộc địa chỉ nhận hàng, kích thước và trọng lượng gói hàng. Một số chương trình ưu đãi ship nếu có sẽ được thông báo rõ trước khi thanh toán."
        ]
      },
      {
        heading: "4. Đóng gói",
        paragraphs: [
          "Sản phẩm được đóng gói cẩn thận để hạn chế móp méo, ẩm bẩn hoặc hư hại trong quá trình vận chuyển. Với đơn quà tặng, Tiny có thể hỗ trợ gói hộp/thiệp theo thỏa thuận."
        ]
      },
      {
        heading: "5. Kiểm tra khi nhận hàng",
        paragraphs: [
          "Khách hàng nên quay video khi mở hàng để Tiny và đơn vị vận chuyển có căn cứ hỗ trợ nếu phát sinh thiếu hàng, sai mẫu hoặc hư hỏng."
        ]
      }
    ]
  },
  refund: {
    slug: policyRoutes.refund.slug,
    title: policyRoutes.refund.title,
    description: "Các trường hợp hỗ trợ đổi, sửa hoặc hoàn tiền và cách liên hệ Tiệm Len Nhà Tiny khi cần kiểm tra đơn hàng.",
    sections: [
      {
        heading: "1. Trường hợp hỗ trợ",
        paragraphs: [
          "Tiny hỗ trợ đổi, sửa hoặc hoàn tiền nếu sản phẩm bị lỗi kỹ thuật do Tiny, giao sai mẫu đã chốt, thiếu sản phẩm, hoặc hư hỏng nghiêm trọng trong quá trình vận chuyển có video mở hàng rõ ràng."
        ]
      },
      {
        heading: "2. Thời hạn phản hồi",
        paragraphs: [
          "Vui lòng liên hệ trong vòng 48 giờ sau khi nhận hàng kèm ảnh/video tình trạng sản phẩm để Tiny kiểm tra và đề xuất hướng xử lý."
        ]
      },
      {
        heading: "3. Sản phẩm đặt riêng",
        paragraphs: [
          "Với hàng handmade làm theo yêu cầu cá nhân, Tiny không nhận đổi trả vì đổi ý sau khi sản phẩm đã hoàn thiện đúng thông tin đã chốt. Nếu có lỗi do Tiny, Tiny sẽ ưu tiên sửa hoặc làm lại phần lỗi."
        ]
      },
      {
        heading: "4. Hoàn tiền",
        paragraphs: [
          "Nếu đủ điều kiện hoàn tiền, Tiny sẽ hoàn qua phương thức đã thỏa thuận sau khi xác minh tình trạng đơn hàng. Thời gian xử lý thông thường từ 3-7 ngày làm việc."
        ]
      },
      {
        heading: "5. Chi phí phát sinh",
        paragraphs: [
          "Nếu lỗi phát sinh từ Tiny hoặc vận chuyển có xác nhận, Tiny sẽ hỗ trợ chi phí hợp lý. Nếu khách đổi thông tin sau khi đơn đã gửi, chi phí phát sinh có thể do khách thanh toán."
        ]
      }
    ]
  }
};
