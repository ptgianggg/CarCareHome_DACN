package com.carcarehome.backend.state;

public class BookingStateFactory {
    public static BookingState getState(String status) {
        switch (status) {
            case "PENDING": return new PendingState();
            case "SUCCESS": return new SuccessState();
            case "IN_PROGRESS": return new InProgressState();
            case "AWAITING_FINAL_PAYMENT": return new AwaitingFinalPaymentState();
            case "STAFF_REJECT": return new StaffRejectState();
            default: return new FinalState();
        }
    }
}
