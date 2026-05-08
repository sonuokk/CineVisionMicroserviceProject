package com.doffeii.userService.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDto {
    private boolean emailEnabled;
    private boolean smsEnabled;
    private boolean whatsappEnabled;
}
