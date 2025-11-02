package com.fastfood.management.repository;

import com.fastfood.management.entity.StoreStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreStaffRepository extends JpaRepository<StoreStaff, Long> {
    List<StoreStaff> findByUserIdAndStatus(Long userId, StoreStaff.StaffStatus status);
}