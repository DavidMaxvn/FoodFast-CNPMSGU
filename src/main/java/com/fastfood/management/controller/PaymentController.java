package com.fastfood.management.controller;

import com.fastfood.management.dto.request.PaymentRequest;
import com.fastfood.management.dto.response.PaymentResponse;
import com.fastfood.management.dto.response.VNPayResponse;
import com.fastfood.management.service.api.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
//
//    @PostMapping("/vnpay/{orderId}")
//    public ResponseEntity<VNPayResponse> createVNPayPayment(
//            @PathVariable Long orderId,
//            @Valid @RequestBody PaymentRequest paymentRequest) {
//        VNPayResponse response = paymentService.createVNPayPayment(orderId, paymentRequest);
//        return ResponseEntity.ok(response);
//    }
//
//    @GetMapping("/vnpay/return")
//    public ResponseEntity<PaymentResponse> processVNPayReturn(@RequestParam Map<String, String> vnpParams) {
//        PaymentResponse response = paymentService.processVNPayReturn(vnpParams);
//        return ResponseEntity.ok(response);
//    }
//
//    @GetMapping("/order/{orderId}")
//    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable Long orderId) {
//        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
//        return ResponseEntity.ok(response);
//    }
}