'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Stats from '../components/Stats';
import { supabase } from '../lib/supabase';

interface Order {
  orderId: string;
  trackingNumber: string;
  trackingInfoDescription?: string;
  status?: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  products?: Array<{ name: string; amount: number; price: string; rawPrice?: number }>;
  cookie?: string;
}

export default function HomePage() {
  const [cookieInput, setCookieInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, shipping: 0, done: 0, cancel: 0 });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateStats = (orders: Order[]) => {
    let shipping = 0;
    let done = 0;
    let cancel = 0;

    orders.forEach((order) => {
      const desc = order.trackingInfoDescription?.toLowerCase() || '';
      const status = order.status;

      // Phân loại dựa trên tracking_info_description hoặc status
      // Status: 1=đang xử lý, 3-4=đang giao, 5=hoàn thành, 6=đã hủy
      if (desc.includes('đã hủy') || desc.includes('hủy') || status === 6) {
        cancel++;
      } else if (desc.includes('đã giao') || desc.includes('hoàn thành') || desc.includes('giao thành công') || status === 5) {
        done++;
      } else if (desc.includes('đang giao') || desc.includes('đang vận chuyển') || desc.includes('chuẩn bị hàng') || status === 3 || status === 4) {
        shipping++;
      } else {
        // Mặc định là đang giao nếu có tracking number
        if (order.trackingNumber && order.trackingNumber !== 'Chưa có' && order.trackingNumber !== 'Không xác định') {
          shipping++;
        }
      }
    });

    return {
      total: orders.length,
      shipping,
      done,
      cancel
    };
  };

  const formatPrice = (price: number) => {
    // Price từ API là số (ví dụ: 10900000000 = 109,000đ)
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price / 100000);
  };

  // Tải danh sách đơn từ Supabase khi vào trang chủ
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: rows, error } = await supabase
        .from('orders')
        .select('order_id, tracking_number, tracking_info_description, status, shipping_name, shipping_phone, shipping_address, products, cookie')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Load orders from DB:', error);
        return;
      }
      if (rows && rows.length > 0) {
        const list: Order[] = rows.map((r: any) => ({
          orderId: r.order_id ?? '',
          trackingNumber: r.tracking_number ?? 'Chưa có',
          trackingInfoDescription: r.tracking_info_description ?? '',
          status: r.status ?? undefined,
          shippingName: r.shipping_name ?? '',
          shippingPhone: r.shipping_phone ?? '',
          shippingAddress: r.shipping_address ?? '',
          products: Array.isArray(r.products) ? r.products : [],
          cookie: r.cookie ?? undefined,
        }));
        setOrders(list);
        setStats(calculateStats(list));
      }
    })();
  }, []);

  const handleCheck = async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!cookieInput.trim()) {
      setError('Vui lòng nhập cookie');
      setInfo('');
      return;
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError('');
    setInfo('');

    try {
      const response = await fetch(
        'https://us-central1-get-feedback-a0119.cloudfunctions.net/app/api/shopee/getOrderDetailsForCookie',
        {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            cookies: [cookieInput.trim()]
          }),
          signal: abortController.signal
        }
      );

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      const data = await response.json();

      // Check again after JSON parse (might take time)
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Lỗi khi lấy đơn hàng');
      }

      // Parse response: data có allOrderDetails là array, mỗi item có orderDetails
      // Only process if this is still the current request
      if (abortController.signal.aborted) {
        return;
      }

      const allOrders: Order[] = [];
      
      // Xử lý cấu trúc: data.allOrderDetails là array
      if (data.allOrderDetails && Array.isArray(data.allOrderDetails) && data.allOrderDetails.length > 0) {
        data.allOrderDetails.forEach((item: any) => {
          if (item.orderDetails && Array.isArray(item.orderDetails)) {
            item.orderDetails.forEach((orderDetail: any) => {
              const order: Order = {
                orderId: orderDetail.order_id || '',
                trackingNumber: orderDetail.tracking_number || 'Chưa có',
                trackingInfoDescription: orderDetail.tracking_info_description || '',
                status: orderDetail.status,
                shippingName: orderDetail.address?.shipping_name || '',
                shippingPhone: orderDetail.address?.shipping_phone || '',
                shippingAddress: orderDetail.address?.shipping_address || '',
                products: orderDetail.product_info?.map((product: any) => ({
                  name: product.name || '',
                  amount: product.amount || 0,
                  price: formatPrice(product.item_price || 0),
                  rawPrice: product.item_price || 0
                })) || []
              };
              allOrders.push(order);
            });
          }
        });
      }

      // Final check before updating state
      if (abortController.signal.aborted) {
        return;
      }

      const cookieUsed = cookieInput.trim();
      // Gộp với danh sách hiện tại: đơn từ API (thêm/cập nhật + cookie) lên trước, giữ các đơn cũ không nằm trong response
      setOrders((prev) => {
        const fromApi = allOrders.map((o) => ({ ...o, cookie: cookieUsed }));
        const updatedIds = new Set(fromApi.map((o) => o.orderId));
        const kept = prev.filter((o) => !updatedIds.has(o.orderId));
        const merged = [...fromApi, ...kept];
        setStats(calculateStats(merged));
        return merged;
      });

      if (allOrders.length > 0) {
        // Lưu vào Supabase: đơn mới thì insert, đơn đã tồn tại thì update (cả cookie)
        let saveMsg = `✅ Thêm ${allOrders.length} đơn từ cookie · Đã gộp vào danh sách`;
        if (supabase) {
          const rows = allOrders.map((o) => ({
            order_id: o.orderId,
            tracking_number: o.trackingNumber || null,
            tracking_info_description: o.trackingInfoDescription || null,
            status: o.status ?? null,
            shipping_name: o.shippingName,
            shipping_phone: o.shippingPhone,
            shipping_address: o.shippingAddress,
            products: o.products ?? [],
            cookie: cookieUsed || null,
          }));
          try {
            const { error: sbError } = await supabase.from('orders').upsert(rows, {
              onConflict: 'order_id',
              ignoreDuplicates: false,
            });
            if (sbError) {
              console.error('Supabase save orders:', sbError);
              saveMsg += ` (lưu DB lỗi: ${sbError.message})`;
            } else {
              saveMsg += ' · Đã lưu DB';
            }
          } catch (e: any) {
            console.error('Supabase save orders:', e);
            const isNetwork = (e?.message || '').includes('fetch');
            saveMsg += isNetwork
              ? ' (lưu DB lỗi: kiểm tra .env.local — NEXT_PUBLIC_SUPABASE_URL phải là https://<project-id>.supabase.co, sau đó restart dev server)'
              : ` (lưu DB lỗi: ${e?.message || 'Unknown'})`;
          }
        } else {
          saveMsg += ' (chưa cấu hình Supabase)';
        }
        setInfo(saveMsg);
      } else {
        setInfo('Cookie này không trả về đơn nào. Danh sách hiện tại giữ nguyên.');
      }
    } catch (err: any) {
      // Don't set error if request was aborted
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      setError(err.message || 'Có lỗi xảy ra khi kiểm tra đơn hàng');
    } finally {
      // Only update loading state if this is still the current request
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      // Clear abort controller if this was the current request
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleCheck();
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này khỏi danh sách?')) return;
    if (supabase) {
      const { error } = await supabase.from('orders').delete().eq('order_id', orderId);
      if (error) {
        console.error('Delete order:', error);
        setError('Không thể xóa đơn: ' + error.message);
        return;
      }
    }
    const next = orders.filter((o) => o.orderId !== orderId);
    setOrders(next);
    setStats(calculateStats(next));
    setInfo(next.length > 0 ? `Đã xóa đơn. Còn ${next.length} đơn.` : 'Đã xóa đơn. Danh sách trống.');
  };

  // Cập nhật dữ liệu một đơn: dùng cookie của đơn (hoặc cookie đang nhập) gọi API rồi cập nhật đơn đó
  const handleUpdateOrder = async (order: Order) => {
    const cookieToUse = (order.cookie || cookieInput.trim()).trim();
    if (!cookieToUse) {
      setError('Đơn chưa có cookie. Nhập cookie vào ô trên rồi bấm Cập nhật.');
      return;
    }
    setUpdatingOrderId(order.orderId);
    setError('');
    setInfo('');
    try {
      const response = await fetch(
        'https://us-central1-get-feedback-a0119.cloudfunctions.net/app/api/shopee/getOrderDetailsForCookie',
        {
          method: 'POST',
          headers: {
            accept: 'application/json, text/plain, */*',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ cookies: [cookieToUse] }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Lỗi khi lấy đơn hàng');
      }
      let updatedOrder: Order | null = null;
      if (data.allOrderDetails && Array.isArray(data.allOrderDetails)) {
        for (const item of data.allOrderDetails) {
          if (!item.orderDetails || !Array.isArray(item.orderDetails)) continue;
          const detail = item.orderDetails.find((d: any) => (d.order_id || '') === order.orderId);
          if (detail) {
            updatedOrder = {
              orderId: detail.order_id || '',
              trackingNumber: detail.tracking_number || 'Chưa có',
              trackingInfoDescription: detail.tracking_info_description || '',
              status: detail.status,
              shippingName: detail.address?.shipping_name || '',
              shippingPhone: detail.address?.shipping_phone || '',
              shippingAddress: detail.address?.shipping_address || '',
              products: detail.product_info?.map((p: any) => ({
                name: p.name || '',
                amount: p.amount || 0,
                price: formatPrice(p.item_price || 0),
                rawPrice: p.item_price || 0,
              })) || [],
              cookie: cookieToUse,
            };
            break;
          }
        }
      }
      if (!updatedOrder) {
        setInfo('Không tìm thấy đơn này trong dữ liệu trả về từ cookie.');
        return;
      }
      if (supabase) {
        const row = {
          order_id: updatedOrder.orderId,
          tracking_number: updatedOrder.trackingNumber || null,
          tracking_info_description: updatedOrder.trackingInfoDescription || null,
          status: updatedOrder.status ?? null,
          shipping_name: updatedOrder.shippingName,
          shipping_phone: updatedOrder.shippingPhone,
          shipping_address: updatedOrder.shippingAddress,
          products: updatedOrder.products ?? [],
          cookie: cookieToUse,
        };
        const { error: sbError } = await supabase.from('orders').upsert([row], {
          onConflict: 'order_id',
          ignoreDuplicates: false,
        });
        if (sbError) {
          setError('Lưu DB: ' + sbError.message);
          return;
        }
      }
      const nextList = orders.map((o) => (o.orderId === order.orderId ? updatedOrder! : o));
      setOrders(nextList);
      setStats(calculateStats(nextList));
      setInfo(`Đã cập nhật đơn ${order.orderId}`);
    } catch (e: any) {
      setError(e?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Aurora backgrounds */}
      <div className="aurora"></div>
      <div className="aurora aurora-2"></div>
      <div className="aurora aurora-3"></div>

      <div className="relative z-[1] flex-1 flex flex-col items-center">
        <Navbar />

        <main className="flex-1 w-full max-w-[900px] lg:max-w-[1400px] xl:max-w-[1600px] mx-auto px-3 sm:px-5 py-6 pb-15 flex flex-col">
          {/* Hero */}
          <div className="hero text-center mb-4.5">
            <h1 className="text-[clamp(20px,4vw,32px)] font-extrabold tracking-[-0.8px] leading-tight mb-0.5">
              Tra cứu <span className="gradient-text">Đơn Hàng Shopee</span>
            </h1>
            <p className="text-[var(--text2)] text-[11px]">
              Cookie · Tra cứu MVĐ SPX
            </p>
          </div>

          {/* Search Card */}
          <div className="search-card glass p-3 sm:p-4 mb-1 transition-all focus-within:border-[rgba(124,92,252,0.35)] focus-within:shadow-[0_0_24px_rgba(124,92,252,0.12)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3 relative">
              <div className="absolute left-4 top-3.5 sm:top-1/2 sm:-translate-y-1/2 text-[var(--text3)] pointer-events-none z-10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-5 sm:h-5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <input
                type="text"
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Dán SPC_ST cookie..."
                autoComplete="off"
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 sm:py-3.5 pl-11 sm:pl-12 text-sm sm:text-base text-[var(--text)] font-inherit min-w-0 disabled:opacity-50 placeholder:text-[var(--text3)]"
              />
              <div className="flex sm:ml-2">
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-white border-none rounded-[12px] px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-semibold cursor-pointer transition-all whitespace-nowrap shadow-[0_4px_20px_rgba(124,92,252,0.3)] hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(124,92,252,0.45)] relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="relative z-10">{loading ? '⏳ Đang kiểm tra...' : 'Kiểm tra'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-2.5 px-3.5 rounded-[10px] text-[11px] mb-3 font-medium bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[var(--red)]">
              {error}
            </div>
          )}
          {info && (
            <div className="p-2.5 px-3.5 rounded-[10px] text-[11px] mb-3 font-medium bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] text-[var(--blue)]">
              {info}
            </div>
          )}

          {/* Stats */}
          {orders.length > 0 && (
            <>
              <Stats total={stats.total} shipping={stats.shipping} done={stats.done} cancel={stats.cancel} />

              {/* Sheet View: desktop full width không scroll, mobile scroll ngang */}
              <div className="rounded-[14px] border border-[var(--card-border)] bg-[rgba(255,255,255,0.02)] mb-4 overflow-x-auto lg:overflow-visible">
                  <table className="w-full border-collapse text-xs min-w-[1800px] lg:min-w-0 lg:table-fixed">
                    <thead>
                      <tr>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 left-0 z-[2] w-12 min-w-[3rem] lg:w-[3%] whitespace-nowrap">STT</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 left-12 z-[3] w-20 min-w-[5rem] lg:w-[8%] whitespace-nowrap shadow-[4px_0_6px_rgba(0,0,0,0.2)]">Thao tác</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[10%] whitespace-nowrap">Mã đơn</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[11%] whitespace-nowrap">MVĐ</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[14%] whitespace-nowrap">Trạng thái</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[6%] whitespace-nowrap">Shop</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[10%] whitespace-nowrap">Người nhận</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[9%] whitespace-nowrap">SĐT</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[19%] whitespace-nowrap">Địa chỉ</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] lg:w-[10%] whitespace-nowrap">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={order.orderId || index} className="transition-all hover:bg-[rgba(124,92,252,0.06)] even:bg-[rgba(255,255,255,0.018)] group">
                          <td className="p-2.5 text-center text-[var(--text3)] font-semibold border-b border-[rgba(255,255,255,0.05)] sticky left-0 z-[1] w-12 min-w-[3rem] bg-[var(--bg)] group-even:bg-[rgba(255,255,255,0.018)] group-hover:bg-[rgba(124,92,252,0.06)] shadow-[4px_0_6px_rgba(0,0,0,0.08)]">{index + 1}</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap sticky left-12 z-[1] w-20 min-w-[5rem] bg-[var(--bg)] group-even:bg-[rgba(255,255,255,0.018)] group-hover:bg-[rgba(124,92,252,0.06)] shadow-[4px_0_6px_rgba(0,0,0,0.08)]">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateOrder(order)}
                                disabled={updatingOrderId === order.orderId}
                                className="px-2 py-1 text-[10px] font-medium rounded-lg bg-[rgba(96,165,250,0.2)] text-[var(--blue)] border border-[rgba(96,165,250,0.35)] hover:bg-[rgba(96,165,250,0.3)] disabled:opacity-50 transition-colors"
                              >
                                {updatingOrderId === order.orderId ? '…' : 'Cập nhật'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.orderId)}
                                className="px-2 py-1 text-[10px] font-medium rounded-lg bg-[rgba(248,113,113,0.15)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] hover:bg-[rgba(248,113,113,0.25)] transition-colors"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-[var(--accent2)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">{order.orderId || '—'}</td>
                          <td className="p-2.5 font-mono text-[var(--accent2)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">
                            {order.trackingNumber && order.trackingNumber !== 'Chưa có' && order.trackingNumber !== 'Không xác định' ? order.trackingNumber : 'Chưa có'}
                          </td>
                          <td className="p-2.5 font-semibold border-b border-[rgba(255,255,255,0.05)] text-[var(--text2)] lg:max-w-0 lg:truncate" title={order.trackingInfoDescription || ''}>
                            {order.trackingInfoDescription || '—'}
                          </td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">—</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap lg:truncate" title={order.shippingName || ''}>{order.shippingName || '—'}</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">{order.shippingPhone || '—'}</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] lg:max-w-0 lg:truncate" title={order.shippingAddress || ''}>{order.shippingAddress || '—'}</td>
                          <td className="p-2.5 text-[var(--orange)] font-bold text-[13px] border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">
                            {order.products && order.products.length > 0 
                              ? (() => {
                                  const total = order.products.reduce((sum, p) => sum + (p.rawPrice || 0), 0);
                                  return formatPrice(total);
                                })()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </>
          )}

          {/* SPX Panel */}
          <div id="spx-panel" className="hidden mt-1.5">
            {/* SPX panel will be rendered here */}
          </div>

          {/* History Section */}
          <div id="history-section" className="hidden mt-5">
            {/* History will be rendered here */}
          </div>
        </main>

        <footer className="text-center py-3.5 text-[var(--text3)] text-[9px] border-t border-[var(--card-border)]">
          TrackShopee © 2026
        </footer>
      </div>
    </div>
  );
}
