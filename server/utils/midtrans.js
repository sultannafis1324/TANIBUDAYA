import midtransClient from 'midtrans-client';

// Initialize Snap API
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Initialize Core API (untuk check status)
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

/**
 * Create Midtrans Snap Transaction
 */
export const createSnapTransaction = async (pesanan, pembeli, metodePembayaran) => {
  try {
    const orderId = pesanan.kode_pesanan;
    const grossAmount = Math.round(pesanan.total_bayar);

    // Map metode pembayaran ke enabled_payments Midtrans
    let enabledPayments = [];
    if (metodePembayaran === 'card') {
      enabledPayments = ['credit_card'];
    } else if (metodePembayaran === 'qris') {
      enabledPayments = process.env.MIDTRANS_IS_PRODUCTION === 'true' 
        ? ['qris'] 
        : ['gopay']; // sandbox tidak support QRIS
    } else if (metodePembayaran === 'transfer') {
      enabledPayments = ['bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va', 'other_va'];
    } else if (metodePembayaran === 'ewallet') {
      if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
        enabledPayments = ['gopay', 'shopeepay', 'qris', 'dana', 'linkaja', 'ovo'];
      } else {
        enabledPayments = ['gopay', 'shopeepay', 'dana', 'linkaja', 'ovo'];
      }
    }

    // Build item details
    const itemDetails = pesanan.items.map(item => ({
      id: item.id_produk.toString(),
      price: Math.round(item.harga_satuan),
      quantity: item.jumlah,
      name: item.nama_produk.substring(0, 50) // Midtrans limit 50 char
    }));

    // Add ongkir if exists
    if (pesanan.ongkir > 0) {
      itemDetails.push({
        id: 'ONGKIR',
        price: Math.round(pesanan.ongkir),
        quantity: 1,
        name: 'Ongkos Kirim'
      });
    }

    // Add biaya admin if exists
    if (pesanan.biaya_admin > 0) {
      itemDetails.push({
        id: 'ADMIN_FEE',
        price: Math.round(pesanan.biaya_admin),
        quantity: 1,
        name: 'Biaya Admin'
      });
    }

    // Add discount as negative price if exists
    if (pesanan.diskon > 0) {
      itemDetails.push({
        id: 'DISCOUNT',
        price: -Math.round(pesanan.diskon),
        quantity: 1,
        name: 'Diskon'
      });
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: itemDetails,
      customer_details: {
        first_name: pembeli.nama_lengkap || 'Customer',
        email: pembeli.email || 'customer@tanibudaya.com',
        phone: pembeli.no_telepon || '082100000000'
      },
      enabled_payments: enabledPayments,
      expiry: {
        duration: metodePembayaran === 'qris' ? 15 : 24,
        unit: metodePembayaran === 'qris' ? 'minutes' : 'hours'
      }
    };

    console.log('📤 Creating Midtrans Snap with params:', JSON.stringify(parameter, null, 2));

    const transaction = await snap.createTransaction(parameter);
    
    console.log('✅ Midtrans Snap created:', {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

    return {
      snap_token: transaction.token,
      payment_url: transaction.redirect_url,
      order_id: orderId
    };

  } catch (error) {
    console.error('❌ Midtrans Snap Error:', error.message);
    throw new Error(`Failed to create Midtrans transaction: ${error.message}`);
  }
};

/**
 * Check Transaction Status from Midtrans
 */
export const checkTransactionStatus = async (orderId) => {
  try {
    console.log('🔍 Checking status for order:', orderId);
    
    const statusResponse = await coreApi.transaction.status(orderId);
    
    console.log('✅ Status response:', JSON.stringify(statusResponse, null, 2));

    return {
      transaction_status: statusResponse.transaction_status,
      fraud_status: statusResponse.fraud_status || 'accept',
      payment_type: statusResponse.payment_type,
      transaction_id: statusResponse.transaction_id,
      gross_amount: statusResponse.gross_amount,
      settlement_time: statusResponse.settlement_time,
      expiry_time: statusResponse.expiry_time,
      va_numbers: statusResponse.va_numbers, // untuk VA
      acquirer: statusResponse.acquirer, // untuk e-wallet
      raw_response: statusResponse
    };

  } catch (error) {
    console.error('❌ Midtrans Status Check Error:', error.message);
    
    // Jika 404, berarti order tidak ditemukan atau sudah expired
    if (error.httpStatusCode === 404) {
      return {
        transaction_status: 'expired',
        error: 'Transaction not found or expired'
      };
    }
    
    throw new Error(`Failed to check transaction status: ${error.message}`);
  }
};

/**
 * Cancel Transaction
 */
export const cancelTransaction = async (orderId) => {
  try {
    console.log('🚫 Cancelling order:', orderId);
    
    const response = await coreApi.transaction.cancel(orderId);
    
    console.log('✅ Cancellation response:', response);
    
    return response;
  } catch (error) {
    console.error('❌ Midtrans Cancel Error:', error.message);
    // Don't throw error, just log it
    return null;
  }
};

/**
 * Extract Payment Channel from Midtrans Response
 */
export const extractPaymentChannel = (paymentType, statusResponse) => {
  if (!paymentType) return 'unknown';

  // Check acquirer first for e-wallets
  const acquirer = statusResponse.acquirer?.toLowerCase() || '';
  
  // E-Wallet Detection
  const ewalletMap = {
    'gopay': 'GoPay',
    'shopeepay': 'ShopeePay',
    'dana': 'DANA',
    'ovo': 'OVO',
    'linkaja': 'LinkAja'
  };
  
  if (ewalletMap[acquirer] || ewalletMap[paymentType]) {
    return ewalletMap[acquirer] || ewalletMap[paymentType];
  }

  // Bank Transfer / VA
  const channelMap = {
    'credit_card': 'Credit Card',
    'bank_transfer': 'Bank Transfer',
    'bca_va': 'BCA Virtual Account',
    'bni_va': 'BNI Virtual Account',
    'bri_va': 'BRI Virtual Account',
    'echannel': 'Mandiri Bill Payment',
    'permata_va': 'Permata Virtual Account',
    'other_va': 'Other Bank VA',
    'qris': 'QRIS'
  };

  let channel = channelMap[paymentType] || paymentType;

  // Extract specific bank from va_numbers
  if (paymentType === 'bank_transfer' && statusResponse.va_numbers?.length > 0) {
    const bankCode = statusResponse.va_numbers[0].bank?.toLowerCase();
    const bankNames = {
      'bca': 'BCA Virtual Account',
      'bni': 'BNI Virtual Account',
      'bri': 'BRI Virtual Account',
      'mandiri': 'Mandiri Bill Payment',
      'permata': 'Permata Virtual Account'
    };
    channel = bankNames[bankCode] || `${bankCode?.toUpperCase()} Virtual Account`;
  }

  return channel;
};

export default { 
  createSnapTransaction, 
  checkTransactionStatus, 
  cancelTransaction,
  extractPaymentChannel 
};