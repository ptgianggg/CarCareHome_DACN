package com.carcarehome.backend.state;

import com.carcarehome.backend.entity.Booking;

public interface BookingState {
    void next(Booking booking);
    void cancel(Booking booking);
    String getStatusName();
}
