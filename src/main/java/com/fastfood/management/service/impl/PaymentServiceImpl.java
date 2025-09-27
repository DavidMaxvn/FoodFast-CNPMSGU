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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    // Tạo thanh toán VNPay cơ bản: lưu Payment và trả về URL giả lập
    @Override
    public VNPayResponse createVNPayPayment(Long orderId, PaymentRequest paymentRequest) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Sinh mã tham chiếu giao dịch (giả lập)
        String txnRef = "ORD-" + order.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);

        // Tạo bản ghi thanh toán
        Payment payment = Payment.builder()
                .order(order)
                .provider("VNPAY")
                .amount(order.getTotalAmount())
                .transactionReference(txnRef)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        // URL VNPay giả lập (chỉ cần chứa txnRef, amount, returnUrl)
        String paymentUrl = generateVNPayUrl(order.getTotalAmount(), txnRef, paymentRequest.getReturnUrl());

        VNPayResponse res = new VNPayResponse();
        res.setPaymentUrl(paymentUrl);
        res.setTransactionReference(txnRef);
        return res;
    }

    // Xử lý callback VNPay cơ bản: dựa vào response code
    @Override
    public PaymentResponse processVNPayReturn(Map<String, String> vnpParams) {
        String txnRef = vnpParams.get("vnp_TxnRef");
        String responseCode = vnpParams.get("vnp_ResponseCode");

        Payment payment = paymentRepository.findByTransactionReference(txnRef)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with txnRef: " + txnRef));
        Order order = payment.getOrder();

        if ("00".equals(responseCode)) {
            // Thành công
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.PAID);
        } else {
            // Thất bại
            payment.setStatus(Payment.PaymentStatus.FAILED);
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
        }
        paymentRepository.save(payment);
        orderRepository.save(order);

        return mapToPaymentResponse(payment);
    }

    // Lấy payment theo orderId
    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        // Lấy payment mới nhất của order (đơn giản: lấy theo orderId và chọn phần tử đầu nếu có)
        return paymentRepository.findByOrderId(orderId).stream()
                .findFirst()
                .map(this::mapToPaymentResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
    }

    // Hàm tiện ích tạo URL VNPay giả lập
    private String generateVNPayUrl(BigDecimal amount, String txnRef, String returnUrl) {
        BigDecimal vnpAmount = amount.multiply(BigDecimal.valueOf(100));
        String base = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        return base + "?vnp_Amount=" + vnpAmount + "&vnp_TxnRef=" + txnRef + "&vnp_ReturnUrl=" + returnUrl;
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
}