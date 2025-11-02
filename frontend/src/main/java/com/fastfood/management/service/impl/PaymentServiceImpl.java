package com.fastfood.management.service.impl;

import com.fastfood.management.config.VNPayConfig;
import com.fastfood.management.dto.request.PaymentRequest;
import com.fastfood.management.dto.response.PaymentResponse;
import com.fastfood.management.dto.response.VNPayResponse;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.Payment;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.PaymentRepository;
import com.fastfood.management.service.api.PaymentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utils.VNPayUtils;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

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
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

        if (order.getPaymentMethod() != Order.PaymentMethod.VNPAY) {
            throw new IllegalStateException("Order is not set to VNPay payment method");
        }

        // Find existing pending payment or create one
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        Payment payment = payments.stream()
                .filter(p -> "VNPAY".equals(p.getProvider()))
                .findFirst()
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .order(order)
                        .provider("VNPAY")
                        .amount(order.getTotalAmount())
                        .transactionReference("ORD-" + order.getId())
                        .status(Payment.PaymentStatus.PENDING)
                        .build()));

        Map<String, String> vnpParams = vnPayConfig.getVNPayConfig();
        vnpParams.put("vnp_TxnRef", payment.getTransactionReference());
        vnpParams.put("vnp_Amount", toVnpAmount(payment.getAmount()));
        vnpParams.put("vnp_OrderInfo", String.valueOf(order.getId()));
        if (paymentRequest.getIpAddress() != null) {
            vnpParams.put("vnp_IpAddr", paymentRequest.getIpAddress());
        }
        if (paymentRequest.getReturnUrl() != null) {
            vnpParams.put("vnp_ReturnUrl", paymentRequest.getReturnUrl());
        }
        if (paymentRequest.getLocale() != null) {
            vnpParams.put("vnp_Locale", paymentRequest.getLocale());
        }

        String queryUrl = VNPayUtils.generateQueryUrl(vnpParams, true);
        String hashData = VNPayUtils.generateQueryUrl(vnpParams, false);
        String vnpSecureHash = VNPayUtils.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData);
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnpSecureHash;

        VNPayResponse response = new VNPayResponse();
        response.setPaymentUrl(paymentUrl);
        response.setTransactionReference(payment.getTransactionReference());
        return response;
    }

    @Override
    public PaymentResponse processVNPayReturn(Map<String, String> vnpParams) {
        String txnRef = vnpParams.get("vnp_TxnRef");
        String responseCode = vnpParams.get("vnp_ResponseCode");

        Payment payment = paymentRepository.findByTransactionReference(txnRef)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));
        Order order = payment.getOrder();

        boolean success = "00".equals(responseCode);
        payment.setStatus(success ? Payment.PaymentStatus.COMPLETED : Payment.PaymentStatus.FAILED);
        order.setPaymentStatus(success ? Order.PaymentStatus.PAID : Order.PaymentStatus.FAILED);

        // Save updates
        paymentRepository.save(payment);
        orderRepository.save(order);

        return toResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        if (payments.isEmpty()) {
            throw new EntityNotFoundException("No payments found for order");
        }
        Payment latest = payments.stream()
                .max(Comparator.comparing(p -> p.getCreatedAt()))
                .orElse(payments.get(0));
        return toResponse(latest);
    }

    @Override
    public PaymentResponse createCODPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

        // Create or update COD payment
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        Payment payment = payments.stream()
                .filter(p -> "COD".equals(p.getProvider()))
                .findFirst()
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .order(order)
                        .provider("COD")
                        .amount(order.getTotalAmount())
                        .transactionReference("COD-" + order.getId())
                        .status(Payment.PaymentStatus.PENDING)
                        .build()));

        // For basic COD, mark as completed immediately
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        paymentRepository.save(payment);
        orderRepository.save(order);

        return toResponse(payment);
    }

    private String toVnpAmount(BigDecimal amount) {
        // VNPay expects amount x100 (no decimals)
        return amount.multiply(BigDecimal.valueOf(100)).toBigInteger().toString();
    }

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse res = new PaymentResponse();
        res.setId(payment.getId());
        res.setOrderId(payment.getOrder().getId());
        res.setProvider(payment.getProvider());
        res.setAmount(payment.getAmount());
        res.setTransactionReference(payment.getTransactionReference());
        res.setStatus(payment.getStatus().name());
        res.setCreatedAt(payment.getCreatedAt());
        return res;
    }
}