package com.fastfood.management.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class ImagesResourceConfig implements WebMvcConfigurer {
    private static final Logger log = LoggerFactory.getLogger(ImagesResourceConfig.class);

    @Value("${app.images.dir}")
    private String imagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String dir = imagesDir;
        if (dir == null || dir.isBlank()) {
            // Default fallback (should be overridden in application.properties)
            dir = "c:/Users/dell/Desktop/fastfood/images/";
        }

        // Ensure proper file: prefix and trailing slash
        String normalized = dir.replace("\\", "/");
        if (!normalized.endsWith("/")) {
            normalized += "/";
        }
        String location = normalized.startsWith("file:") ? normalized : ("file:" + normalized);

        registry
            .addResourceHandler("/images/**")
            .addResourceLocations(location)
            .setCachePeriod(3600)
            .resourceChain(true)
            .addResolver(new PathResourceResolver());

        log.info("Static images mapped: '/images/**' -> {}", location);
    }
}