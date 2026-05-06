package com.kaankaplan.userService.controller;

import com.kaankaplan.userService.business.abstracts.UserService;
import com.kaankaplan.userService.entity.dto.AdminRegisterRequestDto;
import com.kaankaplan.userService.entity.dto.PromoteUserRequestDto;
import com.kaankaplan.userService.entity.dto.UserProfileResponseDto;
import com.kaankaplan.userService.entity.dto.UserRegisterRequestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/users/")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("isExist/{userId}")
    public boolean isExists(@PathVariable("userId") String userId) {
        return userService.isUserExist(userId);
    }

    @PostMapping("add")
    public UserProfileResponseDto addUser(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {
        return userService.addUser(userRegisterRequestDto);
    }

    @PostMapping("admin/setup")
    public UserProfileResponseDto addAdmin(@RequestBody AdminRegisterRequestDto adminRegisterRequestDto) {
        return userService.addAdmin(adminRegisterRequestDto);
    }

    @GetMapping("admin/all")
    public List<UserProfileResponseDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("admin/promote")
    public UserProfileResponseDto promoteUserToAdmin(@Valid @RequestBody PromoteUserRequestDto promoteUserRequestDto) {
        return userService.promoteUserToAdmin(promoteUserRequestDto.getEmail());
    }

    @GetMapping("me")
    public UserProfileResponseDto me() {
        return userService.getCurrentUserProfile();
    }

    @GetMapping("isUserCustomer")
    public boolean isUserCustomer() {
        return userService.isUserCustomer();
    }
    @GetMapping("isUserAdmin")
    public boolean isUserAdmin() {
        return userService.isUserAdmin();
    }
}
