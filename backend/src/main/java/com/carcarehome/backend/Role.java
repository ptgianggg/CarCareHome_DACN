package com.carcarehome.backend;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum Role {
    ADMIN(1),
    USER(2),
    STAFF(3);

    public final long value;
}
