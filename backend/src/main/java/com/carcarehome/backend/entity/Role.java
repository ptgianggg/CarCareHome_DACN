package com.carcarehome.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Table(name = "role")
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 250)
    private String description;
}