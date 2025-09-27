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

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
//
//    @Override
//    public VNPayResponse createVNPayPayment(Long orderId, PaymentRequest paymentRequest) {
//        Order order = orderRepository.findById(orderId)
//                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
//
//        // Create payment record
//        Payment payment = Payment.builder()
//                .order(order)
//                .amount(order.getTotalAmount())
//                .method(Payment.PaymentMethod.VNPAY)
//                .status(Payment.PaymentStatus.PENDING)
//                .build();
//
//        paymentRepository.save(payment);
//
//        // Generate VNPay payment URL (simplified implementation)
//        String paymentUrl = generateVNPayUrl(order, payment);
//
//        return VNPayResponse.builder()
//                .paymentUrl(paymentUrl)
//                .orderId(orderId)
//                .amount(order.getTotalAmount())
//                .build();
//    }
//
//    @Override
//    public PaymentResponse processVNPayReturn(Map<String, String> vnpParams) {
//        // Process VNPay return parameters (simplified implementation)
//        String orderId = vnpParams.get("vnp_TxnRef");
//        String responseCode = vnpParams.get("vnp_ResponseCode");
//
//        Order order = orderRepository.findById(Long.parseLong(orderId))
//                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
//
//        Payment payment = paymentRepository.findByOrder(order)
//                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
//
//        if ("00".equals(responseCode)) {
//            // Payment successful
//            payment.setStatus(Payment.PaymentStatus.COMPLETED);
//            payment.setTransactionId(vnpParams.get("vnp_TransactionNo"));
//            payment.setCompletedAt(LocalDateTime.now());
//
//            // Update order status
//            order.setPaymentStatus(Order.PaymentStatus.PAID);
//            order.setStatus(Order.OrderStatus.PAID);
//        } else {
//            // Payment failed
//            payment.setStatus(Payment.PaymentStatus.FAILED);
//            order.setPaymentStatus(Order.PaymentStatus.FAILED);
//        }
//
//        paymentRepository.save(payment);
//        orderRepository.save(order);
//
//        return mapToPaymentResponse(payment);
//    }
//
//    @Override
//    @Transactional(readOnly = true)
//    public PaymentResponse getPaymentByOrderId(Long orderId) {
//        Order order = orderRepository.findById(orderId)
//                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
//
//        Payment payment = paymentRepository.findByOrder(order)
//                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
//
//        return mapToPaymentResponse(payment);
//    }
//
//    private String generateVNPayUrl(Order order, Payment payment) {
//        // Simplified VNPay URL generation
//        // In real implementation, this would include proper VNPay integration
//        return "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=" +
//               order.getTotalAmount().multiply(BigDecimal.valueOf(100)) +
//               "&vnp_TxnRef=" + order.getId();
//    }
//
//    private PaymentResponse mapToPaymentResponse(Payment payment) {
//        return PaymentResponse.builder()
//                .id(payment.getId())
//                .orderId(payment.getOrder().getId())
//                .amount(payment.getAmount())
//                .method(payment.getMethod().name())
//                .status(payment.getStatus().name())
//                .transactionId(payment.getTransactionId())
//                .createdAt(payment.getCreatedAt())
//                .completedAt(payment.getCompletedAt())
//                .build();
//    }
}