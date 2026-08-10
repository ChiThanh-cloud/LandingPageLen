import type { WholesaleTier } from "@/types/yarn-product";
import styles from "./YarnProductDetail.module.css";

export function WholesalePricingTable({ tiers }: { tiers: WholesaleTier[] }) {
  if (tiers.length === 0) return null;
  return (
    <section className={styles.wholesale} aria-labelledby="wholesale-heading">
      <div className={styles.wholesaleHeader}>
        <h2 id="wholesale-heading">Bảng giá sỉ</h2>
        <p>Giá theo số lượng từ dữ liệu sản phẩm.</p>
      </div>
      <table className={styles.wholesaleTable}>
        <thead><tr><th scope="col">Số lượng</th><th scope="col">Giá</th></tr></thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.minQuantity}>
              <td>{tier.label}</td>
              <td><strong>{tier.price.toLocaleString("vi-VN")}đ</strong> / cuộn</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
