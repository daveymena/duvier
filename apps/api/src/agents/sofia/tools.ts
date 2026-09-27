import { searchProducts, getProduct } from "../../db/repos/products.js";
import { findCoupon, useCoupon } from "../../db/repos/coupons.js";
import { createOrder, updateOrder } from "../../db/repos/orders.js";
import { setFunnelStage } from "../../db/repos/contacts.js";
import { createMercadoPagoLink } from "../../integrations/payments/mercadopago.js";
import { createPaypalOrder } from "../../integrations/payments/paypal.js";
import { readPaymentReceipt } from "../../integrations/vision.js";
import type { ToolFn } from "../toolLoop.js";

export function buildSofiaTools(businessId: string, contactId: string): Record<string, ToolFn> {
  return {
    async buscar_producto({ query }) {
      const products = searchProducts(businessId, String(query ?? ""));
      return { products: products.map((p) => ({ id: p.id, nombre: p.name, precio: p.price, moneda: p.currency, stock: p.stock })) };
    },

    async cotizar({ productId, qty }) {
      const product = getProduct(String(productId));
      if (!product) return { error: "Producto no encontrado" };
      const cantidad = Number(qty) || 1;
      return { producto: product.name, precioUnitario: product.price, cantidad, total: product.price * cantidad, moneda: product.currency };
    },

    async aplicar_cupon({ code }) {
      const coupon = findCoupon(businessId, String(code ?? ""));
      if (!coupon) return { valido: false };
      return { valido: true, porcentaje: coupon.percent_off, montoFijo: coupon.amount_off };
    },

    async crear_pedido({ items, couponCode }) {
      const list = Array.isArray(items) ? items : [];
      const resolved = list
        .map((it: any) => {
          const p = getProduct(String(it.productId));
          if (!p) return null;
          return { productId: p.id, name: p.name, price: p.price, qty: Number(it.qty) || 1 };
        })
        .filter(Boolean) as { productId: string; name: string; price: number; qty: number }[];
      if (resolved.length === 0) return { error: "No se reconocieron productos válidos" };
      const order = createOrder(businessId, contactId, resolved, "COP", couponCode);
      setFunnelStage(contactId, "negociando");
      return { orderId: order.id, total: order.total, moneda: order.currency };
    },

    async generar_link_pago({ orderId, metodo }) {
      const method = String(metodo ?? "mercadopago");
      const order = (await import("../../db/repos/orders.js")).getOrder(String(orderId));
      if (!order) return { error: "Pedido no encontrado" };
      if (method === "paypal") {
        const res = await createPaypalOrder(businessId, { amount: order.total, description: `Pedido ${order.id}` });
        if (res.link) updateOrder(order.id, { payment_method: "paypal", payment_link: res.link });
        return res;
      }
      const res = await createMercadoPagoLink(businessId, {
        title: `Pedido ${order.id}`,
        quantity: 1,
        unitPrice: order.total,
        externalReference: order.id,
      });
      if (res.link) updateOrder(order.id, { payment_method: "mercadopago", payment_link: res.link });
      return res;
    },

    async leer_comprobante({ imageUrl, orderId }) {
      const analisis = await readPaymentReceipt(businessId, String(imageUrl));
      if (orderId) updateOrder(String(orderId), { receipt_url: String(imageUrl) });
      return { analisis };
    },

    async marcar_pagado({ orderId }) {
      updateOrder(String(orderId), { status: "pagado" });
      setFunnelStage(contactId, "pagado");
      return { ok: true };
    },

    async actualizar_etapa({ etapa }) {
      setFunnelStage(contactId, String(etapa));
      return { ok: true };
    },
  };
}
