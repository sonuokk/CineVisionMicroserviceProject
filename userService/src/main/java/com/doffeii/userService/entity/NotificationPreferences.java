package com.doffeii.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {
    private boolean emailEnabled;
    private boolean smsEnabled;
    private boolean whatsappEnabled;
}
