package com.carcarehome.backend.state;

import com.carcarehome.backend.entity.Booking;

class PendingState implements BookingState {
    @Override
    public void next(Booking booking) {
        booking.setStatus("SUCCESS");
    }
    @Override
    public void cancel(Booking booking) {
        booking.setStatus("CANCEL");
        booking.getAssignedStaffs().clear();
    }
    @Override
    public String getStatusName() { return "PENDING"; }
}

class SuccessState implements BookingState {
    @Override
    public void next(Booking booking) {
        booking.setStatus("IN_PROGRESS");
    }
    @Override
    public void cancel(Booking booking) {
        booking.setStatus("CANCEL");
        booking.getAssignedStaffs().clear();
    }
    @Override
    public void reject(Booking booking) {
        booking.setStatus("STAFF_REJECT");
        booking.getAssignedStaffs().clear();
    }
    @Override
    public String getStatusName() { return "SUCCESS"; }
}

class InProgressState implements BookingState {
    @Override
    public void next(Booking booking) {
        // Sau khi KTV hoàn thành → chuyển sang chờ thanh toán cuối
        // Nếu đã thanh toán đủ rồi (MoMo trả hết) thì vào thẳng COMPLETED
        if ("PAID_FULL".equals(booking.getPaymentStatus())) {
            booking.setStatus("COMPLETED");
            booking.setCompletedAt(java.time.LocalDateTime.now());
        } else {
            booking.setStatus("AWAITING_FINAL_PAYMENT");
        }
    }
    @Override
    public void cancel(Booking booking) {
        booking.setStatus("CANCEL");
        booking.getAssignedStaffs().clear();
    }
    @Override
    public String getStatusName() { return "IN_PROGRESS"; }
}

class AwaitingFinalPaymentState implements BookingState {
    @Override
    public void next(Booking booking) {
        // Chỉ cho phép chuyển sang COMPLETED khi đã thanh toán đủ
        if (!"PAID_FULL".equals(booking.getPaymentStatus())) {
            throw new IllegalStateException("Chưa thanh toán đủ. Vui lòng thanh toán trước khi hoàn tất đơn hàng.");
        }
        booking.setStatus("COMPLETED");
        booking.setCompletedAt(java.time.LocalDateTime.now());
    }
    @Override
    public void cancel(Booking booking) {
        booking.setStatus("CANCEL");
        booking.getAssignedStaffs().clear();
    }
    @Override
    public String getStatusName() { return "AWAITING_FINAL_PAYMENT"; }
}

class FinalState implements BookingState {
    @Override public void next(Booking booking) { /* Already final */ }
    @Override public void cancel(Booking booking) { /* Already final */ }
    @Override public String getStatusName() { return "COMPLETED/CANCEL"; }
}

class StaffRejectState implements BookingState {
    @Override
    public void next(Booking booking) {
        booking.setStatus("SUCCESS");
    }
    @Override
    public void cancel(Booking booking) {
        booking.setStatus("CANCEL");
        booking.getAssignedStaffs().clear();
    }
    @Override
    public String getStatusName() { return "STAFF_REJECT"; }
}
