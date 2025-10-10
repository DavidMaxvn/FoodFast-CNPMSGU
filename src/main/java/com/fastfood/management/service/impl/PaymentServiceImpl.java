package com.fastfood.management.service.impl;

import com.fastfood.management.dto.request.PaymentRequest;
import com.fastfood.management.dto.response.PaymentResponse;
import com.fastfood.management.dto.response.VNPayResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.Payment;
import com.fastfood.management.exception.ResourceNotFoundException;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.PaymentRepository;
import com.fastfood.management.service.api.PaymentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Value("${vnpay.version}")
    private String vnpVersion;
    @Value("${vnpay.tmnCode}")
    private String vnpTmnCode;
    @Value("${vnpay.hashSecret}")
    private String vnpHashSecret;
    @Value("${vnpay.payUrl}")
    private String vnpPayUrl;
    @Value("${vnpay.returnUrl}")
    private String vnpDefaultReturnUrl;

    // Tạo thanh toán VNPay thật: lưu Payment và trả về URL sandbox để redirect
    @Override
    public VNPayResponse createVNPayPayment(Long orderId, PaymentRequest paymentRequest) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        String txnRef = "ORD-" + order.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);

        Payment payment = Payment.builder()
                .order(order)
                .provider("VNPAY")
                .amount(order.getTotalAmount())
                .transactionReference(txnRef)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        // Build tham số VNPay
        BigDecimal vnpAmount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)); // đơn vị VND * 100
        String returnUrl = (paymentRequest.getReturnUrl() != null && !paymentRequest.getReturnUrl().isBlank())
                ? paymentRequest.getReturnUrl()
                : vnpDefaultReturnUrl;
        String ipAddr = (paymentRequest.getIpAddress() != null && !paymentRequest.getIpAddress().isBlank())
                ? paymentRequest.getIpAddress() : "127.0.0.1";
        String locale = (paymentRequest.getLocale() != null && !paymentRequest.getLocale().isBlank())
                ? paymentRequest.getLocale() : "vn";

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String createDate = now.format(fmt);
        String expireDate = now.plusMinutes(15).format(fmt);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnpVersion);
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", vnpAmount.toBigInteger().toString());
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", ipAddr);
        vnpParams.put("vnp_Locale", locale);
        vnpParams.put("vnp_CreateDate", createDate);
        vnpParams.put("vnp_ExpireDate", expireDate);

        // Ký HMAC SHA512
        String hashData = buildHashData(vnpParams);
        String secureHash = hmacSHA512(vnpHashSecret, hashData);
        vnpParams.put("vnp_SecureHash", secureHash);
        vnpParams.put("vnp_SecureHashType", "HMACSHA512");

        String query = buildQueryString(vnpParams);
        String paymentUrl = vnpPayUrl + "?" + query;

        VNPayResponse res = new VNPayResponse();
        res.setPaymentUrl(paymentUrl);
        res.setTransactionReference(txnRef);
        return res;
    }

    // Xử lý callback VNPay: xác thực chữ ký và cập nhật trạng thái thanh toán/đơn hàng
    @Override
    public PaymentResponse processVNPayReturn(Map<String, String> vnpParams) {
        String txnRef = vnpParams.get("vnp_TxnRef");
        String responseCode = vnpParams.get("vnp_ResponseCode");
        String incomingHash = vnpParams.get("vnp_SecureHash");

        if (txnRef == null) {
            throw new ResourceNotFoundException("Missing vnp_TxnRef");
        }

        Payment payment = paymentRepository.findByTransactionReference(txnRef)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with txnRef: " + txnRef));
        Order order = payment.getOrder();

        // Xác thực chữ ký
        Map<String, String> verifyParams = new HashMap<>(vnpParams);
        verifyParams.remove("vnp_SecureHash");
        verifyParams.remove("vnp_SecureHashType");
        String hashData = buildHashData(verifyParams);
        String expectedHash = hmacSHA512(vnpHashSecret, hashData);
        boolean signatureOk = (incomingHash != null) && incomingHash.equalsIgnoreCase(expectedHash);

        // Lưu raw callback để audit
        String raw = vnpParams.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
        payment.setRawCallback(raw);

        if (signatureOk && "00".equals(responseCode)) {
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.CONFIRMED);
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            if (order.getPaymentStatus() != Order.PaymentStatus.PAID) {
                order.setPaymentStatus(Order.PaymentStatus.FAILED);
            }
        }
        paymentRepository.save(payment);
        orderRepository.save(order);

        return mapToPaymentResponse(payment);
    }

    // Map sang PaymentResponse tối giản
    private PaymentResponse mapToPaymentResponse(Payment payment) {
        PaymentResponse dto = new PaymentResponse();
        dto.setId(payment.getId());
        dto.setOrderId(payment.getOrder() != null ? payment.getOrder().getId() : null);
        dto.setProvider(payment.getProvider());
        dto.setAmount(payment.getAmount());
        dto.setTransactionReference(payment.getTransactionReference());
        dto.setStatus(payment.getStatus() != null ? payment.getStatus().name() : null);
        dto.setCreatedAt(payment.getCreatedAt());
        return dto;
    }

    // ======= Helpers =======
    private String buildHashData(Map<String, String> params) {
        return params.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                .sorted(Map.Entry.comparingByKey())
                .map(e -> urlEncode(e.getKey()) + "=" + urlEncode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String buildQueryString(Map<String, String> params) {
        return params.entrySet().stream()
                .filter(e -> e.getValue() != null)
                .sorted(Map.Entry.comparingByKey())
                .map(e -> urlEncode(e.getKey()) + "=" + urlEncode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String urlEncode(String s) {
        try {
            String encoded = URLEncoder.encode(s, StandardCharsets.UTF_8.toString());
            // VNPay khuyến nghị dùng percent-encoding, không dùng dấu '+' cho khoảng trắng
            return encoded.replace("+", "%20");
        } catch (Exception e) {
            return s;
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to compute HMAC SHA512", e);
        }
    }
    
    @Override
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        List<Payment> list = paymentRepository.findByOrderId(orderId);
        if (list == null || list.isEmpty()) {
            throw new ResourceNotFoundException("Payment not found for orderId: " + orderId);
        }
        // giả định lấy payment mới nhất theo createdAt nếu có nhiều
        Payment latest = list.stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .findFirst()
                .orElse(list.get(0));
        return mapToPaymentResponse(latest);
    }

    @Override
    public PaymentResponse createCODPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        // Tạo bản ghi thanh toán COD
        Payment payment = Payment.builder()
                .order(order)
                .provider("COD")
                .amount(order.getTotalAmount())
                .transactionReference("COD-" + order.getId() + "-" + UUID.randomUUID().toString().substring(0, 8))
                .status(Payment.PaymentStatus.COMPLETED)
                .build();
        paymentRepository.save(payment);

        // Cập nhật trạng thái thanh toán đơn hàng
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        return mapToPaymentResponse(payment);
    }
}