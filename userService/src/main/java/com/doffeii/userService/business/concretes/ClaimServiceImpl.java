package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.ClaimService;
import com.doffeii.userService.entity.Claim;
import org.springframework.stereotype.Service;

@Service
public class ClaimServiceImpl implements ClaimService {

    @Override
    public Claim getClaimByClaimName(String claimName) {
        return Claim.builder().claimName(claimName).build();
    }

    @Override
    public Claim getOrCreateClaim(String claimName) {
        return Claim.builder().claimName(claimName).build();
    }
}
