package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl  implements UserDetailsService {

    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userService.getUserByEmail(email.trim().toLowerCase(Locale.ROOT));

        if(user == null) {
            throw new UsernameNotFoundException("Kullanıcı bulunamadı");
        }

        if (!user.isEmailVerified()) {
            throw new UsernameNotFoundException("Email is not verified");
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(user.getClaim() != null ? user.getClaim().getClaimName() : "CUSTOMER"));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), authorities);
    }

}
