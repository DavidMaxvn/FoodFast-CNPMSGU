package com.fastfood.management.mapper;

import com.fastfood.management.dto.response.UserResponse;
import com.fastfood.management.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-09-27T20:46:06+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.43.0.v20250819-1513, environment: Java 21.0.8 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserResponse toResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponse userResponse = new UserResponse();

        userResponse.setCreatedAt( user.getCreatedAt() );
        userResponse.setEmail( user.getEmail() );
        userResponse.setFullName( user.getFullName() );
        userResponse.setId( user.getId() );
        userResponse.setUpdatedAt( user.getUpdatedAt() );
        userResponse.setUsername( user.getUsername() );

        userResponse.setRoles( mapRolesToStrings(user.getRoles()) );

        return userResponse;
    }
}
