package com.carcarehome.backend.mapper;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import com.carcarehome.backend.dto.BookingRequest;
import com.carcarehome.backend.dto.BookingItemRequest;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.entity.BookingItem;
import java.math.BigDecimal;

@Component
public class BookingMapper {

    public void mapRequestToEntity(BookingRequest request, Booking booking) {
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerPhone(request.getCustomerPhone());
        booking.setCustomerEmail(request.getCustomerEmail());
        
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            booking.getItems().clear();
            StringBuilder services = new StringBuilder();
            
            for (int i = 0; i < request.getItems().size(); i++) {
                BookingItemRequest itemReq = request.getItems().get(i);
                BookingItem item = new BookingItem();
                item.setVehicleType(itemReq.getVehicleType());
                item.setVehiclePlate(itemReq.getVehiclePlate());
                item.setServiceType(itemReq.getServiceType());
                item.setPrice(itemReq.getPrice());
                booking.addItem(item);
                
                if (i > 0) services.append(" | ");
                services.append(itemReq.getServiceType());
                
                if (i == 0) {
                    booking.setVehicleType(itemReq.getVehicleType());
                    booking.setVehiclePlate(itemReq.getVehiclePlate());
                }
            }
            booking.setServiceType(services.toString());
        } else {
            booking.setVehicleType(request.getVehicleType());
            booking.setVehiclePlate(request.getVehiclePlate());
            booking.setServiceType(request.getServiceType());
        }

        booking.setBookingDate(request.getBookingDate());
        booking.setBookingTime(request.getBookingTime());
        
        if (request.getBookingEndTime() != null) {
            booking.setBookingEndTime(request.getBookingEndTime());
        } else if (request.getBookingTime() != null) {
            // Default: 45 minutes duration
            booking.setBookingEndTime(request.getBookingTime().plusMinutes(45));
        }
        
        booking.setAddressName(request.getAddressName());
        booking.setNote(request.getNote());
        booking.setStatus(request.getStatus());
        booking.setTotalPrice(request.getTotalPrice());
        booking.setDistance(request.getDistance());
        booking.setTravelFee(request.getTravelFee());
        
        BigDecimal deposit = request.getDepositAmount() != null ? request.getDepositAmount() : BigDecimal.ZERO;

        if (deposit.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tien coc khong duoc am");
        }

        booking.setDepositAmount(deposit);
    }
}
