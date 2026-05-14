const policies = {
  privacy: `
    <h2>Chính sách bảo mật</h2>
    <p><strong>Chủ thể bán hàng: Tiệm Len Nhà Tiny.</strong> Tiny chỉ thu thập thông tin cần thiết để tư vấn, xác nhận đơn, giao hàng và hỗ trợ sau bán hàng.</p>
    <h3>1. Thông tin có thể được thu thập</h3>
    <p>Tên người nhận, số điện thoại, địa chỉ giao hàng, nội dung bạn nhắn qua Zalo/Messenger/Facebook, ảnh mẫu bạn gửi để đặt làm sản phẩm và lịch sử sản phẩm đã tư vấn.</p>
    <h3>2. Mục đích sử dụng</h3>
    <p>Thông tin được dùng để báo giá, tư vấn màu/size/chất liệu, xác nhận đơn, giao hàng, xử lý đổi trả/hoàn tiền và chăm sóc khách hàng.</p>
    <h3>3. Cookie, pixel và công cụ đo lường</h3>
    <p>Khi được bật, website có thể dùng Meta Pixel, TikTok Pixel và Google Analytics để đo lượt xem trang, lượt nhấn nút liên hệ và hiệu quả quảng cáo. Các công cụ này không dùng để bán thông tin cá nhân của bạn.</p>
    <h3>4. Bên thứ ba liên quan</h3>
    <p>Thông tin có thể được chia sẻ ở mức cần thiết với nền tảng chat, đơn vị vận chuyển, Supabase để hiển thị dữ liệu sản phẩm, và các nền tảng đo lường quảng cáo khi pixel được bật.</p>
    <h3>5. Quyền của khách hàng</h3>
    <p>Bạn có thể yêu cầu Tiny kiểm tra, chỉnh sửa hoặc xóa thông tin đặt hàng bằng cách liên hệ qua Zalo 036.890.3519 hoặc Facebook Fanpage.</p>
    <h3>6. Cam kết</h3>
    <p>Tiny không bán thông tin khách hàng. Dữ liệu chỉ được lưu trong thời gian cần thiết cho việc xử lý đơn, bảo hành/đổi trả và đối soát vận chuyển.</p>
  `,
  terms: `
    <h2>Điều khoản dịch vụ</h2>
    <p>Chủ thể bán hàng: <strong>Tiệm Len Nhà Tiny</strong>. Địa chỉ liên hệ: 853 Ba Đình, Phường Chánh Hưng, TP. Hồ Chí Minh. Kênh hỗ trợ: Zalo 036.890.3519 và Facebook Fanpage.</p>
    <h3>1. Sản phẩm và báo giá</h3>
    <p>Tiny bán len sợi từ 8.000đ, hộp quà từ 100.000đ, set tự móc từ 100.000đ và nhận làm đồ móc handmade báo giá theo mẫu. Giá hiển thị hoặc báo qua tin nhắn được tính bằng VND và có thể thay đổi theo kích thước, chất liệu, độ khó, số lượng và yêu cầu gói quà.</p>
    <h3>2. Đơn đặt riêng</h3>
    <p>Với sản phẩm handmade theo ảnh mẫu, Tiny sẽ tư vấn trước về màu, size, thời gian hoàn thiện và chi phí. Sản phẩm handmade có thể chênh nhẹ về màu sắc/kích thước do ánh sáng, lô len và thao tác thủ công.</p>
    <h3>3. Thanh toán và đặt cọc</h3>
    <p>Đơn có sẵn có thể thanh toán theo thỏa thuận khi chốt đơn. Đơn thiết kế riêng có thể cần đặt cọc trước, thông thường từ 30-50% giá trị đơn, tùy độ phức tạp và số lượng.</p>
    <h3>4. Thời gian thực hiện</h3>
    <p>Đơn móc theo yêu cầu thường cần 3-7 ngày làm việc, đơn phức tạp hoặc số lượng lớn có thể lâu hơn. Tiny sẽ báo lịch dự kiến trước khi nhận cọc.</p>
    <h3>5. Hủy đơn</h3>
    <p>Đơn đặt riêng đã bắt đầu làm hoặc đã mua nguyên liệu riêng theo yêu cầu có thể không được hủy hoàn toàn. Tiny sẽ trao đổi phương án phù hợp theo tiến độ thực tế.</p>
  `,
  shipping: `
    <h2>Chính sách vận chuyển</h2>
    <h3>1. Phạm vi giao hàng</h3>
    <p>Tiny hỗ trợ giao hàng toàn quốc qua các đơn vị vận chuyển phù hợp như GHN, GHTK, J&amp;T hoặc đơn vị tương đương.</p>
    <h3>2. Thời gian giao hàng</h3>
    <p>Nội thành TP.HCM thường từ 1-3 ngày làm việc sau khi gửi hàng. Các tỉnh thành khác thường từ 2-5 ngày làm việc, tùy khu vực và tình trạng vận chuyển.</p>
    <h3>3. Phí vận chuyển</h3>
    <p>Phí ship được báo khi chốt đơn, phụ thuộc địa chỉ nhận hàng, kích thước và trọng lượng gói hàng. Một số chương trình ưu đãi ship nếu có sẽ được thông báo rõ trước khi thanh toán.</p>
    <h3>4. Đóng gói</h3>
    <p>Sản phẩm được đóng gói cẩn thận để hạn chế móp méo, ẩm bẩn hoặc hư hại trong quá trình vận chuyển. Với đơn quà tặng, Tiny có thể hỗ trợ gói hộp/thiệp theo thỏa thuận.</p>
    <h3>5. Kiểm tra khi nhận hàng</h3>
    <p>Khách hàng nên quay video khi mở hàng để Tiny và đơn vị vận chuyển có căn cứ hỗ trợ nếu phát sinh thiếu hàng, sai mẫu hoặc hư hỏng.</p>
  `,
  refund: `
    <h2>Chính sách đổi trả &amp; hoàn tiền</h2>
    <h3>1. Trường hợp hỗ trợ</h3>
    <p>Tiny hỗ trợ đổi, sửa hoặc hoàn tiền nếu sản phẩm bị lỗi kỹ thuật do Tiny, giao sai mẫu đã chốt, thiếu sản phẩm, hoặc hư hỏng nghiêm trọng trong quá trình vận chuyển có video mở hàng rõ ràng.</p>
    <h3>2. Thời hạn phản hồi</h3>
    <p>Vui lòng liên hệ trong vòng 48 giờ sau khi nhận hàng kèm ảnh/video tình trạng sản phẩm để Tiny kiểm tra và đề xuất hướng xử lý.</p>
    <h3>3. Sản phẩm đặt riêng</h3>
    <p>Với hàng handmade làm theo yêu cầu cá nhân, Tiny không nhận đổi trả vì đổi ý sau khi sản phẩm đã hoàn thiện đúng thông tin đã chốt. Nếu có lỗi do Tiny, Tiny sẽ ưu tiên sửa hoặc làm lại phần lỗi.</p>
    <h3>4. Hoàn tiền</h3>
    <p>Nếu đủ điều kiện hoàn tiền, Tiny sẽ hoàn qua phương thức đã thỏa thuận sau khi xác minh tình trạng đơn hàng. Thời gian xử lý thông thường từ 3-7 ngày làm việc.</p>
    <h3>5. Chi phí phát sinh</h3>
    <p>Nếu lỗi phát sinh từ Tiny hoặc vận chuyển có xác nhận, Tiny sẽ hỗ trợ chi phí hợp lý. Nếu khách đổi thông tin sau khi đơn đã gửi, chi phí phát sinh có thể do khách thanh toán.</p>
  `
};

export function openPolicyModal(type) {
  const policyModal = document.getElementById('policyModal');
  const policyContent = document.getElementById('policyContent');

  if (!policyModal || !policyContent || !policies[type]) return;

  policyContent.innerHTML = policies[type];
  policyModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closePolicyModal() {
  const policyModal = document.getElementById('policyModal');
  policyModal?.classList.remove('active');
  document.body.style.overflow = '';
}

export function initPolicyModal() {
  const policyModal = document.getElementById('policyModal');

  policyModal?.addEventListener('click', (e) => {
    if (e.target === policyModal) closePolicyModal();
  });

  window.openPolicyModal = openPolicyModal;
  window.closePolicyModal = closePolicyModal;
}
