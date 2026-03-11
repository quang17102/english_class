'use client';

import { useState, useEffect } from 'react';
import { supabase, Order, AccData } from '../../lib/supabase';

const STATUS_OPTIONS: Order['status'][] = ['chưa đặt', 'đã đặt', 'đang vận chuyển', 'thành công', 'đã hủy'];

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAccDetail, setShowAccDetail] = useState(false);
  const [currentAccId, setCurrentAccId] = useState<string | null>(null);
  const [accFormData, setAccFormData] = useState<AccData>({
    acc_content: '',
    cookie: '',
    mailpass: '',
  });
  const [copyAlert, setCopyAlert] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  
  const [formData, setFormData] = useState({
    customer_name: '',
    address: '',
    products: '',
    note: '',
    acc: '',
    mvd: '',
    order_time: '',
    status: 'chưa đặt' as Order['status'],
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!supabase) {
      setError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      setError('Lỗi khi tải danh sách đơn hàng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      address: '',
      products: '',
      note: '',
      acc: '',
      mvd: '',
      order_time: '',
      status: 'chưa đặt',
    });
    setEditingOrder(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  // Hàm parse ACC từ format: id|pass|phone|SPC_F=... để tách thành 3 field
  // acc_content: id|pass|phone|SPC_F=...
  // cookie: SPC_ST=...
  // mailpass: email|passmail
  const parseAccData = (accString: string): AccData | null => {
    if (!accString || !accString.trim()) return null;

    try {
      const fullString = accString.trim();
      
      // Tách acc_content: phần từ đầu đến trước SPC_ST
      let accContent = '';
      let cookie = '';
      let mailpass = '';

      // Tìm vị trí SPC_ST=
      const spcStIndex = fullString.indexOf('SPC_ST=');
      if (spcStIndex > 0) {
        // acc_content là phần từ đầu đến trước SPC_ST (bao gồm cả phần trước đó)
        accContent = fullString.substring(0, spcStIndex).trim();
        
        // Tìm phần cookie (SPC_ST=...)
        const afterSpcSt = fullString.substring(spcStIndex);
        // Tìm email để tách cookie và mailpass
        const emailMatch = afterSpcSt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)/);
        if (emailMatch && emailMatch.index !== undefined) {
          // cookie là phần từ SPC_ST= đến trước email
          cookie = afterSpcSt.substring(0, emailMatch.index).trim();
          
          // mailpass là phần từ email đến cuối
          const emailIndex = emailMatch.index;
          const emailPart = afterSpcSt.substring(emailIndex);
          // Tìm passmail sau email (phân tách bằng |)
          const mailpassMatch = emailPart.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)\|([^\s\t]+)/);
          if (mailpassMatch) {
            mailpass = `${mailpassMatch[1]}|${mailpassMatch[2]}`;
          } else {
            mailpass = emailPart.trim();
          }
        } else {
          // Không tìm thấy email, cookie là phần còn lại
          cookie = afterSpcSt.trim();
        }
      } else {
        // Không có SPC_ST, acc_content là toàn bộ chuỗi
        accContent = fullString;
      }

      return {
        acc_content: accContent || fullString,
        cookie: cookie || undefined,
        mailpass: mailpass || undefined,
      };
    } catch (error) {
      console.error('Error parsing ACC data:', error);
      return null;
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    // Format datetime-local input (YYYY-MM-DDTHH:mm)
    const orderTime = order.order_time 
      ? new Date(order.order_time).toISOString().slice(0, 16)
      : '';
    
    setFormData({
      customer_name: order.customer_name,
      address: order.address,
      products: order.products || '',
      note: order.note || '',
      acc: order.acc || '',
      mvd: order.mvd || '',
      order_time: orderTime,
      status: order.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.customer_name.trim()) {
      setError('Vui lòng nhập tên người đặt');
      return;
    }

    if (!formData.address.trim()) {
      setError('Vui lòng nhập địa chỉ');
      return;
    }

    if (!formData.products.trim()) {
      setError('Vui lòng nhập sản phẩm');
      return;
    }

    if (!supabase) {
      setError('Supabase chưa được cấu hình');
      return;
    }

    setLoading(true);
    try {
      const orderData: any = {
        customer_name: formData.customer_name.trim(),
        address: formData.address.trim(),
        products: formData.products.trim(),
        note: formData.note.trim() || null,
        acc: formData.acc.trim() || null,
        mvd: formData.mvd.trim() || null,
        status: formData.status,
      };

      if (editingOrder?.id) {
        // Update - giữ nguyên order_time hoặc cập nhật nếu có
        if (formData.order_time) {
          orderData.order_time = new Date(formData.order_time).toISOString();
        }
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', editingOrder.id);

        if (error) throw error;
        setSuccess('Đã cập nhật đơn hàng thành công!');

        // Nếu có ACC, tự động parse và cập nhật vào acc_data
        if (formData.acc && formData.acc.trim()) {
          const parsedAcc = parseAccData(formData.acc.trim());
          if (parsedAcc && parsedAcc.acc_content) {
            try {
              // Extract acc_id từ acc_content (phần đầu trước dấu |)
              const accId = parsedAcc.acc_content.split('|')[0]?.trim();
              if (!accId) return;

              // Kiểm tra xem acc_id đã tồn tại chưa bằng cách query acc_content
              const { data: allAccs, error: fetchError } = await supabase
                .from('acc_data')
                .select('id, acc_content');

              if (fetchError) {
                console.error('Error fetching ACC data:', fetchError);
                return;
              }

              // Tìm ACC có cùng acc_id (extract từ acc_content)
              const existingAcc = allAccs?.find(acc => {
                const existingAccId = acc.acc_content?.split('|')[0]?.trim();
                return existingAccId === accId;
              });

              if (existingAcc) {
                // Update nếu đã tồn tại
                const { error: accError } = await supabase
                  .from('acc_data')
                  .update(parsedAcc)
                  .eq('id', existingAcc.id);
                
                if (accError) {
                  console.error('Error updating ACC data:', accError);
                }
              } else {
                // Insert nếu chưa tồn tại
                const { error: accError } = await supabase
                  .from('acc_data')
                  .insert([parsedAcc]);
                
                if (accError) {
                  console.error('Error inserting ACC data:', accError);
                }
              }
            } catch (accErr) {
              console.error('Error processing ACC data:', accErr);
              // Không throw error để không ảnh hưởng đến việc update order
            }
          }
        }
      } else {
        // Create - tự động set order_time = ngày hiện tại
        orderData.order_time = new Date().toISOString();
        const { error } = await supabase
          .from('orders')
          .insert([orderData]);

        if (error) throw error;
        setSuccess('Đã thêm đơn hàng thành công!');

        // Nếu có ACC, tự động parse và thêm vào acc_data
        if (formData.acc && formData.acc.trim()) {
          const parsedAcc = parseAccData(formData.acc.trim());
          if (parsedAcc && parsedAcc.acc_content) {
            try {
              // Extract acc_id từ acc_content (phần đầu trước dấu |)
              const accId = parsedAcc.acc_content.split('|')[0]?.trim();
              if (!accId) return;

              // Kiểm tra xem acc_id đã tồn tại chưa bằng cách query acc_content
              const { data: allAccs, error: fetchError } = await supabase
                .from('acc_data')
                .select('id, acc_content');

              if (fetchError) {
                console.error('Error fetching ACC data:', fetchError);
                return;
              }

              // Tìm ACC có cùng acc_id (extract từ acc_content)
              const existingAcc = allAccs?.find(acc => {
                const existingAccId = acc.acc_content?.split('|')[0]?.trim();
                return existingAccId === accId;
              });

              if (existingAcc) {
                // Update nếu đã tồn tại
                const { error: accError } = await supabase
                  .from('acc_data')
                  .update(parsedAcc)
                  .eq('id', existingAcc.id);
                
                if (accError) {
                  console.error('Error updating ACC data:', accError);
                }
              } else {
                // Insert nếu chưa tồn tại
                const { error: accError } = await supabase
                  .from('acc_data')
                  .insert([parsedAcc]);
                
                if (accError) {
                  console.error('Error inserting ACC data:', accError);
                }
              }
            } catch (accErr) {
              console.error('Error processing ACC data:', accErr);
              // Không throw error để không ảnh hưởng đến việc tạo order
            }
          }
        }
      }

      resetForm();
      loadOrders();
    } catch (err: any) {
      setError('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const handleDeleteConfirm = async (id: string) => {
    setShowDeleteConfirm(null);

    if (!supabase) {
      setError('Supabase chưa được cấu hình');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Đã xóa đơn hàng thành công!');
      loadOrders();
    } catch (err: any) {
      setError('Lỗi khi xóa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusClass = (status: Order['status']) => {
    return `status-badge status-${status.replace(/\s+/g, '-')}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyAlert({ message: `Đã copy ${type} vào clipboard!`, visible: true });
      setTimeout(() => setCopyAlert({ message: '', visible: false }), 2000);
    } catch (err) {
      setCopyAlert({ message: 'Không thể copy vào clipboard', visible: true });
      setTimeout(() => setCopyAlert({ message: '', visible: false }), 2000);
    }
  };

  const handleAccDetailClick = async (accString: string) => {
    if (!accString || !accString.trim()) {
      setError('Không có thông tin ACC');
      return;
    }

    if (!supabase) {
      setError('Supabase chưa được cấu hình');
      return;
    }

    // Parse ACC để lấy acc_content và extract acc_id
    const parsedAcc = parseAccData(accString.trim());
    if (!parsedAcc || !parsedAcc.acc_content) {
      setError('Không thể parse thông tin ACC');
      return;
    }

    const accId = parsedAcc.acc_content.split('|')[0]?.trim();
    if (!accId) {
      setError('Không thể extract ID từ ACC');
      return;
    }

    setCurrentAccId(accId);
    setLoading(true);
    setError('');

    try {
      // Load ACC data từ database bằng cách tìm acc_content có cùng acc_id
      const { data: allAccs, error: fetchError } = await supabase
        .from('acc_data')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      // Tìm ACC có cùng acc_id (extract từ acc_content)
      const accData = allAccs?.find(acc => {
        const existingAccId = acc.acc_content?.split('|')[0]?.trim();
        return existingAccId === accId;
      });

      if (accData) {
        setAccFormData({
          acc_content: accData.acc_content || '',
          cookie: accData.cookie || '',
          mailpass: accData.mailpass || '',
        });
      } else {
        // Nếu chưa có trong database, dùng dữ liệu đã parse
        setAccFormData({
          acc_content: parsedAcc.acc_content || '',
          cookie: parsedAcc.cookie || '',
          mailpass: parsedAcc.mailpass || '',
        });
      }

      setShowAccDetail(true);
    } catch (err: any) {
      setError('Lỗi khi tải thông tin ACC: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!supabase) {
      setError('Supabase chưa được cấu hình');
      return;
    }

    if (!accFormData.acc_content) {
      setError('Vui lòng nhập ACC Content');
      return;
    }

    setLoading(true);
    try {
      // Extract acc_id từ acc_content
      const accId = accFormData.acc_content.split('|')[0]?.trim();
      if (!accId) {
        throw new Error('Không thể extract ID từ ACC Content');
      }

      // Kiểm tra xem acc_id đã tồn tại chưa bằng cách query acc_content
      const { data: allAccs, error: fetchError } = await supabase
        .from('acc_data')
        .select('id, acc_content');

      if (fetchError) {
        throw fetchError;
      }

      // Tìm ACC có cùng acc_id (extract từ acc_content)
      const existingAcc = allAccs?.find(acc => {
        const existingAccId = acc.acc_content?.split('|')[0]?.trim();
        return existingAccId === accId;
      });

      if (existingAcc) {
        // Update nếu đã tồn tại
        const { error: accError } = await supabase
          .from('acc_data')
          .update(accFormData)
          .eq('id', existingAcc.id);

        if (accError) throw accError;
        setSuccess('Đã cập nhật thông tin ACC thành công!');
      } else {
        // Insert nếu chưa tồn tại
        const { error: accError } = await supabase
          .from('acc_data')
          .insert([accFormData]);

        if (accError) throw accError;
        setSuccess('Đã thêm thông tin ACC thành công!');
      }

      // Reload orders để cập nhật
      loadOrders();
      setTimeout(() => {
        setShowAccDetail(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Copy Alert - Góc trái màn hình */}
      {copyAlert.visible && (
        <div className="fixed top-4 left-4 z-50 animate-slide-in-left">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[250px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{copyAlert.message}</span>
          </div>
        </div>
      )}

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Quản lý Đơn hàng
            </h1>
            <p className="text-gray-600 text-sm">
              Quản lý đơn hàng hiệu quả
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#ff6b35] text-white font-medium rounded-lg shadow-sm hover:bg-[#e55a2b] hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2"
          >
            <span className="mr-2">+</span>
            Thêm đơn hàng
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 shadow-sm">
            {success}
          </div>
        )}

        {/* Orders Table */}
        {loading && !showForm ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b35]"></div>
            <p className="mt-2">Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">
              Chưa có đơn hàng nào. Nhấn "Thêm đơn hàng" để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-[#fff5f2]">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                      Tên người đặt
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                      Trạng thái
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px] max-w-[200px]">
                      Địa chỉ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px] max-w-[180px]">
                      Sản phẩm
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[60px]">
                      ACC
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px] max-w-[150px]">
                      MVD
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px] max-w-[300px]">
                      Ghi chú
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[140px] whitespace-nowrap">
                      Ngày đặt
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={getStatusClass(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        <div 
                          className="truncate max-w-[200px] cursor-pointer hover:text-[#ff6b35] transition-colors" 
                          title={`${order.address} (Click để copy)`}
                          onClick={() => copyToClipboard(order.address, 'địa chỉ')}
                        >
                          {order.address.length > 20 ? `${order.address.substring(0, 20)}...` : order.address}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        <div 
                          className="truncate max-w-[180px] cursor-pointer hover:text-[#ff6b35] transition-colors" 
                          title={`${order.products || ''} (Click để copy)`}
                          onClick={() => order.products && copyToClipboard(order.products, 'sản phẩm')}
                        >
                          {order.products && order.products.length > 20 ? `${order.products.substring(0, 20)}...` : (order.products || '—')}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-center">
                        {order.acc ? (
                          <button
                            onClick={() => handleAccDetailClick(order.acc!)}
                            className="text-[#ff6b35] hover:text-[#e55a2b] transition-colors p-1 rounded hover:bg-orange-50 mx-auto"
                            title="Xem chi tiết ACC"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {order.mvd || '—'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        <div 
                          className="truncate max-w-[300px] cursor-help" 
                          title={order.note && order.note.length > 50 ? order.note : ''}
                        >
                          {order.note && order.note.length > 50 ? `${order.note.substring(0, 50)}...` : (order.note || '—')}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(order.order_time)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3 items-center justify-center">
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-[#3b82f6] hover:text-[#2563eb] transition-colors p-1.5 rounded hover:bg-blue-50"
                            title="Sửa đơn hàng"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order.id!)}
                            className="text-[#ef4444] hover:text-[#dc2626] transition-colors p-1.5 rounded hover:bg-red-50"
                            title="Xóa đơn hàng"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Order Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] w-full max-w-[560px] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col my-0 sm:my-4">
              {/* Header */}
              <div className="px-4 sm:px-8 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight mb-0.5">
                      {editingOrder ? 'Sửa đơn hàng' : 'Thêm đơn hàng'}
                    </h2>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
                  {/* Customer Information Group */}
                  <div className="space-y-2">
                    <div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-900 mb-1.5">
                            Tên người đặt <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="Nguyễn Văn A"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-900 mb-1.5">
                            Địa chỉ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="123 Đường ABC, Thành phố"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details Group */}
                  <div className="space-y-2">
                    <div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-900 mb-1.5">
                            Sản phẩm <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.products}
                            onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="Tên sản phẩm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-900 mb-1.5">
                            ACC
                          </label>
                          <input
                            type="text"
                            value={formData.acc}
                            onChange={(e) => setFormData({ ...formData, acc: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="Nhập ACC"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-900 mb-1.5">
                            MVD
                          </label>
                          <input
                            type="text"
                            value={formData.mvd}
                            onChange={(e) => setFormData({ ...formData, mvd: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="Nhập MVD"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-900 mb-1.5">
                            Ghi chú
                          </label>
                          <textarea
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all resize-none bg-white text-gray-900 placeholder:text-gray-400"
                            rows={3}
                            placeholder="Ghi chú thêm (tùy chọn)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Group */}
                  <div className="space-y-2">
                    <div>
                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1.5">
                          Trạng thái <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
                          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 cursor-pointer"
                          required
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-[#ff6b35] rounded-lg hover:bg-[#e55a2b] shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ff6b35]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang lưu...
                        </span>
                      ) : (
                        editingOrder ? 'Cập nhật' : 'Tạo đơn hàng'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ACC Detail Modal */}
        {showAccDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                  Chi tiết ACC
                </h2>
              </div>

              {/* Form */}
              <form onSubmit={handleAccSubmit} className="flex-1 overflow-y-auto">
                <div className="px-6 sm:px-8 py-6 space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1.5">
                        ACC Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={accFormData.acc_content}
                        onChange={(e) => setAccFormData({ ...accFormData, acc_content: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all resize-none bg-white text-gray-900 placeholder:text-gray-400"
                        rows={3}
                        placeholder="102u39y7lu|7sz^&fAbkDnKeW|0777820559|SPC_F=69RGjue4XhMErBV56l7EdBhqq2ib9OE9"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1.5">
                        Cookie
                      </label>
                      <textarea
                        value={accFormData.cookie}
                        onChange={(e) => setAccFormData({ ...accFormData, cookie: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all resize-none bg-white text-gray-900 placeholder:text-gray-400"
                        rows={4}
                        placeholder="SPC_ST=.Y0N4RFNvNHBxdGt6MUpjMguQ7UijkaDKJ6N7kyKsTsV/op7AoeUTOJvf32waJZPftbkJtAtFRsIMHoaVb24EX4wrZodEBxTzRqL5nSfXERqOTX2PRjLGXr4TaU33/whZiFTXn0OQl/QL6L3CgQ7pr9TAx0IQ0+BukkzzPuOMPxjllpfkIG/eqFSd8FERYBnTHJ+tJJcOP2drJ3qoe/Crt4t7C4WBbns830IiA0UP13kIO4TW/XsUBx9ZeSXSeKrmDLt7hQtTeO8u128IKuSMpZEvQGk78JuM//EfyhbZsdM="
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1.5">
                        Mailpass
                      </label>
                      <input
                        type="text"
                        value={accFormData.mailpass}
                        onChange={(e) => setAccFormData({ ...accFormData, mailpass: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all bg-white text-gray-900 placeholder:text-gray-400"
                        placeholder="nakeiras837@mariathecuties.indevs.in|O240JKbSOc0d"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccDetail(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#ff6b35] rounded-lg shadow-sm hover:bg-[#e55a2b] hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Xác nhận xóa
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                  className="flex-1 px-6 py-3 bg-[#ef4444] text-white font-medium rounded-lg shadow-sm hover:bg-[#dc2626] hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ef4444] focus:ring-offset-2"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
