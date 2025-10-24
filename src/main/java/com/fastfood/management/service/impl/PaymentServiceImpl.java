package com.fastfood.management.service.impl;

import com.fastfood.management.config.VNPayConfig;
import com.fastfood.management.dto.request.PaymentRequest;
import com.fastfood.management.dto.response.PaymentResponse;
import com.fastfood.management.dto.response.VNPayResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.Payment;
import com.fastfood.management.exception.ResourceNotFoundException;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.PaymentRepository;
import com.fastfood.management.service.api.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utils.VNPayUtils;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final VNPayConfig vnPayConfig;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public VNPayResponse createVNPayPayment(Long orderId, PaymentRequest paymentRequest) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != Order.OrderStatus.CREATED) {
            throw new IllegalStateException("Order is not in CREATED status");
        }
        if (order.getPaymentMethod() != Order.PaymentMethod.VNPAY) {
            throw new IllegalStateException("Payment method is not VNPay");
        }

        Map<String, String> vnpParams = new HashMap<>(vnPayConfig.getVNPayConfig());
        String txnRef = vnpParams.get("vnp_TxnRef");

        BigDecimal amount = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        vnpParams.put("vnp_OrderInfo", String.valueOf(order.getId()));
        if (paymentRequest.getIpAddress() != null) {
            vnpParams.put("vnp_IpAddr", paymentRequest.getIpAddress());
        }
        if (paymentRequest.getLocale() != null && !paymentRequest.getLocale().isEmpty()) {
            vnpParams.put("vnp_Locale", paymentRequest.getLocale());
        }
        if (paymentRequest.getReturnUrl() != null && !paymentRequest.getReturnUrl().isEmpty()) {
            vnpParams.put("vnp_ReturnUrl", paymentRequest.getReturnUrl());
        }

        String hashData = VNPayUtils.generateQueryUrl(vnpParams, false);
        String queryUrl = VNPayUtils.generateQueryUrl(vnpParams, true);
        String vnpSecureHash = VNPayUtils.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData);
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnpSecureHash;

        // Upsert Payment record for VNPay
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        Optional<Payment> existingVnpay = payments.stream()
                .filter(p -> "VNPAY".equalsIgnoreCase(p.getProvider()))
                .findFirst();
        Payment payment = existingVnpay.orElseGet(() -> Payment.builder()
                .order(order)
                .provider("VNPAY")
                .amount(order.getTotalAmount())
                .status(Payment.PaymentStatus.PENDING)
                .build());
        payment.setTransactionReference(txnRef);
        paymentRepository.save(payment);

        VNPayResponse response = new VNPayResponse();
        response.setPaymentUrl(paymentUrl);
        response.setTransactionReference(txnRef);
        return response;
    }

    @Override
    public PaymentResponse processVNPayReturn(Map<String, String> vnpParams) {
        if (vnpParams == null || vnpParams.isEmpty()) {
            throw new IllegalArgumentException("VNPay params required");
        }
        String providedHash = vnpParams.get("vnp_SecureHash");
        Map<String, String> toSign = vnpParams.entrySet().stream()
                .filter(e -> !"vnp_SecureHash".equals(e.getKey()) && !"vnp_SecureHashType".equals(e.getKey()))
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        String calculated = VNPayUtils.hmacSHA512(vnPayConfig.getVnpHashSecret(),
                toSign.entrySet().stream().sorted(Map.Entry.comparingByKey())
                        .map(e -> e.getKey() + "=" + e.getValue())
                        .collect(Collectors.joining("&")));
        if (providedHash == null || !providedHash.equalsIgnoreCase(calculated)) {
            throw new IllegalArgumentException("Invalid VNPay signature");
        }

        String responseCode = vnpParams.get("vnp_ResponseCode");
        String txnStatus = vnpParams.getOrDefault("vnp_TransactionStatus", "00");
        boolean success = "00".equals(responseCode) && "00".equals(txnStatus);

        String txnRef = vnpParams.get("vnp_TxnRef");
        Optional<Payment> paymentOpt = paymentRepository.findByTransactionReference(txnRef);
        if (paymentOpt.isEmpty()) {
            // Fallback by orderId if available
            Long orderId = null;
            try {
                orderId = Long.valueOf(vnpParams.getOrDefault("vnp_OrderInfo", "0"));
            } catch (Exception ignored) {}
            if (orderId != null && orderId > 0) {
                paymentOpt = paymentRepository.findByOrderId(orderId).stream()
                        .filter(p -> "VNPAY".equalsIgnoreCase(p.getProvider()))
                        .findFirst();
            }
        }
        Payment payment = paymentOpt.orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        Order order = payment.getOrder();

        payment.setRawCallback(new TreeMap<>(vnpParams).toString());
        if (success) {
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
        }
        paymentRepository.save(payment);
        orderRepository.save(order);

        return toResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        if (payments == null || payments.isEmpty()) {
            throw new ResourceNotFoundException("Payment not found");
        }
        Payment latest = payments.stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(Payment::getId, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .findFirst().get();
        return toResponse(latest);
    }

    @Override
    public PaymentResponse createCODPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getPaymentMethod() != Order.PaymentMethod.COD) {
            throw new IllegalStateException("Payment method is not COD");
        }
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        Optional<Payment> codOpt = payments.stream().filter(p -> "COD".equalsIgnoreCase(p.getProvider())).findFirst();
        Payment payment = codOpt.orElseGet(() -> Payment.builder()
                .order(order)
                .provider("COD")
                .amount(order.getTotalAmount())
                .status(Payment.PaymentStatus.PENDING)
                .transactionReference("COD-" + order.getId())
                .build());
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        paymentRepository.save(payment);

        order.setPaymentStatus(Order.PaymentStatus.PAID);
        orderRepository.save(order);
        return toResponse(payment);
    }

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse resp = new PaymentResponse();
        resp.setId(payment.getId());
        resp.setOrderId(payment.getOrder().getId());
        resp.setProvider(payment.getProvider());
        resp.setAmount(payment.getAmount());
        resp.setTransactionReference(payment.getTransactionReference());
        resp.setStatus(payment.getStatus().name());
        resp.setCreatedAt(payment.getCreatedAt());
        return resp;
    }
}