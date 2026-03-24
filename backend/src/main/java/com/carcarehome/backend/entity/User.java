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

    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    private String phone;
    private String avatar;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
}