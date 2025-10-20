package com.fastfood.management.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class ImagesResourceConfig implements WebMvcConfigurer {
    private static final Logger log = LoggerFactory.getLogger(ImagesResourceConfig.class);

    // Có thể để trống -> sẽ resolve theo CWD nếu dùng ./images trong properties
    @Value("${app.images.dir:}")
    private String imagesDirProp;

    // Mặc định ./uploads (nằm cạnh nơi bạn chạy app)
    @Value("${app.upload-dir:./uploads}")
    private String uploadDirProp;

    private Path imagesDir;   // đường dẫn tuyệt đối đã chuẩn hoá (có thể null)
    private Path uploadDir;   // đường dẫn tuyệt đối đã chuẩn hoá

    @PostConstruct
    void init() throws Exception {
        Path cwd = Paths.get("").toAbsolutePath();

        // Resolve upload
        Path upCfg = Paths.get(uploadDirProp);
        this.uploadDir = upCfg.isAbsolute() ? upCfg.normalize() : cwd.resolve(upCfg).normalize();
        Files.createDirectories(this.uploadDir);

        // Resolve images (nếu không cấu hình thì bỏ qua)
        if (imagesDirProp != null && !imagesDirProp.isBlank()) {
            Path imCfg = Paths.get(imagesDirProp);
            this.imagesDir = imCfg.isAbsolute() ? imCfg.normalize() : cwd.resolve(imCfg).normalize();
            // images có thể là thư mục chỉ đọc; tuỳ nhu cầu bạn có thể create
            // Files.createDirectories(this.imagesDir);
        } else {
            this.imagesDir = null; // không map /images nếu không set
        }

        log.info("[CWD] {}", cwd);
        log.info("[UploadRoot] {}", this.uploadDir);
        if (this.imagesDir != null) {
            log.info("[ImagesRoot] {}", this.imagesDir);
        } else {
            log.info("[ImagesRoot] (disabled – app.images.dir not set)");
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1) Map /uploads/** -> uploadDir (tuyệt đối)
        // Dùng toUri().toString() để chắc chắn prefix 'file:' và dấu '/'
        String uploadsLocation = this.uploadDir.toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsLocation)
                .setCachePeriod(3600)
                .resourceChain(true)
                .addResolver(new PathResourceResolver());
        log.info("Static uploads mapped: '/uploads/**' -> {}", uploadsLocation);

        // 2) Map /images/** nếu có cấu hình app.images.dir
        if (this.imagesDir != null) {
            String imagesLocation = this.imagesDir.toUri().toString();
            registry.addResourceHandler("/images/**")
                    .addResourceLocations(imagesLocation)
                    .setCachePeriod(3600)
                    .resourceChain(true)
                    .addResolver(new PathResourceResolver());
            log.info("Static images mapped: '/images/**' -> {}", imagesLocation);
        }
    }
}
