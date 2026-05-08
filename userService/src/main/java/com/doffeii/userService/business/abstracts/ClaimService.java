package com.doffeii.userService.business.abstracts;

import com.doffeii.userService.entity.Claim;

public interface ClaimService {

    Claim getClaimByClaimName(String claimName);

    Claim getOrCreateClaim(String claimName);
}
