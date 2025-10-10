package com.fastfood.management.service.impl;

import com.fastfood.management.dto.request.RegisterRequest;
import com.fastfood.management.dto.response.JwtResponse;
import com.fastfood.management.dto.response.UserResponse;
import com.fastfood.management.entity.Role;
import com.fastfood.management.entity.User;
import com.fastfood.management.exception.ResourceNotFoundException;
import com.fastfood.management.mapper.UserMapper;
import com.fastfood.management.repository.RoleRepository;
import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.service.api.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
//    private final RoleRepository roleRepository;
//    private final UserMapper userMapper;
//    private final PasswordEncoder passwordEncoder;
//
//    @Override
//    public UserResponse registerUser(RegisterRequest registerRequest) {
//        // Check if username already exists
//        if (userRepository.existsByUsername(registerRequest.getUsername())) {
//            throw new IllegalArgumentException("Username already exists");
//        }
//
//        // Check if email already exists
//        if (userRepository.existsByEmail(registerRequest.getEmail())) {
//            throw new IllegalArgumentException("Email already exists");
//        }
//
//        // Create new user
//        User user = User.builder()
//                .username(registerRequest.getUsername())
//                .email(registerRequest.getEmail())
//                .password(passwordEncoder.encode(registerRequest.getPassword()))
//                .fullName(registerRequest.getFullName())
//                .phoneNumber(registerRequest.getPhoneNumber())
//                .isActive(true)
//                .build();
//
//        // Assign default role (CUSTOMER)
//        Role customerRole = roleRepository.findByCode("CUSTOMER")
//                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER not found"));
//
//        Set<Role> roles = new HashSet<>();
//        roles.add(customerRole);
//        user.setRoles(roles);
//
//        User savedUser = userRepository.save(user);
//        return userMapper.toResponse(savedUser);
//    }
//
//    @Override
//    public JwtResponse authenticateUser(String username, String password) {
//        // This is a simplified implementation
//        // In real application, this would be handled by Spring Security
//        User user = userRepository.findByUsername(username)
//                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
//
//        if (!passwordEncoder.matches(password, user.getPassword())) {
//            throw new IllegalArgumentException("Invalid credentials");
//        }
//
//        if (!user.isActive()) {
//            throw new IllegalArgumentException("User account is disabled");
//        }
//
//        // Generate JWT token (simplified)
//        String token = generateJwtToken(user);
//
//        Set<String> roles = user.getRoles().stream()
//                .map(Role::getCode)
//                .collect(Collectors.toSet());
//
//        return JwtResponse.builder()
//                .token(token)
//                .type("Bearer")
//                .userId(user.getId())
//                .username(user.getUsername())
//                .email(user.getEmail())
//                .roles(roles)
//                .build();
//    }
//
//    @Override
//    @Transactional(readOnly = true)
//    public UserResponse getUserById(Long id) {
//        User user = userRepository.findById(id)
//                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
//        return userMapper.toResponse(user);
//    }
//
//    @Override
//    @Transactional(readOnly = true)
//    public UserResponse getUserByUsername(String username) {
//        User user = userRepository.findByUsername(username)
//                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
//        return userMapper.toResponse(user);
//    }
//
//    @Override
//    @Transactional(readOnly = true)
//    public List<UserResponse> getAllUsers() {
//        List<User> users = userRepository.findAll();
//        return users.stream()
//                .map(userMapper::toResponse)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public UserResponse updateUser(Long id, UserResponse userResponse) {
//        User user = userRepository.findById(id)
//                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
//
//        // Update user fields
//        if (userResponse.getFullName() != null) {
//            user.setFullName(userResponse.getFullName());
//        }
//        if (userResponse.getPhoneNumber() != null) {
//            user.setPhoneNumber(userResponse.getPhoneNumber());
//        }
//        if (userResponse.getEmail() != null) {
//            user.setEmail(userResponse.getEmail());
//        }
//
//        User updatedUser = userRepository.save(user);
//        return userMapper.toResponse(updatedUser);
//    }
//
//    @Override
//    public void deleteUser(Long id) {
//        User user = userRepository.findById(id)
//                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
//
//        // Soft delete by setting active to false
//        user.setActive(false);
//        userRepository.save(user);
//    }
//
//    @Override
//    public User getCurrentUser() {
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        if (authentication == null || !authentication.isAuthenticated()) {
//            throw new IllegalStateException("No authenticated user found");
//        }
//
//        String username = authentication.getName();
//        return userRepository.findByUsernameAndIsActiveTrue(username)
//                .orElseThrow(() -> new EntityNotFoundException("User not found"));
//    }
//
//    private String generateJwtToken(User user) {
//        // Simplified JWT token generation
//        // In real implementation, this would use proper JWT library
//        return "jwt-token-for-" + user.getUsername() + "-" + System.currentTimeMillis();
//    }
}