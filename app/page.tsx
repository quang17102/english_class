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
}

export default function HomePage() {
  const [cookieInput, setCookieInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, shipping: 0, done: 0, cancel: 0 });
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
        .select('order_id, tracking_number, tracking_info_description, status, shipping_name, shipping_phone, shipping_address, products')
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
    setOrders([]);

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

      if (allOrders.length > 0) {
        setOrders(allOrders);
        const newStats = calculateStats(allOrders);
        setStats(newStats);

        // Lưu toàn bộ trường vào bảng Supabase khi người dùng click Kiểm tra
        let saveMsg = `✅ Tìm thấy ${allOrders.length} đơn hàng`;
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
              saveMsg += ' · Đã lưu vào danh sách';
            }
          } catch (e: any) {
            console.error('Supabase save orders:', e);
            const isNetwork = (e?.message || '').includes('fetch');
            saveMsg += isNetwork
              ? ' (lưu DB lỗi: kiểm tra .env.local — NEXT_PUBLIC_SUPABASE_URL phải là https://<project-id>.supabase.co, sau đó restart dev server)'
              : ` (lưu DB lỗi: ${e?.message || 'Unknown'})`;
          }
        } else {
          saveMsg += ' (chưa cấu hình Supabase: đặt NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local)';
        }
        setInfo(saveMsg);
      } else {
        setInfo('✅ Không có đơn hàng nào');
        setOrders([]);
        setStats({ total: 0, shipping: 0, done: 0, cancel: 0 });
      }
    } catch (err: any) {
      // Don't set error if request was aborted
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      setError(err.message || 'Có lỗi xảy ra khi kiểm tra đơn hàng');
      setOrders([]);
      setStats({ total: 0, shipping: 0, done: 0, cancel: 0 });
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

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Aurora backgrounds */}
      <div className="aurora"></div>
      <div className="aurora aurora-2"></div>
      <div className="aurora aurora-3"></div>

      <div className="relative z-[1] flex-1 flex flex-col items-center">
        <Navbar />

        <main className="flex-1 w-full max-w-[900px] mx-auto px-3 sm:px-5 py-6 pb-15 flex flex-col">
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

              {/* Sheet View */}
              <div className="overflow-x-auto rounded-[14px] border border-[var(--card-border)] bg-[rgba(255,255,255,0.02)] mb-4">
                  <table className="w-full border-collapse text-xs min-w-[1800px]">
                    <thead>
                      <tr>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 left-0 z-[2] w-12 min-w-[3rem] whitespace-nowrap">STT</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 left-12 z-[3] w-20 min-w-[5rem] whitespace-nowrap shadow-[4px_0_6px_rgba(0,0,0,0.2)]">Thao tác</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">Mã đơn</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">MVĐ</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">Trạng thái</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">Shop</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">Người nhận</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">SĐT</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">Địa chỉ</th>
                        <th className="bg-gradient-to-br from-[#1565c0] to-[#1a73e8] text-white p-3 text-[11px] font-bold uppercase tracking-[0.5px] sticky top-0 z-[2] whitespace-nowrap">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={order.orderId || index} className="transition-all hover:bg-[rgba(124,92,252,0.06)] even:bg-[rgba(255,255,255,0.018)] group">
                          <td className="p-2.5 text-center text-[var(--text3)] font-semibold border-b border-[rgba(255,255,255,0.05)] sticky left-0 z-[1] w-12 min-w-[3rem] bg-[var(--bg)] group-even:bg-[rgba(255,255,255,0.018)] group-hover:bg-[rgba(124,92,252,0.06)] shadow-[4px_0_6px_rgba(0,0,0,0.08)]">{index + 1}</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap sticky left-12 z-[1] w-20 min-w-[5rem] bg-[var(--bg)] group-even:bg-[rgba(255,255,255,0.018)] group-hover:bg-[rgba(124,92,252,0.06)] shadow-[4px_0_6px_rgba(0,0,0,0.08)]">
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.orderId)}
                              className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-[rgba(248,113,113,0.15)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] hover:bg-[rgba(248,113,113,0.25)] transition-colors"
                            >
                              Xóa
                            </button>
                          </td>
                          <td className="p-2.5 font-mono text-[var(--accent2)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">{order.orderId || '—'}</td>
                          <td className="p-2.5 font-mono text-[var(--accent2)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">
                            {order.trackingNumber && order.trackingNumber !== 'Chưa có' && order.trackingNumber !== 'Không xác định' ? order.trackingNumber : 'Chưa có'}
                          </td>
                          <td className="p-2.5 font-semibold border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap text-[var(--text2)]">
                            {order.trackingInfoDescription || '—'}
                          </td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">—</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">{order.shippingName || '—'}</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] whitespace-nowrap">{order.shippingPhone || '—'}</td>
                          <td className="p-2.5 border-b border-[rgba(255,255,255,0.05)] max-w-[300px] min-w-[160px]">{order.shippingAddress || '—'}</td>
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
