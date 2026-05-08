package com.doffeii.userService.core.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.lang.Strings;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class TokenVerifierFilter extends OncePerRequestFilter {
    private final String jwtSecretKey;

    public TokenVerifierFilter(String jwtSecretKey) {
        this.jwtSecretKey = jwtSecretKey;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/user/auth/")
                || path.equals("/api/user/users/add")
                || path.startsWith("/api/user/users/isExist/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String token = request.getHeader("Authorization");

        if(Strings.hasText(token) && token.startsWith("Bearer ")){
            token = token.replace("Bearer ", "");
            try {
                Jws<Claims> jwsClaims = Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(jwtSecretKey.getBytes()))
                        .build()
                        .parseClaimsJws(token);

                Claims body = jwsClaims.getBody();
                String email = body.getSubject();


                List<?> authorities = (List<?>) body.get("authorities");

                Set<SimpleGrantedAuthority> grantedAuthorities = authorities.stream()
                        .map(this::extractAuthority)
                        .map(authority -> new SimpleGrantedAuthority(normalizeAuthority(authority)))
                        .collect(Collectors.toSet());

                Authentication authentication = new UsernamePasswordAuthenticationToken(email, null, grantedAuthorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                filterChain.doFilter(request, response);

            } catch (JwtException e) {
                throw new RuntimeException("Token geçerli değil!");
            }

        }else {
            filterChain.doFilter(request, response);
        }
    }

    private String normalizeAuthority(String authority) {
        return authority.startsWith("ROLE_") ? authority : "ROLE_" + authority;
    }

    private String extractAuthority(Object authority) {
        if (authority instanceof Map<?, ?> authorityMap) {
            Object value = authorityMap.get("authority");
            return value != null ? value.toString() : "";
        }
        return authority != null ? authority.toString() : "";
    }
}
