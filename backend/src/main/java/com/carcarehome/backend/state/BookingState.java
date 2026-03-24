package com.carcarehome.backend.state;

import com.carcarehome.backend.entity.Booking;

public interface BookingState {
    void next(Booking booking);
    void cancel(Booking booking);
    default void reject(Booking booking) {
        throw new IllegalStateException("Không thể từ chối ở trạng thái hiện tại");
    }
    String getStatusName();
}
