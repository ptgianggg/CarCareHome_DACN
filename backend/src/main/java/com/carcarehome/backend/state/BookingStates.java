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
    }
    @Override
    public void reject(Booking booking) {
        booking.setStatus("STAFF_REJECT");
        booking.setAssignedStaff(null);
    }
    @Override
    public String getStatusName() { return "SUCCESS"; }
}

class InProgressState implements BookingState {
    @Override
    public void next(Booking booking) {
        booking.setStatus("COMPLETED");
    }
    @Override
    public void cancel(Booking booking) {
        // Typically can't cancel if in progress without penalty, but for now:
        booking.setStatus("CANCEL");
    }
    @Override
    public String getStatusName() { return "IN_PROGRESS"; }
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
    }
    @Override
    public String getStatusName() { return "STAFF_REJECT"; }
}
