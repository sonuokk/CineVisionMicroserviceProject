package com.doffeii.userService.business.abstracts;

import com.doffeii.userService.entity.Role;

public interface RoleService {

    Role getRoleByRoleName(String roleName);

    Role getOrCreateRole(String roleName);
}
