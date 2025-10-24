package com.fastfood.management.config;

// Cấu hình bảo mật: bật xác thực JWT cho tất cả endpoint trừ /api/auth/**

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

import com.fastfood.management.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .cors().and()
      .csrf().disable()
      .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
      .authorizeHttpRequests()
       .requestMatchers("/auth/**").permitAll()
        // Error page should be publicly accessible to avoid 403 loops
        .requestMatchers(HttpMethod.GET, "/error").permitAll()
        // Public static resources (served via resource handler)
        .requestMatchers(HttpMethod.GET, "/images/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/images/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
        // File upload endpoints
        .requestMatchers(HttpMethod.POST, "/files/**").permitAll()
        // Public menu browsing endpoints
        .requestMatchers(HttpMethod.GET, "/menu/**").permitAll()
        // Admin menu management endpoints (temporarily allow for testing)
        .requestMatchers(HttpMethod.POST, "/menu/**").permitAll()
        .requestMatchers(HttpMethod.PUT, "/menu/**").permitAll()
        .requestMatchers(HttpMethod.DELETE, "/menu/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/public/**").permitAll()
        // Public store browsing endpoints
        .requestMatchers(HttpMethod.GET, "/stores").permitAll()
        .requestMatchers(HttpMethod.GET, "/stores/**").permitAll()
        // Cho phép VNPay tạo payment và trả về (callback) không cần JWT
        .requestMatchers(HttpMethod.POST, "/payments/vnpay/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/payments/vnpay/return").permitAll()
        .anyRequest().authenticated();

    // Thêm JWT filter trước UsernamePasswordAuthenticationFilter
    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Allow specific origins instead of wildcard to support credentials
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:8080"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true); // Enable credentials support
    configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
   }
}