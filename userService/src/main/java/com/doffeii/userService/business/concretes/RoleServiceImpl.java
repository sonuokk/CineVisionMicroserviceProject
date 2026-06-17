package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.RoleService;
import com.doffeii.userService.entity.Role;
import org.springframework.stereotype.Service;

@Service
public class RoleServiceImpl implements RoleService {

    @Override
    public Role getRoleByRoleName(String roleName) {
        return Role.builder().roleName(roleName).build();
    }

    @Override
    public Role getOrCreateRole(String roleName) {
        return Role.builder().roleName(roleName).build();
    }
}
