package com.carcarehome.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Table(name="users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    private String phone;
    private String avatar;

    @Column(name = "points", nullable = false)
    private Integer points = 0;

    @Column(name = "points_lifetime", nullable = false)
    private Integer pointsLifetime = 0;

    @Column(name = "tier", nullable = false)
    private String tier = "BRONZE"; // BRONZE, SILVER,  , VIP

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
}